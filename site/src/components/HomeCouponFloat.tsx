'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { toTraditional } from '@/lib/i18n/convert';

type HomeCoupon = { code: string; desc: string; expireLabel: string };

export default function HomeCouponFloat({
  coupons,
  locale,
}: {
  coupons: HomeCoupon[];
  locale: string;
}) {
  const t = (en: string, zh: string) =>
    locale === 'en' ? en : locale === 'zh-Hant' ? toTraditional(zh) : zh;

  const [dismissed, setDismissed] = useState<Set<string>>(new Set());
  const [copied, setCopied] = useState<string | null>(null);

  // 读取本地已关闭记录（按券码记，过期/换码后自动重新出现）
  useEffect(() => {
    try {
      const raw = localStorage.getItem('hcf-dismissed');
      if (raw) setDismissed(new Set(JSON.parse(raw) as string[]));
    } catch {
      /* 忽略损坏的本地记录 */
    }
  }, []);

  function close(code: string) {
    setDismissed((prev) => {
      const next = new Set(prev);
      next.add(code);
      try {
        localStorage.setItem('hcf-dismissed', JSON.stringify([...next]));
      } catch {
        /* 忽略写入失败 */
      }
      return next;
    });
  }

  async function copy(code: string) {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(code);
      setTimeout(() => setCopied((c) => (c === code ? null : c)), 1600);
    } catch {
      /* 复制失败静默 */
    }
  }

  const visible = coupons.filter((c) => !dismissed.has(c.code));
  if (visible.length === 0) return null;

  return (
    <div className="home-coupon-float" aria-label="promotions">
      {visible.map((c) => (
        <div className="hcf-card" key={c.code}>
          <button
            className="hcf-close"
            aria-label={t('Dismiss', '关闭')}
            onClick={() => close(c.code)}
          >
            ×
          </button>
          <div className="hcf-tag">{t('Limited offer', '限时优惠')}</div>
          <div className="hcf-code">{c.code}</div>
          <div className="hcf-desc">{c.desc}</div>
          <div className="hcf-expire">{c.expireLabel}</div>
          <div className="hcf-actions">
            <button
              type="button"
              className="hcf-copy"
              onClick={() => copy(c.code)}
            >
              {copied === c.code ? t('Copied ✓', '已复制 ✓') : t('Copy code', '复制优惠码')}
            </button>
            <Link className="hcf-go" href="/objects">
              {t('Shop now →', '去逛逛 →')}
            </Link>
          </div>
        </div>
      ))}
    </div>
  );
}
