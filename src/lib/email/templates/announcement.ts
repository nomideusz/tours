import { baseTemplate } from '../components/base-template.js';
import { header, footer } from '../components/index.js';
import type { User } from '$lib/types.js';

export interface AnnouncementEmailData {
  recipient: User;
  subject: string;
  heading: string;
  message: string;
  ctaText?: string;
  ctaUrl?: string;
  footer?: string;
}

export function announcementEmail(data: AnnouncementEmailData) {
  const { recipient, subject, heading, message, ctaText, ctaUrl, footer: footerText } = data;
  
  // Convert message to HTML with proper line breaks
  const htmlMessage = message
    .split('\n\n')
    .map(paragraph => `<p style="margin: 0 0 16px 0; color: #4a5568; line-height: 1.6;">${paragraph.replace(/\n/g, '<br>')}</p>`)
    .join('');
  
  const content = `
    ${header()}
    <tr>
      <td style="padding: 30px;">
        <h2 style="font-size: 24px; color: #2d3748; margin: 0 0 20px 0; font-weight: 600;">
          ${heading}
        </h2>
        <p style="font-size: 16px; color: #2d3748; margin: 0 0 8px 0;">
          Hi ${recipient.name || 'there'},
        </p>
        ${htmlMessage}
        ${ctaText && ctaUrl ? `
        <div style="text-align: center; margin: 30px 0;">
          <a href="${ctaUrl}" style="display: inline-block; background: #fa6b5d; color: white; padding: 12px 32px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px;">
            ${ctaText}
          </a>
        </div>
        ` : ''}
        ${footerText ? `
        <p style="font-size: 14px; color: #718096; margin: 20px 0 0 0; font-style: italic;">
          ${footerText}
        </p>
        ` : ''}
      </td>
    </tr>
    ${footer()}
  `;
  
  return {
    subject,
    html: baseTemplate({ content })
  };
}
