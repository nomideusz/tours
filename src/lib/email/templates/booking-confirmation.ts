import { baseTemplate } from '../components/base-template.js';
import { header, footer, contentWrapper, button, infoBox, tourDetails, list, qrCode } from '../components/index.js';
import type { Booking, Tour, TimeSlot } from '$lib/types.js';
import { formatParticipantDisplay, formatEmailDateTime, formatCurrency } from '../utils.js';
import { generateCheckInURL, getDisplayReference } from '$lib/ticket-qr.js';

export interface BookingConfirmationData {
  booking: Booking;
  tour: Tour;
  timeSlot: TimeSlot;
  tourOwnerCurrency?: string;
}

export function bookingConfirmationTemplate(data: BookingConfirmationData): string {
  const { booking, tour, timeSlot, tourOwnerCurrency = 'EUR' } = data;
  const startTime = new Date(timeSlot.startTime);
  const ticketCode = booking.ticketQRCode;
  
  // Generate QR code URL if ticket code exists
  const hasQRCode = ticketCode ? true : false;
  const checkInURL = hasQRCode ? generateCheckInURL(ticketCode!) : '';
  const qrCodeUrl = hasQRCode ? `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(checkInURL)}` : '';
  const displayRef = hasQRCode ? getDisplayReference(ticketCode!) : booking.bookingReference;
  
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
      
      ${hasQRCode && ticketCode ? qrCode({
        qrCodeUrl,
        ticketCode,
        displayReference: displayRef
      }) : ''}
      
      ${tourDetails({
        reference: booking.bookingReference,
        tourName: tour.name,
        dateTime: formatEmailDateTime(startTime),
        participants: formatParticipantDisplay(booking),
        totalAmount: booking.totalAmount,
        meetingPoint: tour.location,
        currency: tourOwnerCurrency
      })}
      
      ${tour.duration ? `
        <p style="text-align: center; margin: 20px 0;">
          <strong>Duration:</strong> ${tour.duration} minutes
        </p>
      ` : ''}
      
      ${booking.participantBreakdown && (booking.participantBreakdown.adults > 0 || (booking.participantBreakdown.children || 0) > 0) ? `
        <div style="margin: 30px 0; padding: 20px; background: #f8f9fa; border-radius: 8px;">
          <h3 style="margin-top: 0;">💰 Pricing Breakdown</h3>
          ${booking.participantBreakdown.adults > 0 ? `
            <p style="display: flex; justify-content: space-between; margin: 10px 0;">
              <span>Adults (${booking.participantBreakdown.adults} × ${formatCurrency(parseFloat(tour.price), tourOwnerCurrency)})</span>
              <strong>${formatCurrency(parseFloat(tour.price) * booking.participantBreakdown.adults, tourOwnerCurrency)}</strong>
            </p>
          ` : ''}
          ${booking.participantBreakdown.children !== undefined && booking.participantBreakdown.children > 0 && tour.pricingTiers?.child ? `
            <p style="display: flex; justify-content: space-between; margin: 10px 0;">
              <span>Children (${booking.participantBreakdown.children} × ${formatCurrency(tour.pricingTiers.child, tourOwnerCurrency)})</span>
              <strong>${formatCurrency(tour.pricingTiers.child * booking.participantBreakdown.children, tourOwnerCurrency)}</strong>
            </p>
          ` : ''}
          <p style="display: flex; justify-content: space-between; margin: 10px 0; padding-top: 10px; border-top: 1px solid #dee2e6;">
            <span>Total Amount</span>
            <strong>${formatCurrency(parseFloat(booking.totalAmount), tourOwnerCurrency)}</strong>
          </p>
        </div>
      ` : ''}
      
      ${tour.includedItems && Array.isArray(tour.includedItems) && tour.includedItems.length > 0 ? `
        <h3>✅ What's Included</h3>
        ${list(tour.includedItems.map(item => ({ text: item, icon: '✓' })))}
      ` : ''}
      
      ${tour.requirements && Array.isArray(tour.requirements) && tour.requirements.length > 0 ? `
        <h3>📋 Requirements</h3>
        ${list(tour.requirements.map(req => ({ text: req })))}
      ` : ''}
      
      <h3>📱 Important Instructions</h3>
      ${list([
        { text: hasQRCode ? 'Save this email or screenshot your QR code' : 'Save this email with your booking reference', icon: '📧' },
        { text: 'Arrive 15 minutes before the tour starts', icon: '⏰' },
        { text: hasQRCode ? 'Show your QR code to the tour guide' : 'Give your booking reference to the tour guide', icon: '📱' },
        { text: 'Bring comfortable walking shoes and weather-appropriate clothing', icon: '👟' }
      ])}
      
      ${booking.specialRequests ? infoBox({
        title: '📝 Your Special Requests',
        content: `<p style="margin: 0;">${booking.specialRequests}</p>`,
        variant: 'default'
      }) : ''}
      
      ${tour.cancellationPolicy && typeof tour.cancellationPolicy === 'string' && tour.cancellationPolicy.trim() ? `
        <h3>🛡️ Cancellation Policy</h3>
        <div style="padding: 15px; background: #f8f9fa; border-radius: 8px; margin: 20px 0;">
          ${tour.cancellationPolicy.split('\n').map(line => `<p style="margin: 5px 0;">${line}</p>`).join('')}
        </div>
      ` : `
        <h3>🛡️ Cancellation Policy</h3>
        ${list([
          { text: 'Free cancellation up to 24 hours before the tour' },
          { text: '50% refund for cancellations within 24 hours' },
          { text: 'No refund for no-shows or cancellations after tour start time' },
          { text: 'Contact your tour guide directly for any changes' }
        ])}
      `}
      
      ${button({
        text: 'View Your Ticket',
        href: `https://zaur.app/ticket/${booking.ticketQRCode || booking.bookingReference}`
      })}
      
      <p style="text-align: center; color: #6b7280; font-size: 14px; margin-top: 30px;">
        ${hasQRCode ? `Can't display the QR code? Your ticket code is: <strong>${displayRef}</strong><br>` : ''}
        Questions? Contact your tour guide or visit our help center.
      </p>
    `)}
    ${footer()}
  `;
  
  return baseTemplate({
    content,
    preheader: `Your booking for ${tour.name} is confirmed! ${hasQRCode ? 'QR ticket included.' : ''} Reference: ${booking.bookingReference}`
  });
}

export function bookingConfirmationEmail(data: BookingConfirmationData) {
  return {
    subject: `🎉 Booking Confirmed + ${data.booking.ticketQRCode ? '🎫 QR Ticket' : 'Details'} - ${data.tour.name}`,
    html: bookingConfirmationTemplate(data)
  };
} 