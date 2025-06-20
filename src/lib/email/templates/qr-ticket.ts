import { baseTemplate } from '../components/base-template.js';
import { header, footer, contentWrapper, infoBox, tourDetails, qrCode, list } from '../components/index.js';
import type { Booking, Tour, TimeSlot } from '$lib/types.js';
import { formatParticipantDisplay, formatEmailDateTime } from '../utils.js';
import { generateCheckInURL, getDisplayReference } from '$lib/ticket-qr.js';

export interface QRTicketData {
  booking: Booking;
  tour: Tour;
  timeSlot: TimeSlot;
}

export function qrTicketTemplate(data: QRTicketData): string {
  const { booking, tour, timeSlot } = data;
  const startTime = new Date(timeSlot.startTime);
  const ticketCode = booking.ticketQRCode;
  
  if (!ticketCode) {
    throw new Error('Ticket QR code is required for QR ticket email');
  }
  
  // Generate QR code URL and check-in URL
  const checkInURL = generateCheckInURL(ticketCode);
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(checkInURL)}`;
  const displayRef = getDisplayReference(ticketCode);
  
  const content = `
    ${header()}
    ${contentWrapper(`
      <h2>🎫 Your Digital Ticket</h2>
      <p>Hello ${booking.customerName},</p>
      <p>
        Your QR ticket for <strong>${tour.name}</strong> is ready! 
        Please save this email or screenshot the QR code below.
      </p>
      
      ${qrCode({
        qrCodeUrl,
        ticketCode,
        displayReference: displayRef
      })}
      
      ${infoBox({
        title: '📱 Important Instructions',
        content: list([
          { text: 'Save this email or screenshot your QR code' },
          { text: 'Present this ticket at the meeting point' },
          { text: 'Arrive 15 minutes before tour start time' },
          { text: 'This ticket is valid only for this specific tour' }
        ]),
        variant: 'warning'
      })}
      
      ${tourDetails({
        reference: booking.bookingReference,
        tourName: tour.name,
        dateTime: formatEmailDateTime(startTime),
        participants: formatParticipantDisplay(booking),
        totalAmount: booking.totalAmount,
        meetingPoint: tour.location
      })}
      
      <h3>Tour Day Checklist</h3>
      ${list([
        { text: 'QR ticket ready on your phone', icon: '📱' },
        { text: 'Comfortable walking shoes', icon: '👟' },
        { text: 'Weather-appropriate clothing', icon: '🌤️' },
        { text: 'Water and snacks if needed', icon: '💧' },
        { text: 'Camera for memories!', icon: '📸' }
      ])}
      
      <p style="text-align: center; color: #6b7280; font-size: 14px; margin-top: 30px;">
        Can't display the QR code? Your ticket code is: <strong>${displayRef}</strong>
      </p>
    `)}
    ${footer()}
  `;
  
  return baseTemplate({
    content,
    preheader: `Your QR ticket for ${tour.name} is ready! Tour starts ${formatEmailDateTime(startTime)}`
  });
}

export function qrTicketEmail(data: QRTicketData) {
  return {
    subject: `🎫 Your QR Ticket - ${data.tour.name}`,
    html: qrTicketTemplate(data)
  };
} 