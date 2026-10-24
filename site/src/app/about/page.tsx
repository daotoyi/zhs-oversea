import type { Metadata } from 'next';
import { Nav } from '@/components/Nav';
import { Footer } from '@/components/Footer';
import { getNavStrings, getFooterStrings, getTrustItems, getUi } from '@/lib/i18n';

export const metadata: Metadata = {
  title: 'About — our lineage',
  description:
    'A Beijing studio working with the Mawangdui silk manuscript tradition. 我们的老师, our workshops, our standards.',
  alternates: { canonical: '/about' },
};

export default async function AboutPage() {
  const { locale, t } = await getUi();
  const navStrings = await getNavStrings();
  const footerStrings = await getFooterStrings();
  return (
    <>
      <Nav strings={navStrings} />
      <section className="sec" style={{ paddingTop: 64 }}>
        <div className="wrap">
          <div className="eyebrow" style={{ marginBottom: 18 }}>
            About · 真和盛
          </div>
          <h1
            className="serif"
            style={{ fontWeight: 300, fontSize: 'clamp(2.2rem, 4.4vw, 3.4rem)', lineHeight: 1.1, marginBottom: 26 }}
          >
            We read the text that was<br />
            <em>actually written down.</em>
          </h1>
          <div className="prose" style={{ marginTop: 40 }}>
            <p>
              Zhen He Sheng (真和盛) is a Beijing studio that has spent fifteen years on a single
              question: what did Laozi&rsquo;s text actually say? Not the version popularised in the
              West over the last two centuries — but the text found in a sealed tomb at Mawangdui in
              1973, written on silk, unpolished and unrhymed.
            </p>
            <p>
              That difference matters. The received <em>Dao De Jing</em> reads as literature. The silk
              text reads as instruction. It was made to be spoken aloud, to a listener, in a specific
              situation — and much of its force comes from what it refuses to smooth out.
            </p>

            <h2>我们的老师</h2>
            <p>
              Liang Kun teaches the silk <em>Dao De Jing</em> online on Tuesday evenings; Zhang Hong
              teaches the origins of Chinese characters and calligraphy on Sundays. Both sessions are
              open to anyone. A third weekly gathering, in person at our Tongzhou studio, covers
              classical practice.
            </p>

            <h2>我们做什么</h2>
            <p>
              We work with a small number of workshops rather than running our own production. The
              tea ware comes from Yixing in Jiangsu and Jingdezhen in Jiangxi; the writing desk objects
              from Guangdong stone and Anhui bamboo; the incense from our own workshop here in Beijing.
              Each object is made by people we can name.
            </p>

            <h2>我们的标准</h2>
            <p>
              We publish what most sellers will not: the maker, the origin, the material composition,
              the laboratory report number, the CITES status, and the consecration certificate number
              where one applies. It is the only honest way to tell handwork from manufacturing, and it
              lets you check us rather than take our word.
            </p>

            <h2>联系</h2>
            <p>
              Zhen He Sheng, Beijing, China. Registered in Hong Kong SAR. We answer written enquiries
              within one business day — a person reads them.
            </p>
            <p>
              <a href="/contact" className="link-more">
                联系 us →
              </a>
            </p>
          </div>
        </div>
      </section>
      <Footer strings={footerStrings} />
    </>
  );
}
