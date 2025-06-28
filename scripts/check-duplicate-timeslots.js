import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { timeSlots } from '../src/lib/db/schema/index.js';
import { sql } from 'drizzle-orm';

// Database connection
const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
	console.error('DATABASE_URL environment variable is required');
	process.exit(1);
}

const client = postgres(connectionString);
const db = drizzle(client);

async function checkDuplicateTimeSlots() {
	console.log('🔍 Checking for duplicate time slots...');
	
	try {
		// Find duplicate time slots (same tour, same start time, same end time)
		const duplicates = await db.execute(sql`
			SELECT 
				tour_id,
				start_time,
				end_time,
				COUNT(*) as count,
				array_agg(id) as ids
			FROM time_slots 
			GROUP BY tour_id, start_time, end_time 
			HAVING COUNT(*) > 1
			ORDER BY tour_id, start_time
		`);

		if (duplicates.length === 0) {
			console.log('✅ No duplicate time slots found');
			return;
		}

		console.log(`⚠️ Found ${duplicates.length} sets of duplicate time slots:`);
		
		let totalDuplicates = 0;
		for (const dup of duplicates) {
			console.log(`\n📅 Tour ${dup.tour_id}:`);
			console.log(`   Time: ${dup.start_time} - ${dup.end_time}`);
			console.log(`   Count: ${dup.count} slots`);
			console.log(`   IDs: ${dup.ids.join(', ')}`);
			totalDuplicates += dup.count - 1; // -1 because we keep one
		}

		console.log(`\n📊 Summary: ${totalDuplicates} duplicate slots to clean up`);
		
		// Ask if user wants to clean up
		const args = process.argv.slice(2);
		if (args.includes('--fix')) {
			console.log('\n🧹 Cleaning up duplicates...');
			
			for (const dup of duplicates) {
				const ids = dup.ids;
				const keepId = ids[0]; // Keep the first one
				const deleteIds = ids.slice(1); // Delete the rest
				
				console.log(`Keeping ${keepId}, deleting: ${deleteIds.join(', ')}`);
				
				// Delete duplicate time slots
				await db.execute(sql`
					DELETE FROM time_slots 
					WHERE id = ANY(${deleteIds})
				`);
			}
			
			console.log('✅ Cleanup complete!');
		} else {
			console.log('\n💡 Run with --fix flag to clean up duplicates:');
			console.log('   node scripts/check-duplicate-timeslots.js --fix');
		}

	} catch (error) {
		console.error('❌ Error checking duplicates:', error);
	} finally {
		await client.end();
	}
}

checkDuplicateTimeSlots(); 