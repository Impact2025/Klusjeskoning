/**
 * Server-side HTML sanitization utilities
 * Note: For full XSS protection with dangerouslySetInnerHTML,
 * use the SafeHtmlContent client component which uses DOMPurify
 */

/**
 * Basic server-side HTML sanitization (regex-based)
 * For full protection, use SafeHtmlContent component on the client
 */
export function sanitizeHtml(html: string): string {
  if (!html) return '';

  return html
    // Remove script tags
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    // Remove event handlers
    .replace(/\s*on\w+\s*=\s*["'][^"']*["']/gi, '')
    // Remove javascript: URLs
    .replace(/javascript:/gi, '')
    // Remove iframe tags
    .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '')
    // Remove style tags
    .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '')
    .trim();
}

/**
 * Sanitize HTML and transform external links for security
 */
export function sanitizeHtmlWithLinks(html: string): string {
  let sanitized = sanitizeHtml(html);

  // Add rel="noopener noreferrer" to all external links
  sanitized = sanitized.replace(
    /<a\s+href=["'](https?:\/\/(?!klusjeskoningapp\.nl)[^"']+)["']/gi,
    '<a href="$1" target="_blank" rel="noopener noreferrer"'
  );

  return sanitized;
}
