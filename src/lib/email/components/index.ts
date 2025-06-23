import { emailStyles } from '../styles.js';
import { formatCurrency } from '../utils.js';

// Header component with Zaur branding
export function header(): string {
  return `
    <tr>
      <td style="padding: 30px 30px 20px 30px; text-align: center; border-bottom: 1px solid ${emailStyles.colors.border.light};">
        <h1 style="font-size: 32px; color: ${emailStyles.colors.primary}; margin: 0; font-weight: 700;">
          Zaur
        </h1>
        <p style="margin: 5px 0 0 0; color: ${emailStyles.colors.text.tertiary}; font-size: 14px;">
          Tour Experiences Made Simple
        </p>
      </td>
    </tr>
  `;
}

// Footer component
export function footer(): string {
  return `
    <tr>
      <td class="footer">
        <p>© ${new Date().getFullYear()} Zaur - Tour Experiences</p>
        <p>
          <a href="https://zaur.app" style="color: ${emailStyles.colors.primary};">zaur.app</a> • 
          <a href="https://zaur.app/help" style="color: ${emailStyles.colors.primary};">Help Center</a>
        </p>
        <p style="font-size: 12px; color: ${emailStyles.colors.text.light};">
          You received this email because of your booking or account with Zaur.
        </p>
      </td>
    </tr>
  `;
}

// Button component
export interface ButtonProps {
  text: string;
  href: string;
  variant?: 'primary' | 'success' | 'danger';
}

export function button({ text, href, variant = 'primary' }: ButtonProps): string {
  const variantClass = variant === 'primary' ? '' : `button-${variant}`;
  return `
    <div class="button-center">
      <a href="${href}" class="button ${variantClass}">
        ${text}
      </a>
    </div>
  `;
}

// Info box component
export interface InfoBoxProps {
  title?: string;
  content: string;
  variant?: 'default' | 'success' | 'warning';
  icon?: string;
}

export function infoBox({ title, content, variant = 'default', icon }: InfoBoxProps): string {
  const variantClass = variant === 'default' ? 'info-box' : `info-box info-box-${variant}`;
  const titleColor = variant === 'warning' ? emailStyles.colors.danger : 
                     variant === 'success' ? '#0c4a6e' : 
                     emailStyles.colors.text.primary;
  
  return `
    <div class="${variantClass}">
      ${title ? `
        <h3 style="color: ${titleColor}; margin-top: 0; margin-bottom: 15px;">
          ${icon ? `${icon} ` : ''}${title}
        </h3>
      ` : ''}
      ${content}
    </div>
  `;
}

// Tour details component
export interface TourDetailsProps {
  reference: string;
  tourName: string;
  dateTime: string;
  participants: string;
  totalAmount: string | number;
  meetingPoint?: string;
  status?: string;
  currency?: string;
}

export function tourDetails(props: TourDetailsProps): string {
  const details = [
    { label: 'Reference', value: props.reference },
    { label: 'Tour', value: props.tourName },
    { label: 'Date & Time', value: props.dateTime },
    { label: 'Participants', value: props.participants },
    { label: 'Total Amount', value: typeof props.totalAmount === 'number' 
        ? formatCurrency(props.totalAmount, props.currency || 'EUR') 
        : props.totalAmount }
  ];

  if (props.meetingPoint) {
    details.push({ label: 'Meeting Point', value: props.meetingPoint });
  }

  if (props.status) {
    details.push({ label: 'Status', value: props.status });
  }

  const detailsHtml = details.map(detail => 
    `<p style="margin: 5px 0;"><strong>${detail.label}:</strong> ${detail.value}</p>`
  ).join('');

  return infoBox({
    title: '📋 Tour Details',
    content: detailsHtml
  });
}

// QR code component
export interface QRCodeProps {
  qrCodeUrl: string;
  ticketCode: string;
  displayReference: string;
}

export function qrCode({ qrCodeUrl, ticketCode, displayReference }: QRCodeProps): string {
  return `
    <div class="qr-container">
      <h3 style="margin-top: 0; margin-bottom: 15px; color: ${emailStyles.colors.text.primary};">
        📱 Your QR Ticket
      </h3>
      <img src="${qrCodeUrl}" alt="QR Ticket" class="qr-code" />
      <p style="font-size: 14px; color: ${emailStyles.colors.text.secondary}; margin: 15px 0 5px 0; font-weight: 600;">
        Ticket Code: ${displayReference}
      </p>
      <p style="font-size: 12px; color: ${emailStyles.colors.text.tertiary}; margin: 0;">
        <strong>Show this QR code to your tour guide</strong>
      </p>
    </div>
  `;
}

// List component
export interface ListItem {
  text: string;
  icon?: string;
}

export function list(items: ListItem[]): string {
  const itemsHtml = items.map(item => 
    `<li style="margin-bottom: 8px;">${item.icon ? `${item.icon} ` : ''}${item.text}</li>`
  ).join('');
  
  return `
    <ul style="margin: 0 0 25px 0; padding-left: 20px; color: ${emailStyles.colors.text.secondary};">
      ${itemsHtml}
    </ul>
  `;
}

// Divider component
export function divider(): string {
  return `
    <tr>
      <td style="padding: 20px 0;">
        <div style="border-top: 1px solid ${emailStyles.colors.border.light};"></div>
      </td>
    </tr>
  `;
}

// Content wrapper
export function contentWrapper(content: string): string {
  return `
    <tr>
      <td class="email-content">
        <div class="content">
          ${content}
        </div>
      </td>
    </tr>
  `;
} 