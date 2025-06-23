import { baseTemplate } from '../components/base-template.js';
import { header, footer, contentWrapper, button, infoBox, tourDetails, list } from '../components/index.js';
import type { Booking, Tour, TimeSlot } from '$lib/types.js';
import { formatParticipantDisplay, formatEmailDateTime, formatEmailTime } from '../utils.js';

export interface TourReminderData {
  booking: Booking;
  tour: Tour;
  timeSlot: TimeSlot;
  tourOwnerCurrency?: string;
}

export function tourReminderTemplate(data: TourReminderData): string {
  const { booking, tour, timeSlot, tourOwnerCurrency } = data;
  const startTime = new Date(timeSlot.startTime);
  
  const content = `
    ${header()}
    ${contentWrapper(`
      <h2>⏰ Tour Tomorrow!</h2>
      <p>Hello ${booking.customerName},</p>
      <p>
        Just a friendly reminder that your tour <strong>${tour.name}</strong> is tomorrow! 
        We're looking forward to showing you an amazing experience.
      </p>
      
      ${infoBox({
        title: '🚨 Don\'t forget!',
        content: `
          <p style="margin: 0 0 10px 0; font-weight: 600;">Tour starts at ${formatEmailTime(startTime)}</p>
          <p style="margin: 0;">Please arrive 15 minutes early for check-in</p>
        `,
        variant: 'warning'
      })}
      
      ${tourDetails({
        reference: booking.bookingReference,
        tourName: tour.name,
        dateTime: formatEmailDateTime(startTime),
        participants: formatParticipantDisplay(booking),
        totalAmount: booking.totalAmount,
        meetingPoint: tour.location,
        status: '✅ Confirmed',
        currency: tourOwnerCurrency
      })}
      
      <h3>Before You Go</h3>
      ${list([
        { text: 'Check your QR ticket email (sent separately)', icon: '🎫' },
        { text: 'Save the QR code to your phone', icon: '📱' },
        { text: 'Check the weather forecast', icon: '🌤️' },
        { text: 'Plan your route to the meeting point', icon: '🗺️' },
        { text: 'Bring comfortable walking shoes', icon: '👟' }
      ])}
      
      ${button({
        text: 'View Your Ticket',
        href: `https://zaur.app/ticket/${booking.ticketQRCode || booking.bookingReference}`
      })}
      
      <p style="text-align: center; margin-top: 30px;">
        <strong>Need to cancel or reschedule?</strong><br>
        <span style="color: #6b7280; font-size: 14px;">
          Please contact your tour guide as soon as possible.
        </span>
      </p>
    `)}
    ${footer()}
  `;
  
  return baseTemplate({
    content,
    preheader: `Reminder: ${tour.name} is tomorrow at ${formatEmailTime(startTime)}!`
  });
}

export function tourReminderEmail(data: TourReminderData) {
  return {
    subject: `⏰ Reminder: ${data.tour.name} Tomorrow!`,
    html: tourReminderTemplate(data)
  };
} 