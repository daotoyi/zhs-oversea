/**
 * 运行时加载器 —— 所有 DB 访问必须经此动态 import
 *
 * 原因：sql.js 需要加载 wasm，Next.js 构建期（静态分析）不能触碰，
 * 否则构建进程崩溃。页面/路由里一律写：
 *   const { all, get, run } = await import('@/lib/db/loader');
 */
export { all, get, run, tx, persist, persistSoon, initDb, now, uid, getDbPath, getDataDir } from './index';
export type { Row } from './index';
export { MODULES, ROLE_DEFAULTS, SCHEMA } from './schema';
export type { ModuleKey } from './schema';
