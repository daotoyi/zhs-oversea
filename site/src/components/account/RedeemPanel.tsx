'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import type { AccountLabels } from '@/lib/account/ui';

export type RedeemOptionView = { points: number; valueCents: number; label: string };

export function RedeemPanel({
  labels,
  options,
  balance,
}: {
  labels: AccountLabels;
  options: RedeemOptionView[];
  balance: number;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState<number | null>(null);
  const [code, setCode] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);

  async function redeem(points: number) {
    setBusy(points);
    setError('');
    setCode(null);
    setCopied(false);
    try {
      const res = await fetch('/api/account/points/redeem', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ points }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || labels.errGeneric);
      setCode(data.couponCode as string);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : labels.errGeneric);
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="acct-redeem">
      <div className="acct-redeem-balance">
        <strong>{balance}</strong> <span>{labels.pointsUnit}</span>
      </div>
      <div className="acct-redeem-opts">
        {options.map((o) => {
          const lack = balance < o.points;
          return (
            <button
              key={o.points}
              type="button"
              className="acct-redeem-opt"
              disabled={lack || busy !== null}
              onClick={() => redeem(o.points)}
            >
              <span className="acct-redeem-value">{o.label}</span>
              <span className="acct-redeem-cost">
                {o.points} {labels.pointsUnit}
              </span>
              {lack && <span className="acct-redeem-lack">{labels.redeemNeed} {o.points - balance}</span>}
            </button>
          );
        })}
      </div>
      {code && (
        <div className="acct-code">
          <span>{labels.redeeemGot}</span>
          <code>{code}</code>
          <button
            type="button"
            className="acct-link"
            onClick={async () => {
              try {
                await navigator.clipboard.writeText(code);
                setCopied(true);
              } catch {
                setCopied(false);
              }
            }}
          >
            {copied ? labels.copied : labels.copyCode}
          </button>
        </div>
      )}
      {error && <p className="acct-error">{error}</p>}
    </div>
  );
}

export function LogoutButton({ labels, className = 'acct-link' }: { labels: AccountLabels; className?: string }) {
  const router = useRouter();
  return (
    <button
      type="button"
      className={className}
      onClick={async () => {
        await fetch('/api/account/logout', { method: 'POST' });
        router.push('/');
        router.refresh();
      }}
    >
      {labels.signOut}
    </button>
  );
}

export function FavoriteRemove({ slug, labels }: { slug: string; labels: AccountLabels }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  return (
    <button
      type="button"
      className="acct-link acct-fav-remove"
      disabled={busy}
      onClick={async () => {
        setBusy(true);
        await fetch('/api/account/favorites', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ slug }),
        });
        router.refresh();
        setBusy(false);
      }}
    >
      {labels.removeFavorite}
    </button>
  );
}
