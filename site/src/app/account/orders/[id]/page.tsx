import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { initDb } from '@/lib/db/loader';
import { currentUser } from '@/lib/account/auth';
import { findUserOrder, getRefundRequestByOrder } from '@/lib/account/dao';
import { accountLabels, orderStatusLabel } from '@/lib/account/ui';
import { getStoreProducts } from '@/lib/storefront';
import { formatUsd } from '@/lib/shipping';
import { getNavStrings, getFooterStrings, getUi } from '@/lib/i18n';
import { Nav } from '@/components/Nav';
import { Footer } from '@/components/Footer';
import { RefundPanel } from '@/components/account/RefundPanel';

export const dynamic = 'force-dynamic';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  return {
    title: `Order ${id}`,
    robots: { index: false, follow: false },
  };
}

type Item = { slug?: string; name?: string; quantity?: number; unitAmountUsd?: number };
type Address = {
  name?: string | null;
  phone?: string | null;
  line1?: string | null;
  line2?: string | null;
  city?: string | null;
  state?: string | null;
  postalCode?: string | null;
  country?: string | null;
};

/** 可申请退款的状态 */
const REFUNDABLE = ['paid', 'shipped', 'delivered'];

export default async function OrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await initDb();

  const user = await currentUser();
  if (!user) redirect(`/account/login?next=/account/orders/${encodeURIComponent(id)}`);

  // 归属校验：非本人订单一律 404（不泄露订单是否存在）
  const order = findUserOrder(user.id, user.email, id);
  if (!order) notFound();

  const { locale, t } = await getUi();
  const labels = accountLabels(locale);
  const navStrings = await getNavStrings();
  const footerStrings = await getFooterStrings();

  let items: Item[] = [];
  try {
    items = JSON.parse(order.items || '[]') as Item[];
  } catch {
    items = [];
  }
  let address: Address | null = null;
  try {
    address = order.address ? (JSON.parse(order.address) as Address) : null;
  } catch {
    address = null;
  }

  // 商品图（前台目录里取当前图，已下架的只留名称）
  const store = await getStoreProducts();
  const bySlug = new Map(store.map((p) => [p.slug, p]));

  const dateFmt = (ts: number) =>
    new Date(ts).toLocaleDateString(locale === 'en' ? 'en-US' : 'zh-CN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });

  const statusText = orderStatusLabel(order.status, labels);
  const refund = getRefundRequestByOrder(order.id);
  const canRequest =
    REFUNDABLE.includes(order.status) && (!refund || refund.status !== 'pending');

  // 物流时间线：状态决定走到第几步
  const steps = [
    { key: 'placed', label: labels.stepPlaced },
    { key: 'paid', label: labels.stepPaid },
    { key: 'shipped', label: labels.stepShipped },
    { key: 'delivered', label: labels.stepDelivered },
  ];
  const stepIndex: Record<string, number> = {
    paid: 1,
    shipped: 2,
    delivered: 3,
    disputed: 1,
    refunded: 1,
    cancelled: 0,
  };
  const activeStep = stepIndex[order.status] ?? 0;
  const shipped = ['shipped', 'delivered'].includes(order.status);
  const etaFrom = order.created_at + 7 * 86400000;
  const etaTo = order.created_at + 15 * 86400000;

  const addressLine = address
    ? [
        address.line1,
        address.line2,
        [address.city, address.state, address.postalCode].filter(Boolean).join(', '),
        address.country,
      ]
        .filter((x): x is string => Boolean(x && x.trim()))
        .join(' · ')
    : '';

  return (
    <>
      <Nav strings={navStrings} />
      <section className="acct-sec">
        <div className="wrap">
          <Link href="/account" className="eyebrow" style={{ display: 'inline-block', marginBottom: 22 }}>
            {t('← Back to account', '← 返回账户')}
          </Link>

          <div className="acct-head">
            <div>
              <div className="eyebrow">{labels.orderDetailTitle}</div>
              <h1 className="serif">{order.id}</h1>
              <p className="acct-head-mail">
                {labels.orderPlacedAt} {dateFmt(order.created_at)}
              </p>
            </div>
            <div className="acct-head-acts">
              <span className={`acct-pill acct-pill-${order.status}`}>{statusText}</span>
            </div>
          </div>

          <div className="acct-grid">
            <div className="acct-col-main">
              {/* 物流 */}
              <section className="acct-card">
                <header className="acct-card-head">
                  <h2 className="serif">{labels.logisticsTitle}</h2>
                  {order.tracking_no && (
                    <span className="acct-card-meta">
                      {labels.carrier}: {order.carrier || '—'} · {labels.trackingNumber}: {order.tracking_no}
                    </span>
                  )}
                </header>

                {!order.tracking_no ? (
                  <p className="acct-note">{labels.noTrackingYet}</p>
                ) : (
                  <div className="ord-track">
                    <div className="ord-track-meta">
                      <span>
                        <em>{labels.carrier}</em>
                        {order.carrier || '—'}
                      </span>
                      <span>
                        <em>{labels.trackingNumber}</em>
                        <code>{order.tracking_no}</code>
                      </span>
                    </div>
                    <ol className="ord-steps">
                      {steps.map((s, i) => (
                        <li key={s.key} className={i <= activeStep ? 'on' : ''}>
                          <span className="ord-step-dot" />
                          <span className="ord-step-label">{s.label}</span>
                        </li>
                      ))}
                    </ol>
                    <p className="acct-note" style={{ marginTop: 12 }}>
                      {labels.etaTitle}:{' '}
                      {shipped
                        ? `${dateFmt(etaFrom)} – ${dateFmt(etaTo)}（${labels.etaRange}）`
                        : labels.etaRange}
                    </p>
                  </div>
                )}
              </section>

              {/* 商品明细 */}
              <section className="acct-card">
                <header className="acct-card-head">
                  <h2 className="serif">{labels.itemsTitle}</h2>
                  <span className="acct-card-meta">{formatUsd(order.total)}</span>
                </header>
                {items.length === 0 ? (
                  <p className="acct-empty">{labels.ordersEmpty}</p>
                ) : (
                  <ul className="acct-orders">
                    {items.map((it, i) => {
                      const p = it.slug ? bySlug.get(it.slug) : undefined;
                      const qty = it.quantity ?? 1;
                      const unit = it.unitAmountUsd ?? 0;
                      return (
                        <li key={`${it.slug ?? 'x'}-${i}`} className="acct-order">
                          <div className="acct-order-items" style={{ borderTop: 'none' }}>
                            <li>
                              {p ? (
                                <Link href={`/objects/${p.slug}`} className="ord-item">
                                  <img src={p.images[0]} alt={p.title} />
                                  <span>{it.name || p.title}</span>
                                </Link>
                              ) : (
                                <span className="ord-item">
                                  <span>{it.name || it.slug}</span>
                                </span>
                              )}
                              <span className="acct-order-qty">×{qty}</span>
                              <span className="acct-order-amt">{formatUsd(unit * qty)}</span>
                            </li>
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                )}

                <dl className="ord-sum">
                  <div>
                    <dt>{labels.subtotal}</dt>
                    <dd>{formatUsd(order.subtotal)}</dd>
                  </div>
                  {order.discount > 0 && (
                    <div>
                      <dt>{labels.discount}</dt>
                      <dd className="ord-discount">−{formatUsd(order.discount)}</dd>
                    </div>
                  )}
                  <div>
                    <dt>{labels.shipping}</dt>
                    <dd>{order.shipping === 0 ? labels.freeShipping : formatUsd(order.shipping)}</dd>
                  </div>
                  {order.tax > 0 && (
                    <div>
                      <dt>{labels.tax}</dt>
                      <dd>{formatUsd(order.tax)}</dd>
                    </div>
                  )}
                  <div className="ord-sum-total">
                    <dt>{labels.total}</dt>
                    <dd>{formatUsd(order.total)}</dd>
                  </div>
                  {order.coupon_code && (
                    <div>
                      <dt>{labels.couponUsed}</dt>
                      <dd>
                        <code>{order.coupon_code}</code>
                      </dd>
                    </div>
                  )}
                </dl>
              </section>

              {/* 收货地址 */}
              <section className="acct-card">
                <header className="acct-card-head">
                  <h2 className="serif">{labels.addressTitle}</h2>
                </header>
                {addressLine ? (
                  <p className="acct-note" style={{ color: 'var(--ink)' }}>
                    {address?.name ? `${address.name} · ` : ''}
                    {addressLine}
                    {address?.phone ? ` · ${address.phone}` : ''}
                  </p>
                ) : (
                  <p className="acct-note">{labels.noAddress}</p>
                )}
              </section>
            </div>

            <div className="acct-col-side">
              {/* 退款 */}
              <section className="acct-card">
                <header className="acct-card-head">
                  <h2 className="serif">{labels.refundTitle}</h2>
                </header>
                <RefundPanel
                  orderId={order.id}
                  amount={order.total}
                  canRequest={canRequest}
                  request={
                    refund
                      ? {
                          id: refund.id,
                          status: refund.status,
                          reason: refund.reason,
                          admin_note: refund.admin_note,
                          created_at: refund.created_at,
                        }
                      : null
                  }
                  labels={labels}
                />
              </section>

              <section className="acct-card">
                <header className="acct-card-head">
                  <h2 className="serif">{labels.paymentTitle}</h2>
                </header>
                <p className="acct-note">
                  {order.customer_name || order.email}
                  {order.customer_name ? ` · ${order.email}` : ''}
                </p>
              </section>
            </div>
          </div>
        </div>
      </section>
      <Footer strings={footerStrings} />
    </>
  );
}
