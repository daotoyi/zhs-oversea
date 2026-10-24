'use client';

import { useState } from 'react';
import { usePathname } from 'next/navigation';
import type { AccountLabels } from '@/lib/account/ui';

/**
 * 商品收藏按钮
 *
 * - 未登录时点击 → 跳到登录页（登录后自动回到当前商品页）
 * - 已在页面中渲染的初始状态由服务端注入，避免闪烁
 */
export function FavoriteHeart({
  slug,
  initial,
  labels,
  variant = 'card',
}: {
  slug: string;
  initial: boolean;
  labels: AccountLabels;
  variant?: 'card' | 'detail';
}) {
  const pathname = usePathname();
  const [on, setOn] = useState(initial);
  const [busy, setBusy] = useState(false);

  async function toggle(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    if (busy) return;
    setBusy(true);
    try {
      const res = await fetch('/api/account/favorites', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ slug }),
      });
      if (res.status === 401) {
        window.location.href = `/account/login?next=${encodeURIComponent(pathname || '/account')}`;
        return;
      }
      const data = await res.json();
      if (res.ok) setOn(Boolean(data.favorited));
    } finally {
      setBusy(false);
    }
  }

  const title = on ? labels.favoriteSaved : labels.favoriteAdd;

  return (
    <button
      type="button"
      className={`fav-heart ${on ? 'on' : ''} fav-heart-${variant}`}
      aria-pressed={on}
      aria-label={title}
      title={title}
      disabled={busy}
      onClick={toggle}
    >
      <svg width={variant === 'detail' ? 18 : 16} height={variant === 'detail' ? 18 : 16} viewBox="0 0 24 24" aria-hidden="true">
        <path
          d="M12 20.5s-7.5-4.6-7.5-9.6A4.4 4.4 0 0 1 12 7.9a4.4 4.4 0 0 1 7.5 3c0 5-7.5 9.6-7.5 9.6Z"
          fill={on ? 'currentColor' : 'none'}
          stroke="currentColor"
          strokeWidth="1.4"
          strokeLinejoin="round"
        />
      </svg>
      {variant === 'detail' && <span>{title}</span>}
    </button>
  );
}
