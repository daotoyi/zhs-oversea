import { NextRequest, NextResponse } from 'next/server';

/**
 * 反代后重建「公网绝对 URL」。
 *
 * 站点经 nginx 反代到 127.0.0.1:5001，Next 收到的 req.url 是内部地址
 * （http://localhost:5001/...）。若直接用 req.url 拼 303 重定向，浏览器会被
 * 跳转到一个用户机器不可达的 localhost:5001 → “无法访问此网站”。
 *
 * nginx 用 `proxy_set_header Host $host;` 透传公网域名，因此重定向必须基于
 * 请求的 Host 头重建。协议默认 https（站点 http→https 强制跳转）；
 * 本地开发（localhost / 127.0.0.1）回落 http，避免本地登录死循环。
 */
export function publicBaseUrl(req: NextRequest): string {
  const host = req.headers.get('host') || new URL(req.url).host;
  // 站点在边缘（nginx）强制 https 终止，直连后端为 http，故不依赖
  // x-forwarded-proto，直接按 host 判定：本地开发走 http，公网走 https。
  const isLocal = host.startsWith('localhost') || host.startsWith('127.0.0.1');
  const proto = isLocal ? 'http' : 'https';
  return `${proto}://${host}`;
}

/** 基于公网地址的 303 重定向（登录/登出/错误回跳统一走这里） */
export function publicRedirect(req: NextRequest, path: string, status = 303): NextResponse {
  return NextResponse.redirect(new URL(path, publicBaseUrl(req)), status);
}
