import { initDb } from '@/lib/db/loader';
import { bad, json, readJson } from '@/lib/account/api';
import { currentUser } from '@/lib/account/auth';
import { listFavorites, toggleFavorite } from '@/lib/account/dao';

export const runtime = 'nodejs';

/** 收藏列表（slug 数组，供商品卡片/详情页点亮） */
export async function GET() {
  await initDb();
  const user = await currentUser();
  if (!user) return json({ slugs: [] });
  return json({ slugs: listFavorites(user.id).map((f) => f.slug) });
}

/** 切换收藏 */
export async function POST(req: Request) {
  await initDb();
  const user = await currentUser();
  if (!user) return bad('请先登录后收藏', 401);

  const body = await readJson(req);
  const slug = typeof body.slug === 'string' ? body.slug.trim() : '';
  if (!slug) return bad('缺少商品');

  const favorited = toggleFavorite(user.id, slug);
  return json({ ok: true, favorited, slug });
}
