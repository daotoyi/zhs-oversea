/**
 * 数据库 Schema —— zhenhesheng.com 后台
 *
 * sql.js（WASM SQLite）：零原生依赖，跨平台可用。
 * 单文件持久化（.data/zhs.db），写操作后原子落盘。
 */

export const SCHEMA = `
CREATE TABLE IF NOT EXISTS staff (
  id TEXT PRIMARY KEY,
  username TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  name TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'ops',
  permissions TEXT NOT NULL DEFAULT '[]',
  status TEXT NOT NULL DEFAULT 'active',
  created_at INTEGER NOT NULL,
  last_login_at INTEGER
);

CREATE TABLE IF NOT EXISTS customers (
  id TEXT PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  name TEXT,
  tags TEXT NOT NULL DEFAULT '[]',
  notes TEXT,
  order_count INTEGER NOT NULL DEFAULT 0,
  total_spent INTEGER NOT NULL DEFAULT 0,
  first_order_at INTEGER,
  last_order_at INTEGER,
  created_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS products (
  slug TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  title_zh TEXT,
  tagline TEXT,
  description TEXT,
  category TEXT NOT NULL,
  price_usd INTEGER NOT NULL,
  compare_at_usd INTEGER,
  images TEXT NOT NULL DEFAULT '[]',
  status TEXT NOT NULL DEFAULT 'active',
  stock INTEGER NOT NULL DEFAULT 0,
  sort_order INTEGER NOT NULL DEFAULT 0,
  meta TEXT NOT NULL DEFAULT '{}',
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS orders (
  id TEXT PRIMARY KEY,
  stripe_session_id TEXT UNIQUE,
  email TEXT NOT NULL,
  customer_name TEXT,
  items TEXT NOT NULL DEFAULT '[]',
  subtotal INTEGER NOT NULL,
  discount INTEGER NOT NULL DEFAULT 0,
  shipping INTEGER NOT NULL DEFAULT 0,
  tax INTEGER NOT NULL DEFAULT 0,
  total INTEGER NOT NULL,
  currency TEXT NOT NULL DEFAULT 'usd',
  status TEXT NOT NULL DEFAULT 'paid',
  coupon_code TEXT,
  tracking_no TEXT,
  address TEXT,
  created_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS coupons (
  code TEXT PRIMARY KEY,
  type TEXT NOT NULL,
  value INTEGER NOT NULL,
  min_subtotal INTEGER NOT NULL DEFAULT 0,
  max_uses INTEGER NOT NULL DEFAULT 0,
  used_count INTEGER NOT NULL DEFAULT 0,
  per_customer_limit INTEGER NOT NULL DEFAULT 0,
  starts_at INTEGER,
  ends_at INTEGER,
  status TEXT NOT NULL DEFAULT 'active',
  created_by TEXT,
  created_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS coupon_uses (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  code TEXT NOT NULL,
  email TEXT NOT NULL,
  order_id TEXT NOT NULL,
  amount INTEGER NOT NULL,
  created_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS sale_events (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  discount_percent INTEGER NOT NULL,
  applies_to TEXT NOT NULL DEFAULT 'all',
  target TEXT NOT NULL DEFAULT '[]',
  starts_at INTEGER NOT NULL,
  ends_at INTEGER NOT NULL,
  status TEXT NOT NULL DEFAULT 'active',
  created_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS campaigns (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  subject TEXT NOT NULL,
  body TEXT NOT NULL,
  target_tags TEXT NOT NULL DEFAULT '[]',
  status TEXT NOT NULL DEFAULT 'draft',
  sent_count INTEGER NOT NULL DEFAULT 0,
  created_by TEXT,
  created_at INTEGER NOT NULL,
  sent_at INTEGER
);

CREATE TABLE IF NOT EXISTS email_logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  campaign_id TEXT,
  email TEXT NOT NULL,
  status TEXT NOT NULL,
  error TEXT,
  created_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS audit_logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  staff_id TEXT,
  staff_name TEXT,
  action TEXT NOT NULL,
  target TEXT,
  detail TEXT,
  created_at INTEGER NOT NULL
);

/* ══════════════════════════════════════════════════
   前台会员账户（与后台 staff 完全分离）
   ══════════════════════════════════════════════════ */

CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  name TEXT,
  password_hash TEXT,
  avatar_url TEXT,
  birthday TEXT,                              -- 'MM-DD'（不存年份，隐私最小化）
  points INTEGER NOT NULL DEFAULT 0,
  tier TEXT NOT NULL DEFAULT 'initiate',
  status TEXT NOT NULL DEFAULT 'active',
  marketing_opt_in INTEGER NOT NULL DEFAULT 1,
  email_verified INTEGER NOT NULL DEFAULT 0,
  birthday_gift_year INTEGER,                 -- 最近一次领取生日礼的年份
  created_at INTEGER NOT NULL,
  last_login_at INTEGER
);

CREATE TABLE IF NOT EXISTS user_identities (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id TEXT NOT NULL,
  provider TEXT NOT NULL,                     -- password | google | apple
  provider_uid TEXT NOT NULL,
  email TEXT,
  created_at INTEGER NOT NULL,
  UNIQUE(provider, provider_uid)
);

CREATE TABLE IF NOT EXISTS user_sessions (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  user_agent TEXT,
  ip TEXT,
  created_at INTEGER NOT NULL,
  expires_at INTEGER NOT NULL,
  revoked_at INTEGER
);

CREATE TABLE IF NOT EXISTS favorites (
  user_id TEXT NOT NULL,
  slug TEXT NOT NULL,
  created_at INTEGER NOT NULL,
  PRIMARY KEY (user_id, slug)
);

CREATE TABLE IF NOT EXISTS points_ledger (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id TEXT NOT NULL,
  delta INTEGER NOT NULL,
  balance_after INTEGER NOT NULL,
  reason TEXT NOT NULL,                       -- signup | order_earn | birthday | redeem | refund | admin
  ref TEXT,
  note TEXT,
  created_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS user_tokens (
  id TEXT PRIMARY KEY,                        -- token 的 sha256，不存明文
  user_id TEXT NOT NULL,
  kind TEXT NOT NULL,                         -- reset | verify
  expires_at INTEGER NOT NULL,
  used_at INTEGER,
  created_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS oauth_states (
  state TEXT PRIMARY KEY,
  provider TEXT NOT NULL,
  redirect_to TEXT,
  created_at INTEGER NOT NULL,
  expires_at INTEGER NOT NULL
);

/* 站点配置 —— 键值对（第三方登录凭据等运行期可改的密钥） */
CREATE TABLE IF NOT EXISTS settings (
  key TEXT PRIMARY KEY,
  value TEXT,
  updated_by TEXT,
  updated_at INTEGER NOT NULL
);

/* ── 邮件 ──
   退订/拒收名单：营销邮件必须尊重；交易邮件（密码重置等）不查此表。
   unsubscribe_tokens 用于生成不可枚举的退订链接（token → email 反查，
   URL 里不暴露收件人地址，避免转发/日志泄露）。 */
CREATE TABLE IF NOT EXISTS email_suppressions (
  email TEXT PRIMARY KEY,
  reason TEXT NOT NULL DEFAULT 'unsubscribe',
  source TEXT,
  created_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS mail_unsubscribe_tokens (
  email TEXT PRIMARY KEY,
  token TEXT UNIQUE NOT NULL,
  created_at INTEGER NOT NULL
);
`;

/** 后台模块定义（权限粒度） */
export const MODULES = [
  { key: 'dashboard', label: '仪表盘', labelEn: 'Dashboard' },
  { key: 'users', label: '用户管理', labelEn: 'Customers' },
  { key: 'products', label: '商品管理', labelEn: 'Products' },
  { key: 'orders', label: '订单统计', labelEn: 'Orders' },
  { key: 'coupons', label: '优惠券', labelEn: 'Coupons' },
  { key: 'sales', label: '节日折扣', labelEn: 'Sale events' },
  { key: 'campaigns', label: '邮件推广', labelEn: 'Campaigns' },
  { key: 'staff', label: '员工管理', labelEn: 'Staff' },
  { key: 'settings', label: '登录与邮件', labelEn: 'Sign-in & mail' },
] as const;

export type ModuleKey = (typeof MODULES)[number]['key'];

/** 角色 → 默认权限 */
export const ROLE_DEFAULTS: Record<string, ModuleKey[]> = {
  super: MODULES.map((m) => m.key),
  admin: ['dashboard', 'users', 'products', 'orders', 'coupons', 'sales', 'campaigns', 'settings'],
  ops: ['dashboard', 'products', 'orders'],
  support: ['dashboard', 'users', 'orders'],
};
