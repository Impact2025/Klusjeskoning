import { Metadata } from 'next';

export function createMetadata({
  title,
  description,
  path = '',
  images,
  type = 'website',
}: {
  title: string;
  description: string;
  path?: string;
  images?: { url: string; width?: number; height?: number; alt?: string }[];
  type?: 'website' | 'article';
}): Metadata {
  const url = `https://klusjeskoningapp.nl${path}`;
  const defaultImage = {
    url: 'https://weareimpact.nl/LogoKlusjeskoning3.png',
    width: 1200,
    height: 630,
    alt: 'KlusjesKoning Logo',
  };

  const ogImages = images || [defaultImage];

  return {
    title,
    description,
    openGraph: {
      type,
      locale: 'nl_NL',
      url,
      siteName: 'KlusjesKoning',
      title,
      description,
      images: ogImages,
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: ogImages.map((img) => img.url),
      creator: '@weareimpact',
    },
    alternates: {
      canonical: url,
    },
  };
}
