import type { Metadata } from 'next';
import Link from 'next/link';
import { Nav } from '@/components/Nav';
import { Footer } from '@/components/Footer';

export const metadata: Metadata = {
  title: 'Traceability standards',
  description:
    'How we verify origin, materials, laboratory testing, CITES status and consecration — and how to check our claims.',
  alternates: { canonical: '/traceability' },
};

const STANDARDS = [
  {
    title: 'Origin',
    body: 'Every product names its workshop, its maker and the region it was made in. We do not sell through intermediaries we have not visited.',
  },
  {
    title: 'Material',
    body: 'Full composition is declared — species for wood and resin, alloy for metal, pigment for lacquer and ink. Nothing is summarised as "traditional materials".',
  },
  {
    title: 'Laboratory testing',
    body: 'Testing is done at an ISO/IEC 17025 accredited laboratory. The report number appears on the product page so you can request the full report from us before ordering.',
  },
  {
    title: 'CITES status',
    body: 'Sandalwood, red sandalwood and agarwood are listed under CITES Appendix II and travel with export certificates, including when plantation-grown. Where a species cannot be certified, we do not list it.',
  },
  {
    title: 'Consecration',
    body: 'Where an object has been ritually prepared, we name the lineage, the practitioner and the date, and print the certificate number. We do not describe the effect of a rite, only that it was performed.',
  },
  {
    title: 'Heavy metals',
    body: 'Items containing cinnabar or other regulated materials are sealed against skin contact and are not sold as wearable. They carry a heavy-metal assay and are marked as display pieces.',
  },
];

export default function TraceabilityPage() {
  return (
    <>
      <Nav />
      <section className="sec" style={{ paddingTop: 64 }}>
        <div className="wrap">
          <div className="eyebrow" style={{ marginBottom: 18 }}>
            Traceability
          </div>
          <h1
            className="serif"
            style={{ fontWeight: 300, fontSize: 'clamp(2.2rem, 4.4vw, 3.4rem)', lineHeight: 1.1, marginBottom: 24 }}
          >
            How to know what<br />
            <em>you are holding.</em>
          </h1>
          <p style={{ fontSize: 15, color: 'var(--ash)', maxWidth: 560, lineHeight: 1.8, marginBottom: 56 }}>
            Most sellers of Daoist objects online will not tell you where the material came from, what
            the metal contains, or who consecrated it. This page sets out what we publish on every
            product — and how you can check it rather than take our word.
          </p>

          <div className="std-grid">
            {STANDARDS.map((s, i) => (
              <div key={s.title} className="std-card">
                <div className="std-num">{String(i + 1).padStart(2, '0')}</div>
                <h2 className="serif">{s.title}</h2>
                <p>{s.body}</p>
              </div>
            ))}
          </div>

          <div className="card" style={{ marginTop: 56, padding: '28px 32px' }}>
            <h2 className="serif" style={{ fontWeight: 400, fontSize: 22, marginBottom: 10 }}>
              Checking a claim
            </h2>
            <p style={{ fontSize: 13.5, color: '#4A443C', lineHeight: 1.8, marginBottom: 16 }}>
              Every product page carries the maker, the region, the material breakdown, the laboratory
              report number, the CITES status and the consecration certificate where one applies. If a
              claim on this site is not reflected on a product page, treat that as an error and write
              to us — we will correct it or withdraw the product.
            </p>
            <Link className="link-more" href="/contact">
              Report a discrepancy →
            </Link>
          </div>
        </div>
      </section>
      <Footer />
    </>
  );
}
