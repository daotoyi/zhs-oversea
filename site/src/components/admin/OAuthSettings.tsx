'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { apiFetch } from '@/lib/admin/client';

type Initial = {
  googleClientId: string;
  googleSecretSet: boolean;
  googleSecretTail: string;
  googleMissing: string[];
  appleClientId: string;
  appleTeamId: string;
  appleKeyId: string;
  appleKeySet: boolean;
  appleMissing: string[];
  appleAssoc: string;
  envGoogle: boolean;
  envApple: boolean;
};

const SITE = 'https://zhenhesheng.com';
const GOOGLE_URI = `${SITE}/api/auth/oauth/google/callback`;
const APPLE_URI = `${SITE}/api/auth/oauth/apple/callback`;

export default function OAuthSettings({ initial }: { initial: Initial }) {
  const router = useRouter();
  const [msg, setMsg] = useState<{ t: 'ok' | 'err'; m: string } | null>(null);
  const [busy, setBusy] = useState<string | null>(null);

  const [gId, setGId] = useState(initial.googleClientId);
  const [gSecret, setGSecret] = useState('');
  const [aId, setAId] = useState(initial.appleClientId);
  const [aTeam, setATeam] = useState(initial.appleTeamId);
  const [aKey, setAKey] = useState(initial.appleKeyId);
  const [aP8, setAP8] = useState('');
  const [assoc, setAssoc] = useState(initial.appleAssoc);

  const gReady = initial.googleMissing.length === 0;
  const aReady = initial.appleMissing.length === 0;

  async function saveGoogle() {
    setBusy('google');
    setMsg(null);
    try {
      await apiFetch('/api/admin/settings', {
        method: 'POST',
        body: { provider: 'google', clientId: gId, clientSecret: gSecret },
      });
      setGSecret('');
      setMsg({ t: 'ok', m: 'Google 配置已保存，未填的字段保持原值' });
      router.refresh();
    } catch (e) {
      setMsg({ t: 'err', m: (e as Error).message });
    } finally {
      setBusy(null);
    }
  }

  async function saveApple() {
    setBusy('apple');
    setMsg(null);
    try {
      await apiFetch('/api/admin/settings', {
        method: 'POST',
        body: { provider: 'apple', clientId: aId, teamId: aTeam, keyId: aKey, privateKey: aP8 },
      });
      setAP8('');
      setMsg({ t: 'ok', m: 'Apple 配置已保存，私钥校验通过' });
      router.refresh();
    } catch (e) {
      setMsg({ t: 'err', m: (e as Error).message });
    } finally {
      setBusy(null);
    }
  }

  async function saveAssoc() {
    setBusy('assoc');
    setMsg(null);
    try {
      await apiFetch('/api/admin/settings', { method: 'PUT', body: { assoc } });
      setMsg({ t: 'ok', m: '域名校验文件已上线（Apple 现在可以验证域名了）' });
      router.refresh();
    } catch (e) {
      setMsg({ t: 'err', m: (e as Error).message });
    } finally {
      setBusy(null);
    }
  }

  async function clear(provider: 'google' | 'apple') {
    if (!confirm(`确定清除 ${provider === 'google' ? 'Google' : 'Apple'} 的全部凭据？前台该按钮会回到未开通状态。`)) return;
    setBusy(provider);
    setMsg(null);
    try {
      await apiFetch('/api/admin/settings', { method: 'POST', body: { provider, clear: true } });
      setMsg({ t: 'ok', m: '已清除' });
      router.refresh();
    } catch (e) {
      setMsg({ t: 'err', m: (e as Error).message });
    } finally {
      setBusy(null);
    }
  }

  return (
    <>
      {msg && (
        <p style={{ marginBottom: 16, fontSize: 13, color: msg.t === 'err' ? '#8c2f22' : '#1f6b3b' }}>
          {msg.m}
        </p>
      )}

      <div className="adm-oauth-grid">
        {/* ── Google ── */}
        <section className="adm-oauth-card">
          <div className="adm-oauth-head">
            <h2>Google 登录</h2>
            <span className={`adm-oauth-state${gReady ? ' on' : ''}`}>{gReady ? '已启用' : '未启用'}</span>
          </div>
          <p className="adm-oauth-hint">
            {gReady
              ? '前台登录页已显示「用 Google 继续」。'
              : `还缺：${initial.googleMissing.join(' / ')}${initial.envGoogle ? '（环境变量里已有一份）' : ''}`}
          </p>

          <div className="adm-oauth-uri">
            <span>已授权重定向 URI</span>
            <code>{GOOGLE_URI}</code>
            <button type="button" onClick={() => navigator.clipboard?.writeText(GOOGLE_URI)}>
              复制
            </button>
          </div>

          <label className="adm-oauth-field">
            <span>Client ID</span>
            <input
              value={gId}
              onChange={(e) => setGId(e.target.value)}
              placeholder="xxxx.apps.googleusercontent.com"
              autoComplete="off"
            />
          </label>
          <label className="adm-oauth-field">
            <span>Client Secret {initial.googleSecretSet && <em>(已配置 ····{initial.googleSecretTail})</em>}</span>
            <input
              value={gSecret}
              onChange={(e) => setGSecret(e.target.value)}
              placeholder={initial.googleSecretSet ? '留空 = 不修改' : 'GOCSPX-…'}
              autoComplete="off"
            />
          </label>

          <div className="adm-oauth-foot">
            <button className="btn btn-solid" type="button" disabled={busy === 'google'} onClick={saveGoogle}>
              {busy === 'google' ? '保存中…' : '保存 Google 配置'}
            </button>
            <button className="acct-link" type="button" onClick={() => clear('google')}>
              清除
            </button>
          </div>
        </section>

        {/* ── Apple ── */}
        <section className="adm-oauth-card">
          <div className="adm-oauth-head">
            <h2>Apple 登录</h2>
            <span className={`adm-oauth-state${aReady ? ' on' : ''}`}>{aReady ? '已启用' : '未启用'}</span>
          </div>
          <p className="adm-oauth-hint">
            {aReady
              ? '前台登录页已显示「用 Apple 继续」。'
              : `还缺：${initial.appleMissing.join(' / ')}${initial.envApple ? '（环境变量里已有一份）' : ''}`}
          </p>

          <div className="adm-oauth-uri">
            <span>Return URL</span>
            <code>{APPLE_URI}</code>
            <button type="button" onClick={() => navigator.clipboard?.writeText(APPLE_URI)}>
              复制
            </button>
          </div>

          <label className="adm-oauth-field">
            <span>Services ID（不是 App ID）</span>
            <input value={aId} onChange={(e) => setAId(e.target.value)} placeholder="com.zhenhesheng.web" autoComplete="off" />
          </label>
          <div className="adm-oauth-grid" style={{ gap: 12, gridTemplateColumns: '1fr 1fr' }}>
            <label className="adm-oauth-field">
              <span>Team ID</span>
              <input value={aTeam} onChange={(e) => setATeam(e.target.value)} placeholder="ABCDE12345" autoComplete="off" />
            </label>
            <label className="adm-oauth-field">
              <span>Key ID</span>
              <input value={aKey} onChange={(e) => setAKey(e.target.value)} placeholder="XYZ9876543" autoComplete="off" />
            </label>
          </div>
          <label className="adm-oauth-field">
            <span>Private Key（.p8 全文）{initial.appleKeySet && <em>(已配置)</em>}</span>
            <textarea
              value={aP8}
              onChange={(e) => setAP8(e.target.value)}
              placeholder={initial.appleKeySet ? '留空 = 不修改' : '-----BEGIN PRIVATE KEY-----\n…\n-----END PRIVATE KEY-----'}
              spellCheck={false}
            />
          </label>

          <div className="adm-oauth-foot">
            <button className="btn btn-solid" type="button" disabled={busy === 'apple'} onClick={saveApple}>
              {busy === 'apple' ? '校验中…' : '保存 Apple 配置'}
            </button>
            <button className="acct-link" type="button" onClick={() => clear('apple')}>
              清除
            </button>
          </div>

          <hr className="rule" style={{ margin: '18px 0 14px' }} />

          <p className="adm-oauth-hint">
            Apple 要求先验证域名归属。把 Apple 给的<strong>校验文件内容</strong>粘到下面，我们会立刻发布到{' '}
            <code>/.well-known/apple-developer-domain-association.txt</code>，然后你在 Apple 后台点 Verify 即可。
          </p>
          <label className="adm-oauth-field">
            <span>域名校验文件内容</span>
            <textarea
              value={assoc}
              onChange={(e) => setAssoc(e.target.value)}
              placeholder="粘贴 apple-developer-domain-association.txt 的全文"
              spellCheck={false}
            />
          </label>
          <div className="adm-oauth-foot">
            <button className="btn btn-outline" type="button" disabled={busy === 'assoc'} onClick={saveAssoc}>
              {busy === 'assoc' ? '发布中…' : '发布校验文件'}
            </button>
            <a className="acct-link" href="/.well-known/apple-developer-domain-association.txt" target="_blank" rel="noreferrer">
              查看已发布内容 →
            </a>
          </div>
        </section>
      </div>

      <hr className="rule" style={{ margin: '26px 0 20px' }} />

      <h2 style={{ fontSize: 15, fontWeight: 600, marginBottom: 12 }}>怎么拿到这些凭据</h2>
      <div className="adm-oauth-grid">
        <section>
          <p className="adm-oauth-hint" style={{ marginBottom: 8 }}>
            <strong>Google</strong>（免费，10 分钟）
          </p>
          <ol className="adm-steps">
            <li>
              打开 <code>console.cloud.google.com</code> → 新建项目（或用已有）
            </li>
            <li>
              「API 和服务」→「OAuth 同意屏幕」→ 选 External → 填应用名 <code>Zhen He Sheng</code>、
              支持邮箱、开发者邮箱 → 保存
            </li>
            <li>
              发布状态点「发布应用」（Testing 状态只有测试账号能登）
            </li>
            <li>
              「凭据」→「创建凭据」→「OAuth 客户端 ID」→ 类型 <code>Web 应用</code>
            </li>
            <li>
              「已获授权的重定向 URI」填 <code>{GOOGLE_URI}</code>
            </li>
            <li>把拿到的 Client ID 与 Client Secret 填到左边保存即可</li>
          </ol>
          <p className="adm-steps-note">
            同意屏幕若长期留 Testing，只能白名单里的邮箱登录；上线前务必 Publish。Google 不要求域名验证。
          </p>
        </section>

        <section>
          <p className="adm-oauth-hint" style={{ marginBottom: 8 }}>
            <strong>Apple</strong>（需付费开发者账号 $99/年）
          </p>
          <ol className="adm-steps">
            <li>
              前提：Apple Developer Program 有效，且已有 <strong>App ID</strong>（默认就有一个，需勾上
              Sign In with Apple）
            </li>
            <li>
              Identifiers → 右上 + → <code>Services IDs</code> → 填 <code>com.zhenhesheng.web</code>
            </li>
            <li>
              进入该 Services ID → 勾 <strong>Sign In with Apple</strong> → Configure
            </li>
            <li>
              Primary Domain 填 <code>zhenhesheng.com</code>；Return URL 填 <code>{APPLE_URI}</code>
            </li>
            <li>
              页面会给出一个校验文件下载 → 打开它，全文粘到左边「域名校验文件内容」→ 发布 → 回 Apple 点 Verify
            </li>
            <li>
              Keys → 右上 + → 勾 Sign In with Apple → 下载 <code>.p8</code>（<strong>只能下载一次</strong>）
              → 记下 Key ID 与 Team ID
            </li>
            <li>把 Services ID / Team ID / Key ID / .p8 全文填到左边保存</li>
          </ol>
          <p className="adm-steps-note">
            Apple 两个坑：① 用 Services ID，不是 App ID；② .p8 只能下载一次，丢了只能重建 Key。
            另外 Apple 只在首次授权时把姓名给你，之后拿不到。
          </p>
        </section>
      </div>
    </>
  );
}
