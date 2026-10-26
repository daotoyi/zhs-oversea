/**
 * 数据库单例 —— sql.js (WASM SQLite)
 *
 * 设计要点：
 * - 只在请求处理时动态加载（见 lib/db/loader.ts），Next 构建期不碰 wasm
 * - 单文件持久化：<DATA_DIR>/zhs.db，写操作后原子落盘（tmp + rename）
 * - 写频率低（后台 + 会员操作，分钟级），每次写立即落盘无性能问题
 *
 * ⚠ 两个必须守住的点（踩过坑）：
 * 1. 实例挂在 globalThis 上。Next 会为不同路由/页面打不同 bundle，
 *    模块级变量会被复制成多份 sql.js 实例 —— 路由写入的内存库，
 *    页面那个实例看不见，表现为「刚注册完进账户页仍是未登录」。
 * 2. 每次写都要 persist。sql.js 纯内存，不落盘则进程重启即丢数据。
 */

import fs from 'node:fs';
import path from 'node:path';
import initSqlJs from 'sql.js';
// 从 initSqlJs 推导具体类型（@types/sql.js 未命名导出 Database/Statement）
type SqlJsSQL = Awaited<ReturnType<typeof initSqlJs>>;
type Database = InstanceType<SqlJsSQL['Database']>;
type Statement = ReturnType<Database['prepare']>;
import { SCHEMA } from './schema';

export type Row = Record<string, unknown>;

type DbState = {
  db: Database;
  dbPath: string;
  persistTimer: NodeJS.Timeout | null;
};

/** 进程级单例（跨 bundle 共享） */
const STATE_KEY = '__zhsDbState__';
type GlobalWithDb = typeof globalThis & { [STATE_KEY]?: DbState };

function state(): DbState | null {
  return (globalThis as GlobalWithDb)[STATE_KEY] ?? null;
}

function resolveDataDir(): string {
  const explicit = process.env.DATA_DIR;
  if (explicit) return explicit;
  // standalone 运行时 cwd 即应用目录；开发时为 site/
  return path.join(process.cwd(), '.data');
}

export function getDbPath(): string {
  return path.join(resolveDataDir(), 'zhs.db');
}

/**
 * 数据目录（存 zhs.db 与后台上传的图片）
 *
 * 上传物必须落在 .data 下：部署脚本会保留 .data，
 * 而 public/ 每次发布会整包覆盖 —— 放那里等于每次发版丢图。
 */
export function getDataDir(): string {
  return resolveDataDir();
}

export async function initDb(): Promise<Database> {
  const existing = state();
  if (existing) return existing.db;

  const SQL: SqlJsSQL = await initSqlJs({
    // wasm 与产物同级分发：standalone/sql-wasm.wasm
    locateFile: (file: string) => {
      const candidates = [
        path.join(process.cwd(), 'sql-wasm.wasm'),
        path.join(process.cwd(), 'node_modules', 'sql.js', 'dist', file),
        path.join(__dirname, '..', '..', '..', 'node_modules', 'sql.js', 'dist', file),
      ];
      for (const c of candidates) if (fs.existsSync(c)) return c;
      return file;
    },
  });

  const dbPath = getDbPath();
  let db: Database;
  if (fs.existsSync(dbPath)) {
    const buf = fs.readFileSync(dbPath);
    db = new SQL.Database(buf);
  } else {
    db = new SQL.Database();
  }

  // 幂等建表（新库建表 / 老文件升级补表），并落盘固化
  db.run(SCHEMA);
  migrate(db);

  const st: DbState = { db, dbPath, persistTimer: null };
  (globalThis as GlobalWithDb)[STATE_KEY] = st;
  persist();
  return db;
}

/**
 * 增量迁移 —— CREATE TABLE IF NOT EXISTS 不会给老表加列，
 * 这里对已有表做幂等的 ALTER TABLE ADD COLUMN。
 */
function migrate(database: Database): void {
  ensureColumn(database, 'orders', 'user_id', 'TEXT');
  ensureColumn(database, 'oauth_states', 'nonce', 'TEXT');
  ensureColumn(database, 'orders', 'payment_provider', "TEXT DEFAULT 'stripe'");
  ensureColumn(database, 'orders', 'provider_ref', 'TEXT');
  ensureColumn(database, 'orders', 'carrier', 'TEXT');
  ensureColumn(database, 'products', 'collection', 'TEXT');
  // 老库 coupons 表没有领取模式列：CREATE TABLE IF NOT EXISTS 不会补，
  // 必须显式 ADD COLUMN（默认 manual，存量券行为不变）。
  ensureColumn(database, 'coupons', 'acquisition_mode', "TEXT NOT NULL DEFAULT 'manual'");
}

function ensureColumn(database: Database, table: string, column: string, ddl: string): void {
  try {
    const info = database.exec(`PRAGMA table_info(${table})`);
    if (!info.length) return;
    const names = info[0].values.map((v) => String(v[1]));
    if (names.includes(column)) return;
    database.run(`ALTER TABLE ${table} ADD COLUMN ${column} ${ddl}`);
  } catch (err) {
    console.error(`[db] migrate ${table}.${column} failed:`, err instanceof Error ? err.message : err);
  }
}

/** 原子写：先写临时文件再 rename，避免半截文件 */
export function persist(): void {
  const st = state();
  if (!st) return;
  const dir = path.dirname(st.dbPath);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  // 临时文件名必须唯一：固定名在「两个进程/实例同时落盘」时会互相覆盖，
  // 写出半截文件 → SQLite 报 malformed，甚至让 sql.js 原生崩溃（本地真实踩到过）。
  const tmp = `${st.dbPath}.${process.pid}.${Date.now().toString(36)}.tmp`;
  try {
    fs.writeFileSync(tmp, Buffer.from(st.db.export()));
    fs.renameSync(tmp, st.dbPath);
  } catch (err) {
    try {
      if (fs.existsSync(tmp)) fs.unlinkSync(tmp);
    } catch {
      /* ignore */
    }
    throw err;
  }
}

/** 写操作后调用（50ms 合并窗口，避免一次请求内多次 export） */
export function persistSoon(): void {
  const st = state();
  if (!st || st.persistTimer) return;
  st.persistTimer = setTimeout(() => {
    st.persistTimer = null;
    persist();
  }, 50);
}

/* ── 查询助手（sql.js 的 exec 不接受参数，统一走 prepare/bind）── */

function bindParams(stmt: Statement, params: unknown[]): void {
  if (params.length) stmt.bind(params.map((p) => (p === undefined ? null : p)) as never);
}

export function all<T = Row>(sql: string, params: unknown[] = []): T[] {
  const st = state();
  if (!st) throw new Error('DB not initialized');
  const stmt = st.db.prepare(sql);
  bindParams(stmt, params);
  const rows: T[] = [];
  while (stmt.step()) rows.push(stmt.getAsObject() as unknown as T);
  stmt.free();
  return rows;
}

export function get<T = Row>(sql: string, params: unknown[] = []): T | null {
  const rows = all<T>(sql, params);
  return rows.length ? rows[0] : null;
}

export function run(sql: string, params: unknown[] = []): { changes: number; lastInsertRowid: number } {
  const st = state();
  if (!st) throw new Error('DB not initialized');
  const stmt = st.db.prepare(sql);
  bindParams(stmt, params);
  stmt.step();
  stmt.free();
  const changes = (st.db.exec('SELECT changes() AS c')[0]?.values[0]?.[0] as number) ?? 0;
  const rowid = (st.db.exec('SELECT last_insert_rowid() AS r')[0]?.values[0]?.[0] as number) ?? 0;
  // 写即落盘（合并 50ms）：sql.js 纯内存，不落盘重启即丢
  if (changes > 0 || /^\s*(INSERT|UPDATE|DELETE)/i.test(sql)) persistSoon();
  return { changes, lastInsertRowid: rowid };
}

/** 事务：任一语句失败整体回滚 */
export function tx<T>(fn: () => T): T {
  const st = state();
  if (!st) throw new Error('DB not initialized');
  st.db.run('BEGIN');
  try {
    const result = fn();
    st.db.run('COMMIT');
    persistSoon();
    return result;
  } catch (err) {
    st.db.run('ROLLBACK');
    throw err;
  }
}

export function now(): number {
  return Date.now();
}

export function uid(prefix: string): string {
  return `${prefix}_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`;
}
