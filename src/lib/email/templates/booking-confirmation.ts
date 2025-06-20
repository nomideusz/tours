import { baseTemplate } from '../components/base-template.js';
import { header, footer, contentWrapper, button, infoBox, tourDetails, list } from '../components/index.js';
import type { Booking, Tour, TimeSlot } from '$lib/types.js';
import { formatParticipantDisplay, formatEmailDateTime } from '../utils.js';

export interface BookingConfirmationData {
  booking: Booking;
  tour: Tour;
  timeSlot: TimeSlot;
}

export function bookingConfirmationTemplate(data: BookingConfirmationData): string {
  const { booking, tour, timeSlot } = data;
  const startTime = new Date(timeSlot.startTime);
  
  const content = `
    ${header()}
    ${contentWrapper(`
      <h2>🎉 Booking Confirmed!</h2>
      <p>Hello ${booking.customerName},</p>
      <p>
        Great news! Your booking for <strong>${tour.name}</strong> has been confirmed. 
        We're excited to have you join us for this amazing experience!
      </p>
      
      ${infoBox({
        title: '✅ You\'re all set!',
        content: `<p style="margin: 0; color: #0c4a6e;">Your spot is secured and we can't wait to show you an unforgettable tour experience.</p>`,
        variant: 'success'
      })}
      
      ${tourDetails({
        reference: booking.bookingReference,
        tourName: tour.name,
        dateTime: formatEmailDateTime(startTime),
        participants: formatParticipantDisplay(booking),
        totalAmount: booking.totalAmount,
        meetingPoint: tour.location
      })}
      
      <h3>What happens next?</h3>
      ${list([
        { text: 'You\'ll receive your QR ticket 24 hours before the tour', icon: '🎫' },
        { text: 'A reminder email will be sent the day before', icon: '📧' },
        { text: 'Arrive 15 minutes early at the meeting point', icon: '⏰' },
        { text: 'Show your QR ticket to the tour guide', icon: '📱' }
      ])}
      
      ${button({
        text: 'View Your Booking',
        href: `https://zaur.app/ticket/${booking.ticketQRCode || booking.bookingReference}`
      })}
      
      <p style="text-align: center; color: #6b7280; font-size: 14px; margin-top: 30px;">
        Questions? Contact your tour guide or visit our help center.
      </p>
    `)}
    ${footer()}
  `;
  
  return baseTemplate({
    content,
    preheader: `Your booking for ${tour.name} is confirmed! Reference: ${booking.bookingReference}`
  });
}

export function bookingConfirmationEmail(data: BookingConfirmationData) {
  return {
    subject: `🎉 Booking Confirmed - ${data.tour.name}`,
    html: bookingConfirmationTemplate(data)
  };
} 