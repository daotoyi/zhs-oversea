'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import type { AccountLabels } from '@/lib/account/ui';

export type AddressInitial = {
  addrName: string;
  addrPhone: string;
  addrCountry: string;
  addrState: string;
  addrCity: string;
  addrLine1: string;
  addrLine2: string;
  addrPostal: string;
};

export function AddressForm({
  labels,
  initial,
}: {
  labels: AccountLabels;
  initial: AddressInitial;
}) {
  const router = useRouter();
  const [form, setForm] = useState<AddressInitial>(initial);
  const [state, setState] = useState<'idle' | 'busy' | 'done' | 'error'>('idle');
  const [msg, setMsg] = useState('');

  const set = (k: keyof AddressInitial) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  async function save(e: React.FormEvent) {
    e.preventDefault();
    if (!form.addrName.trim() || !form.addrLine1.trim()) {
      setState('error');
      setMsg(labels.addrRequired);
      return;
    }
    if (form.addrPhone.trim() && !/^[0-9+\-() ]{5,24}$/.test(form.addrPhone.trim())) {
      setState('error');
      setMsg(labels.addrPhoneBad);
      return;
    }
    setState('busy');
    setMsg('');
    try {
      const res = await fetch('/api/account/address', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
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
    <>
      <p className="acct-note">{labels.addressLead}</p>
      <form className="acct-form" onSubmit={save}>
        <div className="acct-row">
          <label className="acct-field">
            <span>{labels.addrRecipient}</span>
            <input type="text" value={form.addrName} onChange={set('addrName')} autoComplete="name" />
          </label>
          <label className="acct-field">
            <span>{labels.addrPhone}</span>
            <input type="tel" value={form.addrPhone} onChange={set('addrPhone')} autoComplete="tel" />
          </label>
        </div>
        <div className="acct-row">
          <label className="acct-field">
            <span>{labels.addrCountry}</span>
            <input type="text" value={form.addrCountry} onChange={set('addrCountry')} autoComplete="country-name" />
          </label>
          <label className="acct-field">
            <span>{labels.addrPostal}</span>
            <input type="text" value={form.addrPostal} onChange={set('addrPostal')} autoComplete="postal-code" />
          </label>
        </div>
        <div className="acct-row">
          <label className="acct-field">
            <span>{labels.addrState}</span>
            <input type="text" value={form.addrState} onChange={set('addrState')} autoComplete="address-level1" />
          </label>
          <label className="acct-field">
            <span>{labels.addrCity}</span>
            <input type="text" value={form.addrCity} onChange={set('addrCity')} autoComplete="address-level2" />
          </label>
        </div>
        <label className="acct-field">
          <span>{labels.addrLine1}</span>
          <input type="text" value={form.addrLine1} onChange={set('addrLine1')} autoComplete="address-line1" />
        </label>
        <label className="acct-field">
          <span>{labels.addrLine2}</span>
          <input type="text" value={form.addrLine2} onChange={set('addrLine2')} autoComplete="address-line2" />
        </label>
        <div className="acct-actions">
          <button className="btn btn-outline" type="submit" disabled={state === 'busy'}>
            {state === 'busy' ? labels.saving : labels.save}
          </button>
          {msg && <span className={state === 'error' ? 'acct-error-inline' : 'acct-ok-inline'}>{msg}</span>}
        </div>
      </form>
    </>
  );
}
