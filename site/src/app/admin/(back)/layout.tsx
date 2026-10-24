import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import { ADMIN_COOKIE, verifyToken } from '@/lib/admin/auth';
import { MODULES } from '@/lib/db/schema';
import type { ModuleKey } from '@/lib/db/schema';

export const metadata: Metadata = {
  title: { default: '管理后台', template: '%s · 真和盛后台' },
  robots: { index: false, follow: false },
};

const ICONS: Record<string, string> = {
  dashboard: '▦',
  users: '◍',
  products: '▤',
  orders: '◈',
  coupons: '◐',
  sales: '◑',
  campaigns: '✉',
  staff: '☰',
  settings: '⚙',
};

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const store = await cookies();
  const token = store.get(ADMIN_COOKIE)?.value;
  const session = token ? verifyToken(token) : null;

  if (!session) redirect('/admin/login');

  const perms = new Set<ModuleKey>(session.role === 'super' ? MODULES.map((m) => m.key) : session.permissions);
  const menu = MODULES.filter((m) => perms.has(m.key));

  return (
    <div className="adm">
      <aside className="adm-side">
        <div className="adm-brand">
          <span className="brand-mark">☯</span>
          <div>
            <div className="adm-brand-name">真和盛</div>
            <div className="adm-brand-sub">管理后台</div>
          </div>
        </div>
        <nav className="adm-nav">
          {menu.map((m) => (
            <a key={m.key} href={m.key === 'dashboard' ? '/admin' : `/admin/${m.key}`}>
              <span className="adm-nav-ico">{ICONS[m.key]}</span>
              {m.label}
            </a>
          ))}
        </nav>
        <div className="adm-side-foot">
          <a href="/" target="_blank" rel="noreferrer">查看前台 →</a>
        </div>
      </aside>
      <div className="adm-main">
        <header className="adm-top">
          <div className="adm-top-user">
            <span className="adm-avatar">{(session.name || session.username).slice(0, 1)}</span>
            <div>
              <div className="adm-top-name">{session.name}</div>
              <div className="adm-top-role">
                {session.username} · {session.role === 'super' ? '超级管理员' : session.role}
              </div>
            </div>
          </div>
          <form action="/api/admin/logout" method="POST">
            <button className="adm-logout" type="submit">退出登录</button>
          </form>
        </header>
        <div className="adm-body">{children}</div>
      </div>
    </div>
  );
}
