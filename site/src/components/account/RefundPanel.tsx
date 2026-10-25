'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { formatUsd } from '@/lib/shipping';
import type { AccountLabels } from '@/lib/account/ui';

type RefundInfo = {
  id: string;
  status: string; // pending | approved | rejected
  reason: string;
  admin_note: string | null;
  created_at: number;
};

/**
 * 订单退款面板
 * - 未申请且订单可退：显示「申请退款」→ 展开原因表单 → 提交申请
 * - 已申请：显示申请状态（处理中 / 已批准 / 已拒绝）与我们的回复
 */
export function RefundPanel({
  orderId,
  amount,
  canRequest,
  request,
  labels,
}: {
  orderId: string;
  amount: number;
  canRequest: boolean;
  request: RefundInfo | null;
  labels: AccountLabels;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState('');
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ t: 'ok' | 'err'; m: string } | null>(null);

  const dateFmt = (ts: number) =>
    new Date(ts).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const text = reason.trim();
    if (!text) {
      setMsg({ t: 'err', m: labels.refundReason });
      return;
    }
    setBusy(true);
    setMsg(null);
    try {
      const res = await fetch(`/api/account/orders/${encodeURIComponent(orderId)}/refund`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: text }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setMsg({ t: 'err', m: data?.error ?? '请求失败，请稍后再试。' });
        setBusy(false);
        return;
      }
      setMsg({ t: 'ok', m: labels.refundSubmitted });
      setOpen(false);
      setReason('');
      router.refresh();
    } catch {
      setMsg({ t: 'err', m: '网络异常，请稍后再试。' });
      setBusy(false);
    }
  }

  if (request) {
    const approved = request.status === 'approved';
    const rejected = request.status === 'rejected';
    return (
      <div className="ord-refund">
        <div className={`ord-refund-state ${approved ? 'ok' : rejected ? 'no' : 'wait'}`}>
          {approved ? labels.refundApproved : rejected ? labels.refundRejected : labels.refundSubmitted}
        </div>
        <p className="acct-note">
          {formatUsd(amount)} · {dateFmt(request.created_at)}
        </p>
        <p className="ord-refund-reason">{request.reason}</p>
        {request.status === 'pending' && <p className="acct-note">{labels.refundPending}</p>}
        {request.admin_note && (
          <p className="acct-note" style={{ color: 'var(--ink)' }}>
            {labels.refundAdminNote}: {request.admin_note}
          </p>
        )}
      </div>
    );
  }

  if (!canRequest) {
    return <p className="acct-note">{labels.refundNotEligible}</p>;
  }

  return (
    <div className="ord-refund">
      <p className="acct-note">{formatUsd(amount)}</p>
      {!open ? (
        <button type="button" className="btn btn-outline" style={{ width: '100%' }} onClick={() => setOpen(true)}>
          {labels.refundApply}
        </button>
      ) : (
        <form onSubmit={submit} className="ord-refund-form">
          <label className="acct-field">
            <span>{labels.refundReason}</span>
            <textarea
              rows={3}
              value={reason}
              placeholder={labels.refundReasonPh}
              onChange={(e) => setReason(e.target.value)}
            />
          </label>
          <div className="acct-actions">
            <button type="submit" className="btn btn-solid" disabled={busy}>
              {busy ? labels.loading : labels.refundSubmit}
            </button>
            <button type="button" className="btn btn-outline" onClick={() => setOpen(false)} disabled={busy}>
              {labels.cancel}
            </button>
          </div>
        </form>
      )}
      {msg && <div className={msg.t === 'ok' ? 'acct-ok-inline' : 'acct-error-inline'}>{msg.m}</div>}
    </div>
  );
}
