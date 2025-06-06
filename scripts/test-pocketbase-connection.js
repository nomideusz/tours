import PocketBase from 'pocketbase';

const POCKETBASE_URL = process.env.POCKETBASE_URL || 'https://z.xeon.pl';
const POCKETBASE_ADMIN_EMAIL = process.env.POCKETBASE_ADMIN_EMAIL || '';
const POCKETBASE_ADMIN_PASSWORD = process.env.POCKETBASE_ADMIN_PASSWORD || '';

async function testPocketBaseConnection() {
  console.log('🔍 Testing PocketBase connection...');
  console.log(`URL: ${POCKETBASE_URL}`);
  console.log(`Admin Email: ${POCKETBASE_ADMIN_EMAIL}`);
  console.log(`Password: ${POCKETBASE_ADMIN_PASSWORD ? '***' : 'NOT SET'}`);
  
  if (!POCKETBASE_ADMIN_EMAIL || !POCKETBASE_ADMIN_PASSWORD) {
    console.error('❌ Please set POCKETBASE_ADMIN_EMAIL and POCKETBASE_ADMIN_PASSWORD environment variables');
    console.log('\nExample:');
    console.log('set POCKETBASE_ADMIN_EMAIL=your-email@example.com');
    console.log('set POCKETBASE_ADMIN_PASSWORD=your-password');
    console.log('pnpm tsx scripts/test-pocketbase-connection.js');
    process.exit(1);
  }
  
  const pb = new PocketBase(POCKETBASE_URL);
  
  try {
    // Test admin authentication
    const authData = await pb.collection('_superusers').authWithPassword(
      POCKETBASE_ADMIN_EMAIL,
      POCKETBASE_ADMIN_PASSWORD
    );
    
    console.log('✅ PocketBase admin authentication successful!');
    console.log(`Admin ID: ${authData.record.id}`);
    console.log(`Admin Email: ${authData.record.email}`);
    
    // Test fetching users
    const users = await pb.collection('users').getList(1, 5);
    console.log(`\n📊 Found ${users.totalItems} users in PocketBase`);
    console.log('Sample users:');
    users.items.forEach((user, index) => {
      console.log(`  ${index + 1}. ${user.email} (${user.name || 'No name'})`);
    });
    
    // Test fetching tours
    const tours = await pb.collection('tours').getList(1, 5);
    console.log(`\n🎯 Found ${tours.totalItems} tours in PocketBase`);
    console.log('Sample tours:');
    tours.items.forEach((tour, index) => {
      console.log(`  ${index + 1}. ${tour.title} - ${tour.price} ${tour.currency || 'EUR'}`);
    });
    
    console.log('\n✨ PocketBase connection test successful!');
    console.log('You can now run the migration script:');
    console.log('pnpm tsx scripts/migrate-from-pocketbase.js');
    
  } catch (error) {
    console.error('❌ PocketBase connection failed:', error.message);
    
    if (error.status === 400) {
      console.error('\n🔧 This usually means:');
      console.error('1. Incorrect admin email or password');
      console.error('2. Admin account does not exist');
      console.error('3. Admin account is disabled');
    } else if (error.status === 404) {
      console.error('\n🔧 This usually means:');
      console.error('1. PocketBase URL is incorrect');
      console.error('2. PocketBase server is not running');
    } else {
      console.error('\n🔧 Network or server error');
    }
    
    process.exit(1);
  }
}

testPocketBaseConnection(); 