'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { apiFetch } from '@/lib/admin/client';

type St = {
  id: string;
  username: string;
  name: string;
  role: string;
  permissions: string;
  status: string;
  created_at: number;
  last_login_at: number | null;
};

type Mod = { key: string; label: string; labelEn: string };

function parsePerm(s: string): string[] { try { return JSON.parse(s || '[]'); } catch { return []; } }

export default function StaffManager({ initial, isSuper, modules }: { initial: St[]; isSuper: boolean; modules: Mod[] }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [editing, setEditing] = useState<St | null>(null);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState<Record<string, string>>({});
  const [perms, setPerms] = useState<string[]>([]);
  const [msg, setMsg] = useState<{ t: 'ok' | 'err'; m: string } | null>(null);
  const [selfId, setSelfId] = useState<string | null>(null);

  function pickPerm(k: string) { setPerms((p) => (p.includes(k) ? p.filter((x) => x !== k) : [...p, k])); }

  function open(s: St) {
    setEditing(s); setCreating(false); setSelfId(s.id);
    setForm({ username: s.username, name: s.name, role: s.role, status: s.status, password: '' });
    setPerms(parsePerm(s.permissions));
    setMsg(null);
  }
  function openCreate() {
    setCreating(true); setEditing(null); setSelfId(null);
    setForm({ username: '', name: '', role: 'ops', status: 'active', password: '' });
    setPerms(modules.map((m) => m.key));
    setMsg(null);
  }
  function set(k: string, v: string) { setForm((f) => ({ ...f, [k]: v })); }

  async function save() {
    setMsg(null);
    const payload: Record<string, unknown> = {
      username: form.username.trim(), name: form.name.trim(), role: form.role, status: form.status,
      permissions: perms,
    };
    if (form.password) (payload as Record<string, unknown>).password = form.password;
    if (editing) (payload as Record<string, unknown>).id = editing.id;
    try { await apiFetch('/api/admin/staff', { method: editing ? 'PATCH' : 'POST', body: payload }); }
    catch (e) { setMsg({ t: 'err', m: (e as Error).message }); return; }
    setEditing(null); setCreating(false); setMsg({ t: 'ok', m: '已保存' });
    startTransition(() => router.refresh());
  }

  async function remove(s: St) {
    if (!confirm(`确认删除员工「${s.username}」？`)) return;
    await apiFetch('/api/admin/staff', { method: 'POST', body: { id: s.id, username: s.username, action: 'delete' } });
    startTransition(() => router.refresh());
  }

  const showForm = (editing || creating) && isSuper;
  const ROLE_LABELS: Record<string, string> = { super: '超级管理员', admin: '管理员', ops: '运营', support: '客服' };

  if (!isSuper) {
    return (
      <div className="adm-card">
        <table className="adm-table">
          <thead><tr><th>工号</th><th>姓名</th><th>角色</th><th>状态</th></tr></thead>
          <tbody>
            {initial.map((s) => (
              <tr key={s.id}><td>{s.username}</td><td>{s.name}</td><td>{ROLE_LABELS[s.role] ?? s.role}</td><td><span className={`adm-status ${s.status}`}>{s.status}</span></td></tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }

  return (
    <>
      <div className="adm-filters">
        <button className="adm-btn" onClick={openCreate} disabled={pending}>＋ 新增员工</button>
        {msg && <span style={{ fontSize: 12.5, color: msg.t === 'ok' ? '#4a5a44' : 'var(--cinnabar)' }}>{msg.m}</span>}
      </div>

      <div className="adm-card">
        <table className="adm-table">
          <thead><tr><th>工号</th><th>姓名</th><th>角色</th><th>权限</th><th>状态</th><th className="actions">操作</th></tr></thead>
          <tbody>
            {initial.length === 0 && <tr><td colSpan={6}><div className="adm-empty">暂无员工</div></td></tr>}
            {initial.map((s) => {
              const p = parsePerm(s.permissions);
              return (
                <tr key={s.id}>
                  <td><strong>{s.username}</strong></td>
                  <td>{s.name}</td>
                  <td>{ROLE_LABELS[s.role] ?? s.role}</td>
                  <td style={{ fontSize: 11.5 }}>{s.role === 'super' ? '全部' : p.length ? p.map((x) => modules.find((m) => m.key === x)?.label ?? x).join('、') : '—'}</td>
                  <td><span className={`adm-status ${s.status}`}>{s.status}</span></td>
                  <td className="actions">
                    <button className="adm-btn outline sm" onClick={() => open(s)}>编辑</button>
                    <button className="adm-btn danger sm" onClick={() => remove(s)}>删除</button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {showForm && (
        <div className="adm-card" style={{ marginTop: 20 }}>
          <h2>{creating ? '新增员工' : `编辑 ${editing?.username}`}</h2>
          <div className="adm-form">
            <div className="adm-form-row">
              <label>工号<input value={form.username} onChange={(e) => set('username', e.target.value)} disabled={!creating} placeholder="ZH002" /></label>
              <label>姓名<input value={form.name} onChange={(e) => set('name', e.target.value)} /></label>
            </div>
            <div className="adm-form-row">
              <label>角色
                <select value={form.role} onChange={(e) => set('role', e.target.value)}>
                  <option value="admin">管理员</option>
                  <option value="ops">运营</option>
                  <option value="support">客服</option>
                </select>
              </label>
              <label>状态
                <select value={form.status} onChange={(e) => set('status', e.target.value)}>
                  <option value="active">启用</option>
                  <option value="disabled">停用</option>
                </select>
              </label>
            </div>
            <label>{editing ? '重置密码（留空=不变）' : '初始密码'}（至少 6 位）
              <input type="password" value={form.password} onChange={(e) => set('password', e.target.value)} autoComplete="new-password" />
            </label>
            <div>
              <div style={{ fontSize: 12, color: 'var(--ash)', marginBottom: 8 }}>模块权限</div>
              <div className="adm-perm-grid">
                {modules.filter((m) => m.key !== 'dashboard').map((m) => (
                  <label key={m.key} className="adm-perm">
                    <input type="checkbox" checked={perms.includes(m.key)} onChange={() => pickPerm(m.key)} />
                    {m.label}
                  </label>
                ))}
              </div>
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
