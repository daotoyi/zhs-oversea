'use client';

import { useState, type CSSProperties } from 'react';
import { formatUsd } from '@/lib/shipping';
import type { Locale } from '@/lib/i18n/config';
import { UI_ZH } from '@/lib/i18n/zh-hans';
import { toTraditional } from '@/lib/i18n/convert';

type S = {
  title: string;
  summary: string;
  subtotal: string;
  shipping: string;
  discount: string;
  total: string;
  cardNumber: string;
  cardNumberPh: string;
  name: string;
  namePh: string;
  expiry: string;
  expiryPh: string;
  cvc: string;
  cvcPh: string;
  email: string;
  emailPh: string;
  pay: (amount: string) => string;
  processing: string;
  secureNote: string;
  stripeNote: string;
  errCard: string;
  errExpiry: string;
  errCvc: string;
  errName: string;
  errEmail: string;
  successTitle: string;
  successNote: string;
  done: string;
};

const STRINGS: Record<Locale, S> = {
  en: {
    title: 'Credit card payment',
    summary: 'Order summary',
    subtotal: 'Subtotal',
    shipping: 'Shipping',
    discount: 'Discount',
    total: 'Total',
    cardNumber: 'Card number',
    cardNumberPh: '1234 5678 9012 3456',
    name: 'Cardholder name',
    namePh: 'As shown on card',
    expiry: 'Expiry',
    expiryPh: 'MM / YY',
    cvc: 'CVC',
    cvcPh: '123',
    email: 'Email for receipt',
    emailPh: 'you@example.com',
    pay: (a) => `Pay ${a}`,
    processing: 'Processing…',
    secureNote: 'Your card details are encrypted in transit.',
    stripeNote: 'Stripe is not connected yet — this is the card-entry screen (demo).',
    errCard: 'Enter a valid card number.',
    errExpiry: 'Enter a valid future expiry date.',
    errCvc: 'Enter the 3–4 digit security code.',
    errName: 'Enter the cardholder name.',
    errEmail: 'Enter a valid email address.',
    successTitle: 'Payment submitted (demo)',
    successNote:
      'Stripe will be connected later to capture the charge and create the order automatically. Nothing was charged in this demo.',
    done: 'Done',
  },
  'zh-Hans': {
    title: '信用卡结算',
    summary: '订单摘要',
    subtotal: '小计',
    shipping: '运费',
    discount: '优惠',
    total: '合计',
    cardNumber: '卡号',
    cardNumberPh: '1234 5678 9012 3456',
    name: '持卡人姓名',
    namePh: '与卡面一致',
    expiry: '有效期',
    expiryPh: 'MM / YY',
    cvc: '安全码',
    cvcPh: '123',
    email: '接收凭证邮箱',
    emailPh: 'you@example.com',
    pay: (a: string) => `支付 ${a}`,
    processing: '处理中…',
    secureNote: '您的卡信息在传输过程中已加密。',
    stripeNote: 'Stripe 尚未接入 —— 此处为信用卡录入界面（演示）。',
    errCard: '请输入有效的卡号。',
    errExpiry: '请输入有效的未来有效期。',
    errCvc: '请输入 3–4 位安全码。',
    errName: '请输入持卡人姓名。',
    errEmail: '请输入有效的邮箱地址。',
    successTitle: '（演示）结算已提交',
    successNote: '稍后接入 Stripe 后将自动扣款并生成订单。本次演示不实际扣款。',
    done: '完成',
  },
  'zh-Hant': {} as S,
};
STRINGS['zh-Hant'] = Object.fromEntries(
  Object.entries(STRINGS['zh-Hans']).map(([k, v]) => [
    k,
    typeof v === 'function' ? (a: string) => toTraditional((v as (x: string) => string)(a)) : toTraditional(v),
  ])
) as S;

// ── 校验工具 ──
function luhnValid(digits: string): boolean {
  if (digits.length < 13 || digits.length > 19) return false;
  let sum = 0;
  let alt = false;
  for (let i = digits.length - 1; i >= 0; i--) {
    let d = digits.charCodeAt(i) - 48;
    if (alt) {
      d *= 2;
      if (d > 9) d -= 9;
    }
    sum += d;
    alt = !alt;
  }
  return sum % 10 === 0;
}

function expiryValid(value: string): boolean {
  const m = value.match(/^(\d{2})\s*\/\s*(\d{2})$/);
  if (!m) return false;
  const month = Number(m[1]);
  const year = 2000 + Number(m[2]);
  if (month < 1 || month > 12) return false;
  const now = new Date();
  const exp = new Date(year, month, 0, 23, 59, 59); // 当月最后一刻
  return exp >= now;
}

function formatCardNumber(raw: string): string {
  const digits = raw.replace(/\D/g, '').slice(0, 19);
  return digits.replace(/(.{4})/g, '$1 ').trim();
}

function formatExpiry(raw: string): string {
  const digits = raw.replace(/\D/g, '').slice(0, 4);
  if (digits.length <= 2) return digits;
  return `${digits.slice(0, 2)} / ${digits.slice(2)}`;
}

function emailValid(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
}

const overlay: CSSProperties = {
  position: 'fixed',
  inset: 0,
  background: 'rgba(28,24,20,0.55)',
  backdropFilter: 'blur(3px)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  zIndex: 999,
  padding: 16,
};
const panel: CSSProperties = {
  background: 'var(--paper)',
  color: 'var(--ink)',
  width: '100%',
  maxWidth: 460,
  maxHeight: '90vh',
  overflowY: 'auto',
  borderRadius: 14,
  padding: '26px 26px 22px',
  boxShadow: '0 24px 60px rgba(0,0,0,0.28)',
};
const field: CSSProperties = {
  width: '100%',
  padding: '11px 12px',
  borderRadius: 9,
  border: '1px solid var(--line)',
  background: 'var(--paper)',
  color: 'var(--ink)',
  fontSize: 15,
  boxSizing: 'border-box',
};
const label: CSSProperties = {
  display: 'block',
  fontSize: 13,
  color: 'var(--ash)',
  margin: '14px 0 6px',
};
const errStyle: CSSProperties = { color: '#b3412c', fontSize: 12, marginTop: 5 };

export function CardCheckoutModal({
  locale,
  subtotalCents,
  shippingCents,
  discountCents,
  onClose,
  onPaid,
}: {
  locale: Locale;
  subtotalCents: number;
  shippingCents: number;
  discountCents: number;
  onClose: () => void;
  onPaid: () => void;
}) {
  const s = STRINGS[locale];
  const [card, setCard] = useState('');
  const [name, setName] = useState('');
  const [expiry, setExpiry] = useState('');
  const [cvc, setCvc] = useState('');
  const [email, setEmail] = useState('');
  const [touched, setTouched] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [done, setDone] = useState(false);

  const totalCents = Math.max(0, subtotalCents - discountCents) + shippingCents;
  const digits = card.replace(/\D/g, '');
  const valid =
    luhnValid(digits) &&
    expiryValid(expiry) &&
    /^\d{3,4}$/.test(cvc) &&
    name.trim().length > 0 &&
    emailValid(email);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    setTouched(true);
    if (!valid || processing) return;
    setProcessing(true);
    // 演示：Stripe 未接入，仅模拟处理流程
    setTimeout(() => {
      setProcessing(false);
      setDone(true);
    }, 1200);
  }

  return (
    <div style={overlay} onClick={onClose} role="dialog" aria-modal="true">
      <div style={panel} onClick={(e) => e.stopPropagation()}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
          <h2 className="serif" style={{ fontWeight: 400, fontSize: 22, margin: 0 }}>
            {s.title}
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            style={{ background: 'transparent', border: 'none', fontSize: 22, lineHeight: 1, color: 'var(--ash)', cursor: 'pointer' }}
          >
            ×
          </button>
        </div>

        {/* 订单摘要 */}
        <div style={{ borderTop: '1px solid var(--line)', borderBottom: '1px solid var(--line)', padding: '12px 0', margin: '14px 0', fontSize: 14 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
            <span style={{ color: 'var(--ash)' }}>{s.subtotal}</span>
            <span>{formatUsd(subtotalCents)}</span>
          </div>
          {discountCents > 0 && (
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
              <span style={{ color: 'var(--ash)' }}>{s.discount}</span>
              <span style={{ color: '#3f7d5a' }}>−{formatUsd(discountCents)}</span>
            </div>
          )}
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
            <span style={{ color: 'var(--ash)' }}>{s.shipping}</span>
            <span>{shippingCents === 0 ? 'Free' : formatUsd(shippingCents)}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 600, marginTop: 8 }}>
            <span>{s.total}</span>
            <span>{formatUsd(totalCents)}</span>
          </div>
        </div>

        {done ? (
          <div style={{ textAlign: 'center', padding: '14px 0 6px' }}>
            <div style={{ fontSize: 38, marginBottom: 8 }}>✓</div>
            <h3 className="serif" style={{ fontWeight: 400, marginTop: 0 }}>{s.successTitle}</h3>
            <p style={{ fontSize: 13, color: 'var(--ash)', lineHeight: 1.6 }}>{s.successNote}</p>
            <button
              type="button"
              className="btn btn-solid"
              style={{ width: '100%', marginTop: 10 }}
              onClick={onPaid}
            >
              {s.done}
            </button>
          </div>
        ) : (
          <form onSubmit={submit} noValidate>
            <label style={label}>{s.cardNumber}</label>
            <input
              inputMode="numeric"
              autoComplete="cc-number"
              placeholder={s.cardNumberPh}
              value={card}
              onChange={(e) => setCard(formatCardNumber(e.target.value))}
              onBlur={() => setTouched(true)}
              style={field}
            />
            {(touched && !luhnValid(digits)) && <div style={errStyle}>{s.errCard}</div>}

            <label style={label}>{s.name}</label>
            <input
              autoComplete="cc-name"
              placeholder={s.namePh}
              value={name}
              onChange={(e) => setName(e.target.value)}
              onBlur={() => setTouched(true)}
              style={field}
            />
            {(touched && name.trim().length === 0) && <div style={errStyle}>{s.errName}</div>}

            <div style={{ display: 'flex', gap: 12 }}>
              <div style={{ flex: 1 }}>
                <label style={label}>{s.expiry}</label>
                <input
                  inputMode="numeric"
                  autoComplete="cc-exp"
                  placeholder={s.expiryPh}
                  value={expiry}
                  onChange={(e) => setExpiry(formatExpiry(e.target.value))}
                  onBlur={() => setTouched(true)}
                  style={field}
                />
                {(touched && !expiryValid(expiry)) && <div style={errStyle}>{s.errExpiry}</div>}
              </div>
              <div style={{ width: 110 }}>
                <label style={label}>{s.cvc}</label>
                <input
                  inputMode="numeric"
                  autoComplete="cc-csc"
                  placeholder={s.cvcPh}
                  value={cvc}
                  onChange={(e) => setCvc(e.target.value.replace(/\D/g, '').slice(0, 4))}
                  onBlur={() => setTouched(true)}
                  style={field}
                />
                {(touched && !/^\d{3,4}$/.test(cvc)) && <div style={errStyle}>{s.errCvc}</div>}
              </div>
            </div>

            <label style={label}>{s.email}</label>
            <input
              type="email"
              autoComplete="email"
              placeholder={s.emailPh}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onBlur={() => setTouched(true)}
              style={field}
            />
            {(touched && !emailValid(email)) && <div style={errStyle}>{s.errEmail}</div>}

            <button
              type="submit"
              className="btn btn-solid"
              disabled={processing}
              style={{ width: '100%', marginTop: 20, opacity: processing ? 0.7 : 1 }}
            >
              {processing ? s.processing : s.pay(formatUsd(totalCents))}
            </button>

            <p style={{ fontSize: 12, color: 'var(--ash)', textAlign: 'center', margin: '12px 0 0' }}>
              {s.secureNote}
            </p>
            <p style={{ fontSize: 11, color: 'var(--ash)', textAlign: 'center', margin: '6px 0 0', opacity: 0.85 }}>
              {s.stripeNote}
            </p>
          </form>
        )}
      </div>
    </div>
  );
}
