import { initDb } from '@/lib/db/loader';
import { getSetting } from '@/lib/settings';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * Apple「Sign In with Apple」域名归属校验文件
 *
 * Apple 要求把 https://<domain>/.well-known/apple-developer-domain-association.txt
 * 变成可访问的内容，且 Content-Type 为纯文本。文件内容由后台「登录配置」页粘贴后存入
 * settings，这里原样输出 —— 免去每次下载文件再重新部署。
 */
export async function GET() {
  try {
    await initDb();
  } catch {
    /* 数据库异常不应 500，按未配置处理 */
  }
  const body = getSetting('apple_domain_assoc');
  if (!body) {
    return new Response('Not found', { status: 404, headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
  }
  return new Response(body.endsWith('\n') ? body : `${body}\n`, {
    status: 200,
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'public, max-age=300',
    },
  });
}
