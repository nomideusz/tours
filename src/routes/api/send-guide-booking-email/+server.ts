import { json, type RequestHandler } from '@sveltejs/kit';
import { db } from '$lib/db/connection.js';
import { bookings, tours, timeSlots, users } from '$lib/db/schema/index.js';
import { eq } from 'drizzle-orm';
import { sendEmail } from '$lib/email.server.js';
import { formatSlotTimeRange } from '$lib/utils/time-slot-client.js';
import { globalCurrencyFormatter } from '$lib/utils/currency.js';

export const POST: RequestHandler = async ({ request }) => {
  try {
    const { bookingId } = await request.json();

    if (!bookingId) {
      return json({ error: 'bookingId is required' }, { status: 400 });
    }

    // Fetch booking data with tour, guide, and time slot information
    const bookingData = await db.select({
      // Booking fields
      bookingId: bookings.id,
      customerName: bookings.customerName,
      customerEmail: bookings.customerEmail,
      customerPhone: bookings.customerPhone,
      participants: bookings.participants,
      totalAmount: bookings.totalAmount,
      bookingReference: bookings.bookingReference,
      specialRequests: bookings.specialRequests,
      createdAt: bookings.createdAt,
      // Tour fields
      tourName: tours.name,
      tourDescription: tours.description,
      tourPrice: tours.price,
      tourLocation: tours.location,
      // Guide fields
      guideName: users.name,
      guideEmail: users.email,
      // TimeSlot fields
      startTime: timeSlots.startTime,
      endTime: timeSlots.endTime,
    })
    .from(bookings)
    .innerJoin(tours, eq(bookings.tourId, tours.id))
    .innerJoin(users, eq(tours.userId, users.id))
    .innerJoin(timeSlots, eq(bookings.timeSlotId, timeSlots.id))
    .where(eq(bookings.id, bookingId))
    .limit(1);

    if (bookingData.length === 0) {
      return json({ error: 'Booking not found' }, { status: 404 });
    }

    const data = bookingData[0];
    
    // Format date and time
    const tourDate = data.startTime ? new Date(data.startTime).toLocaleDateString('en-GB') : 'TBD';
    const tourTime = data.startTime && data.endTime 
      ? formatSlotTimeRange(data.startTime.toISOString(), data.endTime.toISOString())
      : 'TBD';

    // Format total amount
    const formattedAmount = globalCurrencyFormatter(parseFloat(data.totalAmount || '0'));

    // Create email content
    const subject = `🎉 New Booking Received - ${data.tourName}`;
    
    const htmlContent = `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; border-radius: 12px 12px 0 0; text-align: center;">
          <h1 style="margin: 0; font-size: 28px; font-weight: 600;">🎉 New Booking!</h1>
          <p style="margin: 10px 0 0 0; opacity: 0.9; font-size: 16px;">You have a new customer for your tour</p>
        </div>
        
        <div style="background: white; padding: 30px; border-radius: 0 0 12px 12px; border: 1px solid #e5e7eb; border-top: none;">
          <div style="background: #f8fafc; padding: 20px; border-radius: 8px; margin-bottom: 25px;">
            <h2 style="margin: 0 0 15px 0; color: #1f2937; font-size: 20px;">Booking Details</h2>
            <div style="display: grid; gap: 12px;">
              <div style="display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #e5e7eb;">
                <span style="font-weight: 600; color: #374151;">Tour:</span>
                <span style="color: #6b7280;">${data.tourName}</span>
              </div>
              <div style="display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #e5e7eb;">
                <span style="font-weight: 600; color: #374151;">Reference:</span>
                <span style="color: #6b7280; font-family: monospace;">${data.bookingReference}</span>
              </div>
              <div style="display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #e5e7eb;">
                <span style="font-weight: 600; color: #374151;">Date:</span>
                <span style="color: #6b7280;">${tourDate}</span>
              </div>
              <div style="display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #e5e7eb;">
                <span style="font-weight: 600; color: #374151;">Time:</span>
                <span style="color: #6b7280;">${tourTime}</span>
              </div>
              <div style="display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #e5e7eb;">
                <span style="font-weight: 600; color: #374151;">Participants:</span>
                <span style="color: #6b7280;">${data.participants} ${data.participants === 1 ? 'person' : 'people'}</span>
              </div>
              <div style="display: flex; justify-content: space-between; padding: 8px 0;">
                <span style="font-weight: 600; color: #374151;">Total Amount:</span>
                <span style="color: #059669; font-weight: 600; font-size: 18px;">${formattedAmount}</span>
              </div>
            </div>
          </div>

          <div style="background: #f0f9ff; padding: 20px; border-radius: 8px; margin-bottom: 25px;">
            <h3 style="margin: 0 0 15px 0; color: #1f2937; font-size: 18px;">Customer Information</h3>
            <div style="display: grid; gap: 8px;">
              <div><strong>Name:</strong> ${data.customerName}</div>
              <div><strong>Email:</strong> <a href="mailto:${data.customerEmail}" style="color: #2563eb; text-decoration: none;">${data.customerEmail}</a></div>
              ${data.customerPhone ? `<div><strong>Phone:</strong> <a href="tel:${data.customerPhone}" style="color: #2563eb; text-decoration: none;">${data.customerPhone}</a></div>` : ''}
              ${data.specialRequests ? `<div><strong>Special Requests:</strong> ${data.specialRequests}</div>` : ''}
            </div>
          </div>

          <div style="text-align: center; margin: 30px 0;">
            <a href="https://zaur.app/bookings/${data.bookingId}" 
               style="background: #2563eb; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 600; display: inline-block;">
              View Booking Details
            </a>
          </div>

          <div style="background: #fef3c7; border: 1px solid #f59e0b; padding: 15px; border-radius: 8px; margin-top: 25px;">
            <p style="margin: 0; color: #92400e; font-size: 14px;">
              <strong>💡 Next Steps:</strong> Your customer has received their booking confirmation and QR ticket. 
              You can view all booking details in your dashboard and contact the customer directly if needed.
            </p>
          </div>

          <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
          
          <div style="text-align: center; color: #6b7280; font-size: 14px;">
            <p style="margin: 0;">
              This booking was automatically processed through Zaur.
              <br>
              <a href="https://zaur.app/dashboard" style="color: #2563eb; text-decoration: none;">Visit your dashboard</a> to manage all your bookings.
            </p>
          </div>
        </div>
      </div>
    `;

    const textContent = `
🎉 NEW BOOKING RECEIVED

Tour: ${data.tourName}
Reference: ${data.bookingReference}
Date: ${tourDate}
Time: ${tourTime}
Participants: ${data.participants} ${data.participants === 1 ? 'person' : 'people'}
Total Amount: ${formattedAmount}

CUSTOMER INFORMATION
Name: ${data.customerName}
Email: ${data.customerEmail}
${data.customerPhone ? `Phone: ${data.customerPhone}` : ''}
${data.specialRequests ? `Special Requests: ${data.specialRequests}` : ''}

View booking details: https://zaur.app/bookings/${data.bookingId}

Your customer has received their booking confirmation and QR ticket. You can view all booking details in your dashboard and contact the customer directly if needed.

---
Zaur - Tour Booking Platform
Visit your dashboard: https://zaur.app/dashboard
    `;

    // Send email to tour guide
    const emailResult = await sendEmail({
      to: data.guideEmail,
      subject,
      html: htmlContent,
      text: textContent
    });

    if (!emailResult.success) {
      throw new Error(emailResult.error || 'Failed to send email');
    }

    console.log(`✅ Guide notification email sent successfully for booking ${bookingId} to ${data.guideEmail}`);

    return json({
      success: true,
      message: 'Guide notification email sent successfully',
      messageId: emailResult.messageId,
      recipient: data.guideEmail
    });

  } catch (error) {
    console.error('Error in send-guide-booking-email API:', error);
    return json({
      error: 'Failed to send guide notification email',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}; 