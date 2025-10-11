import Script from 'next/script';

type StructuredDataProps = {
  data: Record<string, unknown>;
};

export function StructuredData({ data }: StructuredDataProps) {
  return (
    <Script
      id="structured-data"
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}

export function OrganizationSchema() {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'KlusjesKoning',
    alternateName: 'Klusjes Koning App',
    url: 'https://klusjeskoningapp.nl',
    logo: 'https://weareimpact.nl/LogoKlusjeskoning3.png',
    description: 'De leukste manier om klusjes te doen! Een mobiele app voor gezinnen die samenwerken, sparen voor beloningen en zelfs goede doelen ondersteunen.',
    founder: {
      '@type': 'Person',
      name: 'Vincent van Munster',
      jobTitle: 'Oprichter',
    },
    sameAs: [
      'https://weareimpact.nl',
    ],
    contactPoint: {
      '@type': 'ContactPoint',
      contactType: 'Customer Support',
      email: 'info@klusjeskoningapp.nl',
    },
  };

  return <StructuredData data={schema} />;
}

export function WebApplicationSchema() {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'WebApplication',
    name: 'KlusjesKoning',
    url: 'https://klusjeskoningapp.nl',
    applicationCategory: 'LifestyleApplication',
    operatingSystem: 'Web Browser',
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'EUR',
    },
    aggregateRating: {
      '@type': 'AggregateRating',
      ratingValue: '4.9',
      ratingCount: '150',
    },
  };

  return <StructuredData data={schema} />;
}

type BreadcrumbItem = {
  name: string;
  url: string;
};

export function BreadcrumbSchema({ items }: { items: BreadcrumbItem[] }) {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: item.url,
    })),
  };

  return <StructuredData data={schema} />;
}
