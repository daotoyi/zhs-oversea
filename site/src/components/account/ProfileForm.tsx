'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import type { AccountLabels } from '@/lib/account/ui';

export function ProfileForm({
  labels,
  initialName,
  initialBirthday,
  initialOptIn,
}: {
  labels: AccountLabels;
  initialName: string;
  initialBirthday: string;
  initialOptIn: boolean;
}) {
  const router = useRouter();
  const [name, setName] = useState(initialName);
  const [birthday, setBirthday] = useState(initialBirthday);
  const [optIn, setOptIn] = useState(initialOptIn);
  const [state, setState] = useState<'idle' | 'busy' | 'done' | 'error'>('idle');
  const [msg, setMsg] = useState('');

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setState('busy');
    setMsg('');
    try {
      const res = await fetch('/api/account/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, birthday: birthday || null, marketingOptIn: optIn }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || labels.errGeneric);
      setState('done');
      setMsg(labels.saved);
      router.refresh();
    } catch (err) {
      setState('error');
      setMsg(err instanceof Error ? err.message : labels.errGeneric);
    }
  }

  return (
    <form className="acct-form acct-form-inline" onSubmit={save}>
      <div className="acct-row">
        <label className="acct-field">
          <span>{labels.name}</span>
          <input type="text" value={name} onChange={(e) => setName(e.target.value)} autoComplete="name" />
        </label>
        <label className="acct-field">
          <span>{labels.birthday}</span>
          <input
            type="text"
            value={birthday}
            onChange={(e) => setBirthday(e.target.value)}
            placeholder="MM-DD"
            inputMode="numeric"
          />
        </label>
      </div>
      <label className="acct-check">
        <input type="checkbox" checked={optIn} onChange={(e) => setOptIn(e.target.checked)} />
        <span>{labels.marketingOptIn}</span>
      </label>
      <div className="acct-actions">
        <button className="btn btn-outline" type="submit" disabled={state === 'busy'}>
          {state === 'busy' ? labels.saving : labels.save}
        </button>
        {msg && <span className={state === 'error' ? 'acct-error-inline' : 'acct-ok-inline'}>{msg}</span>}
      </div>
    </form>
  );
}

export function PasswordForm({
  labels,
  hasPassword,
}: {
  labels: AccountLabels;
  hasPassword: boolean;
}) {
  const [current, setCurrent] = useState('');
  const [next, setNext] = useState('');
  const [confirm, setConfirm] = useState('');
  const [state, setState] = useState<'idle' | 'busy' | 'done' | 'error'>('idle');
  const [msg, setMsg] = useState('');

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (next !== confirm) {
      setState('error');
      setMsg(labels.errGeneric);
      return;
    }
    setState('busy');
    setMsg('');
    try {
      const res = await fetch('/api/account/password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentPassword: current, password: next }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || labels.errGeneric);
      setState('done');
      setMsg(labels.saved);
      setCurrent('');
      setNext('');
      setConfirm('');
    } catch (err) {
      setState('error');
      setMsg(err instanceof Error ? err.message : labels.errGeneric);
    }
  }

  return (
    <form className="acct-form acct-form-inline" onSubmit={submit}>
      {!hasPassword && <p className="acct-note">{labels.passwordSetForOauth}</p>}
      {hasPassword && (
        <label className="acct-field">
          <span>{labels.currentPassword}</span>
          <input
            type="password"
            value={current}
            onChange={(e) => setCurrent(e.target.value)}
            autoComplete="current-password"
            required
          />
        </label>
      )}
      <div className="acct-row">
        <label className="acct-field">
          <span>{labels.newPassword}</span>
          <input
            type="password"
            value={next}
            onChange={(e) => setNext(e.target.value)}
            autoComplete="new-password"
            minLength={8}
            required
          />
        </label>
        <label className="acct-field">
          <span>{labels.confirmPassword}</span>
          <input
            type="password"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            autoComplete="new-password"
            minLength={8}
            required
          />
        </label>
      </div>
      <div className="acct-actions">
        <button className="btn btn-outline" type="submit" disabled={state === 'busy'}>
          {state === 'busy' ? labels.saving : hasPassword ? labels.changePassword : labels.setPassword}
        </button>
        {msg && <span className={state === 'error' ? 'acct-error-inline' : 'acct-ok-inline'}>{msg}</span>}
      </div>
    </form>
  );
}
