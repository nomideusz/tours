import 'dotenv/config';
import postgres from 'postgres';

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
	console.error('❌ DATABASE_URL environment variable is not set');
	process.exit(1);
}

const sql = postgres(connectionString);

async function runCompleteMigration() {
	try {
		console.log('🚀 Starting complete pricing model migration...\n');
		
		// Check current state
		console.log('📊 Current state:');
		const beforeResult = await sql`
			SELECT pricing_model, COUNT(*) as count 
			FROM tours 
			GROUP BY pricing_model 
			ORDER BY pricing_model
		`;
		console.table(beforeResult.map(row => ({
			'Pricing Model': row.pricing_model,
			'Count': row.count
		})));
		
		console.log('\n⚙️  Running migration...\n');
		
		// PHASE 1: Add enum value if it doesn't exist
		console.log('   1️⃣  Checking enum values...');
		const enumCheck = await sql`
			SELECT enumlabel 
			FROM pg_enum 
			WHERE enumtypid = 'pricing_model'::regtype 
			AND enumlabel = 'participant_categories'
		`;
		
		if (enumCheck.length === 0) {
			console.log('      Adding participant_categories to enum...');
			await sql.unsafe(`
				ALTER TYPE pricing_model ADD VALUE 'participant_categories'
			`);
			console.log('      ✅ Enum value added');
		} else {
			console.log('      ℹ️  participant_categories already in enum');
		}
		
		// PHASE 2: Migrate data in a transaction
		console.log('\n   2️⃣  Migrating tour data...');
		await sql.begin(async tx => {
			// Convert adult_child tours
			console.log('      • Converting adult_child → participant_categories...');
			const adultChildResult = await tx`
				UPDATE tours 
				SET 
					pricing_model = 'participant_categories',
					participant_categories = jsonb_build_object(
						'categories', jsonb_build_array(
							jsonb_build_object(
								'id', 'adult',
								'label', 'Adult',
								'price', price,
								'sortOrder', 0
							),
							jsonb_build_object(
								'id', 'child',
								'label', 'Child',
								'price', COALESCE((pricing_tiers->>'child')::numeric, price * 0.6),
								'ageRange', 'Under 12',
								'sortOrder', 1
							)
						)
					)
				WHERE pricing_model = 'adult_child'
				RETURNING id, name
			`;
			console.log(`        ✅ Converted ${adultChildResult.length} tour(s)`);
			
			// Convert hybrid tours to group_tiers
			console.log('      • Converting hybrid → group_tiers...');
			const hybridResult = await tx`
				UPDATE tours 
				SET pricing_model = 'group_tiers'
				WHERE pricing_model = 'hybrid'
				RETURNING id, name
			`;
			console.log(`        ✅ Converted ${hybridResult.length} tour(s)`);
			
			// Clean up legacy fields
			console.log('      • Cleaning up legacy pricing_tiers...');
			await tx`
				UPDATE tours 
				SET 
					enable_pricing_tiers = false,
					pricing_tiers = NULL
				WHERE pricing_model IN ('participant_categories', 'group_tiers', 'per_person')
			`;
			console.log('        ✅ Cleaned up');
			
			// Verify
			const invalidCount = await tx`
				SELECT COUNT(*) as count 
				FROM tours 
				WHERE pricing_model IN ('adult_child', 'hybrid')
			`;
			
			if (parseInt(invalidCount[0].count) > 0) {
				throw new Error(`Migration incomplete: ${invalidCount[0].count} tours still have old pricing models`);
			}
		});
		
		console.log('      ✅ Data migration complete');
		
		// Show final state
		console.log('\n📊 After migration:');
		const afterResult = await sql`
			SELECT pricing_model, COUNT(*) as count 
			FROM tours 
			GROUP BY pricing_model 
			ORDER BY pricing_model
		`;
		console.table(afterResult.map(row => ({
			'Pricing Model': row.pricing_model,
			'Count': row.count
		})));
		
		console.log('\n🎉 Migration complete! Your app is ready to use.');
		console.log('\n📋 What was changed:');
		console.log('   • Added participant_categories to pricing_model enum');
		console.log('   • Converted adult_child tours → participant_categories');
		console.log('   • Converted hybrid tours → group_tiers');
		console.log('   • Add-ons now available for all pricing models');
		
	} catch (error) {
		console.error('\n❌ Migration failed:', error.message);
		console.error('\n⚠️  Rolling back transaction...');
		console.error('\nFull error:', error);
		process.exit(1);
	} finally {
		await sql.end();
	}
}

runCompleteMigration();

