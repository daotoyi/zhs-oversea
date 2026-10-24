import type { Metadata } from 'next';
import { Nav } from '@/components/Nav';
import { Footer } from '@/components/Footer';
import { getNavStrings, getFooterStrings, getTrustItems, getUi } from '@/lib/i18n';
import { UI_ZH } from '@/lib/i18n/zh-hans';

export async function generateMetadata(): Promise<Metadata> {
  const { locale } = await getUi();
  const title = locale === 'en' ? 'About — our lineage' : '关于真和盛';
  return {
    title,
    description:
      locale === 'en'
        ? 'A Beijing studio working with the Mawangdui silk manuscript tradition. Our teachers, our workshops, our standards.'
        : '北京的一间作坊，承接马王堆帛书传统。我们的老师、我们的作坊、我们的标准。',
    alternates: { canonical: '/about' },
  };
}

export default async function AboutPage() {
  const { locale, t } = await getUi();
  const navStrings = await getNavStrings();
  const footerStrings = await getFooterStrings();
  const h = UI_ZH.aboutPage;

  return (
    <>
      <Nav strings={navStrings} />
      <section className="sec" style={{ paddingTop: 64 }}>
        <div className="wrap">
          <div className="eyebrow" style={{ marginBottom: 18 }}>
            {t('About · 真和盛', h.eyebrow)}
          </div>
          <h1
            className="serif"
            style={{ fontWeight: 300, fontSize: 'clamp(2.2rem, 4.4vw, 3.4rem)', lineHeight: 1.1, marginBottom: 26 }}
          >
            {t('We read the text that was', h.h1a)}
            <br />
            <em>{t('actually written down.', h.h1b)}</em>
          </h1>
          <div className="prose" style={{ marginTop: 40 }}>
            <p>{t(
              'Zhen He Sheng (真和盛) is a Beijing studio that has spent fifteen years on a single question: what did Laozi’s text actually say? Not the version popularised in the West over the last two centuries — but the text found in a sealed tomb at Mawangdui in 1973, written on silk, unpolished and unrhymed.',
              h.p1
            )}</p>
            <p>
              {t('That difference matters. The received ', h.p2a)}
              <em>Dao De Jing</em>
              {t(' reads as literature. The silk text reads as instruction. It was made to be spoken aloud, to a listener, in a specific situation — and much of its force comes from what it refuses to smooth out.', h.p2b)}
            </p>

            <h2>{t('Our teachers', h.teachersH)}</h2>
            <p>
              {t('Liang Kun teaches the silk ', h.teachersP1)}
              <em>Dao De Jing</em>
              {t(
                ' online on Tuesday evenings; Zhang Hong teaches the origins of Chinese characters and calligraphy on Sundays. Both sessions are open to anyone. A third weekly gathering, in person at our Tongzhou studio, covers classical practice.',
                h.teachersP2
              )}
            </p>

            <h2>{t('What we make', h.makeH)}</h2>
            <p>{t(
              'We work with a small number of workshops rather than running our own production. The tea ware comes from Yixing in Jiangsu and Jingdezhen in Jiangxi; the writing desk objects from Guangdong stone and Anhui bamboo; the incense from our own workshop here in Beijing. Each object is made by people we can name.',
              h.makeP
            )}</p>

            <h2>{t('Our standard', h.standardH)}</h2>
            <p>{t(
              'We publish what most sellers will not: the maker, the origin, the material composition, the laboratory report number, the CITES status, and the consecration certificate number where one applies. It is the only honest way to tell handwork from manufacturing, and it lets you check us rather than take our word.',
              h.standardP
            )}</p>

            <h2>{t('Contact', h.contactH)}</h2>
            <p>{t(
              'Zhen He Sheng, Beijing, China. Registered in Hong Kong SAR. We answer written enquiries within one business day — a person reads them.',
              h.contactP
            )}</p>
            <p>
              <a href="/contact" className="link-more">
                {t('Contact us →', h.contactLink)}
              </a>
            </p>
          </div>
        </div>
      </section>
      <Footer strings={footerStrings} />
    </>
  );
}
