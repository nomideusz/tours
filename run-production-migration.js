import pg from 'pg';
import fs from 'fs';
import 'dotenv/config';

const { Pool } = pg;

async function runMigration() {
	console.log('🚀 Starting Safe Production Migration\n');
	console.log('📋 This will add:');
	console.log('   - Pricing model fields to tours table');
	console.log('   - Capacity settings (min/max)');
	console.log('   - Feature feedback table');
	console.log('');
	
	const pool = new Pool({
		connectionString: process.env.DATABASE_URL,
	});

	try {
		// Test connection first
		console.log('🔌 Testing database connection...');
		await pool.query('SELECT NOW()');
		console.log('✓ Connection successful\n');
		
		// Read migration file
		const migrationSQL = fs.readFileSync('safe-production-migration.sql', 'utf8');
		
		// Execute migration
		console.log('⚙️  Running migration...\n');
		await pool.query(migrationSQL);
		
		console.log('\n✅ Migration completed successfully!\n');
		
		// Verify columns were added
		console.log('🔍 Verifying new columns...');
		const result = await pool.query(`
			SELECT column_name, data_type, column_default
			FROM information_schema.columns 
			WHERE table_name = 'tours' 
			AND column_name IN (
				'pricing_model',
				'participant_categories',
				'private_tour',
				'group_discounts',
				'optional_addons',
				'guide_pays_stripe_fee',
				'min_capacity',
				'max_capacity',
				'count_infants_toward_capacity'
			)
			ORDER BY column_name;
		`);
		
		console.log('\n📊 New columns in tours table:');
		result.rows.forEach(row => {
			console.log(`   ✓ ${row.column_name} (${row.data_type})`);
		});
		
		// Check feature_feedback table
		const feedbackCheck = await pool.query(`
			SELECT COUNT(*) as count
			FROM information_schema.tables 
			WHERE table_name = 'feature_feedback';
		`);
		
		if (feedbackCheck.rows[0].count > 0) {
			console.log('\n✓ feature_feedback table created');
		}
		
		// Count existing tours
		const tourCount = await pool.query('SELECT COUNT(*) FROM tours');
		console.log(`\n📈 Existing tours: ${tourCount.rows[0].count}`);
		console.log('   All tours retain their data with safe defaults applied\n');
		
		console.log('🎉 Migration complete! Your database is ready.\n');
		console.log('Next steps:');
		console.log('   1. Deploy updated application code');
		console.log('   2. Test creating new tours with pricing features');
		console.log('   3. Monitor logs for any issues');
		
	} catch (error) {
		console.error('\n❌ Migration failed!');
		console.error('Error:', error.message);
		console.error('\nThe transaction was automatically rolled back.');
		console.error('Your database is unchanged. Safe to retry.\n');
		
		if (error.message.includes('permission')) {
			console.error('💡 Tip: Make sure your database user has ALTER TABLE privileges');
		}
		
		if (error.message.includes('connection')) {
			console.error('💡 Tip: Check your DATABASE_URL environment variable');
		}
		
		process.exit(1);
	} finally {
		await pool.end();
	}
}

console.log('═══════════════════════════════════════════════════════');
console.log('  Safe Production Migration Script');
console.log('  Zaur Tours Application');
console.log('═══════════════════════════════════════════════════════\n');

runMigration();
