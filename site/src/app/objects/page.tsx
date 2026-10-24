import type { Metadata } from 'next';
import Link from 'next/link';
import { getProducts } from '@/lib/products';
import { formatUsd } from '@/lib/shipping';
import { Nav } from '@/components/Nav';
import { Footer } from '@/components/Footer';
import { TrustBar } from '@/components/TrustBar';

export const metadata: Metadata = {
  title: 'Objects — Dao Culture & Living',
  description:
    'Tea ware, incense, writing desk and ritual objects. Made by named hands, in named workshops, with the material declared.',
  alternates: { canonical: '/objects' },
};

const CATEGORY_LABEL: Record<string, string> = {
  'tea-ware': 'Tea ware',
  'incense-ritual': 'Incense & ritual',
  'writing-desk': 'Writing & desk',
  'talisman-objects': 'Talisman objects',
  'home-altar': 'Home & altar',
  books: 'Books',
};

const FILTERS = [
  { key: 'all', label: 'All' },
  { key: 'tea-ware', label: 'Tea ware' },
  { key: 'incense-ritual', label: 'Incense & ritual' },
  { key: 'writing-desk', label: 'Writing & desk' },
  { key: 'talisman-objects', label: 'Talisman objects' },
  { key: 'home-altar', label: 'Home & altar' },
  { key: 'books', label: 'Books' },
];

export default async function ObjectsPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string }>;
}) {
  const { category } = await searchParams;
  const all = getProducts();
  const products = category && category !== 'all' ? all.filter((p) => p.category === category) : all;

  return (
    <>
      <Nav />
      <section className="sec" style={{ paddingTop: 72, paddingBottom: 40 }}>
        <div className="wrap">
          <div className="eyebrow" style={{ marginBottom: 18 }}>
            道之器 · Objects
          </div>
          <h1
            className="serif"
            style={{ fontWeight: 300, fontSize: 'clamp(2.2rem, 4.4vw, 3.4rem)', lineHeight: 1.1, marginBottom: 20 }}
          >
            Objects for the <em>daily practice.</em>
          </h1>
          <p style={{ fontSize: 14.5, color: 'var(--ash)', maxWidth: 520, lineHeight: 1.75 }}>
            Made by named hands, in named workshops, with the material declared. Every product page
            carries the traceability record — origin, assay, CITES status, consecration certificate.
          </p>
        </div>
      </section>

      <div className="wrap" style={{ paddingBottom: 64 }}>
        <nav className="filter-bar" aria-label="Product categories">
          {FILTERS.map((f) => (
            <Link
              key={f.key}
              href={f.key === 'all' ? '/objects' : `/objects?category=${f.key}`}
              className={`filter-chip${(category ?? 'all') === f.key ? ' on' : ''}`}
            >
              {f.label}
            </Link>
          ))}
        </nav>

        <div className="obj-grid">
          {products.map((p) => (
            <Link key={p.slug} className="obj-card" href={`/objects/${p.slug}`}>
              <div className="obj-media">
                <img src={p.images[0]} alt={p.title} />
                <span className="obj-price">from {formatUsd(p.priceUsd)}</span>
                {p.cites.status === 'regulated' && <span className="obj-flag">CITES</span>}
                {p.prop65Warning && <span className="obj-flag prop65">Prop 65</span>}
              </div>
              <div className="obj-body">
                <div className="obj-cat">{CATEGORY_LABEL[p.category]}</div>
                <h3 className="obj-name">{p.title}</h3>
                <p className="obj-zh">{p.titleZh}</p>
                <p className="obj-desc">{p.tagline}</p>
              </div>
            </Link>
          ))}
        </div>

        {products.length === 0 && (
          <p style={{ padding: '60px 0', color: 'var(--ash)' }}>No objects in this category yet.</p>
        )}
      </div>

      <TrustBar />
      <Footer />
    </>
  );
}
