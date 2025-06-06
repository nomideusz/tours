import PocketBase from 'pocketbase';

const POCKETBASE_URL = 'https://z.xeon.pl';
const POCKETBASE_ADMIN_EMAIL = 'nom@zaur.app';
const POCKETBASE_ADMIN_PASSWORD = 'Szczerzuj1a!';

async function debugPocketBaseStructure() {
  console.log('🔍 Analyzing PocketBase data structure...');
  
  const pb = new PocketBase(POCKETBASE_URL);
  
  try {
    // Authenticate
    await pb.collection('_superusers').authWithPassword(
      POCKETBASE_ADMIN_EMAIL,
      POCKETBASE_ADMIN_PASSWORD
    );
    
    console.log('✅ Connected to PocketBase');
    
    // Get a sample user
    console.log('\n👤 Sample User:');
    const users = await pb.collection('users').getList(1, 1);
    if (users.items.length > 0) {
      console.log('User fields:', Object.keys(users.items[0]));
      console.log('Sample user:', JSON.stringify(users.items[0], null, 2));
    }
    
    // Get a sample tour
    console.log('\n🎯 Sample Tour:');
    const tours = await pb.collection('tours').getList(1, 1);
    if (tours.items.length > 0) {
      console.log('Tour fields:', Object.keys(tours.items[0]));
      console.log('Sample tour:', JSON.stringify(tours.items[0], null, 2));
    }
    
    // Get a sample time slot
    console.log('\n⏰ Sample Time Slot:');
    const timeSlots = await pb.collection('time_slots').getList(1, 1);
    if (timeSlots.items.length > 0) {
      console.log('Time slot fields:', Object.keys(timeSlots.items[0]));
      console.log('Sample time slot:', JSON.stringify(timeSlots.items[0], null, 2));
    }
    
    // Get a sample booking
    console.log('\n📝 Sample Booking:');
    const bookings = await pb.collection('bookings').getList(1, 1);
    if (bookings.items.length > 0) {
      console.log('Booking fields:', Object.keys(bookings.items[0]));
      console.log('Sample booking:', JSON.stringify(bookings.items[0], null, 2));
    }
    
    // Get a sample QR code
    console.log('\n🔲 Sample QR Code:');
    const qrCodes = await pb.collection('qr_codes').getList(1, 1);
    if (qrCodes.items.length > 0) {
      console.log('QR code fields:', Object.keys(qrCodes.items[0]));
      console.log('Sample QR code:', JSON.stringify(qrCodes.items[0], null, 2));
    }
    
  } catch (error) {
    console.error('❌ Failed to analyze structure:', error.message);
  }
}

debugPocketBaseStructure(); 