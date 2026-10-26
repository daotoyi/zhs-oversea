'use client';

import { useState } from 'react';

export type CouponView = {
  code: string;
  title: string;
  validityText: string;
  statusKey: 'used' | 'expired' | 'notStarted' | 'active';
  statusText: string;
};

/**
 * 账户页「我的优惠券」列表（客户端组件，含复制码按钮与状态徽章）。
 * 展示字段由服务端 account/page.tsx 预计算后传入，这里只负责渲染与复制交互。
 */
export function CouponList({
  coupons,
  labels,
}: {
  coupons: CouponView[];
  labels: { couponEmpty: string; copyCode: string; copied: string };
}) {
  const [copied, setCopied] = useState<string | null>(null);

  if (coupons.length === 0) {
    return <p className="acct-empty">{labels.couponEmpty}</p>;
  }

  const copy = async (code: string) => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(code);
      setTimeout(() => setCopied((c) => (c === code ? null : c)), 1500);
    } catch {
      /* 剪贴板不可用时静默失败，用户可手动选中复制 */
    }
  };

  return (
    <ul className="acct-coupons">
      {coupons.map((c) => (
        <li key={c.code} className={`acct-coupon acct-coupon-${c.statusKey}`}>
          <div className="acct-coupon-main">
            <div className="acct-coupon-title">{c.title}</div>
            <code className="acct-coupon-code">{c.code}</code>
            <div className="acct-coupon-validity">{c.validityText}</div>
          </div>
          <div className="acct-coupon-side">
            <span className={`acct-coupon-badge acct-coupon-badge-${c.statusKey}`}>{c.statusText}</span>
            {c.statusKey === 'active' && (
              <button type="button" className="acct-coupon-copy" onClick={() => copy(c.code)}>
                {copied === c.code ? labels.copied : labels.copyCode}
              </button>
            )}
          </div>
        </li>
      ))}
    </ul>
  );
}
