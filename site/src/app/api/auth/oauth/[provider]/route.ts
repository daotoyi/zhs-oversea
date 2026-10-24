import { NextRequest, NextResponse } from 'next/server';
import { initDb } from '@/lib/db/loader';
import { publicBaseUrl } from '@/lib/admin/http';
import { safeNext } from '@/lib/account/api';
import { authorizeUrl, createState, isProviderEnabled } from '@/lib/account/oauth';
import type { ProviderKey } from '@/lib/account/oauth';

export const runtime = 'nodejs';

export async function GET(req: NextRequest, ctx: { params: Promise<{ provider: string }> }) {
  const { provider } = await ctx.params;
  const base = publicBaseUrl(req);
  if (provider !== 'google' && provider !== 'apple') {
    return NextResponse.redirect(new URL('/account/login?error=unknown_provider', base));
  }

  await initDb();
  // 未配置凭据时明确回跳并给出提示，不做半截跳转也不静默失败
  if (!isProviderEnabled(provider as ProviderKey)) {
    return NextResponse.redirect(new URL(`/account/login?error=provider_disabled&provider=${provider}`, base));
  }

  const next = safeNext(new URL(req.url).searchParams.get('next'));
  const state = await createState(provider as ProviderKey, next);
  return NextResponse.redirect(authorizeUrl(provider as ProviderKey, state, base));
}
