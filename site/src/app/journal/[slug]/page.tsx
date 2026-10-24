import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Nav } from '@/components/Nav';
import { Footer } from '@/components/Footer';
import { getNavStrings, getFooterStrings, getUi, localizePost } from '@/lib/i18n';
import { POSTS } from '@/data/posts';
import { toTraditional } from '@/lib/i18n/convert';

export function generateStaticParams() {
  return Object.keys(POSTS).map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const post = POSTS[slug];
  if (!post) return { title: 'Entry not found' };
  return {
    title: post.title,
    description: post.body[0].slice(0, 155),
    alternates: { canonical: `/journal/${slug}` },
    openGraph: { type: 'article', title: post.title, images: [{ url: post.image }] },
  };
}

export default async function JournalPost({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const base = POSTS[slug];
  if (!base) notFound();

  const { locale, t } = await getUi();
  const navStrings = await getNavStrings();
  const footerStrings = await getFooterStrings();
  const post = await localizePost(base, slug);

  return (
    <>
      <Nav strings={navStrings} />
      <article className="sec" style={{ paddingTop: 56 }}>
        <div className="wrap" style={{ maxWidth: 720 }}>
          <Link href="/journal" className="eyebrow" style={{ display: 'inline-block', marginBottom: 28 }}>
            {t('← Journal', '← 札记')}
          </Link>
          <div className="journal-meta">
            {locale === 'en' ? post.category : toTraditional(post.category)} · {post.minutes} min
          </div>
          <h1 className="serif" style={{ fontWeight: 300, fontSize: 'clamp(1.9rem, 3.8vw, 2.9rem)', lineHeight: 1.15, margin: '10px 0 32px' }}>
            {post.title}
          </h1>
          <div style={{ marginBottom: 40, overflow: 'hidden', background: '#EFEBE1', aspectRatio: '16 / 9' }}>
            <img src={post.image} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          </div>
          {post.body.map((para, i) => (
            <p key={i} style={{ fontSize: 15.5, lineHeight: 1.85, color: '#3A352E', marginBottom: 20 }}>
              {para}
            </p>
          ))}
        </div>
      </article>
      <Footer strings={footerStrings} />
    </>
  );
}
