import { generateEmailContent } from '../components/index.js';
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
  const { recipient, subject, heading, message, ctaText, ctaUrl, footer } = data;
  
  // Convert message to HTML with proper line breaks
  const htmlMessage = message
    .split('\n\n')
    .map(paragraph => `<p style="margin: 0 0 16px 0; color: #4a5568; line-height: 1.6;">${paragraph.replace(/\n/g, '<br>')}</p>`)
    .join('');
  
  return generateEmailContent({
    subject,
    title: heading,
    sections: [
      {
        content: `
          <tr>
            <td style="padding: 0 24px;">
              <p style="font-size: 16px; color: #2d3748; margin: 0 0 8px 0;">
                Hi ${recipient.name || 'there'},
              </p>
            </td>
          </tr>
          <tr>
            <td style="padding: 0 24px;">
              ${htmlMessage}
            </td>
          </tr>
          ${ctaText && ctaUrl ? `
          <tr>
            <td style="padding: 24px; text-align: center;">
              <a href="${ctaUrl}" style="display: inline-block; background: #fa6b5d; color: white; padding: 12px 32px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px;">
                ${ctaText}
              </a>
            </td>
          </tr>
          ` : ''}
          ${footer ? `
          <tr>
            <td style="padding: 0 24px 24px 24px;">
              <p style="font-size: 14px; color: #718096; margin: 16px 0 0 0; font-style: italic;">
                ${footer}
              </p>
            </td>
          </tr>
          ` : ''}
        `
      }
    ]
  });
}
