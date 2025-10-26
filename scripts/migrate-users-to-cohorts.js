#!/usr/bin/env node

/**
 * User Cohort Migration Script
 * 
 * Assigns beta_group (cohort) to existing users based on their promo codes
 * and subscription discount percentages.
 * 
 * Logic:
 * - Users with 30% discount OR 'BETA_APPRECIATION' code → beta_1
 * - Users with 20% discount OR 'BETA2*' code → beta_2
 * - Users with earlyAccessMember = true → beta_1
 * - Other users remain null (will default to 'public' on checkout)
 * 
 * Usage:
 *   node scripts/migrate-users-to-cohorts.js --dry-run  (preview changes)
 *   node scripts/migrate-users-to-cohorts.js            (apply changes)
 */

import { H as db, d as users } from '../.svelte-kit/output/server/chunks/connection.js';
import { eq, or, isNotNull } from 'drizzle-orm';

const isDryRun = process.argv.includes('--dry-run');

async function migrateUsersCohorts() {
  console.log('🚀 Starting user cohort migration...');
  console.log(`Mode: ${isDryRun ? 'DRY RUN (no changes will be made)' : 'LIVE (changes will be applied)'}\n`);

  try {
    // Fetch all users with promo codes or discounts
    const allUsers = await db.select().from(users);
    
    console.log(`Found ${allUsers.length} total users\n`);

    const updates = {
      beta_1: [],
      beta_2: [],
      unchanged: []
    };

    for (const user of allUsers) {
      // Skip if already has a cohort assigned
      if (user.betaGroup) {
        updates.unchanged.push({
          userId: user.id,
          email: user.email,
          reason: `Already has cohort: ${user.betaGroup}`
        });
        continue;
      }

      let assignedCohort = null;
      let reason = '';

      // Check for Beta 1 indicators
      if (user.subscriptionDiscountPercentage === 30 && user.isLifetimeDiscount) {
        assignedCohort = 'beta_1';
        reason = '30% lifetime discount';
      } else if (user.promoCodeUsed === 'BETA_APPRECIATION') {
        assignedCohort = 'beta_1';
        reason = 'BETA_APPRECIATION promo code';
      } else if (user.earlyAccessMember) {
        assignedCohort = 'beta_1';
        reason = 'Early access member flag';
      }
      // Check for Beta 2 indicators
      else if (user.subscriptionDiscountPercentage === 20 && user.isLifetimeDiscount) {
        assignedCohort = 'beta_2';
        reason = '20% lifetime discount';
      } else if (user.promoCodeUsed && user.promoCodeUsed.startsWith('BETA2')) {
        assignedCohort = 'beta_2';
        reason = `${user.promoCodeUsed} promo code`;
      }

      if (assignedCohort) {
        updates[assignedCohort].push({
          userId: user.id,
          email: user.email,
          name: user.name,
          reason,
          currentDiscount: user.subscriptionDiscountPercentage,
          promoCode: user.promoCodeUsed
        });

        // Apply update if not dry run
        if (!isDryRun) {
          await db.update(users)
            .set({
              betaGroup: assignedCohort,
              updatedAt: new Date()
            })
            .where(eq(users.id, user.id));
        }
      } else {
        updates.unchanged.push({
          userId: user.id,
          email: user.email,
          reason: 'No cohort indicators (will default to public)'
        });
      }
    }

    // Display results
    console.log('=' .repeat(80));
    console.log('MIGRATION SUMMARY');
    console.log('=' .repeat(80));
    console.log('');

    if (updates.beta_1.length > 0) {
      console.log(`\n🥇 Beta 1 Cohort (${updates.beta_1.length} users):`);
      console.log('   - 1 year free trial + 30% lifetime discount\n');
      updates.beta_1.forEach(u => {
        console.log(`   ✓ ${u.email}`);
        console.log(`     Name: ${u.name}`);
        console.log(`     Reason: ${u.reason}`);
        if (u.currentDiscount) console.log(`     Current discount: ${u.currentDiscount}%`);
        if (u.promoCode) console.log(`     Promo code: ${u.promoCode}`);
        console.log('');
      });
    }

    if (updates.beta_2.length > 0) {
      console.log(`\n🥈 Beta 2 Cohort (${updates.beta_2.length} users):`);
      console.log('   - 4 months free trial + 20% lifetime discount\n');
      updates.beta_2.forEach(u => {
        console.log(`   ✓ ${u.email}`);
        console.log(`     Name: ${u.name}`);
        console.log(`     Reason: ${u.reason}`);
        if (u.currentDiscount) console.log(`     Current discount: ${u.currentDiscount}%`);
        if (u.promoCode) console.log(`     Promo code: ${u.promoCode}`);
        console.log('');
      });
    }

    console.log(`\n⚪ Unchanged (${updates.unchanged.length} users):`);
    console.log('   - Will use public pricing (full price + 14-day trial)\n');
    if (updates.unchanged.length <= 10) {
      updates.unchanged.forEach(u => {
        console.log(`   • ${u.email} - ${u.reason}`);
      });
    } else {
      console.log(`   (Showing first 10 of ${updates.unchanged.length})`);
      updates.unchanged.slice(0, 10).forEach(u => {
        console.log(`   • ${u.email} - ${u.reason}`);
      });
    }

    console.log('\n' + '=' .repeat(80));
    console.log('TOTAL RESULTS:');
    console.log(`  Beta 1 users: ${updates.beta_1.length}`);
    console.log(`  Beta 2 users: ${updates.beta_2.length}`);
    console.log(`  Unchanged:    ${updates.unchanged.length}`);
    console.log(`  Total:        ${allUsers.length}`);
    console.log('=' .repeat(80));

    if (isDryRun) {
      console.log('\n⚠️  DRY RUN MODE - No changes were made to the database');
      console.log('Run without --dry-run flag to apply these changes');
    } else {
      console.log('\n✅ Migration complete! All cohorts have been assigned.');
      console.log('\nNext steps:');
      console.log('1. Verify the assignments look correct');
      console.log('2. Deploy the updated application code');
      console.log('3. Test subscription checkout for each cohort');
    }

  } catch (error) {
    console.error('\n❌ Migration failed:', error);
    console.error(error.stack);
    process.exit(1);
  }
}

// Run the migration
migrateUsersCohorts()
  .then(() => {
    process.exit(0);
  })
  .catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
  });

