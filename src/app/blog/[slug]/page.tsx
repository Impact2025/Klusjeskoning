import Link from 'next/link';
import Image from 'next/image';
import { format } from 'date-fns';
import { nl } from 'date-fns/locale';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { fetchBlogPostBySlug, fetchPublishedBlogPosts } from '@/lib/content';

const formatDate = (date: Date) => format(date, 'd MMM yyyy', { locale: nl });
const hasValidImageUrl = (url?: string | null) => {
  if (!url) return false;
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
};

type BlogPostParams = {
  slug: string;
};

export const revalidate = 300;

export async function generateMetadata({ params }: { params: Promise<BlogPostParams> }): Promise<Metadata> {
  const { slug } = await params;
  const post = await fetchBlogPostBySlug(slug);
  if (!post || post.status !== 'published') {
    return {
      title: 'Artikel niet gevonden | KlusjesKoning',
    };
  }

  return {
    title: post.seoTitle ?? post.title,
    description: post.seoDescription ?? post.excerpt,
    alternates: {
      canonical: `/blog/${post.slug}`,
    },
  };
}

export default async function BlogPostPage({ params }: { params: Promise<BlogPostParams> }) {
  const { slug } = await params;
  const post = await fetchBlogPostBySlug(slug);

  if (!post || post.status !== 'published') {
    notFound();
  }

  const publishedDate = (post.publishedAt ?? post.createdAt).toDate();

  const allPosts = await fetchPublishedBlogPosts();
  const otherPosts = allPosts.filter((candidate) => candidate.id !== post.id);
  const mostReadPosts = otherPosts.slice(0, 3);
  const latestPosts = otherPosts.slice(0, 3);

  const tagFrequency = otherPosts.reduce<Map<string, number>>((acc, current) => {
    current.tags.forEach((tag) => {
      const normalized = tag.trim();
      if (!normalized) return;
      acc.set(normalized, (acc.get(normalized) ?? 0) + 1);
    });
    return acc;
  }, new Map());

  const tagCloud = Array.from(tagFrequency.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([label, count]) => ({ label, count }));

  return (
    <div className="relative overflow-hidden bg-gradient-to-br from-white via-amber-50 to-sky-50">
      <div className="mx-auto flex max-w-6xl flex-col gap-12 px-6 py-16 sm:px-10">
        <Button asChild variant="outline" className="w-fit rounded-full border-slate-200 bg-white text-slate-700 hover:bg-slate-100">
          <Link href="/">← Terug naar homepage</Link>
        </Button>

        <div className="grid gap-10 lg:grid-cols-[2fr_1fr]">
          <article className="flex flex-col gap-10">
            <header className="space-y-6 text-center lg:text-left">
              <div className="flex flex-wrap justify-center gap-3 text-sm text-slate-500 lg:justify-start">
                <span>{formatDate(publishedDate)}</span>
                {post.tags.map((tag) => (
                  <Badge key={tag} className="bg-primary/10 text-primary">
                    #{tag}
                  </Badge>
                ))}
              </div>
              <h1 className="font-brand text-4xl leading-snug text-slate-900 sm:text-5xl">{post.title}</h1>
              <p className="text-lg text-slate-600">{post.excerpt}</p>
            </header>

            {hasValidImageUrl(post.coverImageUrl) && (
              <div className="relative h-80 w-full overflow-hidden rounded-3xl border border-white/60 shadow-lg">
                <Image
                  src={post.coverImageUrl as string}
                  alt={post.title}
                  fill
                  className="object-cover"
                  priority
                  sizes="(min-width: 768px) 60vw, 100vw"
                />
              </div>
            )}

            <div className="prose prose-lg prose-slate max-w-none text-left">
              <div dangerouslySetInnerHTML={{ __html: post.content }} />
            </div>

            {latestPosts.length > 0 && (
              <section className="space-y-6">
                <div className="space-y-2 text-center lg:text-left">
                  <Badge className="bg-primary/10 text-primary">Nog meer lezen</Badge>
                  <h2 className="text-2xl font-semibold text-slate-900">Ontdek meer verhalen</h2>
                  <p className="text-sm text-slate-600">Deze recente artikelen sluiten aan bij het thema van KlusjesKoning.</p>
                </div>
                <div className="grid gap-6 sm:grid-cols-2">
                  {latestPosts.map((related) => {
                    const relatedDate = (related.publishedAt ?? related.createdAt).toDate();
                    const hasCover = hasValidImageUrl(related.coverImageUrl);
                    return (
                      <Card key={related.id} className="h-full overflow-hidden border-slate-100 bg-white/90 shadow-md transition hover:-translate-y-1 hover:shadow-lg">
                        <Link href={`/blog/${related.slug}`} className="flex h-full flex-col">
                          <div className="relative h-40 w-full overflow-hidden bg-gradient-to-br from-primary/10 via-slate-100 to-amber-100">
                            {hasCover ? (
                              <Image
                                src={related.coverImageUrl as string}
                                alt={related.title}
                                fill
                                className="object-cover transition duration-300 hover:scale-105"
                                sizes="(min-width: 768px) 40vw, 100vw"
                              />
                            ) : (
                              <div className="absolute inset-0 flex items-center justify-center text-3xl text-primary/60">✍️</div>
                            )}
                          </div>
                          <CardContent className="flex flex-1 flex-col gap-3 p-5">
                            <span className="text-xs uppercase tracking-wide text-slate-500">{formatDate(relatedDate)}</span>
                            <CardTitle className="text-lg text-slate-900">{related.title}</CardTitle>
                            <CardDescription className="line-clamp-3 text-sm text-slate-600">{related.excerpt}</CardDescription>
                            <span className="mt-auto text-sm font-semibold text-primary">Lees verder →</span>
                          </CardContent>
                        </Link>
                      </Card>
                    );
                  })}
                </div>
              </section>
            )}
          </article>

          <aside className="space-y-8">
            {mostReadPosts.length > 0 && (
              <Card className="border-slate-100 bg-white/90 shadow-md">
                <CardHeader>
                  <CardTitle className="text-lg text-slate-900">Meest gelezen</CardTitle>
                  <CardDescription className="text-slate-600">Populaire artikelen die je niet mag missen.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {mostReadPosts.map((item, index) => {
                    const itemDate = (item.publishedAt ?? item.createdAt).toDate();
                    return (
                      <div key={item.id} className="flex items-start gap-3">
                        <span className="mt-0.5 text-sm font-semibold text-primary">{index + 1}.</span>
                        <div className="space-y-1">
                          <Link href={`/blog/${item.slug}`} className="font-medium text-slate-900 hover:text-primary">
                            {item.title}
                          </Link>
                          <p className="text-xs text-slate-500">{formatDate(itemDate)}</p>
                        </div>
                      </div>
                    );
                  })}
                </CardContent>
              </Card>
            )}

            {tagCloud.length > 0 && (
              <Card className="border-slate-100 bg-white/90 shadow-md">
                <CardHeader>
                  <CardTitle className="text-lg text-slate-900">Tag cloud</CardTitle>
                  <CardDescription className="text-slate-600">Ontdek thema’s waar gezinnen op zoeken.</CardDescription>
                </CardHeader>
                <CardContent className="flex flex-wrap gap-2">
                  {tagCloud.map((tag) => (
                    <Link
                      key={tag.label}
                      href={`/blog?tag=${encodeURIComponent(tag.label)}`}
                      className="inline-flex items-center rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary transition hover:bg-primary/20"
                    >
                      #{tag.label}
                      <span className="ml-1 text-[10px] text-primary/70">{tag.count}</span>
                    </Link>
                  ))}
                </CardContent>
              </Card>
            )}
          </aside>
        </div>
      </div>
    </div>
  );
}
