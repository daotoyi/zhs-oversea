'use client';

import { useState, useTransition, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { apiFetch } from '@/lib/admin/client';

type Ord = {
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
  created_at: number;
};

const STATUSES = ['paid', 'shipped', 'refunded', 'cancelled'];
function usd(cents: number) { return `$${(cents / 100).toFixed(2)}`; }

export default function OrdersManager({ initial }: { initial: Ord[] }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [statusFilter, setStatusFilter] = useState('all');
  const [q, setQ] = useState('');
  const [savingId, setSavingId] = useState<string | null>(null);

  const filtered = useMemo(
    () =>
      initial.filter((o) => {
        if (statusFilter !== 'all' && o.status !== statusFilter) return false;
        if (q && !(`${o.id} ${o.email} ${o.customer_name ?? ''}`.toLowerCase().includes(q.toLowerCase()))) return false;
        return true;
      }),
    [initial, statusFilter, q]
  );

  async function patch(o: Ord, body: Record<string, unknown>) {
    setSavingId(o.id);
    await apiFetch('/api/admin/orders', { method: 'PATCH', body: { id: o.id, ...body } });
    setSavingId(null);
    startTransition(() => router.refresh());
  }

  return (
    <>
      <div className="adm-filters">
        <input placeholder="搜索订单号 / 邮箱 / 姓名" value={q} onChange={(e) => setQ(e.target.value)} />
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
          <option value="all">全部状态</option>
          {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
        <span style={{ fontSize: 12.5, color: 'var(--ash)' }}>{filtered.length} / {initial.length} 笔</span>
      </div>

      <div className="adm-card">
        <table className="adm-table">
          <thead>
            <tr><th>订单号</th><th>客户</th><th className="num">金额</th><th>状态</th><th>物流单号</th><th>时间</th></tr>
          </thead>
          <tbody>
            {filtered.length === 0 && <tr><td colSpan={6}><div className="adm-empty">暂无订单</div></td></tr>}
            {filtered.map((o) => (
              <tr key={o.id}>
                <td><div>{o.id}</div>{o.coupon_code && <div style={{ fontSize: 11, color: 'var(--cinnabar)' }}>券 {o.coupon_code}</div>}</td>
                <td>{o.customer_name || o.email}</td>
                <td className="num">{usd(o.total)}</td>
                <td>
                  <select value={o.status} disabled={savingId === o.id} onChange={(e) => patch(o, { status: e.target.value })} style={{ fontSize: 12, padding: '4px 8px' }}>
                    {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
                  </select>
                </td>
                <td>
                  <input
                    defaultValue={o.tracking_no ?? ''}
                    placeholder="录入单号后回车"
                    onKeyDown={async (e) => {
                      if (e.key === 'Enter') {
                        const v = (e.target as HTMLInputElement).value;
                        await patch(o, { status: o.status, tracking_no: v });
                      }
                    }}
                    style={{ fontSize: 12, padding: '4px 8px', minWidth: 150 }}
                  />
                </td>
                <td style={{ whiteSpace: 'nowrap' }}>{new Date(o.created_at).toLocaleDateString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p style={{ fontSize: 11.5, color: 'var(--ash)', marginTop: 12 }}>
        提示：在「物流单号」列回车可保存并标记物流；修改状态即时生效。订单通过 Stripe Webhook 自动同步入库。
      </p>
    </>
  );
}
