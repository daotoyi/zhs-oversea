'use client';

import Link from 'next/link';
import { useCart } from '@/lib/cart';
import { LanguageSwitcher } from './LanguageSwitcher';

export type NavStrings = {
  menu: { href: string; label: string }[];
  bag: string;
  search: string;
  contact: string;
  account: string;
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
            <Link href="/account" className="nav-account" aria-label={strings.account}>
              <svg
                width="18"
                height="18"
                viewBox="0 0 20 20"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.3"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <circle cx="10" cy="6.6" r="3.1" />
                <path d="M4 17c0-2.8 2.7-4.6 6-4.6s6 1.8 6 4.6" />
              </svg>
              <span className="hide-sm">{strings.account}</span>
            </Link>
            <Link href="/cart" className="cart" aria-label={strings.bag}>
              {strings.bag}
              <span className="bag">
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 20 20"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.3"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <path d="M2.6 3.2h2.1l2.05 9.2h8.55l1.7-6.4H6.3" />
                  <circle cx="8.1" cy="16" r="1.35" />
                  <circle cx="14.9" cy="16" r="1.35" />
                </svg>
                {count > 0 && <span className="bag-count">{count}</span>}
              </span>
            </Link>
          </div>
        </div>
      </nav>
    </>
  );
}
