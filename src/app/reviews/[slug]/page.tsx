import { fetchReviewBySlug } from '@/lib/content';
import { Badge } from '@/components/ui/badge';
import { notFound } from 'next/navigation';
import { format } from 'date-fns';
import { nl } from 'date-fns/locale';
import type { Metadata } from 'next';

type ReviewPageProps = {
  params: Promise<{ slug: string }>;
};

export const revalidate = 300;

export async function generateMetadata({ params }: ReviewPageProps): Promise<Metadata> {
  const { slug } = await params;
  const review = await fetchReviewBySlug(slug);
  if (!review || review.status !== 'published') {
    return { title: 'Review niet gevonden | KlusjesKoning' };
  }

  return {
    title: review.seoTitle ?? review.title,
    description: review.seoDescription ?? review.excerpt,
    alternates: {
      canonical: `/reviews/${review.slug}`,
    },
  };
}

export default async function ReviewPage({ params }: ReviewPageProps) {
  const { slug } = await params;
  const review = await fetchReviewBySlug(slug);

  if (!review || review.status !== 'published') {
    notFound();
  }

  const publishedDate = (review.publishedAt ?? review.createdAt).toDate();
  const paragraphs = review.content.split(/\n{2,}/).map((block) => block.trim()).filter(Boolean);

  return (
    <article className="relative overflow-hidden bg-gradient-to-br from-white via-amber-50 to-primary/10">
      <div className="mx-auto flex max-w-3xl flex-col gap-8 px-6 py-16 sm:px-10">
        <header className="space-y-4 text-center">
          <div className="flex flex-wrap justify-center gap-3 text-sm text-slate-500">
            <span>{format(publishedDate, 'd MMMM yyyy', { locale: nl })}</span>
            <Badge className="bg-amber-200 text-amber-900">★ {review.rating.toFixed(1)} / 5</Badge>
          </div>
          <h1 className="font-brand text-4xl leading-tight text-slate-900 sm:text-5xl">{review.title}</h1>
          <p className="text-lg text-slate-600">{review.excerpt}</p>
          <p className="text-sm font-semibold uppercase tracking-wide text-primary">Door {review.author}</p>
        </header>

        <div className="space-y-6 text-left text-slate-700">
          {paragraphs.map((paragraph, index) => (
            <p key={index} className="text-lg leading-relaxed">
              {paragraph}
            </p>
          ))}
        </div>
      </div>
    </article>
  );
}
