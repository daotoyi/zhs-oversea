'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { formatUsd } from '@/lib/shipping';
import type { AccountLabels } from '@/lib/account/ui';
import type { Locale } from '@/lib/i18n/config';

/** 订单视图数据（由服务端 page.tsx 传入，形状对齐 lib/account/dao.ts 的 AccountOrder） */
export type AccountOrderView = {
  id: string;
  email: string;
  customer_name: string | null;
  items: string;
  subtotal: number;
  discount: number;
  shipping: number;
  tax: number;
  total: number;
  currency: string;
  status: string;
  coupon_code: string | null;
  tracking_no: string | null;
  carrier: string | null;
  created_at: number;
};

type Item = { slug?: string; name?: string; quantity?: number; unitAmountUsd?: number };

function parseItems(raw: string): Item[] {
  try {
    const arr = JSON.parse(raw || '[]');
    return Array.isArray(arr) ? arr : [];
  } catch {
    return [];
  }
}

export default function OrdersSearch({
  orders,
  labels,
  locale,
}: {
  orders: AccountOrderView[];
  labels: AccountLabels;
  locale: Locale;
}) {
  const [q, setQ] = useState('');

  // 服务端 → 客户端只能传可序列化数据，故日期格式化与状态文案都在组件内计算
  const dateFmt = (ts: number) =>
    new Date(ts).toLocaleDateString(locale === 'en' ? 'en-US' : 'zh-CN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });

  const statusLabel = (status: string) => {
    switch (status) {
      case 'paid':
        return labels.orderStatusPaid;
      case 'refunded':
        return labels.orderStatusRefunded;
      case 'disputed':
        return labels.orderStatusDisputed;
      case 'shipped':
        return labels.orderStatusShipped;
      case 'delivered':
        return labels.orderStatusDelivered;
      case 'cancelled':
        return labels.orderStatusCancelled;
      default:
        return labels.orderStatusPending;
    }
  };

  // 搜索命中范围：订单号 / 商品名 / 收货人 / 运单号 / 优惠券码 / 状态
  const filtered = useMemo(() => {
    const key = q.trim().toLowerCase();
    if (!key) return orders;
    return orders.filter((o) => {
      const items = parseItems(o.items);
      const haystack = [
        o.id,
        o.customer_name ?? '',
        o.tracking_no ?? '',
        o.coupon_code ?? '',
        statusLabel(o.status),
        o.status,
        ...items.map((it) => `${it.name ?? ''} ${it.slug ?? ''}`),
      ]
        .join(' ')
        .toLowerCase();
      return haystack.includes(key);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orders, q, labels]);

  return (
    <>
      <div className="acct-orders-bar">
        <div className="acct-orders-search">
          <input
            type="search"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder={labels.ordersSearchPh}
            aria-label={labels.ordersSearchPh}
          />
          {q && (
            <button
              type="button"
              className="acct-orders-clear"
              onClick={() => setQ('')}
              aria-label={labels.ordersSearchClear}
            >
              ×
            </button>
          )}
        </div>
        <span className="acct-orders-count">
          {labels.ordersSearchCount.replace('{n}', String(filtered.length)).replace('{total}', String(orders.length))}
        </span>
      </div>

      {filtered.length === 0 ? (
        orders.length === 0 ? (
          <p className="acct-empty">
            {labels.ordersEmpty}{' '}
            <Link href="/objects" className="acct-link">
              {labels.browseObjects}
            </Link>
          </p>
        ) : (
          <p className="acct-empty">{labels.ordersSearchNone}</p>
        )
      ) : (
        <ul className="acct-orders">
          {filtered.map((o) => {
            const items = parseItems(o.items);
            const status = statusLabel(o.status);
            return (
              <li key={o.id} className="acct-order">
                <div className="acct-order-top">
                  <div>
                    <span className="acct-order-id">{o.id}</span>
                    <span className="acct-order-date">{dateFmt(o.created_at)}</span>
                  </div>
                  <div className="acct-order-right">
                    <span className={`acct-pill acct-pill-${o.status}`}>{status}</span>
                    <strong>{formatUsd(o.total)}</strong>
                    <Link href={`/account/orders/${o.id}`} className="acct-link">
                      {labels.viewOrder} →
                    </Link>
                  </div>
                </div>
                <ul className="acct-order-items">
                  {items.map((it, i) => (
                    <li key={`${o.id}-${i}`}>
                      {it.slug ? (
                        <Link href={`/objects/${it.slug}`}>{it.name || it.slug}</Link>
                      ) : (
                        <span>{it.name}</span>
                      )}
                      <span className="acct-order-qty">×{it.quantity ?? 1}</span>
                      <span className="acct-order-amt">{formatUsd(it.unitAmountUsd ?? 0)}</span>
                    </li>
                  ))}
                </ul>
                <div className="acct-order-foot">
                  {o.discount > 0 && (
                    <span>
                      {labels.discount} −{formatUsd(o.discount)}
                      {o.coupon_code ? ` (${o.coupon_code})` : ''}
                    </span>
                  )}
                  {o.tracking_no && (
                    <span>
                      {labels.trackNo}: <code>{o.tracking_no}</code>
                    </span>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </>
  );
}
