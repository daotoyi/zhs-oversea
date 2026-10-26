import { redirect } from 'next/navigation';

export const dynamic = 'force-dynamic';

/**
 * 短链：/coupon/CODE → /coupon/claim?code=CODE
 *
 * 营销场景下 `zhenhesheng.com/coupon/FREESHIP99` 比带查询串的地址更好发、
 * 更不容易被邮件/短信客户端截断。真正的领取逻辑只在 claim 页一份。
 */
export default async function CouponShortLink({ params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  redirect(`/coupon/claim?code=${encodeURIComponent(decodeURIComponent(code).toUpperCase())}`);
}
