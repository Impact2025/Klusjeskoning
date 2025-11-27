'use client';

import { useMemo } from 'react';
import DOMPurify from 'dompurify';

interface SafeHtmlContentProps {
  html: string;
  className?: string;
}

/**
 * Safely render HTML content with XSS protection using DOMPurify
 * This component runs client-side where DOMPurify has access to the DOM
 */
export default function SafeHtmlContent({ html, className }: SafeHtmlContentProps) {
  const sanitizedHtml = useMemo(() => {
    if (!html) return '';

    const clean = DOMPurify.sanitize(html, {
      ALLOWED_TAGS: [
        'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
        'p', 'br', 'hr',
        'ul', 'ol', 'li',
        'strong', 'b', 'em', 'i', 'u', 's', 'strike',
        'a', 'img',
        'blockquote', 'pre', 'code',
        'table', 'thead', 'tbody', 'tr', 'th', 'td',
        'div', 'span',
        'figure', 'figcaption',
      ],
      ALLOWED_ATTR: [
        'href', 'target', 'rel',
        'src', 'alt', 'title', 'width', 'height',
        'class', 'id',
      ],
      ALLOW_DATA_ATTR: false,
    });

    // Add security attributes to external links
    return clean.replace(
      /<a\s+href=["'](https?:\/\/(?!klusjeskoningapp\.nl)[^"']+)["']/gi,
      '<a href="$1" target="_blank" rel="noopener noreferrer"'
    );
  }, [html]);

  return (
    <div
      className={className}
      dangerouslySetInnerHTML={{ __html: sanitizedHtml }}
    />
  );
}
