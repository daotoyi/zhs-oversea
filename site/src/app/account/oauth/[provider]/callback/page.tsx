'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';

/**
 * OAuth 前端中继页。
 *
 * 国内服务器无法直连 Google（被墙），标准授权码流会超时 500。
 * 因此 Google 用隐式 id_token 流：授权后把 id_token 直接带回本页（URL fragment），
 * 本页再把 id_token 转发到本站后端，由后端用本地可信 JWKS 验签，全程服务器不访问 Google。
 */
export default function OAuthCallbackPage() {
  const params = useParams<{ provider: string }>();
  const provider = String(params?.provider ?? 'google');
  const [status, setStatus] = useState<'loading' | 'error'>('loading');
  const [message, setMessage] = useState('正在登录…');

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | undefined;

    const goLogin = (reason: string) => {
      setStatus('error');
      setMessage(reason);
      timer = setTimeout(() => {
        window.location.href = '/account/login?error=oauth_failed';
      }, 1800);
    };

    (async () => {
      const hash = window.location.hash.replace(/^#/, '');
      const sp = new URLSearchParams(hash);
      const idToken = sp.get('id_token');
      const state = sp.get('state');
      const err = sp.get('error');

      if (err || !idToken || !state) {
        goLogin(err ? `Google 返回错误：${err}` : '缺少登录凭证');
        return;
      }

      try {
        const res = await fetch(`/api/auth/oauth/${provider}/callback`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'same-origin',
          body: JSON.stringify({ id_token: idToken, state }),
        });
        const data = (await res.json().catch(() => null)) as
          | { ok?: boolean; redirectTo?: string }
          | null;
        if (data?.ok) {
          window.location.href = data.redirectTo || '/account';
        } else {
          goLogin('登录校验失败');
        }
      } catch {
        goLogin('网络错误');
      }
    })();

    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [provider]);

  return (
    <main
      style={{
        minHeight: '70vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 18,
        padding: 24,
      }}
    >
      {status === 'loading' ? (
        <div
          style={{
            width: 34,
            height: 34,
            border: '3px solid #e3ddd0',
            borderTopColor: '#8a6d3b',
            borderRadius: '50%',
            animation: 'zhs-spin 0.8s linear infinite',
          }}
        />
      ) : (
        <div style={{ color: '#a33', fontSize: 15 }}>⚠ {message}</div>
      )}
      <div style={{ color: '#777', fontSize: 14 }}>
        {status === 'loading' ? message : '即将返回登录页…'}
      </div>
      <style>{`@keyframes zhs-spin { to { transform: rotate(360deg); } }`}</style>
    </main>
  );
}
