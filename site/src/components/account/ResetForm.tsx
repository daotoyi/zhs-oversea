'use client';

import { useState } from 'react';
import Link from 'next/link';
import type { AccountLabels } from '@/lib/account/ui';

export function ResetForm({ labels, token }: { labels: AccountLabels; token: string }) {
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [state, setState] = useState<'idle' | 'busy' | 'done' | 'error'>('idle');
  const [msg, setMsg] = useState('');

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (password !== confirm) {
      setState('error');
      setMsg(labels.errGeneric);
      return;
    }
    setState('busy');
    setMsg('');
    try {
      const res = await fetch('/api/account/reset', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || labels.errGeneric);
      setState('done');
      setMsg(labels.resetDone);
    } catch (err) {
      setState('error');
      setMsg(err instanceof Error ? err.message : labels.errGeneric);
    }
  }

  if (!token) {
    return (
      <div className="acct-auth">
        <h1 className="serif">{labels.resetTitle}</h1>
        <p className="acct-note">{labels.errState}</p>
        <Link className="btn btn-outline" href="/account/login">
          {labels.back}
        </Link>
      </div>
    );
  }

  return (
    <div className="acct-auth">
      <div className="acct-auth-head">
        <h1 className="serif">{labels.resetTitle}</h1>
        <p>{labels.resetLead}</p>
      </div>

      {state === 'done' ? (
        <div className="acct-form">
          <p className="acct-info">{msg}</p>
          <Link className="btn btn-solid acct-submit" href="/account/login">
            {labels.signIn}
          </Link>
        </div>
      ) : (
        <form className="acct-form" onSubmit={submit}>
          <label className="acct-field">
            <span>{labels.newPassword}</span>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              minLength={8}
              autoComplete="new-password"
              required
            />
            <em className="acct-hint">{labels.passwordHint}</em>
          </label>
          <label className="acct-field">
            <span>{labels.confirmPassword}</span>
            <input
              type="password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              minLength={8}
              autoComplete="new-password"
              required
            />
          </label>
          {state === 'error' && <p className="acct-error">{msg}</p>}
          <button className="btn btn-solid acct-submit" type="submit" disabled={state === 'busy'}>
            {state === 'busy' ? labels.loading : labels.submitReset}
          </button>
        </form>
      )}
    </div>
  );
}
