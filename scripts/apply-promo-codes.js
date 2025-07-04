import 'dotenv/config';
import { drizzle } from 'drizzle-orm/node-postgres';
import pg from 'pg';

const { Pool } = pg;

async function applyPromoCodesChanges() {
  // Build connection string from environment variables (same logic as main app)
  const connectionString = process.env.DATABASE_URL || 
    `postgresql://${process.env.DATABASE_USER || 'zaur_dev'}:${process.env.DATABASE_PASSWORD || 'zaur_dev_password'}@${process.env.DATABASE_HOST || 'localhost'}:${process.env.DATABASE_PORT || '5432'}/${process.env.DATABASE_NAME || 'zaur_db_local'}`;
  
  console.log('Using database connection:', connectionString.replace(/:[^:@]*@/, ':***@')); // Hide password in logs

  const pool = new Pool({ connectionString });
  const db = drizzle(pool);

  try {
    console.log('Starting promo codes migration...');
    
    // Create promo_codes table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS "promo_codes" (
        "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
        "code" VARCHAR(50) NOT NULL UNIQUE,
        "description" TEXT,
        "type" VARCHAR(50) NOT NULL,
        "discount_percentage" INTEGER,
        "free_months" INTEGER,
        "is_lifetime" BOOLEAN DEFAULT false NOT NULL,
        "max_uses" INTEGER,
        "current_uses" INTEGER DEFAULT 0 NOT NULL,
        "valid_from" TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
        "valid_until" TIMESTAMP WITH TIME ZONE,
        "is_active" BOOLEAN DEFAULT true NOT NULL,
        "created_at" TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
        "updated_at" TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
      )
    `);
    console.log('✓ Created promo_codes table');
    
    // Add new columns to users table
    const columnsToAdd = [
      { name: 'promo_code_used', type: 'VARCHAR(50)' },
      { name: 'subscription_discount_percentage', type: 'INTEGER DEFAULT 0' },
      { name: 'subscription_free_until', type: 'TIMESTAMP WITH TIME ZONE' },
      { name: 'is_lifetime_discount', type: 'BOOLEAN DEFAULT false' },
      { name: 'early_access_member', type: 'BOOLEAN DEFAULT false' }
    ];
    
    for (const column of columnsToAdd) {
      try {
        await pool.query(`ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "${column.name}" ${column.type}`);
        console.log(`✓ Added column ${column.name}`);
      } catch (err) {
        if (err.code === '42701') { // Column already exists
          console.log(`- Column ${column.name} already exists`);
        } else {
          throw err;
        }
      }
    }
    
    // Create indexes
    await pool.query(`CREATE INDEX IF NOT EXISTS "idx_promo_codes_code" ON "promo_codes" ("code")`);
    await pool.query(`CREATE INDEX IF NOT EXISTS "idx_users_promo_code" ON "users" ("promo_code_used")`);
    console.log('✓ Created indexes');
    
    // Insert default promo codes
    const promoCodes = [
      // First 10 users: 1 year free then 50% lifetime discount
      ['FOUNDER', 'Founder member - 1 year free + 50% lifetime discount', 'early_access', 50, 12, true, 10],
      ['EARLY2025', 'Early 2025 member - 1 year free + 50% lifetime discount', 'early_access', 50, 12, true, 10],
      
      // Various discount codes
      ['PREMIUM50', '50% lifetime discount', 'lifetime_discount', 50, 0, true, null],
      ['HALFOFF', '50% discount for 6 months', 'percentage_discount', 50, 6, false, null],
      ['TOURGUIDE25', '25% lifetime discount for tour guides', 'lifetime_discount', 25, 0, true, null],
      
      // Free period codes
      ['FREETRIAL6', '6 months free trial', 'free_period', 0, 6, false, null],
      ['YEARFREE', '1 year free access', 'free_period', 0, 12, false, 50],
      
      // Partner codes (free forever)
      ['PARTNER', 'Partner - Free forever', 'lifetime_discount', 100, 0, true, null],
      ['INFLUENCER', 'Influencer partnership - Free forever', 'lifetime_discount', 100, 0, true, 20],
      
      // Limited time offers
      ['LAUNCH2025', 'Launch special - 3 months free + 30% lifetime', 'early_access', 30, 3, true, 100],
      ['BETAUSER', 'Beta user appreciation - 40% lifetime', 'lifetime_discount', 40, 0, true, 50]
    ];
    
    for (const [code, description, type, discount_percentage, free_months, is_lifetime, max_uses] of promoCodes) {
      await pool.query(`
        INSERT INTO "promo_codes" (
          "code", "description", "type", "discount_percentage", 
          "free_months", "is_lifetime", "max_uses", "is_active"
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, true)
        ON CONFLICT (code) DO NOTHING
      `, [code, description, type, discount_percentage, free_months, is_lifetime, max_uses]);
    }
    console.log('✓ Inserted default promo codes');
    
    // Add constraints
    await pool.query(`
      ALTER TABLE "promo_codes" 
      ADD CONSTRAINT "chk_discount_percentage" 
      CHECK ("discount_percentage" >= 0 AND "discount_percentage" <= 100)
    `).catch(() => console.log('- Discount percentage constraint already exists'));
    
    await pool.query(`
      ALTER TABLE "users" 
      ADD CONSTRAINT "chk_subscription_discount" 
      CHECK ("subscription_discount_percentage" >= 0 AND "subscription_discount_percentage" <= 100)
    `).catch(() => console.log('- Subscription discount constraint already exists'));
    
    console.log('✓ Added constraints');
    
    console.log('\n✅ Promo codes migration completed successfully!');
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  } finally {
    await pool.end();
  }
}

applyPromoCodesChanges().catch(console.error); 