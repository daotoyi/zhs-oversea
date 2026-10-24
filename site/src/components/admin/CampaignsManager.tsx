'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { apiFetch } from '@/lib/admin/client';

type Cmp = {
  id: string;
  name: string;
  subject: string;
  body: string;
  target_tags: string;
  status: string;
  sent_count: number;
  created_at: number;
  sent_at: number | null;
};

function parseTags(s: string): string[] { try { return JSON.parse(s || '[]'); } catch { return []; } }

export default function CampaignsManager({ initial, tags }: { initial: Cmp[]; tags: string[] }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [editing, setEditing] = useState<Cmp | null>(null);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState<Record<string, string>>({});
  const [msg, setMsg] = useState<{ t: 'ok' | 'err'; m: string } | null>(null);

  function open(c: Cmp) {
    setEditing(c); setCreating(false);
    setForm({ name: c.name, subject: c.subject, body: c.body, target_tags: parseTags(c.target_tags).join(', ') });
    setMsg(null);
  }
  function openCreate() {
    setCreating(true); setEditing(null);
    setForm({ name: '', subject: '', body: '', target_tags: '' });
    setMsg(null);
  }
  function set(k: string, v: string) { setForm((f) => ({ ...f, [k]: v })); }

  async function save() {
    setMsg(null);
    const payload: Record<string, unknown> = {
      name: form.name.trim(), subject: form.subject.trim(), body: form.body.trim(),
      target_tags: form.target_tags.split(',').map((s) => s.trim()).filter(Boolean),
    };
    if (editing) (payload as Record<string, unknown>).id = editing.id;
    try { await apiFetch('/api/admin/campaigns', { method: 'POST', body: payload }); }
    catch (e) { setMsg({ t: 'err', m: (e as Error).message }); return; }
    setEditing(null); setCreating(false); setMsg({ t: 'ok', m: '已保存草稿' });
    startTransition(() => router.refresh());
  }

  async function send(c: Cmp) {
    if (!confirm(`向「${parseTags(c.target_tags).length ? parseTags(c.target_tags).join('/') : '全部客户'}」发送「${c.name}」？\n（未配置邮件通道时仅记录待发送）`)) return;
    setMsg(null);
    try {
      const r = await apiFetch<{ delivered: boolean; recipients: number; sent: number; message: string }>(
        '/api/admin/campaigns', { method: 'POST', body: { id: c.id, action: 'send' } }
      );
      setMsg({ t: 'ok', m: r.message || '已发送' });
    } catch (e) { setMsg({ t: 'err', m: (e as Error).message }); return; }
    startTransition(() => router.refresh());
  }

  async function remove(c: Cmp) {
    if (!confirm(`确认删除邮件活动「${c.name}」？`)) return;
    await apiFetch('/api/admin/campaigns', { method: 'POST', body: { id: c.id, action: 'delete' } });
    startTransition(() => router.refresh());
  }

  const showForm = editing || creating;

  return (
    <>
      <div className="adm-filters">
        <button className="adm-btn" onClick={openCreate} disabled={pending}>＋ 新建邮件活动</button>
        {msg && <span style={{ fontSize: 12.5, color: msg.t === 'ok' ? '#4a5a44' : 'var(--cinnabar)' }}>{msg.m}</span>}
      </div>

      <div className="adm-card">
        <table className="adm-table">
          <thead><tr><th>名称</th><th>主题</th><th>目标分组</th><th>状态</th><th>已发送</th><th className="actions">操作</th></tr></thead>
          <tbody>
            {initial.length === 0 && <tr><td colSpan={6}><div className="adm-empty">暂无邮件活动</div></td></tr>}
            {initial.map((c) => {
              const tg = parseTags(c.target_tags);
              return (
                <tr key={c.id}>
                  <td><strong>{c.name}</strong></td>
                  <td>{c.subject}</td>
                  <td>{tg.length ? tg.map((t) => <span key={t} className="adm-tag on">{t}</span>) : <span style={{ color: 'var(--ash)' }}>全部</span>}</td>
                  <td><span className={`adm-status ${c.status}`}>{c.status}</span></td>
                  <td className="num">{c.sent_count}</td>
                  <td className="actions">
                    {c.status !== 'sending' && <button className="adm-btn outline sm" onClick={() => send(c)}>发送</button>}
                    <button className="adm-btn outline sm" onClick={() => open(c)}>编辑</button>
                    <button className="adm-btn danger sm" onClick={() => remove(c)}>删除</button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {showForm && (
        <div className="adm-card" style={{ marginTop: 20 }}>
          <h2>{creating ? '新建邮件活动' : `编辑 ${editing?.name}`}</h2>
          <div className="adm-form">
            <label>活动名称<input value={form.name} onChange={(e) => set('name', e.target.value)} placeholder="春季新品预告" /></label>
            <label>邮件主题<input value={form.subject} onChange={(e) => set('subject', e.target.value)} placeholder="春季限定 · 茶器上新" /></label>
            <label>正文（支持纯文本 / HTML）
              <textarea value={form.body} onChange={(e) => set('body', e.target.value)} style={{ minHeight: 160 }} />
            </label>
            <label>目标分组标签（逗号分隔，留空=全部客户）
              <input value={form.target_tags} onChange={(e) => set('target_tags', e.target.value)} placeholder={tags.join(', ') || 'VIP'} />
            </label>
            <div className="adm-form-actions">
              <button className="adm-btn" onClick={save} disabled={pending}>保存草稿</button>
              <button className="adm-btn outline" onClick={() => { setEditing(null); setCreating(false); }}>取消</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
