import 'dotenv/config';
import postgres from 'postgres';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
	console.error('❌ DATABASE_URL environment variable is not set');
	process.exit(1);
}

const sql = postgres(connectionString);

async function applySchemaUpdate() {
	try {
		console.log('🔧 Applying schema updates...\n');
		
		const schemaSQL = fs.readFileSync(path.join(__dirname, 'manual-schema-update.sql'), 'utf8');
		
		await sql.unsafe(schemaSQL);
		
		console.log('✅ Schema updated successfully!\n');
		console.log('Added:');
		console.log('   • participant_categories enum value');
		console.log('   • tours.participant_categories column');
		console.log('   • bookings.participants_by_category column');
		
	} catch (error) {
		console.error('❌ Schema update failed:', error.message);
		process.exit(1);
	} finally {
		await sql.end();
	}
}

applySchemaUpdate();

