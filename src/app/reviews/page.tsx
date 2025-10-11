import { fetchPublishedReviews } from '@/lib/content';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import { format } from 'date-fns';
import { nl } from 'date-fns/locale';

export const metadata = {
  title: 'Reviews - Ervaringen van Gezinnen',
  description: 'Lees ervaringen van gezinnen die KlusjesKoning gebruiken en laat je inspireren. Van eerste klusjes tot grote beloningen.',
  openGraph: {
    title: 'KlusjesKoning Reviews - Ervaringen van Gezinnen',
    description: 'Van eerste klusjes tot grote beloningen: ontdek hoe andere gezinnen hun routine omtoveren tot spel.',
    images: [
      {
        url: 'https://weareimpact.nl/LogoKlusjeskoning3.png',
        width: 1200,
        height: 630,
        alt: 'KlusjesKoning Reviews',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'KlusjesKoning Reviews',
    description: 'Lees ervaringen van gezinnen met KlusjesKoning',
  },
};

export default async function ReviewsPage() {
  const reviews = await fetchPublishedReviews();

  return (
    <div className="relative overflow-hidden bg-gradient-to-br from-white via-slate-50 to-primary/5">
      <div className="mx-auto flex max-w-5xl flex-col gap-12 px-6 py-16 sm:px-10">
        <header className="space-y-4 text-center">
          <Badge className="mx-auto bg-amber-200 text-amber-900">Reviews</Badge>
          <h1 className="font-brand text-4xl leading-tight text-slate-900 sm:text-5xl">Ervaringen van gezinnen met KlusjesKoning</h1>
          <p className="mx-auto max-w-3xl text-lg text-slate-600 sm:text-xl">
            Van eerste klusjes tot grote beloningen: ontdek hoe andere gezinnen hun routine omtoveren tot spel.
          </p>
        </header>

        {reviews.length === 0 ? (
          <p className="mx-auto max-w-2xl rounded-2xl border border-dashed border-amber-300 bg-white/80 p-8 text-center text-slate-600">
            Nog geen reviews gepubliceerd. Binnenkort delen we de eerste ervaringen!
          </p>
        ) : (
          <div className="grid gap-6">
            {reviews.map((review) => {
              const displayDate = (review.publishedAt ?? review.createdAt).toDate();
              return (
                <Link
                  key={review.id}
                  href={`/reviews/${review.slug}`}
                  className="group rounded-3xl border border-white/60 bg-white/90 p-6 shadow-md transition hover:-translate-y-1 hover:shadow-xl"
                >
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="space-y-2">
                      <div className="flex flex-wrap items-center gap-3 text-sm text-slate-500">
                        <span>{format(displayDate, 'd MMMM yyyy', { locale: nl })}</span>
                        <span>•</span>
                        <span>{review.author}</span>
                      </div>
                      <h2 className="text-2xl font-semibold text-slate-900 group-hover:text-primary">{review.title}</h2>
                      <p className="text-base text-slate-600">{review.excerpt}</p>
                    </div>
                    <div className="self-start rounded-full bg-amber-100 px-4 py-2 text-sm font-semibold text-amber-700">
                      ★ {review.rating.toFixed(1)} / 5
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
