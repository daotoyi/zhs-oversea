'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { apiFetch } from '@/lib/admin/client';

type Supp = { email: string; reason: string; source: string | null; created_at: number };

type Status = {
  ready: boolean;
  marketingReady: boolean;
  keyTail: string;
  fromTransactional: string;
  fromMarketing: string;
  replyTo: string;
  physicalAddress: string;
  companyName: string;
  missing: string[];
  suppressions: Supp[];
  suppressionsTotal: number;
};

export default function MailSettings({ initial }: { initial: Status }) {
  const router = useRouter();
  const [msg, setMsg] = useState<{ t: 'ok' | 'err'; m: string } | null>(null);
  const [busy, setBusy] = useState<string | null>(null);

  const [resendKey, setResendKey] = useState('');
  const [fromT, setFromT] = useState(initial.fromTransactional);
  const [fromM, setFromM] = useState(initial.fromMarketing);
  const [replyTo, setReplyTo] = useState(initial.replyTo);
  const [addr, setAddr] = useState(initial.physicalAddress);
  const [company, setCompany] = useState(initial.companyName);

  const [testTo, setTestTo] = useState('');
  const [testKind, setTestKind] = useState<'transactional' | 'marketing'>('transactional');

  const [suppEmail, setSuppEmail] = useState('');

  async function save() {
    setBusy('save');
    setMsg(null);
    try {
      await apiFetch('/api/admin/mail', {
        method: 'POST',
        body: {
          resendKey,
          fromTransactional: fromT,
          fromMarketing: fromM,
          replyTo,
          physicalAddress: addr,
          companyName: company,
        },
      });
      setResendKey('');
      setMsg({ t: 'ok', m: '已保存（留空的字段保持原值）' });
      router.refresh();
    } catch (e) {
      setMsg({ t: 'err', m: (e as Error).message });
    } finally {
      setBusy(null);
    }
  }

  async function sendTest() {
    setBusy('test');
    setMsg(null);
    try {
      const r = await apiFetch<{ id: string }>('/api/admin/mail', {
        method: 'PUT',
        body: { to: testTo, kind: testKind },
      });
      setMsg({ t: 'ok', m: `已交给 Resend 发送（id ${r.id || 'n/a'}），去收件箱和垃圾箱都看一眼` });
    } catch (e) {
      setMsg({ t: 'err', m: (e as Error).message });
    } finally {
      setBusy(null);
    }
  }

  async function unsuppress(email: string) {
    setBusy(`u:${email}`);
    try {
      await apiFetch('/api/admin/mail', { method: 'POST', body: { action: 'unsuppress', email } });
      router.refresh();
    } catch (e) {
      setMsg({ t: 'err', m: (e as Error).message });
    } finally {
      setBusy(null);
    }
  }

  async function addSupp() {
    if (!suppEmail.trim()) return;
    setBusy('supp');
    try {
      await apiFetch('/api/admin/mail', { method: 'POST', body: { action: 'suppress', email: suppEmail } });
      setSuppEmail('');
      router.refresh();
    } catch (e) {
      setMsg({ t: 'err', m: (e as Error).message });
    } finally {
      setBusy(null);
    }
  }

  return (
    <>
      <h2 style={{ fontSize: 15, fontWeight: 600, margin: '26px 0 10px' }}>邮件</h2>
      <p className="adm-oauth-hint" style={{ marginBottom: 16 }}>
        三条管道各走各的：营销邮件走 <code>news.zhenhesheng.com</code>（声誉独立，带退订链接）；
        交易邮件走 <code>zhenhesheng.com</code>（密码重置等，必须进收件箱）；
        人工收信靠域名 MX（腾讯企业邮），与上面两条无关。
      </p>

      {msg && (
        <p style={{ marginBottom: 14, fontSize: 13, color: msg.t === 'err' ? '#8c2f22' : '#1f6b3b' }}>{msg.m}</p>
      )}

      <div className="adm-mail-grid">
        {/* 左：配置 */}
        <div>
          <div className="adm-oauth-head">
            <h2 style={{ fontSize: 14, fontWeight: 600 }}>Resend 通道</h2>
            <span className={`adm-oauth-state${initial.ready ? ' on' : ''}`}>
              {initial.ready ? '交易邮件已通' : '未配置'}
            </span>
            <span className={`adm-mail-badge${initial.marketingReady ? ' ok' : ''}`}>
              {initial.marketingReady ? '营销已通' : '营销未就绪'}
            </span>
          </div>
          {initial.missing.length > 0 && (
            <p className="adm-oauth-hint" style={{ color: 'var(--cinnabar)' }}>
              还缺：{initial.missing.join(' / ')}
            </p>
          )}

          <label className="adm-oauth-field">
            <span>
              Resend API Key {initial.ready && <em>(已配置 ····{initial.keyTail})</em>}
            </span>
            <input
              value={resendKey}
              onChange={(e) => setResendKey(e.target.value)}
              placeholder={initial.ready ? '留空 = 不修改' : 're_…'}
              autoComplete="off"
            />
          </label>

          <label className="adm-oauth-field">
            <span>交易邮件 From（密码重置 / 订单通知）</span>
            <input value={fromT} onChange={(e) => setFromT(e.target.value)} placeholder="Zhen He Sheng <orders@zhenhesheng.com>" />
          </label>
          <label className="adm-oauth-field">
            <span>营销邮件 From（群发，建议 news 子域）</span>
            <input value={fromM} onChange={(e) => setFromM(e.target.value)} placeholder="Zhen He Sheng <news@news.zhenhesheng.com>" />
          </label>
          <div className="adm-oauth-grid" style={{ gap: 12, gridTemplateColumns: '1fr 1fr' }}>
            <label className="adm-oauth-field">
              <span>Reply-To（客户回信进这里）</span>
              <input value={replyTo} onChange={(e) => setReplyTo(e.target.value)} placeholder="hello@zhenhesheng.com" />
            </label>
            <label className="adm-oauth-field">
              <span>公司名（页脚）</span>
              <input value={company} onChange={(e) => setCompany(e.target.value)} placeholder="Zhen He Sheng" />
            </label>
          </div>
          <label className="adm-oauth-field">
            <span>物理地址（营销邮件页脚，CAN-SPAM 强制要求）</span>
            <input
              value={addr}
              onChange={(e) => setAddr(e.target.value)}
              placeholder="Zhen He Sheng Limited · Hong Kong SAR, China"
            />
          </label>

          <div className="adm-oauth-foot">
            <button className="btn btn-solid" type="button" disabled={busy === 'save'} onClick={save}>
              {busy === 'save' ? '保存中…' : '保存邮件配置'}
            </button>
          </div>

          <hr className="rule" style={{ margin: '20px 0 14px' }} />

          <h2 style={{ fontSize: 14, fontWeight: 600, marginBottom: 8 }}>测试发信</h2>
          <p className="adm-oauth-hint">
            发一封真邮件验证 DNS 是否生效。<strong>先测交易邮件</strong>——它决定密码重置能不能用。
          </p>
          <div className="adm-oauth-grid" style={{ gap: 12, gridTemplateColumns: '1.6fr auto auto' }}>
            <label className="adm-oauth-field" style={{ marginBottom: 0 }}>
              <span>收件邮箱</span>
              <input value={testTo} onChange={(e) => setTestTo(e.target.value)} placeholder="you@gmail.com" />
            </label>
            <label className="adm-oauth-field" style={{ marginBottom: 0 }}>
              <span>类型</span>
              <select
                value={testKind}
                onChange={(e) => setTestKind(e.target.value as 'transactional' | 'marketing')}
                style={{ padding: '9px 10px', border: '1px solid var(--rule)', borderRadius: 4, fontSize: 13 }}
              >
                <option value="transactional">交易</option>
                <option value="marketing">营销（带退订）</option>
              </select>
            </label>
            <button
              className="btn btn-outline"
              type="button"
              style={{ alignSelf: 'end', padding: '11px 18px', fontSize: 11.5 }}
              disabled={busy === 'test' || !testTo.trim()}
              onClick={sendTest}
            >
              {busy === 'test' ? '发送中…' : '发送测试'}
            </button>
          </div>
        </div>

        {/* 右：DNS 清单 */}
        <div>
          <h2 style={{ fontSize: 14, fontWeight: 600, marginBottom: 8 }}>DNSPod 需要加的记录</h2>
          <p className="adm-oauth-hint" style={{ marginBottom: 12 }}>
            照抄即可（值以服务商控制台显示的为准，Resend 后台会给出专属值）。
          </p>

          <table className="adm-dns-table">
            <thead>
              <tr>
                <th>主机记录</th>
                <th>类型</th>
                <th>记录值</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td><code>@</code></td>
                <td>MX</td>
                <td><code>mxbiz1.qq.com</code> 优先级 5</td>
              </tr>
              <tr>
                <td><code>@</code></td>
                <td>MX</td>
                <td><code>mxbiz2.qq.com</code> 优先级 10</td>
              </tr>
              <tr>
                <td><code>@</code></td>
                <td>TXT</td>
                <td><code>v=spf1 include:spf.mail.qq.com include:amazonses.com ~all</code></td>
              </tr>
              <tr>
                <td><code>resend._domainkey</code></td>
                <td>TXT</td>
                <td>Resend 控制台复制（<code>p=MIGf…</code>）</td>
              </tr>
              <tr>
                <td><code>news</code></td>
                <td>CNAME</td>
                <td>Resend 控制台复制（子域验证）</td>
              </tr>
              <tr>
                <td><code>_dmarc</code></td>
                <td>TXT</td>
                <td><code>v=DMARC1; p=none; rua=mailto:hello@zhenhesheng.com</code></td>
              </tr>
            </tbody>
          </table>
          <p className="adm-steps-note" style={{ marginTop: 12 }}>
            顺序很重要：<strong>先 MX</strong>（法律邮箱立刻能用）→ 再 SPF/DKIM → 最后 DMARC。
            DMARC 先 <code>p=none</code> 观察 2–4 周，确认正常后再改 <code>quarantine</code>，否则可能把自己的信拦掉。
          </p>
        </div>
      </div>

      {/* 退订名单 */}
      <hr className="rule" style={{ margin: '26px 0 18px' }} />
      <div className="adm-oauth-head">
        <h2 style={{ fontSize: 14, fontWeight: 600 }}>退订 / 拒收名单</h2>
        <span className="adm-oauth-state">{initial.suppressionsTotal} 人</span>
      </div>
      <p className="adm-oauth-hint">
        这些人不会再收到任何营销邮件（交易邮件不受影响）。群发时会自动跳过。
      </p>

      <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
        <input
          value={suppEmail}
          onChange={(e) => setSuppEmail(e.target.value)}
          placeholder="手动加入名单：email@example.com"
          style={{ flex: 1, maxWidth: 340, padding: '9px 10px', border: '1px solid var(--rule)', borderRadius: 4, fontSize: 13 }}
        />
        <button className="adm-btn outline sm" type="button" onClick={addSupp} disabled={busy === 'supp'}>
          加入
        </button>
      </div>

      {initial.suppressions.length === 0 ? (
        <p className="adm-oauth-hint">暂无退订记录。</p>
      ) : (
        <ul className="adm-supp-list">
          {initial.suppressions.map((s) => (
            <li key={s.email}>
              <span>{s.email}</span>
              <span style={{ color: 'var(--ash)', fontSize: 11 }}>
                {s.reason}
                {s.source ? ` · ${s.source}` : ''}
              </span>
              <button className="adm-btn outline sm" type="button" onClick={() => unsuppress(s.email)} disabled={busy === `u:${s.email}`}>
                恢复订阅
              </button>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
