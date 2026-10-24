'use client';

import Link from 'next/link';
import { useCart } from '@/lib/cart';
import { LanguageSwitcher } from './LanguageSwitcher';

export type NavStrings = {
  menu: { href: string; label: string }[];
  bag: string;
  search: string;
  contact: string;
  topbar: string;
  brandSub: string;
};

export function Nav({ strings }: { strings: NavStrings }) {
  const lines = useCart((s) => s.lines);
  const count = lines.reduce((sum, l) => sum + l.quantity, 0);

  return (
    <>
      <div className="topbar">{strings.topbar}</div>
      <nav className="nav">
        <div className="wrap nav-in">
          <Link className="brand" href="/">
            <span className="brand-mark">☯</span>
            <span>
              <span className="brand-name">ZHEN HE SHENG</span>
              <span className="brand-sub">{strings.brandSub}</span>
            </span>
          </Link>
          <div className="menu">
            {strings.menu.map((m) => (
              <Link key={m.href} href={m.href}>
                {m.label}
              </Link>
            ))}
          </div>
          <div className="nav-acts">
            <Link href="/objects" className="hide-sm">
              {strings.search}
            </Link>
            <Link href="/contact" className="hide-sm">
              {strings.contact}
            </Link>
            <LanguageSwitcher />
            <Link href="/cart" className="cart" aria-label={strings.bag}>
              {strings.bag}
              <span className="bag">
                {count > 0 && <span className="bag-count">{count}</span>}
              </span>
            </Link>
          </div>
        </div>
      </nav>
    </>
  );
}
