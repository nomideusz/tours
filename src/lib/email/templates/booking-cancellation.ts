import { baseTemplate } from '../components/base-template.js';
import { header, footer, contentWrapper, button, infoBox, tourDetails, list } from '../components/index.js';
import type { Booking, Tour, TimeSlot, User } from '$lib/types.js';
import { formatParticipantDisplay, formatEmailDateTime, formatCurrency } from '../utils.js';

export interface BookingCancellationData {
  booking: Booking;
  tour: Tour;
  timeSlot: TimeSlot;
  tourOwner?: User; // Add tour owner info for contact details
  tourOwnerCurrency?: string;
  cancellationReason?: 'weather' | 'illness' | 'emergency' | 'low_enrollment' | 'other';
  customMessage?: string;
  isBulkCancellation?: boolean; // true when entire time slot is cancelled
}

const reasonMessages = {
  weather: 'Due to weather conditions',
  illness: 'Due to guide illness',
  emergency: 'Due to an emergency',
  low_enrollment: 'Due to insufficient enrollment',
  other: 'Due to unforeseen circumstances'
};

export function bookingCancellationTemplate(data: BookingCancellationData): string {
  const { booking, tour, timeSlot, tourOwner, tourOwnerCurrency, cancellationReason, customMessage, isBulkCancellation } = data;
  const startTime = new Date(timeSlot.startTime);
  const reasonText = cancellationReason ? reasonMessages[cancellationReason] : 'Due to unforeseen circumstances';
  
  const content = `
    ${header()}
    ${contentWrapper(`
      <h2>❌ Tour Cancelled</h2>
      <p>Hello ${booking.customerName},</p>
      <p>
        We regret to inform you that your booking for <strong>${tour.name}</strong> has been cancelled.
      </p>
      
      ${infoBox({
        title: '📅 Cancelled Tour Details',
        content: tourDetails({
          reference: booking.bookingReference,
          tourName: tour.name,
          dateTime: formatEmailDateTime(startTime),
          participants: formatParticipantDisplay(booking),
          totalAmount: booking.totalAmount,
          meetingPoint: tour.location,
          currency: tourOwnerCurrency
        }),
        variant: 'warning'
      })}
      
      <h3>Cancellation Information</h3>
      ${infoBox({
        content: `
          <p style="margin: 5px 0;"><strong>Reason:</strong> ${reasonText}</p>
          ${customMessage ? `<p style="margin: 10px 0; font-style: italic;">"${customMessage}"</p>` : ''}
          ${isBulkCancellation ? '<p style="margin: 10px 0; color: #6b7280;">This time slot has been cancelled for all participants.</p>' : ''}
        `
      })}
      
      <h3>💰 Refund Information</h3>
      ${infoBox({
        title: 'Full Refund Processing',
        content: `
          <p style="margin: 5px 0;">Your payment of <strong>${formatCurrency(typeof booking.totalAmount === 'string' ? parseFloat(booking.totalAmount) : booking.totalAmount, tourOwnerCurrency || 'EUR')}</strong> will be refunded in full.</p>
          <p style="margin: 10px 0; color: #6b7280;">• Refunds typically appear within 5-10 business days</p>
          <p style="margin: 5px 0; color: #6b7280;">• You'll receive a confirmation when the refund is processed</p>
        `,
        variant: 'success'
      })}
      
      <h3>What's Next?</h3>
      ${list([
        { text: 'Your refund will be automatically processed', icon: '💳' },
        { text: 'No action required from your side', icon: '✅' },
        { text: 'Check out other available tours on our platform', icon: '🔍' },
        { text: 'Contact us if you have any questions', icon: '📧' }
      ])}
      
      ${button({
        text: 'Browse Other Tours',
        href: tourOwner?.username ? `https://zaur.app/${tourOwner.username}` : 'https://zaur.app'
      })}
      
      ${tourOwner ? `
        <div style="margin-top: 30px; padding: 20px; background-color: #f3f4f6; border-radius: 8px;">
          <h4 style="margin: 0 0 10px 0; color: #111827;">Need Help?</h4>
          <p style="margin: 5px 0; color: #6b7280;">
            If you have any questions about this cancellation or your refund, please don't hesitate to contact:
          </p>
          <p style="margin: 10px 0;">
            ${tourOwner.businessName ? `<strong>${tourOwner.businessName}</strong><br>` : ''}
            ${tourOwner.name ? `${tourOwner.name}<br>` : ''}
            ${tourOwner.email ? `Email: <a href="mailto:${tourOwner.email}" style="color: #3b82f6;">${tourOwner.email}</a><br>` : ''}
            ${tourOwner.phone ? `Phone: <a href="tel:${tourOwner.phone}" style="color: #3b82f6;">${tourOwner.phone}</a>` : ''}
          </p>
        </div>
      ` : ''}
      
      <p style="text-align: center; color: #6b7280; font-size: 14px; margin-top: 30px;">
        We apologize for any inconvenience caused and hope to serve you in the future.
      </p>
    `)}
    ${footer()}
  `;
  
  return baseTemplate({
    content,
    preheader: `Tour cancelled: ${tour.name} on ${formatEmailDateTime(startTime)}`
  });
}

export function bookingCancellationEmail(data: BookingCancellationData) {
  return {
    subject: `❌ Tour Cancelled: ${data.tour.name} - ${formatEmailDateTime(new Date(data.timeSlot.startTime))}`,
    html: bookingCancellationTemplate(data)
  };
} 