import { put } from '@vercel/blob';
import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'edge';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const folder = formData.get('folder') as string || 'uploads';

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      );
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json(
        { error: 'File too large. Maximum size is 5MB.' },
        { status: 400 }
      );
    }

    // Check if we're in development and Vercel Blob is not configured
    const blobToken = process.env.BLOB_READ_WRITE_TOKEN;
    if (!blobToken || blobToken === 'vercel_blob_rw_placeholder_token_here') {
      // Development fallback: return a mock URL
      console.warn('Vercel Blob not configured, returning mock URL for development');
      const mockUrl = `https://mock-storage.example.com/${folder}/${Date.now()}-${file.name}`;
      return NextResponse.json({
        url: mockUrl,
        pathname: `/${folder}/${Date.now()}-${file.name}`,
        isMock: true
      });
    }

    // Create a unique filename
    const filename = `${folder}/${Date.now()}-${file.name}`;

    // Upload to Vercel Blob
    const blob = await put(filename, file, {
      access: 'public',
    });

    return NextResponse.json({
      url: blob.url,
      pathname: blob.pathname,
    });
  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json(
      { error: 'Upload failed' },
      { status: 500 }
    );
  }
}
