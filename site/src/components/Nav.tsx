'use client';

import Link from 'next/link';
import { useCart } from '@/lib/cart';

const MENU = [
  { href: '/classics', label: 'Classics' },
  { href: '/objects', label: 'Objects' },
  { href: '/practice', label: 'Practice' },
  { href: '/traceability', label: 'Traceability' },
  { href: '/journal', label: 'Journal' },
  { href: '/about', label: 'About' },
];

export function Nav() {
  const lines = useCart((s) => s.lines);
  const count = lines.reduce((sum, l) => sum + l.quantity, 0);

  return (
    <>
      <div className="topbar">
        Free US shipping over $60 · Duties included at checkout · 30-day returns
        <span>·</span>
        Consecration certificates on every ritual object
      </div>
      <nav className="nav">
        <div className="wrap nav-in">
          <Link className="brand" href="/">
            <span className="brand-mark">☯</span>
            <span>
              <span className="brand-name">ZHEN HE SHENG</span>
              <span className="brand-sub">Dao Culture &amp; Living</span>
            </span>
          </Link>
          <div className="menu">
            {MENU.map((m) => (
              <Link key={m.href} href={m.href}>
                {m.label}
              </Link>
            ))}
          </div>
          <div className="nav-acts">
            <Link href="/objects" className="hide-sm">
              Search
            </Link>
            <Link href="/contact" className="hide-sm">
              Contact
            </Link>
            <Link href="/cart" className="cart">
              Bag
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
