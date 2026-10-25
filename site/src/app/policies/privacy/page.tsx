import type { Metadata } from 'next';
import { Nav } from '@/components/Nav';
import { Footer } from '@/components/Footer';
import { getNavStrings, getFooterStrings, getUi } from '@/lib/i18n';
import { UI_ZH } from '@/lib/i18n/zh-hans';

export async function generateMetadata(): Promise<Metadata> {
  const { locale } = await getUi();
  return {
    title: locale === 'en' ? 'Privacy policy' : '隐私政策',
    description:
      locale === 'en'
        ? 'How Zhen He Sheng collects, uses and protects your personal information.'
        : '真和盛如何收集、使用与保护您的个人信息。',
    alternates: { canonical: '/policies/privacy' },
  };
}

export default async function PrivacyPage() {
  const { locale, t } = await getUi();
  const navStrings = await getNavStrings();
  const footerStrings = await getFooterStrings();
  const h = UI_ZH.policies.privacy;

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
            {t('Privacy policy', h.h1)}
          </h1>
          <div className="prose">
            <h2>{t('What we collect', h.whatH)}</h2>
            <p>{t(
              'When you order, we collect your name, email address, delivery address and the contents of your order. When you subscribe to the Sunday hexagram, we collect your email address and nothing else. We do not collect payment card details ourselves — those go directly to our payment processor and never touch our servers.',
              h.whatP
            )}</p>

            <h2>{t('Why we collect it', h.whyH)}</h2>
            <ul>
              {h.whyL.map((item, i) => (
                <li key={i}>{t(
                  ['To take, ship and deliver your order, and to answer questions about it',
                   'To email you the tracking number, the order confirmation and, if you asked for it, the weekly reading',
                   'To meet our tax and legal obligations',
                   'To detect and prevent fraud, including payment disputes'][i],
                  item
                )}</li>
              ))}
            </ul>

            <h2>{t('Who we share it with', h.shareH)}</h2>
            <p>{t(
              'We share what is necessary to run the business, and nothing more: our payment processor, our email service, our shipping carrier, and the tax authorities we are required to report to. We do not sell personal information, and we do not share it for advertising.',
              h.shareP
            )}</p>

            <h2>{t('Third-party sign-in', '第三方账户登录')}</h2>
            <p>{t(
              'If you choose to sign in with Google or Apple, we receive the basic profile information those providers share with us — typically your email address, display name and profile picture — and use it only to create and sign you into your account. We never receive your password; this sign-in is governed by each provider’s own privacy policy (Google: privacy.google.com; Apple: apple.com/legal/privacy). You may disconnect the linked account at any time from your account settings.',
              '如果您选择使用 Google 或 Apple 账户登录，我们会从相应服务商获取其共享的基础资料——通常包括您的电子邮件地址、显示名称和头像——并仅用于创建和登录您的账户。我们不会获取您的密码；该登录方式受服务商各自的隐私政策约束（Google：privacy.google.com；Apple：apple.com/legal/privacy）。您可以随时在账户设置中解除绑定。'
            )}</p>

            <h2>{t('Email communications', '电子邮件通信')}</h2>
            <p>{t(
              'We send email through our email provider (Resend). Transactional email — order confirmations, shipping notices and password resets — is sent because it is part of the service you asked for. Marketing email, such as the Sunday hexagram, is sent only if you opt in. Every marketing email includes a one-click unsubscribe link and a physical mailing address, and you can also unsubscribe at zhenhesheng.com/unsubscribe. Once you unsubscribe we keep your address on a suppression list so it is never emailed again.',
              '我们通过邮件服务商（Resend）发送电子邮件。交易邮件——订单确认、发货通知与密码重置——因属于您所请求服务的一部分而发送。营销邮件（如「周日卦象」）仅在您主动订阅后才会发送。每封营销邮件都包含一键退订链接与实体邮寄地址，您也可以在 zhenhesheng.com/unsubscribe 退订。退订后我们会将您的邮箱保留在拒收名单中，不再向您发送营销邮件。'
            )}</p>

            <h2>{t('Cookies', h.cookiesH)}</h2>
            <p>{t(
              'We use a small number of cookies: some are required for the site to work at all, and others tell us which pages are read so we can write more of what is useful. You can refuse the optional ones without losing any functionality.',
              h.cookiesP
            )}</p>

            <h2>{t('How long we keep it', h.keepH)}</h2>
            <p>{t(
              'Order records are kept for as long as our tax obligations require. Newsletter subscriptions are kept until you unsubscribe, and we remove them from our list within thirty days of a request.',
              h.keepP
            )}</p>

            <h2>{t('Your rights', h.rightsH)}</h2>
            <p>{t(
              'You can ask to see the personal data we hold about you, ask us to correct it, or ask us to delete it where we are not legally required to keep it. California residents have specific rights under the CCPA, including the right to know and the right to delete; residents of states with similar laws have the same. Write to us and we will respond within thirty days.',
              h.rightsP
            )}</p>
          </div>
        </div>
      </section>
      <Footer strings={footerStrings} />
    </>
  );
}
