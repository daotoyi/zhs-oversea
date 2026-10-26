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
  acquisition_mode: string;
  show_on_home: number;
  claim_count?: number;
  created_at: number;
};

function usd(cents: number) { return `$${(cents / 100).toFixed(2)}`; }
function fmt(v: number, type: string) {
  if (type === 'freeship') return '免运费';
  return type === 'percent' ? `${v}%` : usd(v);
}
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
      code: c.code, type: c.type,
      value: String(c.type === 'percent' ? c.value : c.value / 100),
      min_subtotal: String(c.min_subtotal / 100), max_uses: String(c.max_uses),
      per_customer_limit: String(c.per_customer_limit),       starts_at: toLocal(c.starts_at), ends_at: toLocal(c.ends_at), status: c.status,
      acquisition_mode: c.acquisition_mode || 'manual',
      show_on_home: String(c.show_on_home ?? 0),
    });
    setMsg(null);
  }
  function openCreate() {
    setCreating(true); setEditing(null);
    setForm({ code: '', type: 'percent', value: '10', min_subtotal: '0', max_uses: '0', per_customer_limit: '1', starts_at: '', ends_at: '', status: 'active', acquisition_mode: 'manual', show_on_home: '0' });
    setMsg(null);
  }
  function set(k: string, v: string) { setForm((f) => ({ ...f, [k]: v })); }

  async function save() {
    setMsg(null);
    const payload: Record<string, unknown> = {
      code: form.code.trim().toUpperCase(),
      type: form.type,
      value: form.type === 'percent'
        ? Number(form.value) || 0
        : form.type === 'freeship' ? 0 : Math.round((Number(form.value) || 0) * 100),
      min_subtotal: Math.round((Number(form.min_subtotal) || 0) * 100),
      max_uses: Number(form.max_uses) || 0,
      per_customer_limit: Number(form.per_customer_limit) || 0,
      starts_at: fromLocal(form.starts_at),
      ends_at: fromLocal(form.ends_at),
      status: form.status,
      acquisition_mode: form.acquisition_mode,
      show_on_home: form.show_on_home === '1' ? 1 : 0,
    };
    if (editing) payload.code = editing.code;
    if (!payload.code) { setMsg({ t: 'err', m: '券码必填' }); return; }
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

  /** 一键切换「首页展示」开关（不打开编辑框，直接落库） */
  async function toggleHome(c: Cp) {
    await apiFetch('/api/admin/coupons', {
      method: 'POST',
      body: { code: c.code, show_on_home: c.show_on_home ? 0 : 1 },
    });
    startTransition(() => router.refresh());
  }

  /** 一键铺好一张免运费券的字段（生成券码 → 提交保存） */
  async function generateFreeship() {
    const code = `FREESHIP${Date.now().toString(36).slice(-5).toUpperCase()}`;
    setForm({
      code,
      type: 'freeship',
      value: '0',
      min_subtotal: '0',
      max_uses: '0',
      per_customer_limit: '1',
      starts_at: '',
      ends_at: '',
      status: 'active',
      acquisition_mode: 'auto',
    });
    setCreating(true);
    setEditing(null);
    setMsg({ t: 'ok', m: `已生成免运费券 ${code}，确认后点「保存」` });
  }

  function claimUrl(code: string) {
    const base = process.env.NEXT_PUBLIC_SITE_URL
      || (typeof window !== 'undefined' ? window.location.origin : 'https://zhenhesheng.com');
    // 用短链形态，比带查询串的地址更好发、不易被邮件客户端截断
    return `${base.replace(/\/$/, '')}/coupon/${encodeURIComponent(code)}`;
  }

  async function copyClaimLink(code: string) {
    try {
      await navigator.clipboard.writeText(claimUrl(code));
      setMsg({ t: 'ok', m: '领取链接已复制' });
      setTimeout(() => setMsg(null), 2000);
    } catch {
      setMsg({ t: 'err', m: '复制失败，请手动选中链接复制' });
    }
  }

  const showForm = Boolean(editing || creating);
  const currentCode = (creating ? form.code : editing?.code) || '';

  return (
    <>
      <div className="adm-filters">
        <button className="adm-btn" onClick={openCreate} disabled={pending}>＋ 新增优惠券</button>
        <button className="adm-btn outline" onClick={generateFreeship} disabled={pending}>🎁 生成免运费券</button>
        {msg && <span style={{ fontSize: 12.5, color: msg.t === 'ok' ? '#4a5a44' : 'var(--cinnabar)' }}>{msg.m}</span>}
      </div>

      <div className="adm-card">
        <table className="adm-table">
          <thead><tr><th>券码</th><th>类型</th><th>门槛</th><th>用量</th><th>有效期</th><th>领取方式</th><th>首页</th><th>状态</th><th className="actions">操作</th></tr></thead>
          <tbody>
            {initial.length === 0 && <tr><td colSpan={9}><div className="adm-empty">暂无优惠券</div></td></tr>}
            {initial.map((c) => (
              <tr key={c.code}>
                <td><strong>{c.code}</strong></td>
                <td><span className="adm-tag on">{fmt(c.value, c.type)}</span></td>
                <td>{c.type === 'freeship' ? '不限' : (c.min_subtotal ? `满 ${usd(c.min_subtotal)}` : '无')}</td>
                <td>{c.used_count}{c.max_uses ? ` / ${c.max_uses}` : ''}</td>
                <td style={{ fontSize: 11.5 }}>
                  {c.starts_at ? new Date(c.starts_at).toLocaleDateString() : '即起'} – {c.ends_at ? new Date(c.ends_at).toLocaleDateString() : '永久'}
                </td>
                <td style={{ fontSize: 11.5 }}>
                  {c.acquisition_mode === 'auto'
                    ? <>公开领取{c.claim_count ? ` · ${c.claim_count} 人领` : ''}</>
                    : '手动发放'}
                </td>
                <td><span className={`adm-status ${c.status}`}>{c.status}</span></td>
                <td>
                  <button
                    className={`adm-btn sm ${c.show_on_home ? '' : 'outline'}`}
                    onClick={() => toggleHome(c)}
                    title="切换是否在网站首页浮动展示"
                    disabled={c.status !== 'active'}
                  >
                    {c.show_on_home ? '展示中' : '不展示'}
                  </button>
                </td>
                <td className="actions">
                  <button className="adm-btn outline sm" onClick={() => open(c)}>编辑</button>
                  {c.acquisition_mode === 'auto' && (
                    <button className="adm-btn outline sm" onClick={() => copyClaimLink(c.code)}>复制领取链接</button>
                  )}
                  <button className="adm-btn danger sm" onClick={() => remove(c)}>删除</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showForm && (
        <div className="adm-card" style={{ marginTop: 20 }}>
          <h2 style={{ marginBottom: 12 }}>{creating ? '新增优惠券' : `编辑 ${editing?.code}`}</h2>
          <div className="adm-form">
            <div className="adm-form-row">
              <label>券码<input value={form.code} onChange={(e) => set('code', e.target.value)} disabled={!creating} placeholder="FREESHIP99" /></label>
              <label>类型
                <select value={form.type} onChange={(e) => set('type', e.target.value)}>
                  <option value="percent">百分比折扣（%）</option>
                  <option value="fixed">固定立减（美元）</option>
                  <option value="freeship">免运费（运费全免）</option>
                </select>
              </label>
            </div>
            <div className="adm-form-row">
              {form.type === 'freeship' ? (
                <label>折扣力度<input value="运费全免（商品金额不变）" disabled /></label>
              ) : (
                <label>{form.type === 'percent' ? '折扣百分比' : '立减金额（美元）'}<input value={form.value} onChange={(e) => set('value', e.target.value)} inputMode="decimal" /></label>
              )}
              <label>最低消费（美元）<input value={form.min_subtotal} onChange={(e) => set('min_subtotal', e.target.value)} inputMode="decimal" /></label>
            </div>
            {form.type === 'freeship' && (
              <p style={{ fontSize: 12, color: '#2d5f28', margin: '-4px 0 8px' }}>
                本券不减免商品金额，只把本单运费归零（任何运费档位都适用）。
              </p>
            )}
            <div className="adm-form-row">
              <label>总次数上限（0=不限）<input value={form.max_uses} onChange={(e) => set('max_uses', e.target.value)} inputMode="numeric" /></label>
              <label>每人限用次数<input value={form.per_customer_limit} onChange={(e) => set('per_customer_limit', e.target.value)} inputMode="numeric" /></label>
            </div>
            <div className="adm-form-row">
              <label>生效时间<input type="datetime-local" value={form.starts_at} onChange={(e) => set('starts_at', e.target.value)} /></label>
              <label>失效时间<input type="datetime-local" value={form.ends_at} onChange={(e) => set('ends_at', e.target.value)} /></label>
            </div>
            <label>领取方式
              <select value={form.acquisition_mode} onChange={(e) => set('acquisition_mode', e.target.value)}>
                <option value="manual">手动发放（券码私下给客户）</option>
                <option value="auto">公开领取（挂链接，访客自助领）</option>
              </select>
            </label>
            {form.acquisition_mode === 'auto' && currentCode && (
              <div style={{ background: '#f7f7f4', border: '1px solid #e6e4dc', borderRadius: 4, padding: '10px 12px', margin: '4px 0 10px', fontSize: 12 }}>
                <div style={{ color: '#666', marginBottom: 6 }}>领取链接（发到社媒 / 邮件 / 短信都可用）</div>
                <code style={{ wordBreak: 'break-all', userSelect: 'all' }}>{claimUrl(currentCode)}</code>
                <div style={{ marginTop: 8 }}>
                  <button className="adm-btn outline sm" onClick={() => copyClaimLink(currentCode)} type="button">📋 复制链接</button>
                </div>
              </div>
            )}
            <label>状态
              <select value={form.status} onChange={(e) => set('status', e.target.value)}>
                <option value="active">启用</option>
                <option value="disabled">停用</option>
              </select>
            </label>
            <label className="adm-check">
              <input type="checkbox" checked={form.show_on_home === '1'} onChange={(e) => set('show_on_home', e.target.checked ? '1' : '0')} />
              在网站首页浮动展示（发布后首页会出现优惠挂件，过期或停用后自动消失）
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
