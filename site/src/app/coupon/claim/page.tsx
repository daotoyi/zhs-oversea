import type { Metadata } from 'next';
import Link from 'next/link';
import { initDb, get, persistSoon } from '@/lib/db/loader';
import { recordCouponClaim } from '@/lib/admin/dao';
import { currentUser } from '@/lib/account/auth';
import { getNavStrings, getFooterStrings, getUi } from '@/lib/i18n';
import { Nav } from '@/components/Nav';
import { Footer } from '@/components/Footer';
import { ClaimCodeCard } from '@/components/ClaimCodeCard';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Claim your coupon — Zhen He Sheng',
  robots: { index: false, follow: false },
};

type ClaimableCoupon = {
  code: string;
  type: string;
  value: number;
  min_subtotal: number;
  max_uses: number;
  used_count: number;
  starts_at: number | null;
  ends_at: number | null;
  status: string;
  acquisition_mode: string;
};

export default async function CouponClaimPage({ searchParams }: { searchParams: Promise<{ code?: string; t?: string }> }) {
  await initDb();
  const sp = await searchParams;
  const rawCode = (sp.code || sp.t || '').trim().toUpperCase();

  const { locale, t } = await getUi();
  const navStrings = await getNavStrings();
  const footerStrings = await getFooterStrings();

  const coupon = rawCode
    ? get<ClaimableCoupon>('SELECT * FROM coupons WHERE code = ?', [rawCode])
    : null;

  const nowMs = Date.now();
  const expired = coupon
    ? (coupon.starts_at !== null && coupon.starts_at > nowMs) ||
      (coupon.ends_at !== null && coupon.ends_at < nowMs)
    : false;
  const soldOut = coupon ? coupon.max_uses > 0 && coupon.used_count >= coupon.max_uses : false;
  const claimable = Boolean(
    coupon && coupon.status === 'active' && coupon.acquisition_mode === 'auto' && !expired && !soldOut
  );

  // 已登录访客记一笔领取（同券同人只记一次）；未登录不落库，避免匿名刷记录
  if (claimable && coupon) {
    const user = await currentUser();
    if (user && recordCouponClaim(coupon.code, user.email)) persistSoon();
  }

  const desc = coupon
    ? coupon.type === 'freeship'
      ? t('Free shipping on any order', '全场免运费')
      : coupon.type === 'percent'
        ? t(`${coupon.value}% off`, `${coupon.value}% 折扣`)
        : t(`$${(coupon.value / 100).toFixed(2)} off`, `立减 $${(coupon.value / 100).toFixed(2)}`)
    : '';

  const threshold = coupon && coupon.min_subtotal > 0
    ? t(`Minimum spend $${(coupon.min_subtotal / 100).toFixed(2)}`, `满 $${(coupon.min_subtotal / 100).toFixed(2)} 可用`)
    : t('No minimum spend', '无门槛');

  const expiryLine = coupon?.ends_at
    ? t(
        `Valid until ${new Date(coupon.ends_at).toLocaleDateString('en-US')}`,
        `有效期至 ${new Date(coupon.ends_at).toLocaleDateString('zh-CN')}`
      )
    : t('No expiry', '长期有效');

  return (
    <>
      <Nav strings={navStrings} />
      <section className="sec" style={{ paddingTop: 96, paddingBottom: 120 }}>
        <div className="wrap" style={{ maxWidth: 620, textAlign: 'center' }}>
          <div className="brand-mark" style={{ margin: '0 auto 28px', width: 44, height: 44, fontSize: 20 }}>☯</div>

          {claimable && coupon ? (
            <>
              <div className="eyebrow">{t('A gift for you', '赠您一券')}</div>
              <h1
                className="serif"
                style={{ fontWeight: 300, fontSize: 'clamp(1.9rem, 4vw, 2.8rem)', lineHeight: 1.15, margin: '10px 0 18px' }}
              >
                {desc}
              </h1>
              <p style={{ fontSize: 14, color: 'var(--ash)', lineHeight: 1.8, marginBottom: 32 }}>{threshold}</p>
              <ClaimCodeCard
                code={coupon.code}
                labels={{
                  label: t('Your coupon code', '您的优惠券码'),
                  copy: t('Copy code', '复制券码'),
                  copied: t('Copied', '已复制'),
                  failed: t('Select and copy manually', '请手动选中复制'),
                }}
              />
              <p style={{ fontSize: 13, color: 'var(--ash)', lineHeight: 1.8, marginTop: 24 }}>{expiryLine}</p>
              <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap', marginTop: 32 }}>
                <Link className="btn btn-solid" href="/objects">{t('Shop the collection', '去挑选')}</Link>
                <Link className="btn btn-outline" href="/cart">{t('View cart', '查看购物车')}</Link>
              </div>
              <p style={{ fontSize: 12.5, color: 'var(--ash)', lineHeight: 1.8, marginTop: 24 }}>
                {t('Apply the code at checkout. One use per order.', '结算时填入券码即可抵扣，每单限用一次。')}
              </p>
            </>
          ) : (
            <>
              <h1
                className="serif"
                style={{ fontWeight: 300, fontSize: 'clamp(1.7rem, 3.6vw, 2.4rem)', lineHeight: 1.2, marginBottom: 18 }}
              >
                {!rawCode || !coupon
                  ? t('This link is not valid', '链接无效')
                  : soldOut
                    ? t('All coupons have been claimed', '优惠券已领完')
                    : expired
                      ? t('This offer has ended', '活动已结束')
                      : t('This coupon is not open for public claim', '此券不支持公开领取')}
              </h1>
              <p style={{ fontSize: 14, color: 'var(--ash)', lineHeight: 1.8, marginBottom: 36 }}>
                {t(
                  'If you already hold a code, you can skip this page and enter it at checkout.',
                  '如果您已持有券码，可跳过此页，直接在结算页填写使用。'
                )}
              </p>
              <Link className="btn btn-outline" href="/objects">{t('Back to the collection', '返回商品')}</Link>
            </>
          )}
        </div>
      </section>
      <Footer strings={footerStrings} />
    </>
  );
}
