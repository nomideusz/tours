import 'dotenv/config';
import { drizzle } from 'drizzle-orm/node-postgres';
import pg from 'pg';

const { Pool } = pg;

/**
 * Script to create Beta 2 promo codes
 * 
 * Beta 2 Offer:
 * - 6 months free trial
 * - 20% lifetime discount after trial
 * - Target: 100 users
 * 
 * Codes:
 * - BETA2_GUIDE: For Solo Guide plan
 * - BETA2_PRO: For Professional plan
 */

async function createBeta2PromoCodes() {
  // Build connection string from environment variables
  const connectionString = process.env.DATABASE_URL || 
    `postgresql://${process.env.DATABASE_USER || 'zaur_dev'}:${process.env.DATABASE_PASSWORD || 'zaur_dev_password'}@${process.env.DATABASE_HOST || 'localhost'}:${process.env.DATABASE_PORT || '5432'}/${process.env.DATABASE_NAME || 'zaur_db_local'}`;
  
  console.log('Using database connection:', connectionString.replace(/:[^:@]*@/, ':***@')); // Hide password in logs

  const pool = new Pool({ connectionString });
  const db = drizzle(pool);

  try {
    console.log('🚀 Creating Beta 2 promo codes...\n');
    
    // Beta 2 promo codes
    const beta2Codes = [
      {
        code: 'BETA2_GUIDE',
        description: 'Beta 2 - Solo Guide: 6 months free + 20% lifetime discount',
        type: 'beta_2',
        discountPercentage: 20,
        freeMonths: 6,
        isLifetime: true,
        maxUses: 60, // Buffer for 50 target
        validFrom: new Date('2025-10-24'),
        validUntil: null // No expiry - valid until manually deactivated
      },
      {
        code: 'BETA2_PRO',
        description: 'Beta 2 - Professional: 6 months free + 20% lifetime discount',
        type: 'beta_2',
        discountPercentage: 20,
        freeMonths: 6,
        isLifetime: true,
        maxUses: 60, // Buffer for 50 target
        validFrom: new Date('2025-10-24'),
        validUntil: null // No expiry - valid until manually deactivated
      },
      {
        code: 'BETA2',
        description: 'Beta 2 - General: 6 months free + 20% lifetime discount (any plan)',
        type: 'beta_2',
        discountPercentage: 20,
        freeMonths: 6,
        isLifetime: true,
        maxUses: 120, // Combined buffer
        validFrom: new Date('2025-10-24'),
        validUntil: null // No expiry
      }
    ];
    
    for (const code of beta2Codes) {
      try {
        const result = await pool.query(`
          INSERT INTO "promo_codes" (
            "code", "description", "type", "discount_percentage", 
            "free_months", "is_lifetime", "max_uses", "is_active",
            "valid_from", "valid_until"
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
          ON CONFLICT (code) 
          DO UPDATE SET
            "description" = EXCLUDED.description,
            "discount_percentage" = EXCLUDED.discount_percentage,
            "free_months" = EXCLUDED.free_months,
            "is_lifetime" = EXCLUDED.is_lifetime,
            "max_uses" = EXCLUDED.max_uses,
            "valid_from" = EXCLUDED.valid_from,
            "valid_until" = EXCLUDED.valid_until,
            "updated_at" = now()
          RETURNING *
        `, [
          code.code, 
          code.description, 
          code.type, 
          code.discountPercentage, 
          code.freeMonths, 
          code.isLifetime, 
          code.maxUses,
          true, // is_active
          code.validFrom,
          code.validUntil
        ]);
        
        console.log(`✅ Created/Updated: ${code.code}`);
        console.log(`   Description: ${code.description}`);
        console.log(`   Benefits: ${code.freeMonths} months free + ${code.discountPercentage}% lifetime discount`);
        console.log(`   Max uses: ${code.maxUses}`);
        console.log('');
      } catch (error) {
        console.error(`❌ Failed to create ${code.code}:`, error.message);
      }
    }
    
    // Query and display current promo codes status
    const allCodes = await pool.query(`
      SELECT code, type, discount_percentage, free_months, 
             is_lifetime, max_uses, current_uses, is_active
      FROM "promo_codes"
      WHERE type IN ('beta_1', 'beta_2', 'early_access')
      ORDER BY code
    `);
    
    console.log('\n📊 Current Beta Promo Codes Status:\n');
    console.log('Code                Type           Discount  Free Period  Max Uses  Used  Active');
    console.log('─'.repeat(85));
    
    for (const row of allCodes.rows) {
      const code = row.code.padEnd(18);
      const type = row.type.padEnd(13);
      const discount = `${row.discount_percentage || 0}%`.padEnd(8);
      const freePeriod = `${row.free_months || 0}mo`.padEnd(11);
      const maxUses = (row.max_uses || '∞').toString().padEnd(8);
      const used = row.current_uses.toString().padEnd(4);
      const active = row.is_active ? '✓' : '✗';
      
      console.log(`${code} ${type} ${discount} ${freePeriod} ${maxUses} ${used} ${active}`);
    }
    
    console.log('\n✅ Beta 2 promo codes created successfully!');
    console.log('\n📝 Next steps:');
    console.log('   1. Update pricing config with Beta 2 base prices (€16 Solo, €36 Professional)');
    console.log('   2. Update marketing pages to show Beta 2 offer');
    console.log('   3. Re-enable beta applications API with spot limit');
    console.log('   4. Launch Beta 2 landing page');
    
  } catch (error) {
    console.error('❌ Script failed:', error);
    throw error;
  } finally {
    await pool.end();
  }
}

createBeta2PromoCodes().catch(console.error);

