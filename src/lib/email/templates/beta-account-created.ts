import { baseTemplate } from '../components/base-template.js';
import { header, contentWrapper, footer, button } from '../components/index.js';

export interface BetaAccountEmailData {
	name: string;
	email: string;
	temporaryPassword: string;
	betaGroup: 'beta_1' | 'beta_2';
	benefits: string;
	loginUrl?: string;
}

export function betaAccountCreatedEmail(data: BetaAccountEmailData): { subject: string; html: string } {
	const betaLabel = data.betaGroup === 'beta_1' ? 'Beta 1' : 'Beta 2';
	const emoji = data.betaGroup === 'beta_1' ? '🌟' : '🚀';
	
	return {
		subject: `${emoji} Welcome to Zaur ${betaLabel} - Your Account is Ready!`,
		html: baseTemplate({
			content: `
				${header()}
				${contentWrapper(`
					<h2 style="color: #1a1a1a; font-size: 24px; margin-bottom: 16px;">
						${emoji} Welcome to Zaur ${betaLabel}!
					</h2>
					
					<p style="color: #4a5568; font-size: 16px; line-height: 1.6; margin-bottom: 16px;">
						Hi ${data.name},
					</p>
					
					<p style="color: #4a5568; font-size: 16px; line-height: 1.6; margin-bottom: 24px;">
						Great news! Your ${betaLabel} application has been accepted, and your account is now ready. 
						You're part of an exclusive group helping shape the future of tour booking!
					</p>
					
					<!-- Benefits Card -->
					<div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border-radius: 12px; padding: 24px; margin-bottom: 24px;">
						<h3 style="color: #ffffff; font-size: 18px; margin: 0 0 12px 0; font-weight: 600;">
							🎁 Your ${betaLabel} Benefits
						</h3>
						<p style="color: #ffffff; font-size: 16px; margin: 0; line-height: 1.6;">
							${data.benefits}
						</p>
					</div>
					
					<!-- Login Credentials -->
					<div style="background: #f7fafc; border: 2px solid #e2e8f0; border-radius: 8px; padding: 20px; margin-bottom: 24px;">
						<h3 style="color: #2d3748; font-size: 16px; margin: 0 0 12px 0; font-weight: 600;">
							🔑 Your Login Credentials
						</h3>
						<p style="color: #4a5568; margin: 0 0 8px 0;">
							<strong>Email:</strong> ${data.email}
						</p>
						<p style="color: #4a5568; margin: 0 0 16px 0;">
							<strong>Temporary Password:</strong> 
							<code style="background: #ffffff; padding: 4px 8px; border-radius: 4px; font-family: 'Courier New', monospace; color: #e53e3e; border: 1px solid #feb2b2;">
								${data.temporaryPassword}
							</code>
						</p>
						<p style="color: #718096; font-size: 14px; margin: 0;">
							⚠️ <strong>Important:</strong> Please change this password after your first login for security.
						</p>
					</div>
					
					${button({
						text: 'Log In to Your Account',
						href: data.loginUrl || 'https://zaur.app/auth/login'
					})}
					
					<!-- Getting Started -->
					<div style="margin-top: 32px; padding-top: 24px; border-top: 1px solid #e2e8f0;">
						<h3 style="color: #2d3748; font-size: 16px; margin: 0 0 12px 0;">
							🎯 Next Steps
						</h3>
						<ol style="color: #4a5568; font-size: 15px; line-height: 1.8; margin: 0; padding-left: 20px;">
							<li>Log in using the credentials above</li>
							<li>Change your temporary password in settings</li>
							<li>Complete your profile setup</li>
							<li>Create your first tour experience</li>
							<li>Start accepting bookings!</li>
						</ol>
					</div>
					
					<!-- Support -->
					<div style="margin-top: 32px; padding: 20px; background: #edf2f7; border-radius: 8px;">
						<p style="color: #4a5568; font-size: 14px; margin: 0 0 8px 0;">
							<strong>Need help getting started?</strong>
						</p>
						<p style="color: #718096; font-size: 14px; margin: 0;">
							We're here to help! Reply to this email or reach out to us at 
							<a href="mailto:support@zaur.app" style="color: #e8523e; text-decoration: none;">support@zaur.app</a>
						</p>
					</div>
					
					<p style="color: #4a5568; font-size: 16px; line-height: 1.6; margin-top: 32px;">
						Welcome aboard! 🎉<br/>
						<strong>The Zaur Team</strong>
					</p>
				`)}
				${footer()}
			`
		})
	};
}

