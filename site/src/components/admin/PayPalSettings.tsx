'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { apiFetch } from '@/lib/admin/client';
import SecretInput from './SecretInput';
import AdminFold from './AdminFold';

type PayPalInitial = {
  clientId: string;
  secretSet: boolean;
  secretTail: string;
  env: string;
  envFromSettings: boolean;
  envFromEnv: boolean;
  missing: string[];
};

// 已保存模式（权威来源：服务端重渲染后 initial.env 会更新）
const savedEnv = (env: string) => (env === 'live' ? 'live' : 'sandbox');

export default function PayPalSettings({ initial }: { initial: PayPalInitial }) {
  const router = useRouter();
  const [msg, setMsg] = useState<{ t: 'ok' | 'err'; m: string } | null>(null);
  const [busy, setBusy] = useState(false);

  const [clientId, setClientId] = useState(initial.clientId);
  const [clientSecret, setClientSecret] = useState('');
  const [env, setEnv] = useState(savedEnv(initial.env));

  const ready = initial.missing.length === 0;
  const isLive = env === 'live';

  async function save() {
    setBusy(true);
    setMsg(null);
    try {
      await apiFetch('/api/admin/settings', {
        method: 'POST',
        body: { provider: 'paypal', clientId, clientSecret, paypalEnv: env },
      });
      setClientSecret('');
      setMsg({ t: 'ok', m: `PayPal 配置已保存（${isLive ? '真实收款 live' : '沙盒测试 sandbox'}），未填字段保持原值` });
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

      {/* 当前已保存模式徽章（防漏：一眼看清现在是 sandbox 还是 live） */}
      <div className="paypal-mode-badge" data-mode={savedEnv(initial.env)}>
        <span className="paypal-mode-dot" />
        当前已保存模式：
        <strong>{savedEnv(initial.env) === 'live' ? '真实收款 (LIVE)' : '沙盒测试 (SANDBOX)'}</strong>
        <span className="paypal-mode-src">
          {initial.envFromSettings ? '（来自后台设置）' : initial.envFromEnv ? '（来自环境变量）' : ''}
        </span>
      </div>

      <p className="adm-oauth-hint">
        {ready ? (
          <>前台结算可选择 PayPal 支付。当前生效模式：<strong>{isLive ? '真实收款 (live)' : '沙盒测试 (sandbox)'}</strong></>
        ) : (
          <>
            还缺：{initial.missing.join(' / ')}
            {initial.envFromEnv ? '（环境变量里已有一份）' : ''}
          </>
        )}
      </p>

      {isLive && (
        <p className="paypal-live-warn">
          ⚠️ 你正在配置 <strong>真实收款 (LIVE)</strong>：保存并付款将是真金白银。建议先用 sandbox 跑通全流程，
          切到 live 后务必先用一笔小额（如 $1）测试到账 + 订单落库，确认无误再正式启用。
        </p>
      )}

      {msg && (
        <p style={{ marginBottom: 16, fontSize: 13, color: msg.t === 'err' ? '#8c2f22' : '#1f6b3b' }}>{msg.m}</p>
      )}

      <label className="adm-oauth-field">
        <span>模式（保存后切换）</span>
        <select value={env} onChange={(e) => setEnv(e.target.value)}>
          <option value="sandbox">沙盒测试（不花真钱，用沙盒买家账号）</option>
          <option value="live">真实收款（live，会动真钱）</option>
        </select>
      </label>

      <label className="adm-oauth-field">
        <span>Client ID</span>
        <input value={clientId} onChange={(e) => setClientId(e.target.value)} placeholder="AeA1QIZ..." autoComplete="off" />
      </label>
      <label className="adm-oauth-field">
        <span>Client Secret {initial.secretSet && <em>(已配置 ····{initial.secretTail})</em>}</span>
        <SecretInput
          value={clientSecret}
          onChange={(e) => setClientSecret(e.target.value)}
          onRevealed={setClientSecret}
          revealField="paypal_client_secret"
          placeholder={initial.secretSet ? '留空 = 不修改 · 点眼睛可看已保存的' : 'EQnc...'}
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

      <AdminFold title="① 怎么拿到 PayPal 凭据" hint="已核实的官方路径">
        <ol className="adm-steps">
          <li>打开 <code>https://developer.paypal.com/dashboard/</code>（这是真正建 App、拿 client_id/secret 的门户）。</li>
          <li>
            用<strong>中国站（贝宝北京）同一企业账号</strong>登录。
            <span className="paypal-trap">⚠️ 登录时若弹出「通行密钥(Passkey)无法使用」报错——那是登录方式故障，不是账号问题。点「以其他方式登录 / 使用密码登录」，用账号邮箱+密码登即可。</span>
          </li>
          <li>进左侧 <code>Apps &amp; Credentials</code> → 顶部把环境切到 <strong>Live</strong>（真实收款）或保持 Sandbox（测试）→ 点 <code>Create App</code> → 取名（如 zhenhesheng-web）。</li>
          <li>App 详情页复制 <code>Client ID</code> 和 <code>Secret</code>（点 Show；Secret 只显示一次，立即存好）。</li>
          <li>
            <strong>sandbox 与 live 是两套独立的凭据</strong>，互不通用。填哪种就选对应模式；上方模式（sandbox/live）要和这里建的 App 环境一致。
          </li>
        </ol>
        <p className="adm-steps-note">
          注意：<code>paypal.cn/portal/developer/*</code> 只是<strong>中国文档/视频门户</strong>，里面没有 App 管理入口（找不到 Apps &amp; Credentials 是正常的）。建 App、拿凭证只认 <code>developer.paypal.com</code>。
        </p>
      </AdminFold>

      <AdminFold title="② Webhook（强烈建议，自动落库兜底）" hint="防止关窗丢单">
        <p className="adm-steps-note" style={{ marginBottom: 8 }}>
          回跳页依赖买家浏览器跳回本站，断网 / 关窗会丢单。注册 PayPal Webhook 后由 PayPal 服务器主动通知我们落库，支付一旦完成订单必被创建，更可靠。
        </p>
        <ol className="adm-steps">
          <li>在 <code>developer.paypal.com</code> → 你的 App（注意选 <strong>sandbox 还是 live 的 App</strong>）→ <code>Webhooks</code> → <code>Add Webhook</code></li>
          <li>URL 填：<code>https://zhenhesheng.com/api/webhooks/paypal</code></li>
          <li>事件勾选 <code>PAYMENT.CAPTURE.COMPLETED</code>（及 <code>CHECKOUT.ORDER.COMPLETED</code>）</li>
          <li><strong>sandbox 与 live 各注册一次</strong>：切到 live 后，必须在这个 live App 里也注册一遍，否则真实收款不会触发兜底落库。</li>
        </ol>
      </AdminFold>

      <AdminFold title="③ 测试 / 上线顺序建议" hint="先用小额真钱验一笔">
        <ol className="adm-steps">
          <li>先用 <code>sandbox</code> 模式 + 沙盒 <strong>Personal（个人买家）</strong>账号完整跑通「结账 → 付款 → 落库 → 订单状态」（别用 Business 商户号给自己付，会被 PayPal 拦）。</li>
          <li>确认无误后，把模式切到 <code>live</code>、填 live 凭据、注册 live Webhook。</li>
          <li><strong>先用一笔小额真钱</strong>测试到账 + 我们后台订单出现 <code>payment_provider=paypal</code>，再正式启用。</li>
        </ol>
      </AdminFold>
    </section>
  );
}
