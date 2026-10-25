'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { apiFetch } from '@/lib/admin/client';

type PayPalInitial = {
  clientId: string;
  secretSet: boolean;
  secretTail: string;
  env: string;
  envFromSettings: boolean;
  envFromEnv: boolean;
  missing: string[];
};

export default function PayPalSettings({ initial }: { initial: PayPalInitial }) {
  const router = useRouter();
  const [msg, setMsg] = useState<{ t: 'ok' | 'err'; m: string } | null>(null);
  const [busy, setBusy] = useState(false);

  const [clientId, setClientId] = useState(initial.clientId);
  const [clientSecret, setClientSecret] = useState('');
  const [env, setEnv] = useState(initial.env === 'live' ? 'live' : 'sandbox');

  const ready = initial.missing.length === 0;

  async function save() {
    setBusy(true);
    setMsg(null);
    try {
      await apiFetch('/api/admin/settings', {
        method: 'POST',
        body: { provider: 'paypal', clientId, clientSecret, paypalEnv: env },
      });
      setClientSecret('');
      setMsg({ t: 'ok', m: `PayPal 配置已保存（${env === 'live' ? '真实收款' : '沙盒测试'}），未填字段保持原值` });
      router.refresh();
    } catch (e) {
      setMsg({ t: 'err', m: (e as Error).message });
    } finally {
      setBusy(false);
    }
  }

  async function clear() {
    if (!confirm('确定清除 PayPal 凭据？前台支付将回到「未配置」状态。')) return;
    setBusy(true);
    setMsg(null);
    try {
      await apiFetch('/api/admin/settings', { method: 'POST', body: { provider: 'paypal', clear: true } });
      setMsg({ t: 'ok', m: '已清除' });
      router.refresh();
    } catch (e) {
      setMsg({ t: 'err', m: (e as Error).message });
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="adm-oauth-card">
      <div className="adm-oauth-head">
        <h2>PayPal 收款</h2>
        <span className={`adm-oauth-state${ready ? ' on' : ''}`}>{ready ? '已启用' : '未启用'}</span>
      </div>
      <p className="adm-oauth-hint">
        {ready ? (
          <>
            前台结算可选择 PayPal 支付。当前模式：<strong>{initial.env === 'live' ? '真实收款 (live)' : '沙盒测试 (sandbox)'}</strong>
          </>
        ) : (
          <>
            还缺：{initial.missing.join(' / ')}
            {initial.envFromEnv ? '（环境变量里已有一份）' : ''}
          </>
        )}
      </p>

      {msg && (
        <p style={{ marginBottom: 16, fontSize: 13, color: msg.t === 'err' ? '#8c2f22' : '#1f6b3b' }}>{msg.m}</p>
      )}

      <label className="adm-oauth-field">
        <span>模式</span>
        <select value={env} onChange={(e) => setEnv(e.target.value)}>
          <option value="sandbox">沙盒测试（不花真钱，用沙盒买家账号）</option>
          <option value="live">真实收款（live）</option>
        </select>
      </label>

      <label className="adm-oauth-field">
        <span>Client ID</span>
        <input value={clientId} onChange={(e) => setClientId(e.target.value)} placeholder="AeA1QIZ..." autoComplete="off" />
      </label>
      <label className="adm-oauth-field">
        <span>Client Secret {initial.secretSet && <em>(已配置 ····{initial.secretTail})</em>}</span>
        <input
          value={clientSecret}
          onChange={(e) => setClientSecret(e.target.value)}
          placeholder={initial.secretSet ? '留空 = 不修改' : 'EQnc...'}
          autoComplete="off"
        />
      </label>

      <div className="adm-oauth-foot">
        <button className="btn btn-solid" type="button" disabled={busy} onClick={save}>
          {busy ? '保存中…' : '保存 PayPal 配置'}
        </button>
        <button className="acct-link" type="button" onClick={clear}>
          清除
        </button>
      </div>

      <hr className="rule" style={{ margin: '18px 0 14px' }} />

      <p className="adm-oauth-hint" style={{ marginBottom: 8 }}>
        <strong>怎么拿到 PayPal 凭据（个人号即可，无需香港主体）</strong>
      </p>
      <ol className="adm-steps">
        <li>打开 developer.paypal.com → Log In（用你的个人 PayPal 账号）→ Dashboard</li>
        <li>左侧 Apps &amp; Credentials → Create App → 取名（如 zhenhesheng-web），Sandbox 即可</li>
        <li>建好后在 App 详情页拿到 <code>Client ID</code> 与 <code>Secret</code>（点 Show）</li>
        <li>先把模式选 <code>sandbox</code>，用沙盒买家账号测试支付（不花真钱）</li>
        <li>确认流程跑通后，再到 PayPal 申请 <code>live</code> 并切到真实收款</li>
      </ol>
      <p className="adm-steps-note">
        测试期建议 sandbox：能完整验证「结账 → 支付 → 落库 → 订单状态」。真实收款前，个人号小额测试通常没问题，正式上量建议注册个体工商户以合规。
      </p>
    </section>
  );
}
