import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getProduct, getRelatedProducts } from '@/lib/products';
import { formatUsd } from '@/lib/shipping';
import { Nav } from '@/components/Nav';
import { Footer } from '@/components/Footer';
import { AddToCart } from '@/components/AddToCart';
import { localizeProduct, getNavStrings, getFooterStrings, getUi } from '@/lib/i18n';
import { UI_ZH } from '@/lib/i18n/zh-hans';
import { toTraditional } from '@/lib/i18n/convert';

export async function generateStaticParams() {
  const { getProducts } = await import('@/lib/products');
  return getProducts().map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const product = getProduct(slug);
  if (!product) return { title: 'Not found' };

  return {
    title: product.title,
    description: product.seo.description,
    alternates: { canonical: `/objects/${product.slug}` },
    openGraph: {
      type: 'website',
      title: product.title,
      description: product.seo.description,
      images: [{ url: product.images[0] }],
    },
    other: { 'product:price:currency': 'USD' },
  };
}

export default async function ProductPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const { locale, t } = await getUi();
  const navStrings = await getNavStrings();
  const footerStrings = await getFooterStrings();

  const base = getProduct(slug);
  if (!base) notFound();
  const product = await localizeProduct(base);
  const related = getRelatedProducts(base);
  const h = UI_ZH.pdp;
  const Z = (s: string) => (locale === 'en' ? s : toTraditional(s));

  const addToCartStrings = {
    addToCart: t('Add to cart', UI_ZH.common.addToCart),
    soldOut: t('Currently unavailable', UI_ZH.common.soldOut),
    shipHintLight: t('Ships from Beijing — 7–12 business days to the US, insured.', h.shipHintLight),
    shipHintHeavy: t('Heavier piece — 8–14 business days to the US, insured.', h.shipHintHeavy),
    variantLabel: t('Variant', h.variantLabel),
  };

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.loc.title,
    description: product.seo.description,
    image: product.images.map((i) => `https://zhenhesheng.com${i}`),
    sku: product.variants[0]?.sku,
    material: product.loc.materials.join(', '),
    weight: product.weightGrams ? { '@type': 'QuantitativeValue', value: product.weightGrams, unitCode: 'GRM' } : undefined,
    offers: {
      '@type': 'Offer',
      price: (product.priceUsd / 100).toFixed(2),
      priceCurrency: 'USD',
      availability: 'https://schema.org/InStock',
      url: `https://zhenhesheng.com/objects/${product.slug}`,
      shippingDetails: {
        '@type': 'OfferShippingDetails',
        shippingDestination: { '@type': 'DefinedRegion', addressCountry: 'US' },
        deliveryTime: {
          '@type': 'ShippingDeliveryTime',
          handlingTime: { '@type': 'QuantitativeValue', minValue: 1, maxValue: 3, unitCode: 'DAY' },
          transitTime: { '@type': 'QuantitativeValue', minValue: 7, maxValue: 15, unitCode: 'DAY' },
        },
      },
    },
  };

  const assurances = locale === 'en'
    ? [
        'Free US shipping over $60 · duties included at checkout',
        '30-day returns, return shipping covered',
        'Shipped from Beijing with tracking · 7–15 business days',
        'Each order includes an English card explaining the object’s origin',
      ]
    : h.assurances.map(toTraditional);

  const categories: Record<string, [string, string]> = {
    'tea-ware': ['Tea ware', UI_ZH.objectsPage.catTea],
    'incense-ritual': ['Incense & ritual', UI_ZH.objectsPage.catIncense],
    'writing-desk': ['Writing & desk', UI_ZH.objectsPage.catWriting],
    'talisman-objects': ['Talisman objects', UI_ZH.objectsPage.catTalisman],
    'home-altar': ['Home & altar', UI_ZH.objectsPage.catHome],
    books: ['Books', UI_ZH.objectsPage.catBooks],
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <Nav strings={navStrings} />

      <section className="sec" style={{ paddingTop: 40 }}>
        <div className="wrap">
          <nav className="crumb" aria-label="Breadcrumb">
            <Link href="/">{t('Home', UI_ZH.common.home)}</Link>
            <span>/</span>
            <Link href="/objects">{t('Objects', UI_ZH.common.objects)}</Link>
            <span>/</span>
            <span aria-current="page">{product.loc.title}</span>
          </nav>

          <div className="pdp">
            <div className="pdp-media">
              <div className="pdp-main">
                <img src={product.images[0]} alt={product.loc.title} />
              </div>
              <div className="pdp-thumbs">
                {product.images.map((img) => (
                  <div key={img} className="pdp-thumb">
                    <img src={img} alt="" />
                  </div>
                ))}
              </div>
            </div>

            <div className="pdp-info">
              <div className="obj-cat">{product.titleZh}</div>
              <h1 className="pdp-title serif">{product.loc.title}</h1>
              <p className="pdp-tagline">{product.loc.tagline}</p>

              <div className="pdp-price">
                {product.compareAtUsd && <s>{formatUsd(product.compareAtUsd)}</s>}
                <strong>{formatUsd(product.priceUsd)}</strong>
              </div>

              <p className="pdp-desc">{product.loc.description}</p>

              {/* 溯源块 —— 差异化护城河 */}
              <div className="pdp-trace">
                <div className="pdp-trace-title">{t('Traceability', h.traceTitle)}</div>
                <dl>
                  <div>
                    <dt>{t('Maker', h.maker)}</dt>
                    <dd>
                      {product.maker.name} — {product.maker.region}
                    </dd>
                  </div>
                  <div>
                    <dt>{t('Craft', h.craft)}</dt>
                    <dd>{product.loc.craft}</dd>
                  </div>
                  <div>
                    <dt>{t('Material', h.material)}</dt>
                    <dd>{product.loc.materials.join(' · ')}</dd>
                  </div>
                  {product.dimensionsCm && (
                    <div>
                      <dt>{t('Dimensions', h.dimensions)}</dt>
                      <dd>
                        {product.dimensionsCm.w} × {product.dimensionsCm.h} × {product.dimensionsCm.d} cm
                      </dd>
                    </div>
                  )}
                  <div>
                    <dt>{t('Laboratory', h.laboratory)}</dt>
                    <dd>
                      {product.assay
                        ? `${product.assay.lab} · ${product.assay.reportNo} (${product.assay.scope.join(', ')})`
                        : t('Not applicable to this material', '此材质无需检测')}
                    </dd>
                  </div>
                  <div>
                    <dt>{t('CITES', h.cites)}</dt>
                    <dd>
                      {product.cites.status === 'regulated'
                        ? `${t('Appendix II', '附录 II')} — ${product.cites.species} · ${t('permit', '许可')} ${product.cites.permitNo}`
                        : t('Not a CITES-regulated species', '非 CITES 管制物种')}
                    </dd>
                  </div>
                  {product.consecration && (
                    <div>
                      <dt>{t('Consecration', h.consecration)}</dt>
                      <dd>
                        {product.consecration.lineage} · {t('cert.', '证书')} {product.consecration.certificateNo} (
                        {product.consecration.date})
                      </dd>
                    </div>
                  )}
                </dl>
              </div>

              {product.wearable === false && product.assay && (
                <div className="pdp-notice">
                  <strong>{t('Display piece.', '展示级器物。')}</strong>{' '}
                  {t(
                    'This item contains a material regulated under EU REACH restrictions. It is sealed against skin contact and is made to be looked at rather than worn. The assay report above is provided so you can check it before ordering.',
                    h.displayNotice
                  )}
                </div>
              )}

              {product.prop65Warning && (
                <div className="pdp-notice warn">
                  <strong>{t('California Proposition 65.', '加州 65 号提案警示。')}</strong>{' '}
                  {t(
                    'This product contains a substance listed under Proposition 65. The report number above identifies the testing performed.',
                    h.prop65Notice
                  )}
                </div>
              )}

              <AddToCart product={product} strings={addToCartStrings} />

              <ul className="pdp-assurances">
                {assurances.map((a) => (
                  <li key={a}>{a}</li>
                ))}
              </ul>
            </div>
          </div>

          {related.length > 0 && (
            <div style={{ marginTop: 96 }}>
              <div className="eyebrow" style={{ marginBottom: 22 }}>
                {t('Also in this category', '同类器物')}
              </div>
              <div className="obj-grid">
                {related.map((p) => (
                  <Link key={p.slug} className="obj-card" href={`/objects/${p.slug}`}>
                    <div className="obj-media">
                      <img src={p.images[0]} alt={p.title} />
                      <span className="obj-price">
                        {t('from ', '起 ')}
                        {formatUsd(p.priceUsd)}
                      </span>
                    </div>
                    <div className="obj-body">
                      <div className="obj-cat">{p.titleZh}</div>
                      <h3 className="obj-name">{p.title}</h3>
                      <p className="obj-desc">{p.tagline}</p>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
      </section>

      <Footer strings={footerStrings} />
    </>
  );
}
