import { sql } from 'drizzle-orm';
import { db } from '../src/server/db/client';

async function createCouponTables() {
  try {
    console.log('Creating coupon tables...');

    if (!db) {
      console.error('Database connection not available. Make sure DATABASE_URL is set.');
      process.exit(1);
    }

    // Create discount_type enum if it doesn't exist
    await db.execute(sql`
      DO $$ BEGIN
        CREATE TYPE discount_type AS ENUM ('percentage', 'fixed');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `);

    // Create coupons table
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS coupons (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        code varchar(50) NOT NULL UNIQUE,
        description text,
        discount_type discount_type NOT NULL,
        discount_value integer NOT NULL,
        max_uses integer,
        used_count integer NOT NULL DEFAULT 0,
        valid_from timestamp with time zone,
        valid_until timestamp with time zone,
        is_active integer NOT NULL DEFAULT 1,
        created_at timestamp with time zone DEFAULT now() NOT NULL,
        updated_at timestamp with time zone DEFAULT now() NOT NULL
      );
    `);

    // Create coupon_usages table
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS coupon_usages (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        coupon_id uuid NOT NULL REFERENCES coupons(id) ON DELETE CASCADE,
        family_id uuid NOT NULL REFERENCES families(id) ON DELETE CASCADE,
        order_id varchar(255),
        discount_applied integer NOT NULL,
        used_at timestamp with time zone DEFAULT now() NOT NULL,
        UNIQUE(coupon_id, family_id)
      );
    `);

    console.log('Coupon tables created successfully!');
  } catch (error) {
    console.error('Error creating coupon tables:', error);
    process.exit(1);
  }
}

createCouponTables().then(() => {
  console.log('Migration completed.');
  process.exit(0);
});