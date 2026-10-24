/**
 * 数据库单例 —— sql.js (WASM SQLite)
 *
 * 设计要点：
 * - 只在请求处理时动态加载（见 lib/db/loader.ts），Next 构建期不碰 wasm
 * - 单文件持久化：<DATA_DIR>/zhs.db，写操作后原子落盘（tmp + rename）
 * - 管理后台写频率低（分钟级），每次写立即 persist 无性能问题
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

let db: Database | null = null;
let SQL: SqlJsSQL | null = null;
let dbPath = '';
let persistTimer: NodeJS.Timeout | null = null;

function resolveDataDir(): string {
  const explicit = process.env.DATA_DIR;
  if (explicit) return explicit;
  // standalone 运行时 cwd 即应用目录；开发时为 site/
  return path.join(process.cwd(), '.data');
}

export function getDbPath(): string {
  return path.join(resolveDataDir(), 'zhs.db');
}

export async function initDb(): Promise<Database> {
  if (db) return db;
  SQL = await initSqlJs({
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
  dbPath = getDbPath();
  if (fs.existsSync(dbPath)) {
    const buf = fs.readFileSync(dbPath);
    db = new SQL.Database(buf);
  } else {
    db = new SQL.Database();
    db.run(SCHEMA);
    persist();
  }
  // 幂等建表（老文件升级）
  db.run(SCHEMA);
  return db;
}

/** 原子写：先写临时文件再 rename，避免半截文件 */
export function persist(): void {
  if (!db) return;
  const dir = path.dirname(dbPath);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  const tmp = dbPath + '.tmp';
  fs.writeFileSync(tmp, Buffer.from(db.export()));
  fs.renameSync(tmp, dbPath);
}

/** 写操作后调用（立即落盘；管理后台频率低，无需批量合并） */
export function persistSoon(): void {
  if (persistTimer) return;
  persistTimer = setTimeout(() => {
    persistTimer = null;
    persist();
  }, 50);
}

/* ── 查询助手（sql.js 的 exec 不接受参数，统一走 prepare/bind）── */

function bindParams(stmt: Statement, params: unknown[]): void {
  if (params.length) stmt.bind(params.map((p) => (p === undefined ? null : p)) as never);
}

export function all<T = Row>(sql: string, params: unknown[] = []): T[] {
  if (!db) throw new Error('DB not initialized');
  const stmt = db.prepare(sql);
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
  if (!db) throw new Error('DB not initialized');
  const stmt = db.prepare(sql);
  bindParams(stmt, params);
  stmt.step();
  stmt.free();
  const changes = (db!.exec('SELECT changes() AS c')[0]?.values[0]?.[0] as number) ?? 0;
  const rowid = (db!.exec('SELECT last_insert_rowid() AS r')[0]?.values[0]?.[0] as number) ?? 0;
  return { changes, lastInsertRowid: rowid };
}

/** 事务：任一语句失败整体回滚 */
export function tx<T>(fn: () => T): T {
  if (!db) throw new Error('DB not initialized');
  db.run('BEGIN');
  try {
    const result = fn();
    db.run('COMMIT');
    return result;
  } catch (err) {
    db.run('ROLLBACK');
    throw err;
  }
}

export function now(): number {
  return Date.now();
}

export function uid(prefix: string): string {
  return `${prefix}_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`;
}
