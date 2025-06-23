import { baseTemplate } from '../components/base-template.js';
import { header, footer, contentWrapper, button, infoBox, tourDetails, list } from '../components/index.js';
import type { Booking, Tour, TimeSlot } from '$lib/types.js';
import { formatParticipantDisplay, formatEmailDateTime, formatCurrency } from '../utils.js';

export interface GuideBookingNotificationData {
  booking: Booking;
  tour: Tour;
  timeSlot: TimeSlot;
  guideName?: string;
  guideCurrency?: string;
}

export function guideBookingNotificationTemplate(data: GuideBookingNotificationData): string {
  const { booking, tour, timeSlot, guideName, guideCurrency } = data;
  const startTime = new Date(timeSlot.startTime);
  
  const content = `
    ${header()}
    ${contentWrapper(`
      <h2>🎉 New Booking Received!</h2>
      <p>Hello ${guideName || 'Tour Guide'},</p>
      <p>
        Great news! You have a new booking for <strong>${tour.name}</strong>. 
        ${booking.customerName} has just booked your tour.
      </p>
      
      ${infoBox({
        title: '💰 Payment Confirmed',
        content: `<p style="margin: 0; color: #059669; font-weight: 600;">Amount: ${formatCurrency(typeof booking.totalAmount === 'string' ? parseFloat(booking.totalAmount) : booking.totalAmount, guideCurrency || 'EUR')}</p>`,
        variant: 'success'
      })}
      
      ${tourDetails({
        reference: booking.bookingReference,
        tourName: tour.name,
        dateTime: formatEmailDateTime(startTime),
        participants: formatParticipantDisplay(booking),
        totalAmount: booking.totalAmount,
        meetingPoint: tour.location,
        status: '✅ Confirmed'
      })}
      
      <h3>Customer Information</h3>
      ${infoBox({
        content: `
          <p style="margin: 5px 0;"><strong>Name:</strong> ${booking.customerName}</p>
          <p style="margin: 5px 0;"><strong>Email:</strong> ${booking.customerEmail}</p>
          ${booking.customerPhone ? `<p style="margin: 5px 0;"><strong>Phone:</strong> ${booking.customerPhone}</p>` : ''}
          ${booking.specialRequests ? `<p style="margin: 5px 0;"><strong>Special Requests:</strong> ${booking.specialRequests}</p>` : ''}
        `
      })}
      
      <h3>Next Steps</h3>
      ${list([
        { text: 'Customer will receive their QR ticket via email', icon: '🎫' },
        { text: 'They\'ll get a reminder 24 hours before the tour', icon: '📧' },
        { text: 'Use the QR scanner on tour day for check-in', icon: '📱' },
        { text: 'Contact customer if you need to make any changes', icon: '☎️' }
      ])}
      
      ${button({
        text: 'View Booking Details',
        href: `https://zaur.app/bookings/${booking.id}`
      })}
      
      <p style="text-align: center; color: #6b7280; font-size: 14px; margin-top: 30px;">
        Need help? Visit our guide support center or contact us.
      </p>
    `)}
    ${footer()}
  `;
  
  return baseTemplate({
    content,
    preheader: `New booking: ${booking.customerName} booked ${tour.name} for ${formatEmailDateTime(startTime)}`
  });
}

export function guideBookingNotificationEmail(data: GuideBookingNotificationData) {
  return {
    subject: `🎉 New Booking: ${data.booking.customerName} - ${data.tour.name}`,
    html: guideBookingNotificationTemplate(data)
  };
} 