/**
 * 站点配置读写（settings 键值表）
 *
 * 用途：把「第三方登录凭据」这类运维期需要改、但不该改代码的东西放到数据库，
 * 让后台「登录配置」页面即可启用，不必 SSH 改 .env 再重启。
 *
 * 优先级：数据库 > 环境变量。数据库为空则回落 .env，
 * 这样两种部署方式都能用，也不会因为一次误删就把线上登录打挂。
 */

import { all, get, run, now } from '@/lib/db/loader';

export function getSetting(key: string): string | null {
  try {
    const row = get<{ value: string | null }>('SELECT value FROM settings WHERE key = ?', [key]);
    const v = row?.value;
    return v && v.trim() ? v.trim() : null;
  } catch {
    // DB 未初始化 / 表缺失时静默回落环境变量，绝不让配置读取把登录打挂
    return null;
  }
}

export function setSetting(key: string, value: string | null, by?: string): void {
  run(
    `INSERT INTO settings (key, value, updated_by, updated_at) VALUES (?, ?, ?, ?)
     ON CONFLICT(key) DO UPDATE SET value = excluded.value,
       updated_by = excluded.updated_by, updated_at = excluded.updated_at`,
    [key, value, by ?? null, now()]
  );
}

export function deleteSetting(key: string): void {
  run('DELETE FROM settings WHERE key = ?', [key]);
}

export function listSettings(): Record<string, string> {
  const rows = all<{ key: string; value: string | null }>('SELECT key, value FROM settings');
  const out: Record<string, string> = {};
  for (const r of rows) if (r.value) out[r.key] = r.value;
  return out;
}

/** 数据库值优先，其次环境变量 */
export function resolve(fileKey: string, envKey: string): string | null {
  return getSetting(fileKey) ?? (process.env[envKey]?.trim() || null);
}

/** 密钥类字段：返回是否已配置 + 末 4 位，用于界面回显（绝不回传完整密钥） */
export function maskSecret(v: string | null): string {
  if (!v) return '';
  if (v.length <= 4) return '••••';
  return `••••••••${v.slice(-4)}`;
}
