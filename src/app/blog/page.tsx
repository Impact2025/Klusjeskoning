import { fetchPublishedBlogPosts } from '@/lib/content';
import { Badge } from '@/components/ui/badge';
import Image from 'next/image';
import Link from 'next/link';
import { format } from 'date-fns';
import { nl } from 'date-fns/locale';

export const metadata = {
  title: 'Blog - Tips & Inspiratie voor Gezinnen',
  description: 'Lees tips, inspiratie en verhalen van gezinnen die KlusjesKoning gebruiken. Ontdek praktische stappenplannen om van klusjes doen een feest te maken.',
  openGraph: {
    title: 'KlusjesKoning Blog - Tips & Inspiratie',
    description: 'Ontdek praktische tips, verhalen uit de community en handige stappenplannen om van klusjes doen een feest te maken.',
    images: [
      {
        url: 'https://weareimpact.nl/LogoKlusjeskoning3.png',
        width: 1200,
        height: 630,
        alt: 'KlusjesKoning Blog',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'KlusjesKoning Blog - Tips & Inspiratie',
    description: 'Ontdek praktische tips en verhalen van gezinnen',
  },
};

export default async function BlogPage() {
  const posts = await fetchPublishedBlogPosts();

  return (
    <div className="relative overflow-hidden bg-gradient-to-br from-white via-sky-50 to-amber-50">
      <div className="mx-auto flex max-w-6xl flex-col gap-12 px-6 py-16 sm:px-10">
        <header className="text-center space-y-4">
          <Badge className="mx-auto bg-primary/10 text-primary">Blog</Badge>
          <h1 className="font-brand text-4xl leading-tight text-slate-900 sm:text-5xl">Inspiratie voor KlusjesKoning gezinnen</h1>
          <p className="mx-auto max-w-3xl text-lg text-slate-600 sm:text-xl">
            Ontdek praktische tips, verhalen uit de community en handige stappenplannen om van klusjes doen een feest te maken.
          </p>
        </header>

        {posts.length === 0 ? (
          <p className="mx-auto max-w-2xl rounded-2xl border border-dashed border-primary/30 bg-white/70 p-8 text-center text-slate-600">
            Er zijn nog geen blogartikelen live. Kom snel terug voor nieuwe verhalen!
          </p>
        ) : (
          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {posts.map((post) => {
              const displayDate = (post.publishedAt ?? post.createdAt).toDate();
              const hasCover = Boolean(post.coverImageUrl);
              return (
                <Link key={post.id} href={`/blog/${post.slug}`} className="group flex h-full flex-col overflow-hidden rounded-3xl border border-white/60 bg-white/80 shadow-lg transition hover:-translate-y-1 hover:shadow-xl">
                  <div className="relative h-48 w-full overflow-hidden bg-gradient-to-br from-primary/10 via-slate-100 to-amber-100">
                    {hasCover ? (
                      <Image
                        src={post.coverImageUrl}
                        alt={post.title}
                        fill
                        className="object-cover transition duration-300 group-hover:scale-105"
                        sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
                      />
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center text-3xl">📝</div>
                    )}
                  </div>
                  <div className="flex flex-1 flex-col gap-4 p-6">
                    <div className="flex items-center gap-3 text-xs uppercase tracking-wide text-slate-500">
                      <span>{format(displayDate, 'dd MMM yyyy', { locale: nl })}</span>
                      {post.tags.length > 0 && (
                        <>
                          <span>•</span>
                          <span>{post.tags.slice(0, 2).join(', ')}</span>
                        </>
                      )}
                    </div>
                    <h2 className="text-xl font-semibold text-slate-900 group-hover:text-primary">{post.title}</h2>
                    <p className="text-sm text-slate-600">{post.excerpt}</p>
                    <span className="mt-auto text-sm font-semibold text-primary">
                      Lees verder →
                    </span>
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
