import Link from 'next/link';

export function Footer({ strings }: { strings: {
  about: string;
  shopH: string;
  learnH: string;
  supportH: string;
  shipping: string;
  returns: string;
  trace: string;
  privacyTerms: string;
  imprint: string;
  copyright: string;
  daoDeJing: string;
  hexagrams: string;
  fourPillars: string;
  sessions: string;
  journal: string;
  tea: string;
  incense: string;
  writing: string;
  books: string;
  allObjects: string;
  contact?: string;
} }) {
  return (
    <footer className="footer">
      <div className="wrap">
        <div className="foot-grid">
          <div className="foot-brand">
            <div className="brand" style={{ marginBottom: 4 }}>
              <span className="brand-mark">☯</span>
              <span>
                <span className="brand-name">ZHEN HE SHENG</span>
                <span className="brand-sub">Dao Culture &amp; Living</span>
              </span>
            </div>
            <p>{strings.about}</p>
          </div>
          <div className="foot-col">
            <h5>{strings.shopH}</h5>
            <Link href="/objects">{strings.allObjects}</Link>
            <Link href="/objects?category=tea-ware">{strings.tea}</Link>
            <Link href="/objects?category=incense-ritual">{strings.incense}</Link>
            <Link href="/objects?category=writing-desk">{strings.writing}</Link>
            <Link href="/objects?category=books">{strings.books}</Link>
          </div>
          <div className="foot-col">
            <h5>{strings.learnH}</h5>
            <Link href="/classics">{strings.daoDeJing}</Link>
            <Link href="/classics/yijing">{strings.hexagrams}</Link>
            <Link href="/classics/bazi">{strings.fourPillars}</Link>
            <Link href="/practice">{strings.sessions}</Link>
            <Link href="/journal">{strings.journal}</Link>
          </div>
          <div className="foot-col">
            <h5>{strings.supportH}</h5>
            <Link href="/contact">{strings.contact ?? 'Contact'}</Link>
            <Link href="/policies/shipping">{strings.shipping}</Link>
            <Link href="/policies/returns">{strings.returns}</Link>
            <Link href="/traceability">{strings.trace}</Link>
            <Link href="/policies/privacy">{strings.privacyTerms}</Link>
            <Link href="/policies/imprint">{strings.imprint}</Link>
          </div>
        </div>
        <div className="foot-bottom">
          <p>
            {strings.copyright}{' '}
            <Link href="/policies/imprint" style={{ borderBottom: '1px solid #4a443c' }}>
              {strings.imprint}
            </Link>
          </p>
          <div className="pay-row">
            <span className="pay-badge">VISA</span>
            <span className="pay-badge">MASTERCARD</span>
            <span className="pay-badge">AMEX</span>
            <span className="pay-badge">APPLE PAY</span>
            <span className="pay-badge">PAYPAL</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
