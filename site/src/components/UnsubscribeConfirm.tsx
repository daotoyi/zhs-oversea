'use client';

import { useState } from 'react';
import Link from 'next/link';

export function UnsubscribeConfirm({
  token,
  email,
  labels,
}: {
  token: string;
  email: string;
  labels: { title: string; lead: string; confirm: string; done: string; doneLead: string; invalid: string; back: string };
}) {
  const [state, setState] = useState<'idle' | 'busy' | 'done' | 'error'>('idle');
  const [msg, setMsg] = useState('');

  async function confirm() {
    setState('busy');
    setMsg('');
    try {
      const res = await fetch('/api/unsubscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || 'failed');
      setState('done');
    } catch (err) {
      setState('error');
      setMsg(err instanceof Error ? err.message : 'failed');
    }
  }

  if (!token) {
    return (
      <div className="unsub">
        <h1 className="serif">{labels.title}</h1>
        <p className="unsub-lead">{labels.invalid}</p>
        <Link className="btn btn-outline" href="/">
          {labels.back}
        </Link>
      </div>
    );
  }

  if (state === 'done') {
    return (
      <div className="unsub">
        <div className="eyebrow">Zhen He Sheng</div>
        <h1 className="serif">{labels.done}</h1>
        <p className="unsub-lead">{labels.doneLead}</p>
        <Link className="btn btn-outline" href="/">
          {labels.back}
        </Link>
      </div>
    );
  }

  return (
    <div className="unsub">
      <div className="eyebrow">Zhen He Sheng</div>
      <h1 className="serif">{labels.title}</h1>
      <p className="unsub-lead">{labels.lead}</p>
      <p className="unsub-mail">{email}</p>
      <div className="unsub-actions">
        <button className="btn btn-solid" type="button" onClick={confirm} disabled={state === 'busy'}>
          {labels.confirm}
        </button>
        <Link className="btn btn-outline" href="/">
          {labels.back}
        </Link>
      </div>
      {state === 'error' && <p className="unsub-error">{msg}</p>}
      <p className="unsub-note">
        Prefer to keep only what matters? You can also manage preferences in your account.
      </p>
    </div>
  );
}
