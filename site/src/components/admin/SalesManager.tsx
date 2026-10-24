'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { apiFetch } from '@/lib/admin/client';

type Ev = {
  id: string;
  name: string;
  discount_percent: number;
  applies_to: string;
  target: string;
  starts_at: number;
  ends_at: number;
  status: string;
  created_at: number;
};

const CATS = ['books', 'writing-desk', 'incense', 'ritual', 'teaware', 'wearable'];

function toLocal(ms: number) { const d = new Date(ms - new Date().getTimezoneOffset() * 60000); return d.toISOString().slice(0, 16); }
function fromLocal(s: string): number { return s ? new Date(s).getTime() : 0; }

export default function SalesManager({ initial }: { initial: Ev[] }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [editing, setEditing] = useState<Ev | null>(null);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState<Record<string, string>>({});
  const [msg, setMsg] = useState<{ t: 'ok' | 'err'; m: string } | null>(null);

  function open(e: Ev) {
    setEditing(e); setCreating(false);
    let target = '';
    try { target = JSON.parse(e.target || '[]').join(', '); } catch { target = e.target; }
    setForm({
      name: e.name, discount_percent: String(e.discount_percent), applies_to: e.applies_to, target,
      starts_at: toLocal(e.starts_at), ends_at: toLocal(e.ends_at), status: e.status,
    });
    setMsg(null);
  }
  function openCreate() {
    setCreating(true); setEditing(null);
    const now = Date.now();
    setForm({ name: '', discount_percent: '10', applies_to: 'all', target: '', starts_at: toLocal(now), ends_at: toLocal(now + 7 * 864e5), status: 'active' });
    setMsg(null);
  }
  function set(k: string, v: string) { setForm((f) => ({ ...f, [k]: v })); }

  async function save() {
    setMsg(null);
    const targetArr = form.applies_to === 'all' ? [] : form.target.split(',').map((s) => s.trim()).filter(Boolean);
    const payload: Record<string, unknown> = {
      name: form.name.trim(), discount_percent: Number(form.discount_percent) || 0,
      applies_to: form.applies_to, target: targetArr,
      starts_at: fromLocal(form.starts_at), ends_at: fromLocal(form.ends_at), status: form.status,
    };
    if (editing) (payload as Record<string, unknown>).id = editing.id;
    try { await apiFetch('/api/admin/sales', { method: 'POST', body: payload }); }
    catch (e) { setMsg({ t: 'err', m: (e as Error).message }); return; }
    setEditing(null); setCreating(false); setMsg({ t: 'ok', m: '已保存' });
    startTransition(() => router.refresh());
  }

  async function remove(e: Ev) {
    if (!confirm(`确认删除活动「${e.name}」？`)) return;
    await apiFetch('/api/admin/sales', { method: 'POST', body: { id: e.id, action: 'delete' } });
    startTransition(() => router.refresh());
  }

  const showForm = editing || creating;

  return (
    <>
      <div className="adm-filters">
        <button className="adm-btn" onClick={openCreate} disabled={pending}>＋ 新建折扣活动</button>
        {msg && <span style={{ fontSize: 12.5, color: msg.t === 'ok' ? '#4a5a44' : 'var(--cinnabar)' }}>{msg.m}</span>}
      </div>

      <div className="adm-card">
        <table className="adm-table">
          <thead><tr><th>活动名称</th><th>折扣</th><th>范围</th><th>生效区间</th><th>状态</th><th className="actions">操作</th></tr></thead>
          <tbody>
            {initial.length === 0 && <tr><td colSpan={6}><div className="adm-empty">暂无折扣活动</div></td></tr>}
            {initial.map((e) => (
              <tr key={e.id}>
                <td><strong>{e.name}</strong></td>
                <td><span className="adm-tag on">{e.discount_percent}%</span></td>
                <td>{e.applies_to === 'all' ? '全站' : e.applies_to === 'category' ? '品类' : '单品'}</td>
                <td style={{ fontSize: 11.5 }}>{new Date(e.starts_at).toLocaleDateString()} – {new Date(e.ends_at).toLocaleDateString()}</td>
                <td><span className={`adm-status ${e.status}`}>{e.status}</span></td>
                <td className="actions">
                  <button className="adm-btn outline sm" onClick={() => open(e)}>编辑</button>
                  <button className="adm-btn danger sm" onClick={() => remove(e)}>删除</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showForm && (
        <div className="adm-card" style={{ marginTop: 20 }}>
          <h2>{creating ? '新建折扣活动' : `编辑 ${editing?.name}`}</h2>
          <div className="adm-form">
            <label>活动名称<input value={form.name} onChange={(e) => set('name', e.target.value)} placeholder="中秋礼遇" /></label>
            <div className="adm-form-row">
              <label>折扣百分比<input value={form.discount_percent} onChange={(e) => set('discount_percent', e.target.value)} inputMode="numeric" /></label>
              <label>状态
                <select value={form.status} onChange={(e) => set('status', e.target.value)}>
                  <option value="active">启用</option>
                  <option value="disabled">停用</option>
                </select>
              </label>
            </div>
            <label>生效范围
              <select value={form.applies_to} onChange={(e) => set('applies_to', e.target.value)}>
                <option value="all">全站商品</option>
                <option value="category">按品类</option>
                <option value="products">按单品（填 slug）</option>
              </select>
            </label>
            {form.applies_to !== 'all' && (
              <label>{form.applies_to === 'category' ? '品类（slug，逗号分隔）' : '单品 slug（逗号分隔）'}
                <input value={form.target} onChange={(e) => set('target', e.target.value)} placeholder={form.applies_to === 'category' ? 'books, teaware' : 'dao-de-jing-81-chapters'} />
              </label>
            )}
            <div className="adm-form-row">
              <label>开始时间<input type="datetime-local" value={form.starts_at} onChange={(e) => set('starts_at', e.target.value)} /></label>
              <label>结束时间<input type="datetime-local" value={form.ends_at} onChange={(e) => set('ends_at', e.target.value)} /></label>
            </div>
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
