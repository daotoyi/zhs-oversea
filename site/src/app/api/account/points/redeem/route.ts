import { initDb } from '@/lib/db/loader';
import { bad, json, readJson } from '@/lib/account/api';
import { currentUser } from '@/lib/account/auth';
import { redeemPoints } from '@/lib/account/points';

export const runtime = 'nodejs';

/** 积分兑换优惠券 */
export async function POST(req: Request) {
  await initDb();
  const user = await currentUser();
  if (!user) return bad('请先登录', 401);

  const body = await readJson(req);
  const points = Number(body.points);
  if (!Number.isFinite(points) || points <= 0) return bad('兑换档位无效');

  const result = redeemPoints(user.id, points);
  if (!result.ok) return bad(result.error || '兑换失败', 400);
  return json(result);
}
