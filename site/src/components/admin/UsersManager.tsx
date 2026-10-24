'use client';

import { useState, useTransition, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { apiFetch } from '@/lib/admin/client';

type Cust = {
  id: string;
  email: string;
  name: string | null;
  tags: string;
  notes: string | null;
  order_count: number;
  total_spent: number;
  last_order_at: number | null;
};

function usd(cents: number) { return `$${(cents / 100).toFixed(2)}`; }
function parseTags(s: string): string[] { try { return JSON.parse(s || '[]'); } catch { return []; } }

export default function UsersManager({ initial, tags }: { initial: Cust[]; tags: string[] }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [tagFilter, setTagFilter] = useState('all');
  const [q, setQ] = useState('');
  const [editing, setEditing] = useState<Cust | null>(null);
  const [form, setForm] = useState<Record<string, string>>({});
  const [msg, setMsg] = useState<string | null>(null);

  const filtered = useMemo(
    () => initial.filter((c) => {
      if (tagFilter !== 'all' && !parseTags(c.tags).includes(tagFilter)) return false;
      if (q && !(`${c.email} ${c.name ?? ''}`.toLowerCase().includes(q.toLowerCase()))) return false;
      return true;
    }),
    [initial, tagFilter, q]
  );

  function open(c: Cust) {
    const t = parseTags(c.tags);
    setEditing(c);
    setForm({ name: c.name ?? '', notes: c.notes ?? '', tags: t.join(', ') });
    setMsg(null);
  }
  function set(k: string, v: string) { setForm((f) => ({ ...f, [k]: v })); }

  async function save() {
    const newTags = form.tags.split(',').map((s) => s.trim()).filter(Boolean);
    try {
      await apiFetch('/api/admin/users', { method: 'PATCH', body: { id: editing!.id, name: form.name || null, notes: form.notes || null, tags: newTags } });
    } catch (e) { setMsg((e as Error).message); return; }
    setEditing(null);
    setMsg('已保存');
    startTransition(() => router.refresh());
  }

  return (
    <>
      <div className="adm-filters">
        <input placeholder="搜索邮箱 / 姓名" value={q} onChange={(e) => setQ(e.target.value)} />
        <select value={tagFilter} onChange={(e) => setTagFilter(e.target.value)}>
          <option value="all">全部分组</option>
          {tags.map((t) => <option key={t} value={t}>{t}</option>)}
        </select>
        <span style={{ fontSize: 12.5, color: 'var(--ash)' }}>{filtered.length} / {initial.length} 人</span>
      </div>

      <div className="adm-card">
        <table className="adm-table">
          <thead>
            <tr><th>邮箱</th><th>姓名</th><th>分组标签</th><th className="num">订单数</th><th className="num">累计消费</th><th>最近购买</th><th className="actions">操作</th></tr>
          </thead>
          <tbody>
            {filtered.length === 0 && <tr><td colSpan={7}><div className="adm-empty">暂无客户 — 订单成交后自动建档</div></td></tr>}
            {filtered.map((c) => {
              const t = parseTags(c.tags);
              return (
                <tr key={c.id}>
                  <td>{c.email}</td>
                  <td>{c.name ?? '—'}</td>
                  <td>{t.length ? t.map((x) => <span key={x} className="adm-tag on">{x}</span>) : <span style={{ color: 'var(--ash)' }}>—</span>}</td>
                  <td className="num">{c.order_count}</td>
                  <td className="num">{usd(c.total_spent)}</td>
                  <td style={{ whiteSpace: 'nowrap' }}>{c.last_order_at ? new Date(c.last_order_at).toLocaleDateString() : '—'}</td>
                  <td className="actions"><button className="adm-btn outline sm" onClick={() => open(c)}>编辑标签</button></td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {editing && (
        <div className="adm-card" style={{ marginTop: 20 }}>
          <h2>编辑客户 · {editing.email}</h2>
          <div className="adm-form">
            <label>姓名<input value={form.name} onChange={(e) => set('name', e.target.value)} /></label>
            <label>分组标签（逗号分隔）
              <input value={form.tags} onChange={(e) => set('tags', e.target.value)} placeholder="VIP, 香道爱好者" />
            </label>
            <label>备注<textarea value={form.notes} onChange={(e) => set('notes', e.target.value)} style={{ minHeight: 70 }} /></label>
            <div className="adm-form-actions">
              <button className="adm-btn" onClick={save} disabled={pending}>保存</button>
              <button className="adm-btn outline" onClick={() => setEditing(null)}>取消</button>
              {msg && <span style={{ fontSize: 12.5, color: msg === '已保存' ? '#4a5a44' : 'var(--cinnabar)' }}>{msg}</span>}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
