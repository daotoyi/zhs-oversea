/**
 * 退订令牌与拒收名单
 *
 * 设计要点：
 * 1. **URL 不暴露邮箱**。退订链接里放随机 token，服务端反查 email。
 *    邮箱直接放在 query 里会随转发、日志、截图泄露。
 * 2. **不可枚举**。token 是 24 字节随机值，不是邮箱的哈希，
 *    无法由邮箱推导，也无法批量猜测。
 * 3. 令牌与邮箱一对一，重复生成复用同一个（链接长期有效，老邮件里的链接仍可用）。
 */

import crypto from 'node:crypto';
import { get, run, all, now } from '@/lib/db/loader';
import { mailConfig } from './config';

export type Suppression = { email: string; reason: string; source: string | null; created_at: number };

function normalize(email: string): string {
  return email.trim().toLowerCase();
}

/** 取（或创建）该邮箱的退订令牌 */
export function unsubscribeToken(email: string): string {
  const e = normalize(email);
  const row = get<{ token: string }>('SELECT token FROM mail_unsubscribe_tokens WHERE email = ?', [e]);
  if (row?.token) return row.token;
  const token = crypto.randomBytes(24).toString('base64url');
  run('INSERT OR IGNORE INTO mail_unsubscribe_tokens (email, token, created_at) VALUES (?, ?, ?)', [e, token, now()]);
  const again = get<{ token: string }>('SELECT token FROM mail_unsubscribe_tokens WHERE email = ?', [e]);
  return again?.token ?? token;
}

export function emailForToken(token: string): string | null {
  if (!token || token.length < 10) return null;
  const row = get<{ email: string }>('SELECT email FROM mail_unsubscribe_tokens WHERE token = ?', [token]);
  return row?.email ?? null;
}

export function unsubscribeUrl(email: string): string {
  const cfg = mailConfig();
  return `${cfg.siteUrl}/unsubscribe?t=${encodeURIComponent(unsubscribeToken(email))}`;
}

/** RFC 8058 一键退订端点（供邮箱客户端直接 POST，无需打开页面） */
export function oneClickUnsubscribeUrl(email: string): string {
  const cfg = mailConfig();
  return `${cfg.siteUrl}/api/unsubscribe?t=${encodeURIComponent(unsubscribeToken(email))}`;
}

/* ── 名单 ── */

export function isSuppressed(email: string): boolean {
  return Boolean(get('SELECT 1 AS x FROM email_suppressions WHERE email = ?', [normalize(email)]));
}

export function suppress(email: string, reason = 'unsubscribe', source?: string): void {
  run(
    `INSERT INTO email_suppressions (email, reason, source, created_at) VALUES (?, ?, ?, ?)
     ON CONFLICT(email) DO UPDATE SET reason = excluded.reason, source = excluded.source`,
    [normalize(email), reason, source ?? null, now()]
  );
}

export function unsuppress(email: string): void {
  run('DELETE FROM email_suppressions WHERE email = ?', [normalize(email)]);
}

export function listSuppressions(limit = 200): Suppression[] {
  return all<Suppression>(
    'SELECT email, reason, source, created_at FROM email_suppressions ORDER BY created_at DESC LIMIT ?',
    [limit]
  );
}

export function suppressionCount(): number {
  return get<{ n: number }>('SELECT COUNT(*) AS n FROM email_suppressions')?.n ?? 0;
}
