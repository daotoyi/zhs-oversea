import type { Metadata } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { initDb } from '@/lib/db/loader';
import { currentUser } from '@/lib/account/auth';
import {
  deleteFavorites,
  findUserById,
  listFavorites,
  listIdentities,
  listUserOrders,
  orderStats,
} from '@/lib/account/dao';
import { claimBirthdayGift, listLedger, nextTier, tierFor, REDEEM_OPTIONS } from '@/lib/account/points';
import { accountLabels, orderStatusLabel } from '@/lib/account/ui';
import { getStoreProducts } from '@/lib/storefront';
import { formatUsd } from '@/lib/shipping';
import { getNavStrings, getFooterStrings, getUi } from '@/lib/i18n';
import { Nav } from '@/components/Nav';
import { Footer } from '@/components/Footer';
import { ProfileForm, PasswordForm } from '@/components/account/ProfileForm';
import { RedeemPanel, LogoutButton, FavoriteRemove } from '@/components/account/RedeemPanel';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'My account — Zhen He Sheng',
  robots: { index: false, follow: false },
};

const REASON_LABEL: Record<string, { en: string; zh: string }> = {
  signup: { en: 'Welcome gift', zh: '注册礼' },
  order_earn: { en: 'Purchase', zh: '消费累积' },
  birthday: { en: 'Birthday gift', zh: '生日礼' },
  redeem: { en: 'Redeemed', zh: '积分兑换' },
  refund: { en: 'Refund adjustment', zh: '退款调整' },
  admin: { en: 'Adjustment', zh: '人工调整' },
};

export default async function AccountPage() {
  await initDb();
  const initial = await currentUser();
  if (!initial) redirect('/account/login?next=/account');

  // 生日当月自动发礼（幂等，一年一次）
  const gift = claimBirthdayGift(initial);
  const user = gift.issued ? findUserById(initial.id)! : initial;

  const { locale, t } = await getUi();
  const labels = accountLabels(locale);
  const navStrings = await getNavStrings();
  const footerStrings = await getFooterStrings();

  const orders = listUserOrders(user.id, user.email);
  const favorites = listFavorites(user.id);
  const ledger = listLedger(user.id, 30);
  const stats = orderStats(user.id, user.email);
  const identities = listIdentities(user.id);
  const tier = tierFor(user.points);
  const upcoming = nextTier(user.points);

  const products = await getStoreProducts();
  const bySlug = new Map(products.map((p) => [p.slug, p]));
  // 清理孤儿收藏：商品已下架/目录更换后，favorites 里指向不存在商品的行会让
  // 统计卡计数与下方列表对不上（与购物车幽灵行同一类问题）。加载时自动清理并自愈。
  const staleSlugs = favorites.filter((f) => !bySlug.has(f.slug)).map((f) => f.slug);
  if (staleSlugs.length > 0) deleteFavorites(user.id, staleSlugs);
  // 计数与列表同源：只数「在售且可展示」的收藏，杜绝两边口径不一致
  const favProducts: { slug: string; product: (typeof products)[number] }[] = [];
  for (const f of favorites) {
    const p = bySlug.get(f.slug);
    if (p) favProducts.push({ slug: f.slug, product: p });
  }
  const favCount = favProducts.length;

  const dateFmt = (ts: number) =>
    new Date(ts).toLocaleDateString(locale === 'en' ? 'en-US' : 'zh-CN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });

  const tierName = locale === 'en' ? tier.labelEn : tier.labelZh;
  const nextName = upcoming ? (locale === 'en' ? upcoming.labelEn : upcoming.labelZh) : null;

  return (
    <>
      <Nav strings={navStrings} />

      <section className="acct-sec">
        <div className="wrap">
          <div className="acct-head">
            <div>
              <div className="eyebrow">{labels.account}</div>
              <h1 className="serif">{user.name || user.email.split('@')[0]}</h1>
              <p className="acct-head-mail">
                {user.email} · {labels.memberSince} {dateFmt(user.created_at)}
              </p>
            </div>
            <div className="acct-head-acts">
              <LogoutButton labels={labels} />
            </div>
          </div>

          {gift.issued && (
            <div className="acct-banner">
              {t('Happy birthday — 200 points and a 15% coupon are in your account.', '生日快乐——200 积分与 15% 生日券已存入账户。')}
              {gift.couponCode && <code>{gift.couponCode}</code>}
            </div>
          )}

          <div className="acct-stats">
            <div className="acct-stat">
              <span className="acct-stat-num">{user.points}</span>
              <span className="acct-stat-lab">{labels.points}</span>
            </div>
            <div className="acct-stat">
              <span className="acct-stat-num">{tierName}</span>
              <span className="acct-stat-lab">
                {labels.tier}
                {nextName && upcoming ? ` · ${labels.nextTierAt} ${upcoming.min}` : ''}
              </span>
            </div>
            <div className="acct-stat">
              <span className="acct-stat-num">{stats.count}</span>
              <span className="acct-stat-lab">{labels.ordersTitle}</span>
            </div>
            <div className="acct-stat">
              <span className="acct-stat-num">{favCount}</span>
              <span className="acct-stat-lab">{labels.favoritesTitle}</span>
            </div>
          </div>

          <div className="acct-grid">
            {/* 左栏：订单 + 收藏 */}
            <div className="acct-col-main">
              <section className="acct-card">
                <header className="acct-card-head">
                  <h2 className="serif">{labels.ordersTitle}</h2>
                  <span className="acct-card-meta">{formatUsd(stats.spent)}</span>
                </header>
                {orders.length === 0 ? (
                  <p className="acct-empty">
                    {labels.ordersEmpty}{' '}
                    <Link href="/objects" className="acct-link">
                      {t('Browse objects', '去看看器物')}
                    </Link>
                  </p>
                ) : (
                  <ul className="acct-orders">
                    {orders.map((o) => {
                      let items: { slug?: string; name?: string; quantity?: number; unitAmountUsd?: number }[] = [];
                      try {
                        items = JSON.parse(o.items || '[]');
                      } catch {
                        items = [];
                      }
                      const status = orderStatusLabel(o.status, labels);
                      return (
                        <li key={o.id} className="acct-order">
                          <div className="acct-order-top">
                            <div>
                              <span className="acct-order-id">{o.id}</span>
                              <span className="acct-order-date">{dateFmt(o.created_at)}</span>
                            </div>
                            <div className="acct-order-right">
                              <span className={`acct-pill acct-pill-${o.status}`}>{status}</span>
                              <strong>{formatUsd(o.total)}</strong>
                            </div>
                          </div>
                          <ul className="acct-order-items">
                            {items.map((it, i) => (
                              <li key={`${o.id}-${i}`}>
                                {it.slug ? (
                                  <Link href={`/objects/${it.slug}`}>{it.name || it.slug}</Link>
                                ) : (
                                  <span>{it.name}</span>
                                )}
                                <span className="acct-order-qty">×{it.quantity ?? 1}</span>
                                <span className="acct-order-amt">{formatUsd(it.unitAmountUsd ?? 0)}</span>
                              </li>
                            ))}
                          </ul>
                          <div className="acct-order-foot">
                            {o.discount > 0 && (
                              <span>
                                {labels.discount} −{formatUsd(o.discount)}
                                {o.coupon_code ? ` (${o.coupon_code})` : ''}
                              </span>
                            )}
                            {o.tracking_no && (
                              <span>
                                {labels.trackNo}: <code>{o.tracking_no}</code>
                              </span>
                            )}
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </section>

              <section className="acct-card">
                <header className="acct-card-head">
                  <h2 className="serif">{labels.favoritesTitle}</h2>
                </header>
                {favProducts.length === 0 ? (
                  <p className="acct-empty">{labels.favoritesEmpty}</p>
                ) : (
                  <ul className="acct-favs">
                    {favProducts.map(({ slug, product }) => (
                      <li key={slug} className="acct-fav">
                        <Link href={`/objects/${slug}`} className="acct-fav-media">
                          <img src={product.images[0]} alt={product.title} />
                        </Link>
                        <div className="acct-fav-body">
                          <Link href={`/objects/${slug}`} className="acct-fav-name">
                            {product.title}
                          </Link>
                          <span className="acct-fav-price">{formatUsd(product.priceUsd)}</span>
                          <FavoriteRemove slug={slug} labels={labels} />
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </section>
            </div>

            {/* 右栏：资料 / 生日 / 积分 / 安全 */}
            <div className="acct-col-side">
              <section className="acct-card">
                <header className="acct-card-head">
                  <h2 className="serif">{labels.profileTitle}</h2>
                </header>
                <ProfileForm
                  labels={labels}
                  initialName={user.name ?? ''}
                  initialBirthday={user.birthday ?? ''}
                  initialOptIn={user.marketing_opt_in === 1}
                />
              </section>

              <section className="acct-card">
                <header className="acct-card-head">
                  <h2 className="serif">{labels.birthdayTitle}</h2>
                </header>
                <p className="acct-note">{labels.birthdayLead}</p>
                <p className="acct-birthday-state">
                  {user.birthday ? (
                    <>
                      <strong>{user.birthday}</strong>
                      <span>
                        {gift.eligible && !gift.issued
                          ? labels.birthdayMonthHint
                          : labels.birthdayNotYet}
                      </span>
                    </>
                  ) : (
                    labels.birthdayUnset
                  )}
                </p>
              </section>

              <section className="acct-card">
                <header className="acct-card-head">
                  <h2 className="serif">{labels.redeemTitle}</h2>
                </header>
                <p className="acct-note">{labels.redeemLead}</p>
                <RedeemPanel
                  labels={labels}
                  balance={user.points}
                  options={REDEEM_OPTIONS.map((o) => ({
                    points: o.points,
                    valueCents: o.valueCents,
                    label: locale === 'en' ? o.labelEn : o.labelZh,
                  }))}
                />
              </section>

              <section className="acct-card">
                <header className="acct-card-head">
                  <h2 className="serif">{labels.ledgerTitle}</h2>
                </header>
                {ledger.length === 0 ? (
                  <p className="acct-empty">{labels.ledgerEmpty}</p>
                ) : (
                  <ul className="acct-ledger">
                    {ledger.map((row, i) => {
                      const lab = REASON_LABEL[row.reason];
                      return (
                        <li key={i}>
                          <span>{lab ? (locale === 'en' ? lab.en : lab.zh) : row.reason}</span>
                          <span className="acct-ledger-date">{dateFmt(row.created_at)}</span>
                          <span className={row.delta >= 0 ? 'acct-plus' : 'acct-minus'}>
                            {row.delta >= 0 ? '+' : ''}
                            {row.delta}
                          </span>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </section>

              <section className="acct-card">
                <header className="acct-card-head">
                  <h2 className="serif">{labels.securityTitle}</h2>
                </header>
                <PasswordForm labels={labels} hasPassword={Boolean(user.password_hash)} />
                <div className="acct-linked">
                  {identities.map((idn) => (
                    <span key={idn.provider} className="acct-chip">
                      {idn.provider === 'password' ? labels.password : idn.provider === 'google' ? 'Google' : 'Apple'}
                    </span>
                  ))}
                </div>
              </section>
            </div>
          </div>
        </div>
      </section>

      <Footer strings={footerStrings} />
    </>
  );
}
