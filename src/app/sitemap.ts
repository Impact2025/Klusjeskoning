import { MetadataRoute } from 'next';
import { fetchPublishedBlogPosts } from '@/lib/content';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = 'https://klusjeskoningapp.nl';

  // Static pages
  const staticPages: MetadataRoute.Sitemap = [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 1,
    },
    {
      url: `${baseUrl}/blog`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/handleidingen`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.7,
    },
    {
      url: `${baseUrl}/reviews`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.6,
    },
  ];

  // Dynamic blog posts
  let blogPosts: MetadataRoute.Sitemap = [];
  try {
    const posts = await fetchPublishedBlogPosts();
    blogPosts = posts.map((post) => ({
      url: `${baseUrl}/blog/${post.slug}`,
      lastModified: (post.publishedAt ?? post.createdAt).toDate(),
      changeFrequency: 'monthly' as const,
      priority: 0.6,
    }));
  } catch (error) {
    console.error('Failed to fetch blog posts for sitemap:', error);
  }

  return [...staticPages, ...blogPosts];
}
