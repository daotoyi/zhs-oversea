'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { apiFetch } from '@/lib/admin/client';

type Cp = {
  code: string;
  type: string;
  value: number;
  min_subtotal: number;
  max_uses: number;
  used_count: number;
  per_customer_limit: number;
  starts_at: number | null;
  ends_at: number | null;
  status: string;
  created_at: number;
};

function usd(cents: number) { return `$${(cents / 100).toFixed(2)}`; }
function fmt(v: number, type: string) { return type === 'percent' ? `${v}%` : usd(v); }
function toLocal(ms: number | null) {
  if (!ms) return '';
  const d = new Date(ms - new Date().getTimezoneOffset() * 60000);
  return d.toISOString().slice(0, 16);
}
function fromLocal(s: string): number | null { return s ? new Date(s).getTime() : null; }

export default function CouponsManager({ initial }: { initial: Cp[] }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [editing, setEditing] = useState<Cp | null>(null);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState<Record<string, string>>({});
  const [msg, setMsg] = useState<{ t: 'ok' | 'err'; m: string } | null>(null);

  function open(c: Cp) {
    setEditing(c); setCreating(false);
    setForm({
      code: c.code, type: c.type, value: String(c.type === 'percent' ? c.value : c.value / 100),
      min_subtotal: String(c.min_subtotal / 100), max_uses: String(c.max_uses),
      per_customer_limit: String(c.per_customer_limit), starts_at: toLocal(c.starts_at), ends_at: toLocal(c.ends_at), status: c.status,
    });
    setMsg(null);
  }
  function openCreate() {
    setCreating(true); setEditing(null);
    setForm({ code: '', type: 'percent', value: '10', min_subtotal: '0', max_uses: '0', per_customer_limit: '1', starts_at: '', ends_at: '', status: 'active' });
    setMsg(null);
  }
  function set(k: string, v: string) { setForm((f) => ({ ...f, [k]: v })); }

  async function save() {
    setMsg(null);
    const payload: Record<string, unknown> = {
      code: form.code.trim().toUpperCase(),
      type: form.type,
      value: form.type === 'percent' ? Number(form.value) || 0 : Math.round((Number(form.value) || 0) * 100),
      min_subtotal: Math.round((Number(form.min_subtotal) || 0) * 100),
      max_uses: Number(form.max_uses) || 0,
      per_customer_limit: Number(form.per_customer_limit) || 0,
      starts_at: fromLocal(form.starts_at),
      ends_at: fromLocal(form.ends_at),
      status: form.status,
    };
    if (editing) (payload as Record<string, unknown>).code = editing.code;
    try { await apiFetch('/api/admin/coupons', { method: 'POST', body: payload }); }
    catch (e) { setMsg({ t: 'err', m: (e as Error).message }); return; }
    setEditing(null); setCreating(false); setMsg({ t: 'ok', m: '已保存' });
    startTransition(() => router.refresh());
  }

  async function remove(c: Cp) {
    if (!confirm(`确认删除优惠券「${c.code}」？`)) return;
    await apiFetch('/api/admin/coupons', { method: 'POST', body: { code: c.code, action: 'delete' } });
    startTransition(() => router.refresh());
  }

  const showForm = editing || creating;

  return (
    <>
      <div className="adm-filters">
        <button className="adm-btn" onClick={openCreate} disabled={pending}>＋ 新增优惠券</button>
        {msg && <span style={{ fontSize: 12.5, color: msg.t === 'ok' ? '#4a5a44' : 'var(--cinnabar)' }}>{msg.m}</span>}
      </div>

      <div className="adm-card">
        <table className="adm-table">
          <thead><tr><th>券码</th><th>类型</th><th>门槛</th><th>用量</th><th>有效期</th><th>状态</th><th className="actions">操作</th></tr></thead>
          <tbody>
            {initial.length === 0 && <tr><td colSpan={7}><div className="adm-empty">暂无优惠券</div></td></tr>}
            {initial.map((c) => (
              <tr key={c.code}>
                <td><strong>{c.code}</strong></td>
                <td><span className="adm-tag on">{fmt(c.value, c.type)}</span></td>
                <td>{c.min_subtotal ? `满 ${usd(c.min_subtotal)}` : '无'}</td>
                <td>{c.used_count}{c.max_uses ? ` / ${c.max_uses}` : ''}</td>
                <td style={{ fontSize: 11.5 }}>
                  {c.starts_at ? new Date(c.starts_at).toLocaleDateString() : '即起'} – {c.ends_at ? new Date(c.ends_at).toLocaleDateString() : '永久'}
                </td>
                <td><span className={`adm-status ${c.status}`}>{c.status}</span></td>
                <td className="actions">
                  <button className="adm-btn outline sm" onClick={() => open(c)}>编辑</button>
                  <button className="adm-btn danger sm" onClick={() => remove(c)}>删除</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showForm && (
        <div className="adm-card" style={{ marginTop: 20 }}>
          <h2>{creating ? '新增优惠券' : `编辑 ${editing?.code}`}</h2>
          <div className="adm-form">
            <div className="adm-form-row">
              <label>券码<input value={form.code} onChange={(e) => set('code', e.target.value)} disabled={!creating} placeholder="AUTUMN10" /></label>
              <label>类型
                <select value={form.type} onChange={(e) => set('type', e.target.value)}>
                  <option value="percent">百分比折扣（%）</option>
                  <option value="fixed">固定立减（美元）</option>
                </select>
              </label>
            </div>
            <div className="adm-form-row">
              <label>{form.type === 'percent' ? '折扣百分比' : '立减金额（美元）'}<input value={form.value} onChange={(e) => set('value', e.target.value)} inputMode="decimal" /></label>
              <label>最低消费（美元）<input value={form.min_subtotal} onChange={(e) => set('min_subtotal', e.target.value)} inputMode="decimal" /></label>
            </div>
            <div className="adm-form-row">
              <label>总次数上限（0=不限）<input value={form.max_uses} onChange={(e) => set('max_uses', e.target.value)} inputMode="numeric" /></label>
              <label>每人限用次数<input value={form.per_customer_limit} onChange={(e) => set('per_customer_limit', e.target.value)} inputMode="numeric" /></label>
            </div>
            <div className="adm-form-row">
              <label>生效时间<input type="datetime-local" value={form.starts_at} onChange={(e) => set('starts_at', e.target.value)} /></label>
              <label>失效时间<input type="datetime-local" value={form.ends_at} onChange={(e) => set('ends_at', e.target.value)} /></label>
            </div>
            <label>状态
              <select value={form.status} onChange={(e) => set('status', e.target.value)}>
                <option value="active">启用</option>
                <option value="disabled">停用</option>
              </select>
            </label>
            <div className="adm-form-actions">
              <button className="adm-btn" onClick={save} disabled={pending}>保存</button>
              <button className="adm-btn outline" onClick={() => { setEditing(null); setCreating(false); }}>取消</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
