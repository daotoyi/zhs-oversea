import Link from 'next/link';

export function Footer() {
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
            <p>
              A Beijing studio working with the Mawangdui silk manuscript tradition. Objects, texts and
              practice — carried to wherever someone wants to begin.
            </p>
            <Link className="cn-link" href="https://zhenhesheng.cn">
              中文站 zhenhesheng.cn →
            </Link>
          </div>
          <div className="foot-col">
            <h5>Shop</h5>
            <Link href="/objects">All objects</Link>
            <Link href="/objects?category=tea-ware">Tea ware</Link>
            <Link href="/objects?category=incense-ritual">Incense &amp; ritual</Link>
            <Link href="/objects?category=writing-desk">Writing &amp; desk</Link>
            <Link href="/objects?category=books">Books</Link>
          </div>
          <div className="foot-col">
            <h5>Learn</h5>
            <Link href="/classics">The Dao De Jing</Link>
            <Link href="/classics/yijing">Sixty-four hexagrams</Link>
            <Link href="/classics/bazi">Four Pillars</Link>
            <Link href="/practice">Weekly study sessions</Link>
            <Link href="/journal">Journal</Link>
          </div>
          <div className="foot-col">
            <h5>Support</h5>
            <Link href="/contact">Contact</Link>
            <Link href="/policies/shipping">Shipping &amp; duties</Link>
            <Link href="/policies/returns">Returns</Link>
            <Link href="/traceability">Traceability standards</Link>
            <Link href="/policies/privacy">Privacy &amp; terms</Link>
          </div>
        </div>
        <div className="foot-bottom">
          <p>
            © 2026 Zhen He Sheng · Beijing, China ·{' '}
            <Link href="/policies/imprint" style={{ borderBottom: '1px solid #4a443c' }}>
              Imprint &amp; legal notice
            </Link>{' '}
            · Registered in Hong Kong SAR
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
