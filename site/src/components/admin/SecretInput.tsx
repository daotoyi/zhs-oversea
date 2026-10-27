'use client';

import { useState, type CSSProperties, type ChangeEvent } from 'react';

/**
 * 密钥输入框 —— 右侧「小眼睛」点击切换明文 / 遮蔽
 *
 * 用于所有密码、API Key、Client Secret、私钥等敏感输入。
 *
 * 关键点：后台这些框默认是空的（占位「留空 = 不修改」），服务端也从不把
 * 已保存的密钥下发到页面。所以「点眼睛能看见东西」必须额外做一步：
 * 传了 revealField 时，第一次点眼睛会去 /api/admin/settings/reveal 按需取一次明文
 * 填进框里（服务端写审计日志）。不传 revealField 就只切换自己输入内容的遮蔽。
 *
 * textarea（.p8 私钥）用等尺寸蒙层打点遮蔽 —— Firefox 不支持
 * -webkit-text-security，只靠它等于假遮蔽。
 */

type Props = {
  value?: string;
  onChange?: (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
  /** 服务端白名单字段名，用于按需取回已保存的明文 */
  revealField?: string;
  /** 取回明文后把值交回父组件（好让保存时带上同一份值） */
  onRevealed?: (value: string) => void;
  placeholder?: string;
  name?: string;
  required?: boolean;
  autoComplete?: string;
  disabled?: boolean;
  style?: CSSProperties;
  className?: string;
  isTextarea?: boolean;
  rows?: number;
  spellCheck?: boolean;
};

/** 把内容替换成等长圆点（保留换行，形状与原文字一致） */
function mask(text: string): string {
  return text.replace(/[^\n]/g, '•');
}

export default function SecretInput({
  value = '',
  onChange,
  revealField,
  onRevealed,
  placeholder,
  name,
  required,
  autoComplete,
  disabled,
  style,
  className,
  isTextarea = false,
  rows = 4,
  spellCheck = false,
}: Props) {
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(false);
  const [note, setNote] = useState<string | null>(null);
  const [fetched, setFetched] = useState(false);
  // 没传 onChange（如登录页只传 name）时，自己维护内容。
  // 否则 value={''} 且无 onChange，React 会当成只读受控输入 —— 敲键盘毫无反应。
  const [internal, setInternal] = useState('');
  const controlled = typeof onChange === 'function';
  const current = controlled ? value : internal;

  function handleChange(e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) {
    if (!controlled) setInternal(e.target.value);
    onChange?.(e);
  }

  async function toggle() {
    const next = !show;
    setShow(next);
    if (!next) return;
    // 框里已经有内容（自己输入的或之前取回来的）就不用再取
    if (current || fetched || !revealField) return;

    setLoading(true);
    setNote(null);
    try {
      const res = await fetch('/api/admin/settings/reveal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ field: revealField }),
        credentials: 'same-origin',
      });
      const data = (await res.json().catch(() => null)) as
        | { value?: string; configured?: boolean; error?: string }
        | null;
      if (!res.ok) throw new Error(data?.error ?? '读取失败');
      setFetched(true); // 只有成功才记住，失败（如会话过期）下次还能重试
      const v = data?.value ?? '';
      if (v) {
        if (!controlled) setInternal(v);
        onRevealed?.(v);
      } else setNote('未保存过任何密钥');
    } catch {
      setNote('读取失败，请重新登录后再试');
    } finally {
      setLoading(false);
    }
  }

  const eye = (
    <button
      type="button"
      tabIndex={-1}
      onClick={toggle}
      disabled={loading}
      title={show ? '隐藏' : '显示明文'}
      aria-label={show ? '隐藏' : '显示明文'}
      style={{
        position: 'absolute',
        right: 6,
        top: isTextarea ? 8 : '50%',
        transform: isTextarea ? 'none' : 'translateY(-50%)',
        width: 26,
        height: 26,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'transparent',
        border: 'none',
        padding: 0,
        cursor: loading ? 'wait' : 'pointer',
        color: show ? 'var(--ink)' : '#8a8578',
        opacity: loading ? 0.5 : 1,
        zIndex: 3,
      }}
    >
      {show ? (
        /* 睁眼：当前是明文，点一下遮起来 */
        <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <path d="M1.5 12S5.5 5 12 5s10.5 7 10.5 7-4 7-10.5 7S1.5 12 1.5 12z" />
          <circle cx="12" cy="12" r="2.8" />
        </svg>
      ) : (
        /* 闭眼：当前是遮蔽，点一下看明文 */
        <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <path d="M17.9 17.9A10.4 10.4 0 0 1 12 19.5C5.5 19.5 1.5 12 1.5 12a19 19 0 0 1 5-5.9" />
          <path d="M9.9 4.7A9.8 9.8 0 0 1 12 4.5c6.5 0 10.5 7.5 10.5 7.5a19.4 19.4 0 0 1-2.2 3.2" />
          <path d="M9.9 9.9a3 3 0 1 0 4.2 4.2" />
          <path d="M2 2l20 20" />
        </svg>
      )}
    </button>
  );

  const ph = loading ? '正在读取已保存的密钥…' : (note ?? placeholder);

  return (
    <div style={{ position: 'relative', width: '100%', ...style }} className={className}>
      {isTextarea ? (
        <div style={{ position: 'relative' }}>
          <textarea
            name={name}
            value={current}
            onChange={handleChange}
            placeholder={ph}
            required={required}
            disabled={disabled}
            rows={rows}
            spellCheck={spellCheck}
            style={{ width: '100%', paddingRight: 32, boxSizing: 'border-box' }}
          />
          {!show && current ? (
            <div
              aria-hidden="true"
              style={{
                position: 'absolute',
                inset: 0,
                padding: '9px 32px 9px 10px',
                border: '1px solid transparent',
                borderRadius: 4,
                background: '#fff',
                fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
                fontSize: 11.5,
                lineHeight: 1.5,
                color: 'var(--ink)',
                overflow: 'hidden',
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-all',
                pointerEvents: 'none',
                boxSizing: 'border-box',
              }}
            >
              {mask(current)}
            </div>
          ) : null}
        </div>
      ) : (
        <input
          type={show ? 'text' : 'password'}
          name={name}
          value={current}
          onChange={handleChange}
          placeholder={ph}
          required={required}
          autoComplete={autoComplete}
          disabled={disabled}
          style={{ width: '100%', paddingRight: 32, boxSizing: 'border-box' }}
        />
      )}
      {eye}
    </div>
  );
}
