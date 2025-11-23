import { NextResponse } from 'next/server';
import { fetchPublishedBlogPosts, getAllBlogTags } from '@/lib/content';

export async function GET() {
  try {
    const [posts, tags] = await Promise.all([
      fetchPublishedBlogPosts(),
      getAllBlogTags()
    ]);

    return NextResponse.json({
      posts,
      tags,
    });
  } catch (error) {
    console.error('Error fetching blog data:', error);
    return NextResponse.json(
      { error: 'Failed to fetch blog data' },
      { status: 500 }
    );
  }
}