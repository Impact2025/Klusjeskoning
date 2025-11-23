import 'server-only';

import { listBlogPosts, listReviews } from '@/server/services/family-service';
import { mapBlogPost, mapReview } from '@/lib/api/app-client';
import type { BlogPost, Review } from './types';

const sortByPublishedDate = <T extends { publishedAt?: string | null; createdAt: string | null }>(items: T[]) =>
  [...items].sort((a, b) => {
    const aDate = a.publishedAt ?? a.createdAt ?? null;
    const bDate = b.publishedAt ?? b.createdAt ?? null;
    const aTime = aDate ? new Date(aDate).getTime() : 0;
    const bTime = bDate ? new Date(bDate).getTime() : 0;
    return bTime - aTime;
  });

export async function fetchPublishedBlogPosts(): Promise<BlogPost[]> {
  try {
    // Check if DATABASE_URL is configured
    if (!process.env.DATABASE_URL) {
      console.warn('DATABASE_URL not configured, skipping blog posts');
      return [];
    }
    const posts = await listBlogPosts();
    const serializable = sortByPublishedDate(posts.filter((post) => post.status === 'published'));
    return serializable.map(mapBlogPost);
  } catch (error) {
    console.error('Error fetching blog posts:', error);
    return [];
  }
}

export async function fetchBlogPostBySlug(slug: string): Promise<BlogPost | null> {
  try {
    if (!process.env.DATABASE_URL) {
      console.warn('DATABASE_URL not configured, skipping blog post');
      return null;
    }
    const posts = await listBlogPosts();
    const match = posts.find((post) => post.slug === slug);
    return match ? mapBlogPost(match) : null;
  } catch (error) {
    console.error('Error fetching blog post by slug:', error);
    return null;
  }
}

export async function fetchPublishedReviews(): Promise<Review[]> {
  try {
    if (!process.env.DATABASE_URL) {
      console.warn('DATABASE_URL not configured, skipping reviews');
      return [];
    }
    const reviews = await listReviews();
    const serializable = sortByPublishedDate(reviews.filter((review) => review.status === 'published'));
    return serializable.map(mapReview);
  } catch (error) {
    console.error('Error fetching reviews:', error);
    return [];
  }
}

export async function fetchReviewBySlug(slug: string): Promise<Review | null> {
  try {
    if (!process.env.DATABASE_URL) {
      console.warn('DATABASE_URL not configured, skipping review');
      return null;
    }
    const reviews = await listReviews();
    const match = reviews.find((review) => review.slug === slug);
    return match ? mapReview(match) : null;
  } catch (error) {
    console.error('Error fetching review by slug:', error);
    return null;
  }
}

// Calculate reading time based on content
export function calculateReadingTime(content: string): number {
  const wordsPerMinute = 200; // Average reading speed
  const words = content.replace(/<[^>]*>/g, '').split(/\s+/).length;
  const readingTime = Math.ceil(words / wordsPerMinute);
  return Math.max(1, readingTime); // Minimum 1 minute
}

// Get all unique tags from blog posts
export async function getAllBlogTags(): Promise<Array<{ tag: string; count: number }>> {
  try {
    const posts = await fetchPublishedBlogPosts();
    const tagCount = new Map<string, number>();

    posts.forEach(post => {
      post.tags.forEach(tag => {
        const normalizedTag = tag.trim().toLowerCase();
        if (normalizedTag) {
          tagCount.set(normalizedTag, (tagCount.get(normalizedTag) || 0) + 1);
        }
      });
    });

    return Array.from(tagCount.entries())
      .map(([tag, count]) => ({ tag, count }))
      .sort((a, b) => b.count - a.count);
  } catch (error) {
    console.error('Error getting blog tags:', error);
    return [];
  }
}

// Filter blog posts by search query and tags
export async function filterBlogPosts(
  searchQuery?: string,
  selectedTags?: string[]
): Promise<BlogPost[]> {
  try {
    let posts = await fetchPublishedBlogPosts();

    // Filter by search query
    if (searchQuery && searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      posts = posts.filter(post =>
        post.title.toLowerCase().includes(query) ||
        post.excerpt.toLowerCase().includes(query) ||
        post.tags.some(tag => tag.toLowerCase().includes(query))
      );
    }

    // Filter by selected tags
    if (selectedTags && selectedTags.length > 0) {
      posts = posts.filter(post =>
        selectedTags.some(selectedTag =>
          post.tags.some(postTag =>
            postTag.toLowerCase() === selectedTag.toLowerCase()
          )
        )
      );
    }

    return posts;
  } catch (error) {
    console.error('Error filtering blog posts:', error);
    return [];
  }
}

// Get related posts based on tags
export async function getRelatedPosts(currentPostId: string, limit: number = 3): Promise<BlogPost[]> {
  try {
    const allPosts = await fetchPublishedBlogPosts();
    const currentPost = allPosts.find(post => post.id === currentPostId);

    if (!currentPost) return [];

    // Find posts with similar tags
    const relatedPosts = allPosts
      .filter(post => post.id !== currentPostId)
      .map(post => {
        const commonTags = post.tags.filter(tag =>
          currentPost.tags.some(currentTag =>
            currentTag.toLowerCase() === tag.toLowerCase()
          )
        );
        return {
          ...post,
          relevanceScore: commonTags.length
        };
      })
      .filter(post => post.relevanceScore > 0)
      .sort((a, b) => b.relevanceScore - a.relevanceScore)
      .slice(0, limit);

    return relatedPosts;
  } catch (error) {
    console.error('Error getting related posts:', error);
    return [];
  }
}