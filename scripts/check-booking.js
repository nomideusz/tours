import { db } from '../src/lib/db/connection.ts';
import { bookings, payments, tours, timeSlots } from '../src/lib/db/schema/index.ts';
import { eq } from 'drizzle-orm';

const bookingId = process.argv[2];

if (!bookingId) {
  console.log('Usage: node check-booking.js <booking-id>');
  process.exit(1);
}

console.log(`Checking booking: ${bookingId}`);

try {
  // Get booking with all related data
  const bookingData = await db
    .select({
      // Booking fields
      id: bookings.id,
      status: bookings.status,
      paymentStatus: bookings.paymentStatus,
      paymentId: bookings.paymentId,
      totalAmount: bookings.totalAmount,
      participants: bookings.participants,
      customerName: bookings.customerName,
      customerEmail: bookings.customerEmail,
      bookingReference: bookings.bookingReference,
      ticketQRCode: bookings.ticketQRCode,
      attendanceStatus: bookings.attendanceStatus,
      createdAt: bookings.createdAt,
      updatedAt: bookings.updatedAt,
      
      // Tour fields
      tourName: tours.name,
      tourLocation: tours.location,
      
      // Time slot fields
      timeSlotStartTime: timeSlots.startTime,
      timeSlotEndTime: timeSlots.endTime
    })
    .from(bookings)
    .leftJoin(tours, eq(bookings.tourId, tours.id))
    .leftJoin(timeSlots, eq(bookings.timeSlotId, timeSlots.id))
    .where(eq(bookings.id, bookingId))
    .limit(1);

  if (bookingData.length === 0) {
    console.log('❌ Booking not found');
    process.exit(1);
  }

  const booking = bookingData[0];
  
  console.log('\n📋 BOOKING DETAILS:');
  console.log(`ID: ${booking.id}`);
  console.log(`Status: ${booking.status}`);
  console.log(`Payment Status: ${booking.paymentStatus}`);
  console.log(`Payment ID: ${booking.paymentId || 'None'}`);
  console.log(`Customer: ${booking.customerName} (${booking.customerEmail})`);
  console.log(`Tour: ${booking.tourName}`);
  console.log(`Reference: ${booking.bookingReference}`);
  console.log(`Ticket QR: ${booking.ticketQRCode || 'None'}`);
  console.log(`Total: €${booking.totalAmount}`);
  console.log(`Created: ${booking.createdAt}`);
  console.log(`Updated: ${booking.updatedAt}`);

  // Check for payment record if paymentId exists
  if (booking.paymentId) {
    console.log('\n💳 PAYMENT RECORD:');
    try {
      const paymentRecords = await db
        .select()
        .from(payments)
        .where(eq(payments.stripePaymentIntentId, booking.paymentId))
        .limit(1);

      if (paymentRecords.length > 0) {
        const payment = paymentRecords[0];
        console.log(`Payment ID: ${payment.id}`);
        console.log(`Stripe Intent: ${payment.stripePaymentIntentId}`);
        console.log(`Status: ${payment.status}`);
        console.log(`Amount: €${payment.amount}`);
        console.log(`Processing Fee: €${payment.processingFee}`);
        console.log(`Net Amount: €${payment.netAmount}`);
        console.log(`Created: ${payment.createdAt}`);
        console.log(`Updated: ${payment.updatedAt}`);
      } else {
        console.log('❌ No payment record found for payment ID');
      }
    } catch (err) {
      console.log('❌ Error fetching payment record:', err.message);
    }
  }

  // Check status and provide recommendations
  console.log('\n🔍 DIAGNOSIS:');
  
  if (booking.status === 'pending' && booking.paymentStatus === 'pending') {
    if (booking.paymentId) {
      console.log('⚠️  Payment was initiated but not completed');
      console.log('💡 Possible issues:');
      console.log('   - Customer didn\'t complete payment in Stripe');
      console.log('   - Payment failed and webhook hasn\'t processed yet');
      console.log('   - Webhook is not working correctly');
    } else {
      console.log('⚠️  No payment was initiated');
      console.log('💡 Customer may have abandoned the payment page');
    }
  } else if (booking.status === 'confirmed' && booking.paymentStatus === 'paid') {
    console.log('✅ Booking is fully confirmed and paid');
  } else {
    console.log(`⚠️  Unusual status combination: ${booking.status}/${booking.paymentStatus}`);
  }

  console.log('\n🛠️  MANUAL ACTIONS:');
  console.log(`1. To manually confirm payment:`);
  console.log(`   curl -X POST http://localhost:5173/api/confirm-payment \\`);
  console.log(`     -H "Content-Type: application/json" \\`);
  console.log(`     -d '{"bookingId":"${bookingId}"}'`);
  console.log('');
  console.log(`2. To check status via API:`);
  console.log(`   curl http://localhost:5173/api/bookings/${bookingId}/status`);

} catch (error) {
  console.error('❌ Error:', error);
} finally {
  process.exit(0);
} 