import { initDb } from '@/lib/db/loader';
import { json } from '@/lib/account/api';
import { currentUser } from '@/lib/account/auth';
import { favoriteCount } from '@/lib/account/dao';
import { tierFor, nextTier } from '@/lib/account/points';

export const runtime = 'nodejs';

/** 导航/客户端取当前登录态 */
export async function GET() {
  await initDb();
  const user = await currentUser();
  if (!user) return json({ user: null });
  const tier = tierFor(user.points);
  return json({
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      avatarUrl: user.avatar_url,
      birthday: user.birthday,
      points: user.points,
      tier: tier.key,
      marketingOptIn: user.marketing_opt_in === 1,
      createdAt: user.created_at,
      favorites: favoriteCount(user.id),
      nextTier: nextTier(user.points),
    },
  });
}
