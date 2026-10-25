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
  carrier: string | null;
  created_at: number;
};

type Refund = {
  id: string;
  order_id: string;
  email: string;
  reason: string;
  amount: number;
  status: string;
  admin_note: string | null;
  created_at: number;
};

const STATUSES = ['paid', 'shipped', 'delivered', 'refunded', 'cancelled'];
function usd(cents: number) { return `$${(cents / 100).toFixed(2)}`; }
function fmt(ts: number) { return new Date(ts).toLocaleDateString(); }

export default function OrdersManager({
  initial,
  refunds,
}: {
  initial: Ord[];
  refunds?: Refund[];
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [statusFilter, setStatusFilter] = useState('all');
  const [q, setQ] = useState('');
  const [savingId, setSavingId] = useState<string | null>(null);
  const [note, setNote] = useState<Record<string, string>>({});

  const refundByOrder = useMemo(() => {
    const m = new Map<string, Refund>();
    for (const r of refunds ?? []) {
      const prev = m.get(r.order_id);
      // 同单多次申请时取最新一条
      if (!prev || r.created_at > prev.created_at) m.set(r.order_id, r);
    }
    return m;
  }, [refunds]);

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

  async function handleRefund(r: Refund, action: 'approve' | 'reject') {
    setSavingId(r.order_id);
    try {
      await apiFetch('/api/admin/refunds', {
        method: 'PATCH',
        body: { id: r.id, action, note: note[r.id] ?? '' },
      });
    } finally {
      setSavingId(null);
      startTransition(() => router.refresh());
    }
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
        {refunds && refunds.filter((r) => r.status === 'pending').length > 0 && (
          <span style={{ fontSize: 12.5, color: 'var(--cinnabar)' }}>
            {refunds.filter((r) => r.status === 'pending').length} 笔退款待处理
          </span>
        )}
      </div>

      <div className="adm-card">
        <table className="adm-table">
          <thead>
            <tr>
              <th>订单号</th><th>客户</th><th className="num">金额</th><th>状态</th>
              <th>承运商 / 物流单号</th><th>退款</th><th>时间</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 && <tr><td colSpan={7}><div className="adm-empty">暂无订单</div></td></tr>}
            {filtered.map((o) => {
              const rf = refundByOrder.get(o.id);
              return (
                <tr key={o.id}>
                  <td>
                    <div>{o.id}</div>
                    {o.coupon_code && <div style={{ fontSize: 11, color: 'var(--cinnabar)' }}>券 {o.coupon_code}</div>}
                  </td>
                  <td>{o.customer_name || o.email}</td>
                  <td className="num">{usd(o.total)}</td>
                  <td>
                    <select
                      value={o.status}
                      disabled={savingId === o.id}
                      onChange={(e) => patch(o, { status: e.target.value })}
                      style={{ fontSize: 12, padding: '4px 8px' }}
                    >
                      {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </td>
                  <td>
                    <input
                      defaultValue={o.carrier ?? ''}
                      placeholder="承运商（如 EMS）"
                      onKeyDown={async (e) => {
                        if (e.key === 'Enter') {
                          const v = (e.target as HTMLInputElement).value;
                          await patch(o, { status: o.status, carrier: v });
                        }
                      }}
                      style={{ fontSize: 12, padding: '4px 8px', width: 110 }}
                    />
                    <input
                      defaultValue={o.tracking_no ?? ''}
                      placeholder="录入单号后回车"
                      onKeyDown={async (e) => {
                        if (e.key === 'Enter') {
                          const v = (e.target as HTMLInputElement).value;
                          await patch(o, { status: o.status, tracking_no: v });
                        }
                      }}
                      style={{ fontSize: 12, padding: '4px 8px', minWidth: 140, marginTop: 4 }}
                    />
                  </td>
                  <td style={{ minWidth: 200 }}>
                    {rf ? (
                      rf.status === 'pending' ? (
                        <div>
                          <div style={{ fontSize: 11.5, color: 'var(--cinnabar)' }}>
                            待处理 · {usd(rf.amount)} · {fmt(rf.created_at)}
                          </div>
                          <div style={{ fontSize: 11.5, color: 'var(--ash)', margin: '3px 0' }}>{rf.reason}</div>
                          <input
                            placeholder="处理备注（可选）"
                            value={note[rf.id] ?? ''}
                            onChange={(e) => setNote((n) => ({ ...n, [rf.id]: e.target.value }))}
                            style={{ fontSize: 11.5, padding: '3px 6px', width: '100%', marginBottom: 4 }}
                          />
                          <button
                            className="adm-btn sm"
                            disabled={savingId === o.id}
                            onClick={() => handleRefund(rf, 'approve')}
                          >
                            批准退款
                          </button>
                          <button
                            className="adm-btn outline sm"
                            disabled={savingId === o.id}
                            onClick={() => handleRefund(rf, 'reject')}
                          >
                            拒绝
                          </button>
                        </div>
                      ) : (
                        <span style={{ fontSize: 11.5, color: 'var(--ash)' }}>
                          {rf.status === 'approved' ? '已批准' : '已拒绝'} · {fmt(rf.created_at)}
                        </span>
                      )
                    ) : (
                      <span style={{ fontSize: 11.5, color: 'var(--ash)' }}>—</span>
                    )}
                  </td>
                  <td style={{ whiteSpace: 'nowrap' }}>{fmt(o.created_at)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <p style={{ fontSize: 11.5, color: 'var(--ash)', marginTop: 12 }}>
        提示：承运商与物流单号录入后回车保存（单号同时把状态标记为物流）；退款申请在「退款」列批准或拒绝，批准后订单状态置 refunded 并回滚该单积分。
      </p>
    </>
  );
}
