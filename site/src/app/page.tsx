import Link from 'next/link';
import { getProducts } from '@/lib/products';
import { formatUsd } from '@/lib/shipping';
import { Footer } from '@/components/Footer';
import { Nav } from '@/components/Nav';
import { TrustBar } from '@/components/TrustBar';

const CATEGORY_LABEL: Record<string, string> = {
  'tea-ware': 'Tea ware',
  'incense-ritual': 'Incense & ritual',
  'writing-desk': 'Writing & desk',
  'talisman-objects': 'Talisman objects',
  'home-altar': 'Home & altar',
  books: 'Books',
};

export default function HomePage() {
  const products = getProducts();
  const featured = products.slice(0, 6);

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'Zhen He Sheng',
    alternateName: '真和盛',
    url: 'https://zhenhesheng.com',
    description:
      'A Beijing studio working with the Mawangdui silk manuscript tradition. Objects, texts and practice.',
    address: {
      '@type': 'PostalAddress',
      addressCountry: 'CN',
      addressLocality: 'Beijing',
    },
    sameAs: ['https://zhenhesheng.cn'],
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <Nav />

      {/* ── Hero ── */}
      <header className="hero">
        <div className="hero-bg">
          <img src="/products/lightning-wood.jpg" alt="Lightning-struck jujube wood ritual object" />
        </div>
        <div className="hero-veil" />
        <div className="hero-in">
          <div className="hero-copy">
            <div className="hero-eyebrow">Beijing · the lineage of Longhu Mountain</div>
            <h1>
              Ancient Dao wisdom,
              <br />
              <em>made tangible.</em>
            </h1>
            <p className="hero-sub">
              Eighty-one chapters of the <em>Dao De Jing</em> in plain English. Hand-thrown tea ware,
              ritual incense, and desk objects — each traced to its maker, its material, and its
              consecration.
            </p>
            <div className="hero-cta">
              <Link className="btn btn-solid" href="/objects">
                Explore the collection
              </Link>
              <Link className="btn btn-ghost-light" href="/classics">
                Read the Dao De Jing
              </Link>
            </div>
          </div>
        </div>
        <div className="hero-note">
          <b>Chapter 8</b>
          “The highest goodness is like water. Water benefits all things and does not contend.”
        </div>
      </header>

      <TrustBar />

      {/* ── 道之源 Origins ── */}
      <section className="sec origins">
        <div className="wrap origins-grid">
          <div className="origins-media">
            <img src="/products/calligraphy-shangshan.jpg" alt="Calligraphy of the Dao De Jing opening" />
            <div className="origins-tag">
              <span>The source</span>
              <p>
                Not the popular <em>Dao De Jing</em>. The <strong>Mawangdui silk manuscript</strong> —
                the text Laozi actually wrote down.
              </p>
            </div>
          </div>
          <div className="origins-body">
            <div className="eyebrow">Origins · 道之源</div>
            <h2>
              From a silk manuscript
              <br />
              found in a tomb.
            </h2>
            <p className="lead">
              In 1973, workers excavating a tomb in Changsha opened a sealed silk scroll untouched for
              two thousand years. Eighty-one chapters. No rhyme, no polish — the raw text.
            </p>
            <p className="lead">
              Our line of study begins there. Every chapter we teach is read from that manuscript rather
              than the later, smoother editions the West has read for two centuries.
            </p>
            <div className="zh">道 法 自 然 · 天 人 合 一</div>
            <ul className="origins-list">
              <li>
                <b>Origin</b>
                <span>Mawangdui silk text, read line by line against the received editions</span>
              </li>
              <li>
                <b>Lineage</b>
                <span>Longhu Mountain — ancestral home of Daoism, recognised through successive dynasties</span>
              </li>
              <li>
                <b>Teachers</b>
                <span>Weekly study sessions in Beijing, open to any level</span>
              </li>
              <li>
                <b>Practice</b>
                <span>Tea, incense, calligraphy and divination as lived disciplines</span>
              </li>
            </ul>
            <Link className="link-more" href="/about">
              Our lineage →
            </Link>
          </div>
        </div>
      </section>

      {/* ── 道之器 Objects ── */}
      <section className="sec" id="objects">
        <div className="wrap">
          <div className="sec-head">
            <div>
              <div className="eyebrow">Objects · 道之器</div>
              <h2>
                Objects for the
                <br />
                <em>daily practice.</em>
              </h2>
            </div>
            <div>
              <p className="lead">
                Tea ware, incense, writing desk and ritual objects — made by named hands, in named
                workshops, with the material declared. Nothing here is anonymous.
              </p>
              <div style={{ marginTop: 18 }}>
                <Link className="link-more" href="/objects">
                  View all {products.length} objects →
                </Link>
              </div>
            </div>
          </div>

          <div className="obj-grid">
            {featured.map((p) => (
              <Link key={p.slug} className="obj-card" href={`/objects/${p.slug}`}>
                <div className="obj-media">
                  <img src={p.images[0]} alt={p.title} />
                  <span className="obj-price">from {formatUsd(p.priceUsd)}</span>
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
        </div>
      </section>

      {/* ── 道之术 Practice ── */}
      <section className="sec practice" id="practice">
        <div className="wrap">
          <div className="sec-head">
            <div>
              <div className="eyebrow">Practice · 道之术</div>
              <h2>
                Read a chapter.
                <br />
                Then live the week.
              </h2>
            </div>
            <p className="lead">
              Every chapter of the <em>Dao De Jing</em> is a prompt, not a lecture. We pair the text
              with a weekly practice and a set of objects that make it easier to keep.
            </p>
          </div>

          <div className="practice-grid">
            <div className="chapter-card">
              <div className="num">Chapter 12</div>
              <h3>The Way of the Sage in the World</h3>
              <div className="zh">道 法 自 然</div>
              <blockquote>
                “The sage manages affairs without doing. He acts without assuming credit for his deeds.
                He is content with the way things are, without ever being attached to it.”
              </blockquote>
              <p className="trans">
                Note the translation is deliberately awkward in places. That is the silk text&rsquo;s own
                rhythm: it was written to be read aloud, two thousand years before anyone decided
                Daoism should sound elegant.
              </p>
              <div className="chapter-foot">
                <span>Objects for this chapter · 3</span>
                <Link href="/classics/dao-de-jing/12">Read chapter 12 →</Link>
              </div>
            </div>

            <div className="practice-side">
              <div>
                <div className="eyebrow" style={{ marginBottom: 14 }}>
                  Also in the Classics
                </div>
                <div className="hex-list">
                  {[
                    ['☰', 'The Creative', '乾'],
                    ['☷', 'The Receptive', '坤'],
                    ['☵', 'The Abysmal', '坎'],
                    ['☲', 'The Clinging', '離'],
                    ['☴', 'The Gentle', '巽'],
                    ['☶', 'The Reedy', '艮'],
                  ].map(([symbol, name, zh]) => (
                    <div className="hex-row" key={zh}>
                      <b>
                        {symbol} {name}
                      </b>
                      <span className="zh">{zh}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="sub-card">
                <h4>One hexagram, every Sunday.</h4>
                <p>
                  The classical reading for the week, with a short commentary and one object that
                  carries the same idea. Free, no card required.
                </p>
                <div className="sub-input">
                  <input type="email" placeholder="your@email.com" aria-label="Email address" />
                  <button type="button">Subscribe</button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── 溯源 Traceability ── */}
      <section className="sec trace" id="traceability">
        <div className="wrap trace-grid">
          <div>
            <div className="eyebrow">Traceability</div>
            <h2>
              How to know
              <br />
              what you&rsquo;re holding.
            </h2>
            <p className="lead">
              Most sellers of Daoist objects online will not tell you where the material came from, what
              the metal contains, or who consecrated it. We publish it on every product page — because
              this is how you tell handwork from manufacturing.
            </p>
            <ul>
              <li>Workshop and maker named, with region of origin</li>
              <li>Material declared in full — species, alloy, finish</li>
              <li>ISO 17025 laboratory report number, viewable</li>
              <li>CITES appendix status stated plainly on wooden and resin pieces</li>
              <li>Consecration certificate number, validatable by lineage</li>
            </ul>
            <Link className="link-more" href="/traceability">
              Read our standards →
            </Link>
          </div>
          <div className="trace-list">
            <div className="trace-cell">
              <div className="k">Laboratory</div>
              <div className="v">
                SGS<small>ISO/IEC 17025 · heavy metals, EN migration</small>
              </div>
            </div>
            <div className="trace-cell">
              <div className="k">Report number</div>
              <div className="v">
                SGS-24-1187<small>Viewable on the product page before purchase</small>
              </div>
            </div>
            <div className="trace-cell">
              <div className="k">Consecration</div>
              <div className="v">
                Cert. LHM-0436<small>Issued by the Longhu Mountain line</small>
              </div>
            </div>
            <div className="trace-cell">
              <div className="k">CITES status</div>
              <div className="v">
                Declared<small>Appendix II species carry export certificates</small>
              </div>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </>
  );
}
