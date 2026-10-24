import type { Metadata } from 'next';
import { Nav } from '@/components/Nav';
import { Footer } from '@/components/Footer';
import { getNavStrings, getFooterStrings, getUi } from '@/lib/i18n';
import { UI_ZH } from '@/lib/i18n/zh-hans';

export async function generateMetadata(): Promise<Metadata> {
  const { locale } = await getUi();
  return {
    title: locale === 'en' ? 'Returns & refunds' : '退换与退款',
    description:
      locale === 'en'
        ? 'Thirty days to return anything unworn, unused and in its original packaging. We cover the return shipping.'
        : '三十天内，凡未佩戴、未使用且保持原包装的物品均可退换。退货运费由我们承担。',
    alternates: { canonical: '/policies/returns' },
  };
}

export default async function ReturnsPage() {
  const { locale, t } = await getUi();
  const navStrings = await getNavStrings();
  const footerStrings = await getFooterStrings();
  const h = UI_ZH.policies.returns;

  return (
    <>
      <Nav strings={navStrings} />
      <section className="sec" style={{ paddingTop: 64 }}>
        <div className="wrap">
          <div className="eyebrow" style={{ marginBottom: 18 }}>
            {t('Policies', UI_ZH.policies.eyebrow)}
          </div>
          <h1
            className="serif"
            style={{ fontWeight: 300, fontSize: 'clamp(2rem, 4vw, 3rem)', lineHeight: 1.1, marginBottom: 32 }}
          >
            {t('Returns & refunds', h.h1)}
          </h1>
          <div className="prose">
            <h2>{t('Thirty days', h.thirtyH)}</h2>
            <p>{t(
              'You have thirty days from delivery to return anything that is unworn, unused and in its original packaging. We cover the return shipping — you do not need to pay to send it back.',
              h.thirtyP
            )}</p>

            <h2>{t('Damaged in transit', h.damagedH)}</h2>
            <p>{t(
              'If an object arrives damaged, send us a photograph and we will replace it or refund you in full. You do not need to return the damaged item; we will ask you to dispose of it, which is the kinder thing to ask when the item is already broken.',
              h.damagedP
            )}</p>

            <h2>{t('How refunds are issued', h.howH)}</h2>
            <p>{t(
              'Refunds go back to the original payment method within five business days of us receiving the return. Your bank or card issuer may take a further few days to post the credit. We cannot refund to a different method, and we cannot refund a method that has expired.',
              h.howP
            )}</p>

            <h2>{t('What we cannot accept back', h.cannotH)}</h2>
            <ul>
              {h.cannotL.map((item, i) => (
                <li key={i}>{t(
                  ['Books that have been read — the pages cannot be un-read',
                   'Incense and fragrance, once the box is opened',
                   'Any object that has been used for its intended purpose'][i],
                  item
                )}</li>
              ))}
            </ul>
            <p>{t(
              'If you are unsure whether something will suit you, write to us first. We would rather answer a question before an order than handle a return after one.',
              h.cannotP
            )}</p>

            <h2>{t('Your statutory rights', h.statutoryH)}</h2>
            <p>{t(
              'Nothing on this page limits your rights under the consumer law that applies to you. If an item is faulty, we will repair or replace it, and if that is not possible, refund you.',
              h.statutoryP
            )}</p>
          </div>
        </div>
      </section>
      <Footer strings={footerStrings} />
    </>
  );
}
