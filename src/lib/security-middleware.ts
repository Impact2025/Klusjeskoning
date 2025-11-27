import 'server-only';
import { NextResponse } from 'next/server';
import { getSession } from '@/server/auth/session';

/**
 * Security middleware for API routes
 * Provides additional validation and security checks
 */

export interface SecurityCheckResult {
  valid: boolean;
  error?: string;
  statusCode?: number;
}

/**
 * Validate request size to prevent oversized payloads
 */
export async function validateRequestSize(
  request: Request,
  maxSizeBytes: number = 1024 * 1024 // 1MB default
): Promise<SecurityCheckResult> {
  try {
    const contentLength = request.headers.get('content-length');

    if (contentLength) {
      const size = parseInt(contentLength, 10);
      if (size > maxSizeBytes) {
        return {
          valid: false,
          error: 'Request payload too large',
          statusCode: 413
        };
      }
    }

    // For JSON requests, we rely on Content-Length header since reading the body would consume it
    // The Content-Length check above is sufficient for JSON requests

    return { valid: true };
  } catch (error) {
    return {
      valid: false,
      error: 'Failed to validate request size',
      statusCode: 400
    };
  }
}

/**
 * Validate request origin for CORS-like protection
 */
export function validateRequestOrigin(
  request: Request,
  allowedOrigins: string[] = []
): SecurityCheckResult {
  const origin = request.headers.get('origin');
  const referer = request.headers.get('referer');

  // Allow requests without origin (server-to-server, mobile apps, etc.)
  if (!origin && !referer) {
    return { valid: true };
  }

  // Check origin if present
  if (origin) {
    try {
      const originUrl = new URL(origin);
      const allowedDomains = [
        'klusjeskoning.nl',
        'klusjeskoningapp.nl',
        'klusjeskoning.app',
        'www.klusjeskoning.app',
        'vercel.app', // Allow Vercel preview deployments
        'localhost',
        '127.0.0.1',
        ...allowedOrigins
      ];

      // In development, allow all localhost origins
      if (process.env.NODE_ENV !== 'production' && (
        originUrl.hostname === 'localhost' ||
        originUrl.hostname === '127.0.0.1'
      )) {
        return { valid: true };
      }

      const isAllowed = allowedDomains.some(domain =>
        originUrl.hostname === domain ||
        originUrl.hostname.endsWith('.' + domain)
      );

      if (!isAllowed) {
        return {
          valid: false,
          error: 'Origin not allowed',
          statusCode: 403
        };
      }
    } catch (error) {
      return {
        valid: false,
        error: 'Invalid origin',
        statusCode: 400
      };
    }
  }

  return { valid: true };
}

/**
 * Enhanced session validation with additional security checks
 */
export async function validateSecureSession(request: Request) {
  const session = await getSession();

  if (!session) {
    return {
      valid: false,
      error: 'Authentication required',
      statusCode: 401
    };
  }

  // Additional security checks can be added here
  // For example: IP address validation, device fingerprinting, etc.

  return {
    valid: true,
    session
  };
}

/**
 * Sanitize user input to prevent XSS and injection attacks
 */
export function sanitizeInput(input: string): string {
  if (typeof input !== 'string') return '';

  return input
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '')
    .replace(/javascript:/gi, '')
    .replace(/on\w+\s*=/gi, '')
    .trim();
}

/**
 * Validate file upload security
 */
export function validateFileUpload(
  fileName: string,
  fileSize: number,
  allowedTypes: string[] = ['image/jpeg', 'image/png', 'image/webp'],
  maxSizeBytes: number = 5 * 1024 * 1024 // 5MB
): SecurityCheckResult {
  // Check file size
  if (fileSize > maxSizeBytes) {
    return {
      valid: false,
      error: 'File too large',
      statusCode: 413
    };
  }

  // Check file extension for basic validation
  const allowedExtensions = ['.jpg', '.jpeg', '.png', '.webp', '.gif'];
  const fileExtension = fileName.toLowerCase().substring(fileName.lastIndexOf('.'));

  if (!allowedExtensions.includes(fileExtension)) {
    return {
      valid: false,
      error: 'File type not allowed',
      statusCode: 400
    };
  }

  // Additional security: prevent directory traversal
  if (fileName.includes('..') || fileName.includes('/') || fileName.includes('\\')) {
    return {
      valid: false,
      error: 'Invalid filename',
      statusCode: 400
    };
  }

  return { valid: true };
}

/**
 * Comprehensive security middleware for API routes
 */
export async function securityMiddleware(
  request: Request,
  options: {
    requireAuth?: boolean;
    maxPayloadSize?: number;
    allowedOrigins?: string[];
  } = {}
): Promise<{ valid: boolean; response?: NextResponse; session?: any }> {
  const { requireAuth = false, maxPayloadSize, allowedOrigins } = options;

  // Validate request size
  if (maxPayloadSize) {
    const sizeCheck = await validateRequestSize(request, maxPayloadSize);
    if (!sizeCheck.valid) {
      return {
        valid: false,
        response: NextResponse.json(
          { error: sizeCheck.error },
          { status: sizeCheck.statusCode || 400 }
        )
      };
    }
  }

  // Validate origin
  const originCheck = validateRequestOrigin(request, allowedOrigins);
  if (!originCheck.valid) {
    return {
      valid: false,
      response: NextResponse.json(
        { error: originCheck.error },
        { status: originCheck.statusCode || 403 }
      )
    };
  }

  // Validate session if required
  if (requireAuth) {
    const sessionCheck = await validateSecureSession(request);
    if (!sessionCheck.valid) {
      return {
        valid: false,
        response: NextResponse.json(
          { error: sessionCheck.error },
          { status: sessionCheck.statusCode || 401 }
        )
      };
    }

    return {
      valid: true,
      session: sessionCheck.session
    };
  }

  return { valid: true };
}