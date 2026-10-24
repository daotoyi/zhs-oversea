'use client';

import { useState } from 'react';
import type { AccountLabels } from '@/lib/account/ui';

type Provider = { key: string; label: string; enabled: boolean; missing?: string[] };

type Mode = 'login' | 'register' | 'forgot';

export function AuthPanel({
  labels,
  providers,
  next,
  initialError,
  initialMode = 'login',
}: {
  labels: AccountLabels;
  providers: Provider[];
  next: string;
  initialError?: string;
  initialMode?: Mode;
}) {
  const [mode, setMode] = useState<Mode>(initialMode);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [name, setName] = useState('');
  const [birthday, setBirthday] = useState('');
  const [optIn, setOptIn] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(initialError ?? null);
  const [info, setInfo] = useState<string | null>(null);

  const anyOff = providers.some((p) => !p.enabled);
  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setInfo(null);

    if (mode === 'register' && password !== confirm) {
      setError(labels.errGeneric);
      return;
    }

    setBusy(true);
    try {
      if (mode === 'forgot') {
        const res = await fetch('/api/account/forgot', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data?.error || labels.errGeneric);
        setInfo(labels.forgotSent);
        return;
      }

      const endpoint = mode === 'login' ? '/api/account/login' : '/api/account/register';
      const payload =
        mode === 'login'
          ? { email, password, next }
          : { email, password, name, birthday: birthday || null, marketingOptIn: optIn, next };

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || labels.errGeneric);
      window.location.href = data.redirect || '/account';
    } catch (err) {
      setError(err instanceof Error ? err.message : labels.errGeneric);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="acct-auth">
      <div className="acct-auth-head">
        <div className="eyebrow">{labels.account}</div>
        <h1 className="serif">{labels.authTitle}</h1>
        <p>{labels.authLead}</p>
      </div>

      {mode !== 'forgot' && (
        <div className="acct-tabs" role="tablist">
          <button
            type="button"
            role="tab"
            aria-selected={mode === 'login'}
            className={mode === 'login' ? 'on' : ''}
            onClick={() => { setMode('login'); setError(null); setInfo(null); }}
          >
            {labels.loginTab}
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={mode === 'register'}
            className={mode === 'register' ? 'on' : ''}
            onClick={() => { setMode('register'); setError(null); setInfo(null); }}
          >
            {labels.registerTab}
          </button>
        </div>
      )}

      {mode === 'forgot' && (
        <div className="acct-forgot-head">
          <h2 className="serif">{labels.forgotTitle}</h2>
          <p>{labels.forgotLead}</p>
        </div>
      )}

      <form className="acct-form" onSubmit={submit}>
        <label className="acct-field">
          <span>{labels.email}</span>
          <input
            type="email"
            name="email"
            autoComplete="email"
            required
            placeholder={labels.emailPlaceholder}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </label>

        {mode !== 'forgot' && (
          <label className="acct-field">
            <span>{labels.password}</span>
            <input
              type="password"
              name="password"
              autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
              required
              minLength={8}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            {mode === 'register' && <em className="acct-hint">{labels.passwordHint}</em>}
          </label>
        )}

        {mode === 'register' && (
          <>
            <label className="acct-field">
              <span>{labels.confirmPassword}</span>
              <input
                type="password"
                autoComplete="new-password"
                required
                minLength={8}
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
              />
            </label>
            <div className="acct-row">
              <label className="acct-field">
                <span>
                  {labels.name} <em className="acct-hint-inline">({labels.optional})</em>
                </span>
                <input type="text" name="name" autoComplete="name" value={name} onChange={(e) => setName(e.target.value)} />
              </label>
              <label className="acct-field">
                <span>
                  {labels.birthday} <em className="acct-hint-inline">({labels.optional})</em>
                </span>
                <input
                  type="text"
                  name="birthday"
                  inputMode="numeric"
                  placeholder="MM-DD"
                  value={birthday}
                  onChange={(e) => setBirthday(e.target.value)}
                />
              </label>
            </div>
            <label className="acct-check">
              <input type="checkbox" checked={optIn} onChange={(e) => setOptIn(e.target.checked)} />
              <span>{labels.marketingOptIn}</span>
            </label>
          </>
        )}

        {error && <p className="acct-error" role="alert">{error}</p>}
        {info && <p className="acct-info" role="status">{info}</p>}

        <button className="btn btn-solid acct-submit" type="submit" disabled={busy}>
          {busy
            ? labels.loading
            : mode === 'login'
              ? labels.submitLogin
              : mode === 'register'
                ? labels.submitRegister
                : labels.submitForgot}
        </button>
      </form>

      <div className="acct-auth-links">
        {mode === 'login' && (
          <>
            <button type="button" className="acct-link" onClick={() => { setMode('forgot'); setError(null); setInfo(null); }}>
              {labels.forgotLink}
            </button>
            <span className="acct-links-sep">·</span>
            <button type="button" className="acct-link" onClick={() => { setMode('register'); setError(null); }}>
              {labels.registerTab}
            </button>
          </>
        )}
        {mode === 'register' && (
          <button type="button" className="acct-link" onClick={() => { setMode('login'); setError(null); }}>
            {labels.haveAccount} {labels.signIn}
          </button>
        )}
        {mode === 'forgot' && (
          <button type="button" className="acct-link" onClick={() => { setMode('login'); setError(null); setInfo(null); }}>
            {labels.back}
          </button>
        )}
      </div>

      {mode !== 'forgot' && (
        <div className="acct-oauth">
          <div className="acct-or">
            <span>{labels.orContinue}</span>
          </div>
          <div className="acct-oauth-btns">
            {/* 按钮常驻：让访客看得见支持哪些方式。未配置凭据时点了会回登录页给出明确提示 */}
            {providers.map((p) => (
              <a
                key={p.key}
                className={`acct-oauth-btn${p.enabled ? '' : ' is-off'}`}
                href={`/api/auth/oauth/${p.key}?next=${encodeURIComponent(next)}`}
                aria-disabled={!p.enabled}
              >
                {p.key === 'google' ? <GoogleMark /> : <AppleMark />}
                <span>
                  {labels.continueWith} {p.label}
                </span>
                {!p.enabled && <em className="acct-oauth-off">{labels.notEnabled}</em>}
              </a>
            ))}
          </div>
          <p className="acct-oauth-note">{anyOff ? labels.oauthNote : labels.oauthNoteReady}</p>
        </div>
      )}
    </div>
  );
}

function GoogleMark() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden="true">
      <path fill="#4285F4" d="M23.5 12.3c0-.8-.1-1.6-.2-2.3H12v4.5h6.4a5.5 5.5 0 0 1-2.4 3.6v3h3.9c2.3-2.1 3.6-5.2 3.6-8.8Z" />
      <path fill="#34A853" d="M12 24c3.2 0 5.9-1.1 7.9-2.9l-3.9-3c-1.1.7-2.4 1.2-4 1.2a7 7 0 0 1-6.6-4.8H1.4v3.1A12 12 0 0 0 12 24Z" />
      <path fill="#FBBC05" d="M5.4 14.5a7.2 7.2 0 0 1 0-4.6V6.8H1.4a12 12 0 0 0 0 10.8l4-3.1Z" />
      <path fill="#EA4335" d="M12 4.8c1.8 0 3.4.6 4.6 1.8l3.5-3.5A12 12 0 0 0 1.4 6.8l4 3.1A7 7 0 0 1 12 4.8Z" />
    </svg>
  );
}

function AppleMark() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M16.4 12.7c0-2.3 1.9-3.4 2-3.5-1.1-1.6-2.8-1.8-3.4-1.9-1.5-.1-2.8.8-3.6.8-.7 0-1.9-.8-3.1-.8-1.6 0-3.1.9-3.9 2.4-1.7 2.9-.4 7.2 1.2 9.6.8 1.2 1.7 2.5 3 2.4 1.2 0 1.7-.8 3.2-.8s1.9.8 3.1.8c1.3 0 2.1-1.2 2.9-2.4.9-1.3 1.3-2.6 1.3-2.7-.1 0-2.7-1-2.7-3.9ZM14 5.6c.6-.8 1.1-1.9 1-3-1 0-2.2.7-2.9 1.5-.6.7-1.2 1.8-1 2.9 1.1.1 2.2-.6 2.9-1.4Z" />
    </svg>
  );
}
