import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getProduct, getRelatedProducts } from '@/lib/products';
import { formatUsd } from '@/lib/shipping';
import { Nav } from '@/components/Nav';
import { Footer } from '@/components/Footer';
import { AddToCart } from '@/components/AddToCart';

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
  const product = getProduct(slug);
  if (!product) notFound();

  const related = getRelatedProducts(product);

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.title,
    description: product.seo.description,
    image: product.images.map((i) => `https://zhenhesheng.com${i}`),
    sku: product.variants[0]?.sku,
    material: product.materials.join(', '),
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

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <Nav />

      <section className="sec" style={{ paddingTop: 40 }}>
        <div className="wrap">
          <nav className="crumb" aria-label="Breadcrumb">
            <Link href="/">Home</Link>
            <span>/</span>
            <Link href="/objects">Objects</Link>
            <span>/</span>
            <span aria-current="page">{product.title}</span>
          </nav>

          <div className="pdp">
            {/* ── 图 ── */}
            <div className="pdp-media">
              <div className="pdp-main">
                <img src={product.images[0]} alt={product.title} />
              </div>
              <div className="pdp-thumbs">
                {product.images.map((img) => (
                  <div key={img} className="pdp-thumb">
                    <img src={img} alt="" />
                  </div>
                ))}
              </div>
            </div>

            {/* ── 信息 ── */}
            <div className="pdp-info">
              <div className="obj-cat">{product.titleZh}</div>
              <h1 className="pdp-title serif">{product.title}</h1>
              <p className="pdp-tagline">{product.tagline}</p>

              <div className="pdp-price">
                {product.compareAtUsd && <s>{formatUsd(product.compareAtUsd)}</s>}
                <strong>{formatUsd(product.priceUsd)}</strong>
              </div>

              <p className="pdp-desc">{product.description}</p>

              {/* 溯源块 —— 差异化护城河 */}
              <div className="pdp-trace">
                <div className="pdp-trace-title">Traceability</div>
                <dl>
                  <div>
                    <dt>Maker</dt>
                    <dd>
                      {product.maker.name} — {product.maker.region}
                    </dd>
                  </div>
                  <div>
                    <dt>Craft</dt>
                    <dd>{product.maker.craft}</dd>
                  </div>
                  <div>
                    <dt>Material</dt>
                    <dd>{product.materials.join(' · ')}</dd>
                  </div>
                  {product.dimensionsCm && (
                    <div>
                      <dt>Dimensions</dt>
                      <dd>
                        {product.dimensionsCm.w} × {product.dimensionsCm.h} × {product.dimensionsCm.d} cm
                      </dd>
                    </div>
                  )}
                  <div>
                    <dt>Laboratory</dt>
                    <dd>
                      {product.assay
                        ? `${product.assay.lab} · ${product.assay.reportNo} (${product.assay.scope.join(', ')})`
                        : 'Not applicable to this material'}
                    </dd>
                  </div>
                  <div>
                    <dt>CITES</dt>
                    <dd>
                      {product.cites.status === 'regulated'
                        ? `Appendix II — ${product.cites.species} · permit ${product.cites.permitNo}`
                        : 'Not a CITES-regulated species'}
                    </dd>
                  </div>
                  {product.consecration && (
                    <div>
                      <dt>Consecration</dt>
                      <dd>
                        {product.consecration.lineage} · cert. {product.consecration.certificateNo} (
                        {product.consecration.date})
                      </dd>
                    </div>
                  )}
                </dl>
              </div>

              {product.wearable === false && product.assay && (
                <div className="pdp-notice">
                  <strong>Display piece.</strong> This item contains a material regulated under EU REACH
                  restrictions. It is sealed against skin contact and is made to be looked at rather than
                  worn. The assay report above is provided so you can check it before ordering.
                </div>
              )}

              {product.prop65Warning && (
                <div className="pdp-notice warn">
                  <strong>California Proposition 65.</strong> This product contains a substance listed
                  under Proposition 65. The report number above identifies the testing performed.
                </div>
              )}

              <AddToCart product={product} />

              <ul className="pdp-assurances">
                <li>Free US shipping over $60 · duties included at checkout</li>
                <li>30-day returns, return shipping covered</li>
                <li>Shipped from Beijing with tracking · 7–15 business days</li>
                <li>Each order includes an English card explaining the object&rsquo;s origin</li>
              </ul>
            </div>
          </div>

          {related.length > 0 && (
            <div style={{ marginTop: 96 }}>
              <div className="eyebrow" style={{ marginBottom: 22 }}>
                Also in this category
              </div>
              <div className="obj-grid">
                {related.map((p) => (
                  <Link key={p.slug} className="obj-card" href={`/objects/${p.slug}`}>
                    <div className="obj-media">
                      <img src={p.images[0]} alt={p.title} />
                      <span className="obj-price">from {formatUsd(p.priceUsd)}</span>
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

      <Footer />
    </>
  );
}
