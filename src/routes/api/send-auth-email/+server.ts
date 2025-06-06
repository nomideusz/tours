import { json, type RequestHandler } from '@sveltejs/kit';
import { sendAuthEmail, type AuthEmailType } from '$lib/email.server.js';

export const POST: RequestHandler = async ({ request }) => {
  try {
    const { emailType, email, name, resetUrl, verificationUrl, newEmail } = await request.json();

    if (!emailType || !email) {
      return json({ error: 'emailType and email are required' }, { status: 400 });
    }

    // Validate email type
    const validTypes: AuthEmailType[] = ['password-reset', 'email-verification', 'welcome', 'email-changed'];
    if (!validTypes.includes(emailType as AuthEmailType)) {
      return json({ error: 'Invalid email type' }, { status: 400 });
    }

    // Validate required fields based on email type
    if (emailType === 'password-reset' && !resetUrl) {
      return json({ error: 'resetUrl is required for password-reset emails' }, { status: 400 });
    }

    if (emailType === 'email-verification' && !verificationUrl) {
      return json({ error: 'verificationUrl is required for email-verification emails' }, { status: 400 });
    }

    if (emailType === 'email-changed' && !newEmail) {
      return json({ error: 'newEmail is required for email-changed emails' }, { status: 400 });
    }

    // Send the email
    const emailResult = await sendAuthEmail(emailType as AuthEmailType, {
      email,
      name,
      resetUrl,
      verificationUrl,
      newEmail
    });

    if (!emailResult.success) {
      throw new Error(emailResult.error || 'Failed to send email');
    }

    console.log(`✅ ${emailType} email sent successfully to ${email}`);

    return json({
      success: true,
      message: `${emailType} email sent successfully`,
      messageId: emailResult.messageId,
      recipient: email
    });

  } catch (error) {
    console.error('Error in send-auth-email API:', error);
    return json({
      error: 'Failed to send email',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}; 