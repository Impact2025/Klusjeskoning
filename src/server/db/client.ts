import 'server-only';

import { neon } from '@neondatabase/serverless';
import { drizzle, type NeonHttpDatabase } from 'drizzle-orm/neon-http';
import * as schema from './schema';

// Get DATABASE_URL
const rawConnectionString = process.env.DATABASE_URL;

// Validate connection string format
const isValidConnectionString = (str: string | undefined): str is string => {
  if (!str || str.trim() === '') return false;
  // Check if it starts with postgresql:// or postgres://
  if (!str.startsWith('postgresql://') && !str.startsWith('postgres://')) return false;

  // Check if it's not a placeholder value
  if (str.includes('your_production_db_url_here') ||
      str.includes('your_db_url') ||
      str.includes('username:password@host')) return false;

  // Basic structure check: should have @ and / after protocol
  const withoutProtocol = str.replace(/^postgres(ql)?:\/\//, '');
  return withoutProtocol.includes('@') && withoutProtocol.includes('/');
};

// Only initialize database connection if we have a valid DATABASE_URL
// This prevents build errors on platforms like Vercel where DATABASE_URL might not be available during build
let db: NeonHttpDatabase<typeof schema> | null = null;
let DbClient: any;

if (!isValidConnectionString(rawConnectionString)) {
  if (process.env.NODE_ENV === 'production') {
    console.error('DATABASE_URL is not configured! Database operations will fail.');
  } else {
    console.warn('DATABASE_URL not set - database features will not be available during build.');
  }

  // Use a mock db client for build time to prevent errors
  db = null as any;
  DbClient = typeof db;
} else {
  const sql = neon(rawConnectionString);
  db = drizzle(sql, { schema });
  DbClient = typeof db;
}

export { db };
export type { DbClient };
