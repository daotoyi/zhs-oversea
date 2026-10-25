'use client';

import Link from 'next/link';
import { useEffect } from 'react';
import { useCart } from '@/lib/cart';
import { getProduct } from '@/lib/products';
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
  const sanitizeLines = useCart((s) => s.sanitizeLines);

  // 一行可解析 = slug 仍在售目录且 variant 存在（DB 覆盖不改 variant id）。
  // 目录更换后 localStorage 里的旧行会变成幽灵行：角标若数原始行，就会与购物车页对不上。
  const isResolvable = (l: { slug: string; variantId: string }) => {
    const p = getProduct(l.slug);
    return !!p && p.variants.some((v) => v.id === l.variantId);
  };
  const count = lines.reduce((sum, l) => (isResolvable(l) ? sum + l.quantity : sum), 0);

  // 全站自愈：任何页面挂载后都把幽灵行从购物车清掉，角标与购物车页随即一致
  useEffect(() => {
    if (lines.length === 0) return;
    const stale = lines.filter((l) => !isResolvable(l));
    if (stale.length === 0) return;
    sanitizeLines((l) => !stale.some((s) => s.slug === l.slug && s.variantId === l.variantId));
  }, [lines, sanitizeLines]);

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
