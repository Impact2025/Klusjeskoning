'use client';

import { useState, useEffect, useMemo } from 'react';
import { calculateReadingTime } from '@/lib/blog-utils';
import { Badge } from '@/components/ui/badge';
import Image from 'next/image';
import Link from 'next/link';
import { format } from 'date-fns';
import { nl } from 'date-fns/locale';
import { BlogFilters } from '@/components/blog/BlogFilters';
import { NewsletterSignup } from '@/components/blog/NewsletterSignup';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Clock, TrendingUp, Eye } from 'lucide-react';


type BlogPostWithReadingTime = {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  coverImageUrl?: string | null;
  tags: string[];
  status: string;
  seoTitle?: string | null;
  seoDescription?: string | null;
  createdAt: any;
  updatedAt: any;
  publishedAt?: any | null;
  readingTime: number;
};

export default function BlogPage() {
  const [posts, setPosts] = useState<BlogPostWithReadingTime[]>([]);
  const [availableTags, setAvailableTags] = useState<Array<{ tag: string; count: number }>>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  // Load initial data
  useEffect(() => {
    const loadData = async () => {
      try {
        const response = await fetch('/api/blog');
        if (!response.ok) {
          throw new Error('Failed to fetch blog data');
        }

        const { posts: postsData, tags: tagsData } = await response.json();

        const postsWithReadingTime: BlogPostWithReadingTime[] = postsData.map((post: any) => ({
          ...post,
          createdAt: new Date(post.createdAt),
          updatedAt: new Date(post.updatedAt),
          publishedAt: post.publishedAt ? new Date(post.publishedAt) : null,
          readingTime: calculateReadingTime(post.content),
        }));

        setPosts(postsWithReadingTime);
        setAvailableTags(tagsData);
      } catch (error) {
        console.error('Error loading blog data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  // Filter posts based on search and tags
  const filteredPosts = useMemo(() => {
    if (!searchQuery.trim() && selectedTags.length === 0) {
      return posts;
    }
    return posts.filter(post => {
      // Search filter
      const matchesSearch = !searchQuery.trim() ||
        post.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        post.excerpt.toLowerCase().includes(searchQuery.toLowerCase()) ||
        post.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));

      // Tag filter
      const matchesTags = selectedTags.length === 0 ||
        selectedTags.some(selectedTag =>
          post.tags.some(postTag =>
            postTag.toLowerCase() === selectedTag.toLowerCase()
          )
        );

      return matchesSearch && matchesTags;
    });
  }, [posts, searchQuery, selectedTags]);

  // Get featured/most read posts (first 3 for demo)
  const featuredPosts = filteredPosts.slice(0, 3);
  const regularPosts = filteredPosts.slice(3);

  const handleSearchChange = (query: string) => {
    setSearchQuery(query);
  };

  const handleTagToggle = (tag: string) => {
    setSelectedTags(prev =>
      prev.includes(tag)
        ? prev.filter(t => t !== tag)
        : [...prev, tag]
    );
  };

  const handleClearFilters = () => {
    setSearchQuery('');
    setSelectedTags([]);
  };

  if (loading) {
    return (
      <div className="relative overflow-hidden bg-gradient-to-br from-white via-sky-50 to-amber-50">
        <div className="mx-auto flex max-w-7xl flex-col gap-16 px-6 py-16 sm:px-10">
          <div className="text-center">
            <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
            <p className="mt-4 text-slate-600">Blog artikelen laden...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white overflow-hidden">
        <div className="absolute inset-0 opacity-20">
          <div className="absolute inset-0 bg-gradient-to-r from-slate-900/50 to-slate-800/50"></div>
        </div>
        <div className="relative mx-auto max-w-7xl px-6 py-24 sm:px-10 lg:py-32">
          <div className="text-center space-y-8">
            <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm rounded-full px-4 py-2 text-sm font-medium">
              <span className="w-2 h-2 bg-primary rounded-full animate-pulse"></span>
              KlusjesKoning Blog
            </div>
            <h1 className="font-brand text-5xl leading-tight text-white sm:text-6xl lg:text-7xl">
              Inspiratie & Expertise
              <span className="block text-primary">voor Moderne Gezinnen</span>
            </h1>
            <p className="mx-auto max-w-3xl text-xl text-slate-300 leading-relaxed">
              Ontdek evidence-based strategieën, praktische tips en inspirerende verhalen van gezinnen die gamification gebruiken voor een harmonieus huishouden.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center pt-8">
              <Link
                href="#articles"
                className="bg-primary hover:bg-primary/90 text-white px-8 py-4 rounded-xl font-semibold text-lg transition-all duration-200 hover:shadow-lg hover:scale-105"
              >
                Artikelen Bekijken
              </Link>
              <Link
                href="#newsletter"
                className="bg-white/10 hover:bg-white/20 backdrop-blur-sm text-white px-8 py-4 rounded-xl font-semibold text-lg transition-all duration-200 border border-white/20"
              >
                Abonneren op Updates
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <div className="mx-auto max-w-7xl px-6 py-16 sm:px-10">
        <div className="grid gap-16 lg:grid-cols-[1fr_320px]">

          {/* Main Content */}
          <main className="space-y-12" id="articles">

            {/* Search and Filters */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8">
              <BlogFilters
                searchQuery={searchQuery}
                selectedTags={selectedTags}
                availableTags={availableTags}
                onSearchChange={handleSearchChange}
                onTagToggle={handleTagToggle}
                onClearFilters={handleClearFilters}
                totalResults={filteredPosts.length}
              />
            </div>

            {/* Featured Posts */}
            {featuredPosts.length > 0 && (
              <section className="space-y-8">
                <div className="flex items-center gap-3">
                  <div className="w-1 h-8 bg-primary rounded-full"></div>
                  <h2 className="text-3xl font-bold text-slate-900">Uitgelichte Artikelen</h2>
                </div>

                <div className="grid gap-8 md:grid-cols-3">
                  {featuredPosts.map((post, index) => {
                    const displayDate = post.publishedAt ?? post.createdAt;
                    const hasCover = Boolean(post.coverImageUrl);
                    const formattedDate = displayDate instanceof Date && !isNaN(displayDate.getTime())
                      ? format(displayDate, 'd MMM yyyy', { locale: nl })
                      : 'Onbekende datum';

                    return (
                      <article key={post.id} className="group bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden hover:shadow-xl transition-all duration-300 hover:-translate-y-2">
                        <div className="relative h-64 w-full overflow-hidden">
                          {hasCover ? (
                            <Image
                              src={post.coverImageUrl!}
                              alt={post.title}
                              fill
                              className="object-cover transition duration-500 group-hover:scale-110"
                              sizes="(min-width: 768px) 33vw, 100vw"
                              priority={index < 2}
                            />
                          ) : (
                            <div className="absolute inset-0 flex items-center justify-center text-5xl bg-gradient-to-br from-primary/10 to-amber-50">
                              📝
                            </div>
                          )}
                          <div className="absolute top-4 left-4">
                            <span className="bg-white/95 backdrop-blur-sm text-slate-900 px-3 py-1 rounded-full text-xs font-semibold">
                              Uitgelicht
                            </span>
                          </div>
                          <div className="absolute bottom-4 left-4 right-4">
                            <div className="flex items-center gap-3 text-white/90 text-sm">
                              <span>{formattedDate}</span>
                              <span>•</span>
                              <div className="flex items-center gap-1">
                                <Clock className="h-4 w-4" />
                                <span>{post.readingTime} min</span>
                              </div>
                            </div>
                          </div>
                        </div>

                        <div className="p-6">
                          <h3 className="text-xl font-bold text-slate-900 mb-3 group-hover:text-primary transition-colors line-clamp-2">
                            {post.title}
                          </h3>

                          <p className="text-slate-600 mb-4 line-clamp-3">{post.excerpt}</p>

                          <div className="flex items-center justify-between">
                            <div className="flex flex-wrap gap-2">
                              {post.tags.slice(0, 2).map((tag) => (
                                <span key={tag} className="bg-primary/10 text-primary px-2 py-1 rounded-md text-xs font-medium">
                                  #{tag}
                                </span>
                              ))}
                            </div>

                            <Link
                              href={`/blog/${post.slug}`}
                              className="text-primary font-semibold hover:text-primary/80 transition-colors flex items-center gap-1"
                            >
                              Lees meer
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                              </svg>
                            </Link>
                          </div>
                        </div>
                      </article>
                    );
                  })}
                </div>
              </section>
            )}

            {/* Regular Posts */}
            <section className="space-y-8">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-slate-900">Alle Artikelen</h2>
                <span className="text-slate-600 text-sm">
                  {filteredPosts.length} artikel{filteredPosts.length !== 1 ? 'en' : ''}
                </span>
              </div>

              {regularPosts.length > 0 ? (
                <div className="grid gap-8 md:grid-cols-2">
                  {regularPosts.map((post) => {
                    const displayDate = post.publishedAt ?? post.createdAt;
                    const hasCover = Boolean(post.coverImageUrl);
                    const formattedDate = displayDate instanceof Date && !isNaN(displayDate.getTime())
                      ? format(displayDate, 'dd MMM yyyy', { locale: nl })
                      : 'Onbekende datum';

                    return (
                      <article
                        key={post.id}
                        className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden hover:shadow-lg transition-all duration-300 hover:-translate-y-1"
                      >
                        <Link href={`/blog/${post.slug}`} className="block">
                          <div className="relative h-48 w-full overflow-hidden bg-gradient-to-br from-primary/5 to-amber-50">
                            {hasCover ? (
                              <Image
                                src={post.coverImageUrl!}
                                alt={post.title}
                                fill
                                className="object-cover transition duration-300 hover:scale-105"
                                sizes="(min-width: 768px) 50vw, 100vw"
                                loading="lazy"
                              />
                            ) : (
                              <div className="absolute inset-0 flex items-center justify-center text-4xl text-slate-400">
                                📝
                              </div>
                            )}
                          </div>
                        </Link>

                        <div className="p-6">
                          <div className="flex items-center gap-3 text-xs text-slate-500 mb-3">
                            <span>{formattedDate}</span>
                            <span>•</span>
                            <div className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              <span>{post.readingTime} min</span>
                            </div>
                          </div>

                          <Link href={`/blog/${post.slug}`}>
                            <h3 className="text-xl font-bold text-slate-900 mb-3 hover:text-primary transition-colors line-clamp-2">
                              {post.title}
                            </h3>
                          </Link>

                          <p className="text-slate-600 mb-4 line-clamp-3">{post.excerpt}</p>

                          <div className="flex items-center justify-between">
                            <div className="flex flex-wrap gap-2">
                              {post.tags.slice(0, 3).map((tag) => (
                                <span key={tag} className="bg-slate-100 text-slate-700 px-2 py-1 rounded-md text-xs font-medium">
                                  #{tag}
                                </span>
                              ))}
                            </div>

                            <Link
                              href={`/blog/${post.slug}`}
                              className="text-primary font-semibold hover:text-primary/80 transition-colors"
                            >
                              Lees meer →
                            </Link>
                          </div>
                        </div>
                      </article>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-16 bg-white rounded-xl border border-slate-200">
                  <div className="text-6xl mb-4">🔍</div>
                  <h3 className="text-xl font-semibold text-slate-900 mb-2">Geen artikelen gevonden</h3>
                  <p className="text-slate-600 mb-6">Probeer andere zoektermen of filters.</p>
                  <button
                    onClick={handleClearFilters}
                    className="bg-primary hover:bg-primary/90 text-white px-6 py-3 rounded-lg font-semibold transition-colors"
                  >
                    Filters Wissen
                  </button>
                </div>
              )}
            </section>
          </main>

          {/* Sidebar */}
          <aside className="space-y-8">

            {/* Newsletter Signup */}
            <div id="newsletter">
              <NewsletterSignup />
            </div>

            {/* Popular Tags */}
            {availableTags.length > 0 && (
              <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
                  <Eye className="h-5 w-5 text-primary" />
                  Populaire Tags
                </h3>
                <div className="flex flex-wrap gap-2">
                  {availableTags.slice(0, 15).map(({ tag, count }) => (
                    <button
                      key={tag}
                      onClick={() => handleTagToggle(tag)}
                      className={`inline-flex items-center rounded-full px-3 py-2 text-sm font-medium transition-all ${
                        selectedTags.includes(tag)
                          ? 'bg-primary text-white shadow-md'
                          : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                      }`}
                    >
                      #{tag}
                      <span className="ml-1 text-xs opacity-75">({count})</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Most Read Articles */}
            {posts.length > 3 && (
              <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-primary" />
                  Meest Gelezen
                </h3>
                <div className="space-y-4">
                  {posts.slice(0, 6).map((post, index) => (
                    <div key={post.id} className="flex items-start gap-3 pb-4 border-b border-slate-100 last:border-b-0 last:pb-0">
                      <span className="flex-shrink-0 w-6 h-6 bg-primary text-white rounded-full flex items-center justify-center text-xs font-bold">
                        {index + 1}
                      </span>
                      <div className="flex-1 min-w-0">
                        <Link
                          href={`/blog/${post.slug}`}
                          className="font-semibold text-slate-900 hover:text-primary transition-colors line-clamp-2 block"
                        >
                          {post.title}
                        </Link>
                        <div className="flex items-center gap-2 text-xs text-slate-500 mt-1">
                          <span>
                            {(() => {
                              const date = post.publishedAt ?? post.createdAt;
                              return date instanceof Date && !isNaN(date.getTime())
                                ? format(date, 'd MMM', { locale: nl })
                                : 'Onbekend';
                            })()}
                          </span>
                          <span>•</span>
                          <div className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            <span>{post.readingTime} min</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* About Section */}
            <div className="bg-gradient-to-br from-primary/5 to-amber-50 rounded-xl p-6 border border-primary/10">
              <h3 className="text-lg font-bold text-slate-900 mb-3">Over KlusjesKoning</h3>
              <p className="text-slate-600 text-sm leading-relaxed mb-4">
                Wij helpen gezinnen om gamification te gebruiken voor een harmonieus huishouden.
                Met onze app maken klusjes doen leuk en belonend voor het hele gezin.
              </p>
              <Link
                href="/"
                className="inline-flex items-center gap-2 text-primary font-semibold hover:text-primary/80 transition-colors"
              >
                Meer over ons
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </Link>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
