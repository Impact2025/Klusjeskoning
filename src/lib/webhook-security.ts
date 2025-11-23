import 'server-only';
import { createHmac } from 'crypto';

/**
 * Verify MultiSafepay webhook signature
 * MultiSafepay uses HMAC-SHA512 for signature verification
 */
export function verifyMultiSafepaySignature(
  payload: string,
  signature: string,
  secret: string
): boolean {
  try {
    const expectedSignature = createHmac('sha512', secret)
      .update(payload, 'utf8')
      .digest('hex');

    // Use constant-time comparison to prevent timing attacks
    return signature === expectedSignature;
  } catch (error) {
    console.error('Webhook signature verification failed:', error);
    return false;
  }
}

/**
 * Extract signature from MultiSafepay webhook headers
 * MultiSafepay typically sends signature in a custom header
 */
export function extractWebhookSignature(request: Request): string | null {
  // Common header names for webhook signatures
  const signatureHeaders = [
    'x-multisafepay-signature',
    'signature',
    'x-signature',
    'x-webhook-signature'
  ];

  for (const headerName of signatureHeaders) {
    const signature = request.headers.get(headerName);
    if (signature) {
      return signature;
    }
  }

  return null;
}

/**
 * Validate webhook timestamp to prevent replay attacks
 * Webhooks should be processed within a reasonable time window
 */
export function isValidWebhookTimestamp(timestamp: number, maxAgeMinutes = 5): boolean {
  const now = Date.now();
  const webhookTime = timestamp * 1000; // Convert to milliseconds
  const age = now - webhookTime;
  const maxAge = maxAgeMinutes * 60 * 1000; // Convert to milliseconds

  return age >= 0 && age <= maxAge;
}

/**
 * Process MultiSafepay webhook with full security validation
 */
export async function processSecureWebhook(
  request: Request,
  secret: string
): Promise<{
  isValid: boolean;
  payload?: any;
  error?: string;
}> {
  try {
    // Get raw body for signature verification
    const rawBody = await request.text();
    const signature = extractWebhookSignature(request);

    if (!signature) {
      return { isValid: false, error: 'Missing webhook signature' };
    }

    if (!secret) {
      return { isValid: false, error: 'Webhook secret not configured' };
    }

    // Verify signature
    const isValidSignature = verifyMultiSafepaySignature(rawBody, signature, secret);
    if (!isValidSignature) {
      return { isValid: false, error: 'Invalid webhook signature' };
    }

    // Parse payload
    let payload: any;
    try {
      payload = JSON.parse(rawBody);
    } catch (error) {
      return { isValid: false, error: 'Invalid JSON payload' };
    }

    // Optional: Validate timestamp if present
    if (payload.timestamp && !isValidWebhookTimestamp(payload.timestamp)) {
      return { isValid: false, error: 'Webhook timestamp too old' };
    }

    return { isValid: true, payload };
  } catch (error) {
    console.error('Webhook processing error:', error);
    return { isValid: false, error: 'Webhook processing failed' };
  }
}