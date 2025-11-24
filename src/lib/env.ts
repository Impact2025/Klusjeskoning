import { z } from 'zod';

/**
 * Environment variable validation schema
 * Ensures all required environment variables are present and valid
 */
const envSchema = z.object({
  // Database
  DATABASE_URL: z.string().url('DATABASE_URL must be a valid URL'),

  // Authentication
  NEXTAUTH_SECRET: z.string().min(32, 'NEXTAUTH_SECRET must be at least 32 characters'),
  NEXTAUTH_URL: z.string().url('NEXTAUTH_URL must be a valid URL'),

  // Email Service
  SENDGRID_API_KEY: z.string().min(1, 'SENDGRID_API_KEY is required'),
  SENDGRID_FROM_EMAIL: z.string().email('SENDGRID_FROM_EMAIL must be a valid email'),

  // Admin Configuration
  ADMIN_EMAIL: z.string().email('ADMIN_EMAIL must be a valid email'),
  ADMIN_PASSWORD: z.string().min(8, 'ADMIN_PASSWORD must be at least 8 characters'),

  // External Services (optional in development)
  SENTRY_DSN: z.string().url().optional(),
  GOOGLE_ANALYTICS_ID: z.string().optional(),
  STRIPE_PUBLISHABLE_KEY: z.string().optional(),
  STRIPE_SECRET_KEY: z.string().optional(),
  STRIPE_WEBHOOK_SECRET: z.string().optional(),

  // File Upload
  VERCEL_BLOB_READ_WRITE_TOKEN: z.string().optional(),

  // Development/Production flags
  NODE_ENV: z.enum(['development', 'production', 'test']),
  VERCEL_ENV: z.enum(['development', 'preview', 'production']).optional(),
});

/**
 * Parsed and validated environment variables
 */
export const env = envSchema.parse(process.env);

/**
 * Type-safe environment variables
 */
export type Env = z.infer<typeof envSchema>;

/**
 * Validate environment variables at runtime
 * Call this in critical paths to ensure configuration is valid
 */
export function validateEnvironment(): Env {
  try {
    return envSchema.parse(process.env);
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errorMessages = error.errors.map(err => `${err.path.join('.')}: ${err.message}`).join('\n');
      throw new Error(`Environment validation failed:\n${errorMessages}`);
    }
    throw error;
  }
}

/**
 * Check if we're in production environment
 */
export const isProduction = env.NODE_ENV === 'production';

/**
 * Check if we're in development environment
 */
export const isDevelopment = env.NODE_ENV === 'development';

/**
 * Check if we're in test environment
 */
export const isTest = env.NODE_ENV === 'test';

/**
 * Get the current environment name
 */
export const currentEnvironment = env.VERCEL_ENV || env.NODE_ENV;