'use client';

import { useState, type CSSProperties, type ChangeEvent } from 'react';

/**
 * 密钥输入框 —— 右侧「小眼睛」点击切换明文 / 遮蔽
 *
 * 用于所有密码、API Key、Client Secret、私钥等敏感输入。
 * - input 模式：type 在 password / text 间切换（浏览器原生，全平台一致）
 * - textarea 模式：Firefox 不支持 -webkit-text-security，改用等尺寸蒙层打点，
 *   保证任何浏览器下「遮住」都是真的遮住，而不是假遮住。
 */

type Props = {
  value?: string;
  onChange?: (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
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

/** 把内容替换成等长圆点（保留换行与空格，形状与原文字一致） */
function mask(text: string): string {
  return text.replace(/[^\n]/g, '•');
}

export default function SecretInput({
  value,
  onChange,
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

  const eye = (
    <button
      type="button"
      tabIndex={-1}
      onClick={() => setShow((v) => !v)}
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
        cursor: 'pointer',
        color: '#8a8578',
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

  return (
    <div style={{ position: 'relative', width: '100%', ...style }} className={className}>
      {isTextarea ? (
        <div style={{ position: 'relative' }}>
          <textarea
            name={name}
            value={value}
            onChange={onChange}
            placeholder={placeholder}
            required={required}
            disabled={disabled}
            rows={rows}
            spellCheck={spellCheck}
            style={{ width: '100%', paddingRight: 32, boxSizing: 'border-box' }}
          />
          {!show && value ? (
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
              {mask(value)}
            </div>
          ) : null}
        </div>
      ) : (
        <input
          type={show ? 'text' : 'password'}
          name={name}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
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
