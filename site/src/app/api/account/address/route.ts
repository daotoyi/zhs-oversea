import { initDb } from '@/lib/db/loader';
import { bad, json, readJson } from '@/lib/account/api';
import { currentUser } from '@/lib/account/auth';
import { findUserById, updateUser } from '@/lib/account/dao';

export const runtime = 'nodejs';

const FIELDS = [
  'addrName',
  'addrPhone',
  'addrCountry',
  'addrState',
  'addrCity',
  'addrLine1',
  'addrLine2',
  'addrPostal',
] as const;

/** 保存默认收货地址（结账时可带出，减少重复填写） */
export async function PUT(req: Request) {
  await initDb();
  const user = await currentUser();
  if (!user) return bad('请先登录', 401);

  const body = await readJson(req);
  const patch: Record<string, string | null> = {};
  for (const key of FIELDS) {
    if (body[key] === undefined) continue;
    const v = typeof body[key] === 'string' ? (body[key] as string).trim().slice(0, 160) : '';
    patch[key] = v || null;
  }
  // 明确保存过地址的话，收件人与详细地址是必填的最小集
  const hasAny = FIELDS.some((k) => patch[k] != null && patch[k] !== '');
  if (hasAny && (!patch.addrName || !patch.addrLine1)) {
    return bad('收件人与详细地址（第一行）为必填');
  }
  if (patch.addrPhone && !/^[0-9+\-() ]{5,24}$/.test(patch.addrPhone)) {
    return bad('电话格式不正确');
  }

  updateUser(user.id, patch);
  const fresh = findUserById(user.id)!;
  return json({
    ok: true,
    address: {
      addrName: fresh.addr_name,
      addrPhone: fresh.addr_phone,
      addrCountry: fresh.addr_country,
      addrState: fresh.addr_state,
      addrCity: fresh.addr_city,
      addrLine1: fresh.addr_line1,
      addrLine2: fresh.addr_line2,
      addrPostal: fresh.addr_postal,
    },
  });
}
