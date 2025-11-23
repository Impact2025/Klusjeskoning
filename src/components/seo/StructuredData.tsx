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

export function ProductSchema() {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: 'KlusjesKoning App',
    description: 'Gamified klusjes app voor gezinnen met punten, beloningen en goede doelen ondersteuning',
    brand: {
      '@type': 'Brand',
      name: 'KlusjesKoning',
    },
    offers: [
      {
        '@type': 'Offer',
        name: 'Gratis Starter Plan',
        price: '0',
        priceCurrency: 'EUR',
        availability: 'https://schema.org/InStock',
        description: 'Max. 2 kinderen, 10 klusjes per maand, basis dashboard',
      },
      {
        '@type': 'Offer',
        name: 'Premium Gezin+ Plan',
        price: '4.99',
        priceCurrency: 'EUR',
        availability: 'https://schema.org/InStock',
        description: 'Onbeperkte kinderen & klusjes, AI-assistent, virtueel huisdier & badges',
      },
    ],
    aggregateRating: {
      '@type': 'AggregateRating',
      ratingValue: '4.9',
      reviewCount: '150',
    },
    applicationCategory: 'LifestyleApplication',
  };

  return <StructuredData data={schema} />;
}

export function FAQSchema() {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: [
      {
        '@type': 'Question',
        name: 'Hoe werkt KlusjesKoning?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'KlusjesKoning maakt klusjes leuk door ze om te zetten in een spel. Kinderen verdienen punten voor voltooide taken, sparen voor beloningen en kunnen zelfs doneren aan goede doelen.',
        },
      },
      {
        '@type': 'Question',
        name: 'Is KlusjesKoning gratis?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Ja! KlusjesKoning heeft een gratis starter plan waarmee gezinnen direct kunnen beginnen. Voor geavanceerde functies is er een betaald Premium plan beschikbaar.',
        },
      },
      {
        '@type': 'Question',
        name: 'Voor welke leeftijd is de app geschikt?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'KlusjesKoning is geschikt voor kinderen vanaf ongeveer 6 jaar. Ouders beheren de app volledig en kunnen taken aanpassen aan de leeftijd en mogelijkheden van hun kinderen.',
        },
      },
      {
        '@type': 'Question',
        name: 'Kan ik mijn kinderen betalingen geven voor klusjes?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Ja! Naast privileges en ervaringen kunnen ouders ook geldelijke beloningen instellen. Dit helpt kinderen te leren over sparen en de waarde van werk.',
        },
      },
    ],
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
