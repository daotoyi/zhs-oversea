#!/usr/bin/env node
/**
 * 同步商品目录到线上 DB —— 与国内文创站 shop.html 对齐
 *
 * 用法（在应用目录内运行，NODE_PATH 可解析到 node_modules/sql.js）：
 *   node scripts/sync-products.mjs            # 实际写入
 *   node scripts/sync-products.mjs --dry      # 只打印将要执行的操作，不落盘
 *   node scripts/sync-products.mjs --db /path/to/zhs.db
 *
 * 说明：
 *   - 前台 storefront 以「静态种子 + DB 覆盖」方式渲染，DB 行的 images/title 会盖掉种子。
 *     仅改种子不足以让线上图/标题变，所以此处直接改 DB。
 *   - 本脚本针对差异操作：保留商品刷新 shop 图并激活；书刷新图与标题；3 件新增全量插入；
 *     9 件国内站没有的商品置 archived（不删库）。
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

const SHOP = 'https://zhenhesheng.cn/images/products';
const img = (n) => `${SHOP}/product-${String(n).padStart(2, '0')}.png`;

// 保留商品 → 仅刷新 shop 图 + 激活
const IMAGE_REFRESH = [
  ['cinnabar-hetian-jade-bracelet', img(1)],
  ['red-sandalwood-prayer-beads', img(2)],
  ['sandalwood-incense-set', img(3)],
  ['gilt-lotus-incense-burner', img(4)],
  ['duan-yan-four-treasures', img(5)],
  ['bamboo-carved-paper-weights', img(6)],
  ['yixing-clay-teapot', img(7)],
  ['blue-white-gaiwan-set', img(8)],
];

// 书 → 刷新图 + 对齐标题
const BOOK = {
  slug: 'dao-de-jing-81-chapters',
  title: 'The Dao De Jing, Silk Manuscript — Annotated',
  title_zh: '帛书道德经注译',
  image: img(12),
};

// 国内站有、海外站缺 → 全量插入
const NEW_PRODUCTS = [
  {
    slug: 'brass-feng-shui-luopan',
    title: 'Brass Feng Shui Compass (Luopan)',
    title_zh: '黄铜风水罗盘',
    category: 'home-altar',
    tagline: 'A brass luopan with the twenty-four mountains, for reading a space.',
    description:
      'Cast brass with the full twenty-four mountain divisions, the eight trigrams and the ten stems engraved around the dial. Used in the traditional survey of a dwelling — to read orientation, light and the flow of a room. Rests on a small wooden stand, and the disc turns in the hand.',
    price_usd: 4800,
    compare_at_usd: null,
    images: JSON.stringify([img(9)]),
    status: 'active',
    stock: 11,
    sort_order: 90,
    meta: JSON.stringify({ source: 'shop-alignment', weightGrams: 820, hsCode: '7323.91' }),
  },
  {
    slug: 'natural-gourd-pendant',
    title: 'Natural Gourd Pendant',
    title_zh: '天然葫芦挂件',
    category: 'home-altar',
    tagline: 'A dried gourd, hung for the home.',
    description:
      'A naturally grown gourd, dried and fitted with a silk cord for hanging. In the old household practice a gourd by the door is kept for luck and to steady a space. Each one differs in shape, as gourds do — no two are alike.',
    price_usd: 1800,
    compare_at_usd: null,
    images: JSON.stringify([img(10)]),
    status: 'active',
    stock: 16,
    sort_order: 91,
    meta: JSON.stringify({ source: 'shop-alignment', weightGrams: 120, hsCode: '1404.90' }),
  },
  {
    slug: 'cotton-linen-meditation-robe',
    title: 'Cotton & Linen Meditation Robe',
    title_zh: '棉麻禅修服',
    category: 'apparel',
    tagline: 'Loose cotton-linen wear for sitting and moving.',
    description:
      'A loose robe in natural cotton and linen, breathable for sitting practice and gentle movement. Cut roomy so it does not bind at the shoulders or knees. Offered in undyed natural or charcoal, one size that fits most.',
    price_usd: 6800,
    compare_at_usd: null,
    images: JSON.stringify([img(11)]),
    status: 'active',
    stock: 28,
    sort_order: 92,
    meta: JSON.stringify({ source: 'shop-alignment', weightGrams: 600, hsCode: '6211.43' }),
  },
];

// 国内站没有、海外站独有的商品 → 归档（不删库）
const ARCHIVE = [
  'calligraphy-shang-shan-ruo-shui',
  'calligraphy-zhi-xu-ji-ye',
  'ai-cao-health-incense',
  'lightning-struck-jujube-wood',
  'three-harmonies-plaque',
  'red-envelope-luck-set',
  'heavenly-official-blessing',
  'fortune-set-miao-jie',
  'i-ching-sixty-four-hexagrams',
];

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

  // 1) 刷新保留商品图 + 激活
  for (const [slug, image] of IMAGE_REFRESH) {
    const exists = getOne('SELECT slug FROM products WHERE slug = ?', [slug]);
    if (!exists) { summary.push(`跳过(无此行): ${slug}`); continue; }
    run("UPDATE products SET images = ?, status = 'active', updated_at = ? WHERE slug = ?", [JSON.stringify([image]), now, slug]);
    summary.push(`刷新图+激活: ${slug}`);
  }

  // 2) 书：图 + 标题 + 激活
  {
    const exists = getOne('SELECT slug FROM products WHERE slug = ?', [BOOK.slug]);
    if (exists) {
      run('UPDATE products SET images = ?, title = ?, title_zh = ?, status = \'active\', updated_at = ? WHERE slug = ?',
        [JSON.stringify([BOOK.image]), BOOK.title, BOOK.title_zh, now, BOOK.slug]);
      summary.push(`刷新图+标题+激活: ${BOOK.slug} → ${BOOK.title_zh}`);
    } else {
      summary.push(`跳过(无此行): ${BOOK.slug}`);
    }
  }

  // 3) 插入 3 件新增（INSERT OR REPLACE，按 slug 幂等）
  for (const p of NEW_PRODUCTS) {
    const existing = getOne('SELECT slug FROM products WHERE slug = ?', [p.slug]);
    if (existing) {
      run(
        `UPDATE products SET title=?, title_zh=?, tagline=?, description=?, category=?, price_usd=?,
          compare_at_usd=?, images=?, status=?, stock=?, sort_order=?, meta=?, updated_at=? WHERE slug=?`,
        [p.title, p.title_zh, p.tagline, p.description, p.category, p.price_usd, p.compare_at_usd,
         p.images, p.status, p.stock, p.sort_order, p.meta, now, p.slug]
      );
      summary.push(`更新已存在: ${p.slug}`);
    } else {
      run(
        `INSERT INTO products (slug, title, title_zh, tagline, description, category, price_usd,
          compare_at_usd, images, status, stock, sort_order, meta, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [p.slug, p.title, p.title_zh, p.tagline, p.description, p.category, p.price_usd,
         p.compare_at_usd, p.images, p.status, p.stock, p.sort_order, p.meta, now, now]
      );
      summary.push(`插入新增: ${p.slug} (${p.title_zh})`);
    }
  }

  // 4) 归档 9 件独有商品
  for (const slug of ARCHIVE) {
    const exists = getOne('SELECT slug FROM products WHERE slug = ?', [slug]);
    if (!exists) { summary.push(`归档跳过(无此行): ${slug}`); continue; }
    run("UPDATE products SET status = 'archived', updated_at = ? WHERE slug = ?", [now, slug]);
    summary.push(`归档: ${slug}`);
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
