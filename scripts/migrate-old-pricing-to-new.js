/**
 * Migrate tours from old pricing system to new pricing models
 * This script converts tours that only have a legacy `price` field to use the new
 * participant_categories pricing model with a single "Adult" category.
 */

import { db } from '../src/lib/db/connection.js';
import { tours } from '../src/lib/db/schema/index.js';
import { eq, or, isNull } from 'drizzle-orm';

async function migrateOldPricingToNew() {
  console.log('🔄 Starting migration from old pricing system to new...\n');
  
  try {
    // Get all tours that need migration
    // Tours need migration if they don't have a pricingModel or have 'per_person' model
    const allTours = await db.select().from(tours);
    
    console.log(`📊 Found ${allTours.length} tours to check\n`);
    
    let migratedCount = 0;
    let skippedCount = 0;
    let errorCount = 0;
    
    for (const tour of allTours) {
      try {
        // Check if tour needs migration
        const needsMigration = (
          !tour.pricingModel || 
          tour.pricingModel === 'per_person' ||
          (tour.pricingModel === 'adult_child' && (!tour.enablePricingTiers || !tour.pricingTiers))
        ) && !tour.participantCategories && !tour.privateTour;
        
        if (!needsMigration) {
          skippedCount++;
          if (process.env.VERBOSE) {
            console.log(`⏭️  Skipped "${tour.name}" (${tour.id.slice(0, 8)}...) - already using new pricing model`);
          }
          continue;
        }
        
        // Get the current price
        const currentPrice = parseFloat(tour.price) || 0;
        
        // For tours with adult/child pricing tiers, convert to participant categories
        if ((tour.pricingModel === 'per_person' || tour.pricingModel === 'adult_child') 
            && tour.enablePricingTiers && tour.pricingTiers) {
          const categories = [];
          
          // Add adult category
          if (tour.pricingTiers.adult !== undefined) {
            categories.push({
              id: 'adult',
              label: 'Adult',
              description: 'Ages 13+',
              price: parseFloat(tour.pricingTiers.adult) || 0,
              minAge: 13,
              maxAge: null,
              sortOrder: 0,
              required: true
            });
          }
          
          // Add child category if exists
          if (tour.pricingTiers.child !== undefined) {
            categories.push({
              id: 'child',
              label: 'Child',
              description: 'Ages 3-12',
              price: parseFloat(tour.pricingTiers.child) || 0,
              minAge: 3,
              maxAge: 12,
              sortOrder: 1,
              required: false
            });
          }
          
          // Add infant category if free
          categories.push({
            id: 'infant',
            label: 'Infant',
            description: 'Ages 0-2',
            price: 0,
            minAge: 0,
            maxAge: 2,
            sortOrder: 2,
            required: false
          });
          
          await db
            .update(tours)
            .set({
              pricingModel: 'participant_categories',
              participantCategories: {
                categories: categories
              },
              updatedAt: new Date()
            })
            .where(eq(tours.id, tour.id));
          
          console.log(`✅ Migrated "${tour.name}" (${tour.id.slice(0, 8)}...)`);
          console.log(`   From: ${tour.pricingModel} with adult/child tiers (adult=${tour.pricingTiers.adult}, child=${tour.pricingTiers.child || 'none'})`);
          console.log(`   To: participant_categories with ${categories.length} categories`);
          migratedCount++;
        } else {
          // For per_person or undefined pricing model, create simple participant categories
          const participantCategories = {
            categories: [
              {
                id: 'adult',
                label: 'Adult',
                description: 'Ages 13+',
                price: currentPrice,
                minAge: 13,
                maxAge: null,
                sortOrder: 0,
                required: true
              },
              {
                id: 'child',
                label: 'Child',
                description: 'Ages 3-12',
                price: currentPrice, // Same price as adult for backward compatibility
                minAge: 3,
                maxAge: 12,
                sortOrder: 1,
                required: false
              },
              {
                id: 'infant',
                label: 'Infant',
                description: 'Ages 0-2 (Free)',
                price: 0, // Infants are typically free
                minAge: 0,
                maxAge: 2,
                sortOrder: 2,
                required: false
              }
            ]
          };
          
          await db
            .update(tours)
            .set({
              pricingModel: 'participant_categories',
              participantCategories: participantCategories,
              updatedAt: new Date()
            })
            .where(eq(tours.id, tour.id));
          
          console.log(`✅ Migrated "${tour.name}" (${tour.id.slice(0, 8)}...)`);
          console.log(`   From: ${tour.pricingModel || 'undefined'} with price=${currentPrice}`);
          console.log(`   To: participant_categories with 3 standard categories (Adult/Child/Infant)`);
          migratedCount++;
        }
      } catch (err) {
        console.error(`❌ Error processing tour "${tour.name}" (${tour.id}):`, err);
        errorCount++;
      }
    }
    
    console.log('\n📈 Summary:');
    console.log(`   ✅ Migrated: ${migratedCount} tours`);
    console.log(`   ⏭️  Skipped: ${skippedCount} tours (already using new pricing)`);
    console.log(`   ❌ Errors: ${errorCount} tours`);
    console.log('\n✨ Migration complete!');
    
    if (migratedCount > 0) {
      console.log('\n💡 Next steps:');
      console.log('   1. Review the migrated tours in your admin panel');
      console.log('   2. Adjust pricing categories if needed');
      console.log('   3. Run sync-tour-prices.js to ensure price field is synced');
    }
    
  } catch (error) {
    console.error('💥 Fatal error during migration:', error);
    process.exit(1);
  }
}

// Run the migration
migrateOldPricingToNew()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('💥 Unhandled error:', err);
    process.exit(1);
  });

