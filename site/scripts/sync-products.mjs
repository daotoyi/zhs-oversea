#!/usr/bin/env node
/**
 * 同步商品目录到线上 DB —— 整批对齐 shop.html 真实商品（CloudBase 同修汇商品库）
 *
 * 数据源：scripts/products-seed.json（由 /tmp/gen.py 依据 dy-api 真实商品生成，含本地图片路径与折算 USD 价格）
 *
 * 用法（在应用目录内运行，NODE_PATH 可解析到 node_modules/sql.js）：
 *   node scripts/sync-products.mjs            # 实际写入
 *   node scripts/sync-products.mjs --dry      # 只打印将要执行的操作，不落盘
 *   node scripts/sync-products.mjs --db /path/to/zhs.db
 *
 * 说明：
 *   - 前台 storefront 以「静态种子 + DB 覆盖」方式渲染，DB 行的 images/price 会盖掉种子。
 *     仅改种子不足以让线上图/标题/价格变，所以此处直接改 DB。
 *   - 本脚本：① 归档所有「不在新目录」的 DB 商品（status='archived'，不删库）；
 *             ② 对 23 件真实商品按 slug UPSERT（INSERT 或全字段 UPDATE）。
 *   - 重要：改完 DB 后必须重启应用进程（pm2 delete/restart）让它重新加载文件，
 *     否则常驻内存的进程会在下次落盘时把改动覆盖掉。
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DRY = process.argv.includes('--dry');
const argDb = process.argv.find((a) => a.startsWith('--db='));
const now = Date.now();

function resolveDbPath() {
  if (argDb) return argDb.slice(6);
  const explicit = process.env.DATA_DIR;
  if (explicit) return path.join(explicit, 'zhs.db');
  return path.join(process.cwd(), '.data', 'zhs.db');
}

const dbPath = resolveDbPath();
if (!fs.existsSync(dbPath)) {
  console.error(`✗ 找不到数据库文件: ${dbPath}`);
  process.exit(1);
}

const SEED_PATH = path.join(__dirname, 'products-seed.json');
if (!fs.existsSync(SEED_PATH)) {
  console.error(`✗ 找不到种子文件: ${SEED_PATH}`);
  process.exit(1);
}
const SEED = JSON.parse(fs.readFileSync(SEED_PATH, 'utf-8'));
const seedSlugs = new Set(SEED.map((p) => p.slug));

async function main() {
  const initSqlJs = (await import('sql.js')).default;
  const SQL = await initSqlJs({
    locateFile: (file) => {
      const cands = [
        path.join(process.cwd(), 'sql-wasm.wasm'),
        path.join(process.cwd(), 'node_modules', 'sql.js', 'dist', file),
        path.join(__dirname, '..', 'node_modules', 'sql.js', 'dist', file),
      ];
      for (const c of cands) if (fs.existsSync(c)) return c;
      return file;
    },
  });

  const buf = fs.readFileSync(dbPath);
  const db = new SQL.Database(buf);

  const run = (sql, params = []) => {
    const stmt = db.prepare(sql);
    if (params.length) stmt.bind(params);
    stmt.step();
    stmt.free();
  };
  const getOne = (sql, params = []) => {
    const stmt = db.prepare(sql);
    if (params.length) stmt.bind(params);
    const row = stmt.step() ? stmt.getAsObject() : null;
    stmt.free();
    return row;
  };

  const summary = [];

  // 0) 幂等补列：本脚本直接操作 DB 文件、不经过应用层 migrate()，
  //    所以「合集」列若尚未由应用迁移创建，这里先补上（与 db/index.ts 的 ensureColumn 同语义）
  {
    const cols = db.exec('PRAGMA table_info(products)');
    const names = cols.length ? cols[0].values.map((v) => String(v[1])) : [];
    if (!names.includes('collection')) {
      run('ALTER TABLE products ADD COLUMN collection TEXT');
      summary.push('新增列: products.collection');
    }
  }

  // 1) 归档所有不在新目录里的旧商品
  const existing = db.exec('SELECT slug FROM products');
  const allSlugs = existing.length ? existing[0].values.map((r) => r[0]) : [];
  for (const slug of allSlugs) {
    if (seedSlugs.has(slug)) continue;
    run("UPDATE products SET status = 'archived', updated_at = ? WHERE slug = ?", [now, slug]);
    summary.push(`归档(不在新目录): ${slug}`);
  }

  // 2) UPSERT 23 件真实商品
  for (const p of SEED) {
    const existingRow = getOne('SELECT slug, created_at FROM products WHERE slug = ?', [p.slug]);
    if (existingRow) {
      run(
        `UPDATE products SET title=?, title_zh=?, tagline=?, description=?, category=?, collection=?, price_usd=?,
          compare_at_usd=?, images=?, status=?, stock=?, sort_order=?, meta=?, updated_at=? WHERE slug=?`,
        [
          p.title, p.title_zh, p.tagline, p.description, p.category, p.collection ?? null, p.price_usd,
          p.compare_at_usd, p.images, p.status, p.stock, p.sort_order, p.meta, now, p.slug,
        ]
      );
      summary.push(`更新已存在: ${p.slug} (${p.title_zh})`);
    } else {
      run(
        `INSERT INTO products (slug, title, title_zh, tagline, description, category, collection, price_usd,
          compare_at_usd, images, status, stock, sort_order, meta, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          p.slug, p.title, p.title_zh, p.tagline, p.description, p.category, p.collection ?? null, p.price_usd,
          p.compare_at_usd, p.images, p.status, p.stock, p.sort_order, p.meta, now, now,
        ]
      );
      summary.push(`插入新增: ${p.slug} (${p.title_zh})`);
    }
  }

  if (DRY) {
    console.log('── DRY RUN ── 不落盘');
    console.log(summary.join('\n'));
    return;
  }

  const out = db.export();
  fs.writeFileSync(dbPath, Buffer.from(out));
  console.log(`✓ 已写入 ${dbPath}`);
  console.log(summary.join('\n'));
  console.log('\n⚠ 记得重启应用进程以重新加载 DB：pm2 delete zhenhesheng && pm2 start ecosystem.config.js && pm2 save');
  db.close();
}

main().catch((e) => {
  console.error('✗ 同步失败:', e);
  process.exit(1);
});
