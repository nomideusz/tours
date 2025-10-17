/**
 * Sync tour prices from new pricing models to old price field
 * This script updates the legacy `price` field based on the current pricing model
 * to ensure backward compatibility and proper display in listings.
 */

import { db } from '../src/lib/db/connection.js';
import { tours } from '../src/lib/db/schema/index.js';
import { eq } from 'drizzle-orm';

async function syncTourPrices() {
  console.log('🔄 Starting tour price synchronization...\n');
  
  try {
    // Get all tours
    const allTours = await db.select().from(tours);
    console.log(`📊 Found ${allTours.length} tours to process\n`);
    
    let updatedCount = 0;
    let skippedCount = 0;
    let errorCount = 0;
    
    for (const tour of allTours) {
      try {
        let newPrice = null;
        let reason = '';
        
        // Calculate price based on pricing model
        if (tour.pricingModel === 'private_tour' && tour.privateTour?.flatPrice) {
          newPrice = String(tour.privateTour.flatPrice);
          reason = 'private tour flat price';
        } else if (tour.pricingModel === 'participant_categories' && tour.participantCategories?.categories?.length) {
          // Use the first (typically adult) category price
          const sortedCategories = [...tour.participantCategories.categories].sort((a, b) => a.sortOrder - b.sortOrder);
          newPrice = String(sortedCategories[0]?.price || 0);
          reason = 'first participant category price';
        } else if (tour.pricingModel === 'group_tiers' && tour.groupPricingTiers?.tiers?.length) {
          // Use minimum tier price
          const minPrice = Math.min(...tour.groupPricingTiers.tiers.map(t => t.price));
          newPrice = String(minPrice);
          reason = 'minimum group tier price';
        } else if ((tour.pricingModel === 'per_person' || tour.pricingModel === 'adult_child') 
                   && tour.enablePricingTiers && tour.pricingTiers?.adult) {
          // Use adult price for tours with adult/child pricing tiers
          newPrice = String(tour.pricingTiers.adult);
          reason = 'adult price from pricing tiers';
        }
        
        // Only update if we calculated a new price and it's different from current
        if (newPrice !== null && newPrice !== tour.price) {
          await db
            .update(tours)
            .set({
              price: newPrice,
              updatedAt: new Date()
            })
            .where(eq(tours.id, tour.id));
          
          console.log(`✅ Updated "${tour.name}" (${tour.id.slice(0, 8)}...)`);
          console.log(`   Old price: ${tour.price}, New price: ${newPrice} (${reason})`);
          updatedCount++;
        } else {
          skippedCount++;
          if (process.env.VERBOSE) {
            console.log(`⏭️  Skipped "${tour.name}" (${tour.id.slice(0, 8)}...) - no change needed`);
          }
        }
      } catch (err) {
        console.error(`❌ Error processing tour "${tour.name}" (${tour.id}):`, err);
        errorCount++;
      }
    }
    
    console.log('\n📈 Summary:');
    console.log(`   ✅ Updated: ${updatedCount} tours`);
    console.log(`   ⏭️  Skipped: ${skippedCount} tours (no change needed)`);
    console.log(`   ❌ Errors: ${errorCount} tours`);
    console.log('\n✨ Price synchronization complete!');
    
  } catch (error) {
    console.error('💥 Fatal error during price synchronization:', error);
    process.exit(1);
  }
}

// Run the sync
syncTourPrices()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('💥 Unhandled error:', err);
    process.exit(1);
  });

