'use client';

import { useState } from 'react';

/** 券码展示 + 一键复制（领券落地页用） */
export function ClaimCodeCard({
  code,
  labels,
}: {
  code: string;
  labels: { label: string; copy: string; copied: string; failed: string };
}) {
  const [state, setState] = useState<'idle' | 'copied' | 'failed'>('idle');

  async function copy() {
    try {
      await navigator.clipboard.writeText(code);
      setState('copied');
      setTimeout(() => setState('idle'), 2200);
    } catch {
      setState('failed');
    }
  }

  return (
    <div
      style={{
        border: '1px dashed var(--line, #d8d4c8)',
        padding: '22px 20px',
        display: 'inline-flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 12,
        minWidth: 260,
      }}
    >
      <span className="eyebrow" style={{ margin: 0 }}>{labels.label}</span>
      <code
        style={{
          fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
          fontSize: 24,
          letterSpacing: '0.14em',
          userSelect: 'all',
        }}
      >
        {code}
      </code>
      <button className="btn btn-outline" type="button" onClick={copy}>
        {state === 'copied' ? labels.copied : state === 'failed' ? labels.failed : labels.copy}
      </button>
    </div>
  );
}
