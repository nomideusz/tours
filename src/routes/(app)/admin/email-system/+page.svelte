<script lang="ts">
	import { createQuery } from '@tanstack/svelte-query';
	import PageContainer from '$lib/components/PageContainer.svelte';
	import Mail from 'lucide-svelte/icons/mail';
	import Send from 'lucide-svelte/icons/send';
	import TestTube from 'lucide-svelte/icons/test-tube';
	import MessageSquare from 'lucide-svelte/icons/message-square';
	import Users from 'lucide-svelte/icons/users';
	import CheckCircle from 'lucide-svelte/icons/check-circle';
	import XCircle from 'lucide-svelte/icons/x-circle';
	import Loader2 from 'lucide-svelte/icons/loader-2';
	import AlertCircle from 'lucide-svelte/icons/alert-circle';
	import Eye from 'lucide-svelte/icons/eye';
	import Megaphone from 'lucide-svelte/icons/megaphone';

	// State
	let activeTab = $state<'test' | 'announcement' | 'whatsapp'>('test');
	let isLoading = $state(false);
	let results = $state<Array<{ time: string; action: string; status: 'success' | 'error'; message: string }>>([]);

	// Test emails state
	let selectedTemplate = $state<'customer-confirmation' | 'guide-notification' | 'tour-reminder'>('customer-confirmation');
	let testBookingId = $state('');

	// Announcement state
	let announcementSubject = $state('');
	let announcementHeading = $state('');
	let announcementMessage = $state('');
	let announcementCTA = $state('');
	let announcementCTAUrl = $state('');
	let announcementFooter = $state('');
	let announcementTarget = $state<'all' | 'active' | 'beta'>('all');
	
	// WhatsApp test state
	let whatsappPhone = $state('');
	let whatsappBookingId = $state('');

	// Fetch recent bookings for testing
	let bookingsQuery = $derived(createQuery({
		queryKey: ['recent-bookings-for-email'],
		queryFn: async () => {
			const response = await fetch('/api/bookings/recent?limit=10');
			if (!response.ok) throw new Error('Failed to fetch bookings');
			return response.json();
		}
	}));

	let recentBookings = $derived($bookingsQuery.data || []);

	async function testEmail() {
		isLoading = true;
		try {
			const response = await fetch('/api/test-booking-emails', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					action: selectedTemplate,
					bookingId: testBookingId || undefined
				})
			});

			const result = await response.json();

			if (response.ok) {
				results = [{ 
					time: new Date().toLocaleTimeString(), 
					action: `Test ${selectedTemplate}`, 
					status: 'success', 
					message: result.message 
				}, ...results];
			} else {
				throw new Error(result.error || 'Unknown error');
			}
		} catch (error) {
			results = [{ 
				time: new Date().toLocaleTimeString(), 
				action: `Test ${selectedTemplate}`, 
				status: 'error', 
				message: error instanceof Error ? error.message : 'Unknown error' 
			}, ...results];
		} finally {
			isLoading = false;
		}
	}

	async function sendAnnouncement() {
		if (!announcementSubject || !announcementHeading || !announcementMessage) {
			results = [{ 
				time: new Date().toLocaleTimeString(), 
				action: 'Send Announcement', 
				status: 'error', 
				message: 'Subject, heading, and message are required' 
			}, ...results];
			return;
		}

		isLoading = true;
		try {
			const response = await fetch('/api/admin/send-announcement', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					subject: announcementSubject,
					heading: announcementHeading,
					message: announcementMessage,
					ctaText: announcementCTA || undefined,
					ctaUrl: announcementCTAUrl || undefined,
					footer: announcementFooter || undefined,
					target: announcementTarget
				})
			});

			const result = await response.json();

			if (response.ok) {
				results = [{ 
					time: new Date().toLocaleTimeString(), 
					action: 'Send Announcement', 
					status: 'success', 
					message: `Sent to ${result.sentCount} users` 
				}, ...results];
				
				// Clear form
				announcementSubject = '';
				announcementHeading = '';
				announcementMessage = '';
				announcementCTA = '';
				announcementCTAUrl = '';
				announcementFooter = '';
			} else {
				throw new Error(result.error || 'Unknown error');
			}
		} catch (error) {
			results = [{ 
				time: new Date().toLocaleTimeString(), 
				action: 'Send Announcement', 
				status: 'error', 
				message: error instanceof Error ? error.message : 'Unknown error' 
			}, ...results];
		} finally {
			isLoading = false;
		}
	}

	async function testWhatsApp() {
		if (!whatsappPhone) {
			results = [{ 
				time: new Date().toLocaleTimeString(), 
				action: 'Test WhatsApp', 
				status: 'error', 
				message: 'Phone number is required' 
			}, ...results];
			return;
		}

		isLoading = true;
		try {
			const response = await fetch('/api/test-whatsapp', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					phone: whatsappPhone,
					bookingId: whatsappBookingId || undefined
				})
			});

			const result = await response.json();

			if (response.ok) {
				results = [{ 
					time: new Date().toLocaleTimeString(), 
					action: 'Test WhatsApp', 
					status: 'success', 
					message: result.message 
				}, ...results];
			} else {
				throw new Error(result.error || 'Unknown error');
			}
		} catch (error) {
			results = [{ 
				time: new Date().toLocaleTimeString(), 
				action: 'Test WhatsApp', 
				status: 'error', 
				message: error instanceof Error ? error.message : 'Unknown error' 
			}, ...results];
		} finally {
			isLoading = false;
		}
	}

	function clearResults() {
		results = [];
	}
</script>

<svelte:head>
	<title>Email System - Admin</title>
</svelte:head>

<PageContainer>
<div class="email-system">
	<div class="header">
		<div class="header-content">
			<Mail class="w-10 h-10 text-primary" />
			<div>
				<h1>Email & Messaging System</h1>
				<p>Test templates, send announcements, and manage communications</p>
			</div>
		</div>
	</div>

	<div class="tabs">
		<button 
			class="tab {activeTab === 'test' ? 'active' : ''}"
			onclick={() => activeTab = 'test'}
		>
			<TestTube class="w-4 h-4" />
			Test Emails
		</button>
		<button 
			class="tab {activeTab === 'announcement' ? 'active' : ''}"
			onclick={() => activeTab = 'announcement'}
		>
			<Megaphone class="w-4 h-4" />
			Send Announcement
		</button>
		<button 
			class="tab {activeTab === 'whatsapp' ? 'active' : ''}"
			onclick={() => activeTab = 'whatsapp'}
		>
			<MessageSquare class="w-4 h-4" />
			Test WhatsApp
		</button>
	</div>

	<!-- Test Emails Tab -->
	{#if activeTab === 'test'}
		<div class="tab-content">
			<div class="section-card">
				<div class="section-header">
					<TestTube class="w-5 h-5 text-primary" />
					<h2>Test Email Templates</h2>
				</div>
				
				<div class="form-group">
					<label for="template">Email Template</label>
					<select id="template" bind:value={selectedTemplate}>
						<option value="customer-confirmation">Customer Booking Confirmation</option>
						<option value="guide-notification">Guide Booking Notification</option>
						<option value="tour-reminder">Tour Reminder (24h before)</option>
					</select>
					<p class="help-text">Select which email template to test</p>
				</div>

				<div class="form-group">
					<label for="bookingId">Booking (Optional)</label>
					<select id="bookingId" bind:value={testBookingId}>
						<option value="">Use most recent booking</option>
						{#each recentBookings as booking}
							<option value={booking.id}>
								{booking.bookingReference} - {booking.customerName} - {booking.tour?.name}
							</option>
						{/each}
					</select>
					<p class="help-text">Leave empty to use the most recent booking</p>
				</div>

				<button 
					class="btn-primary" 
					onclick={testEmail}
					disabled={isLoading}
				>
					{#if isLoading}
						<Loader2 class="w-4 h-4 animate-spin" />
					{:else}
						<Send class="w-4 h-4" />
					{/if}
					Send Test Email
				</button>

				<div class="info-box">
					<AlertCircle class="w-5 h-5 text-info" />
					<div>
						<strong>Test emails will be sent to your admin email address.</strong>
						<p>This uses real booking data to show exactly how emails will look to customers and guides.</p>
					</div>
				</div>
			</div>
		</div>
	{/if}

	<!-- Send Announcement Tab -->
	{#if activeTab === 'announcement'}
		<div class="tab-content">
			<div class="section-card">
				<div class="section-header">
					<Megaphone class="w-5 h-5 text-primary" />
					<h2>Send Announcement</h2>
				</div>

				<div class="form-group">
					<label for="target">Send To</label>
					<select id="target" bind:value={announcementTarget}>
						<option value="all">All Users</option>
						<option value="active">Active Users Only</option>
						<option value="beta">Beta Users Only</option>
					</select>
				</div>

				<div class="form-group">
					<label for="subject">Email Subject *</label>
					<input 
						type="text" 
						id="subject" 
						bind:value={announcementSubject}
						placeholder="e.g., New Features Released!"
					/>
				</div>

				<div class="form-group">
					<label for="heading">Email Heading *</label>
					<input 
						type="text" 
						id="heading" 
						bind:value={announcementHeading}
						placeholder="e.g., Exciting Updates for Your Tours"
					/>
				</div>

				<div class="form-group">
					<label for="message">Message *</label>
					<textarea 
						id="message" 
						bind:value={announcementMessage}
						placeholder="Write your announcement message here... Use double line breaks for paragraphs."
						rows="8"
					></textarea>
					<p class="help-text">Supports paragraphs (double line break) and line breaks</p>
				</div>

				<div class="form-row">
					<div class="form-group">
						<label for="cta-text">Call-to-Action Text (Optional)</label>
						<input 
							type="text" 
							id="cta-text" 
							bind:value={announcementCTA}
							placeholder="e.g., Check It Out"
						/>
					</div>

					<div class="form-group">
						<label for="cta-url">Call-to-Action URL (Optional)</label>
						<input 
							type="url" 
							id="cta-url" 
							bind:value={announcementCTAUrl}
							placeholder="https://zaur.app/..."
						/>
					</div>
				</div>

				<div class="form-group">
					<label for="footer">Footer Text (Optional)</label>
					<textarea 
						id="footer" 
						bind:value={announcementFooter}
						placeholder="e.g., Questions? Reply to this email anytime."
						rows="2"
					></textarea>
				</div>

				<button 
					class="btn-primary" 
					onclick={sendAnnouncement}
					disabled={isLoading || !announcementSubject || !announcementHeading || !announcementMessage}
				>
					{#if isLoading}
						<Loader2 class="w-4 h-4 animate-spin" />
					{:else}
						<Send class="w-4 h-4" />
					{/if}
					Send Announcement
				</button>

				<div class="warning-box">
					<AlertCircle class="w-5 h-5 text-warning" />
					<div>
						<strong>This will send emails to real users!</strong>
						<p>Make sure to review your message carefully before sending.</p>
					</div>
				</div>
			</div>
		</div>
	{/if}

	<!-- Test WhatsApp Tab -->
	{#if activeTab === 'whatsapp'}
		<div class="tab-content">
			<div class="section-card">
				<div class="section-header">
					<MessageSquare class="w-5 h-5 text-primary" />
					<h2>Test WhatsApp Notifications</h2>
				</div>

				<div class="form-group">
					<label for="phone">Phone Number *</label>
					<input 
						type="tel" 
						id="phone" 
						bind:value={whatsappPhone}
						placeholder="+1234567890"
					/>
					<p class="help-text">Include country code (e.g., +1 for US)</p>
				</div>

				<div class="form-group">
					<label for="whatsapp-booking">Booking (Optional)</label>
					<select id="whatsapp-booking" bind:value={whatsappBookingId}>
						<option value="">Use most recent booking</option>
						{#each recentBookings as booking}
							<option value={booking.id}>
								{booking.bookingReference} - {booking.customerName} - {booking.tour?.name}
							</option>
						{/each}
					</select>
				</div>

				<button 
					class="btn-primary" 
					onclick={testWhatsApp}
					disabled={isLoading || !whatsappPhone}
				>
					{#if isLoading}
						<Loader2 class="w-4 h-4 animate-spin" />
					{:else}
						<MessageSquare class="w-4 h-4" />
					{/if}
					Send Test WhatsApp
				</button>

				<div class="info-box">
					<AlertCircle class="w-5 h-5 text-info" />
					<div>
						<strong>WhatsApp requires Professional+ subscription</strong>
						<p>Test messages will use real booking data and your WhatsApp Business template.</p>
					</div>
				</div>
			</div>
		</div>
	{/if}

	<!-- Activity Log -->
	<div class="activity-log">
		<div class="log-header">
			<h3>Activity Log</h3>
			{#if results.length > 0}
				<button class="btn-text" onclick={clearResults}>Clear</button>
			{/if}
		</div>

		{#if results.length === 0}
			<div class="empty-state">
				<Eye class="w-12 h-12 text-tertiary" />
				<p>No activity yet</p>
			</div>
		{:else}
			<div class="log-items">
				{#each results as result}
					<div class="log-item {result.status}">
						<div class="log-icon">
							{#if result.status === 'success'}
								<CheckCircle class="w-5 h-5 text-success" />
							{:else}
								<XCircle class="w-5 h-5 text-danger" />
							{/if}
						</div>
						<div class="log-content">
							<div class="log-header-row">
								<span class="log-action">{result.action}</span>
								<span class="log-time">{result.time}</span>
							</div>
							<p class="log-message">{result.message}</p>
						</div>
					</div>
				{/each}
			</div>
		{/if}
	</div>
</div>
</PageContainer>

<style>
	.email-system {
		max-width: 1000px;
		margin: 0 auto;
	}

	.header {
		margin-bottom: 2rem;
	}

	.header-content {
		display: flex;
		align-items: center;
		gap: 1rem;
		padding-bottom: 2rem;
		border-bottom: 1px solid var(--border-primary);
	}

	.header-content h1 {
		margin: 0;
		font-size: 2rem;
		font-weight: 700;
		color: var(--text-primary);
	}

	.header-content p {
		margin: 0.25rem 0 0 0;
		color: var(--text-secondary);
	}

	.tabs {
		display: flex;
		gap: 0.5rem;
		margin-bottom: 2rem;
		border-bottom: 2px solid var(--border-primary);
	}

	.tab {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		padding: 0.75rem 1.5rem;
		background: none;
		border: none;
		border-bottom: 2px solid transparent;
		margin-bottom: -2px;
		color: var(--text-secondary);
		font-size: 0.875rem;
		font-weight: 500;
		cursor: pointer;
		transition: all 0.15s ease;
	}

	.tab:hover {
		color: var(--text-primary);
		background: var(--bg-secondary);
	}

	.tab.active {
		color: var(--color-primary-600);
		border-bottom-color: var(--color-primary-600);
	}

	.tab-content {
		margin-bottom: 2rem;
	}

	.section-card {
		background: var(--bg-primary);
		border: 1px solid var(--border-primary);
		border-radius: 0.75rem;
		padding: 2rem;
	}

	.section-header {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		margin-bottom: 1.5rem;
	}

	.section-header h2 {
		margin: 0;
		font-size: 1.25rem;
		font-weight: 600;
		color: var(--text-primary);
	}

	.form-group {
		margin-bottom: 1.5rem;
	}

	.form-row {
		display: grid;
		grid-template-columns: repeat(2, 1fr);
		gap: 1rem;
	}

	label {
		display: block;
		margin-bottom: 0.5rem;
		font-size: 0.875rem;
		font-weight: 500;
		color: var(--text-primary);
	}

	input, select, textarea {
		width: 100%;
		padding: 0.625rem 0.875rem;
		background: var(--bg-primary);
		border: 1px solid var(--border-primary);
		border-radius: 0.5rem;
		color: var(--text-primary);
		font-size: 0.875rem;
		transition: all 0.15s ease;
	}

	input:focus, select:focus, textarea:focus {
		outline: none;
		border-color: var(--color-primary-400);
		box-shadow: 0 0 0 3px var(--color-primary-100);
	}

	textarea {
		resize: vertical;
		font-family: inherit;
	}

	.help-text {
		margin: 0.5rem 0 0 0;
		font-size: 0.75rem;
		color: var(--text-tertiary);
	}

	.btn-primary {
		display: inline-flex;
		align-items: center;
		gap: 0.5rem;
		padding: 0.75rem 1.5rem;
		background: var(--color-primary-600);
		color: white;
		border: none;
		border-radius: 0.5rem;
		font-size: 0.875rem;
		font-weight: 500;
		cursor: pointer;
		transition: all 0.15s ease;
	}

	.btn-primary:hover:not(:disabled) {
		background: var(--color-primary-700);
		transform: translateY(-1px);
	}

	.btn-primary:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}

	.btn-text {
		padding: 0.5rem;
		background: none;
		border: none;
		color: var(--text-secondary);
		font-size: 0.875rem;
		cursor: pointer;
		transition: color 0.15s ease;
	}

	.btn-text:hover {
		color: var(--text-primary);
	}

	.info-box, .warning-box {
		display: flex;
		gap: 0.75rem;
		padding: 1rem;
		border-radius: 0.5rem;
		margin-top: 1.5rem;
	}

	.info-box {
		background: var(--color-info-50);
		border: 1px solid var(--color-info-200);
	}

	.warning-box {
		background: var(--color-warning-50);
		border: 1px solid var(--color-warning-200);
	}

	.info-box strong, .warning-box strong {
		display: block;
		margin-bottom: 0.25rem;
		color: var(--text-primary);
		font-size: 0.875rem;
	}

	.info-box p, .warning-box p {
		margin: 0;
		font-size: 0.875rem;
		color: var(--text-secondary);
	}

	.activity-log {
		background: var(--bg-primary);
		border: 1px solid var(--border-primary);
		border-radius: 0.75rem;
		padding: 1.5rem;
	}

	.log-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 1rem;
	}

	.log-header h3 {
		margin: 0;
		font-size: 1rem;
		font-weight: 600;
		color: var(--text-primary);
	}

	.empty-state {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		padding: 3rem;
		text-align: center;
	}

	.empty-state p {
		margin: 0.5rem 0 0 0;
		color: var(--text-secondary);
	}

	.log-items {
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
	}

	.log-item {
		display: flex;
		gap: 0.75rem;
		padding: 1rem;
		background: var(--bg-secondary);
		border: 1px solid var(--border-primary);
		border-radius: 0.5rem;
	}

	.log-item.success {
		border-left: 3px solid var(--color-success-500);
	}

	.log-item.error {
		border-left: 3px solid var(--color-danger-500);
	}

	.log-icon {
		flex-shrink: 0;
	}

	.log-content {
		flex: 1;
		min-width: 0;
	}

	.log-header-row {
		display: flex;
		justify-content: space-between;
		align-items: center;
		gap: 1rem;
		margin-bottom: 0.25rem;
	}

	.log-action {
		font-size: 0.875rem;
		font-weight: 600;
		color: var(--text-primary);
	}

	.log-time {
		font-size: 0.75rem;
		color: var(--text-tertiary);
		white-space: nowrap;
	}

	.log-message {
		margin: 0;
		font-size: 0.875rem;
		color: var(--text-secondary);
	}

	/* Mobile responsive */
	@media (max-width: 768px) {
		.header-content {
			flex-direction: column;
			text-align: center;
		}

		.tabs {
			overflow-x: auto;
		}

		.tab {
			white-space: nowrap;
		}

		.form-row {
			grid-template-columns: 1fr;
		}

		.section-card {
			padding: 1.5rem;
		}
	}
</style>

