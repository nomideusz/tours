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
	import X from 'lucide-svelte/icons/x';
	import Loader2 from 'lucide-svelte/icons/loader-2';
	import AlertCircle from 'lucide-svelte/icons/alert-circle';
	import Eye from 'lucide-svelte/icons/eye';
	import Megaphone from 'lucide-svelte/icons/megaphone';
	import History from 'lucide-svelte/icons/history';
	import FileText from 'lucide-svelte/icons/file-text';
	import Clock from 'lucide-svelte/icons/clock';

	// State
	let activeTab = $state<'test' | 'announcement' | 'whatsapp' | 'history'>('test');
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
	let announcementTarget = $state<'all' | 'active' | 'beta' | 'specific' | 'custom'>('specific');
	let specificEmail = $state('');
	let selectedUserIds = $state<Set<string>>(new Set());
	let showAdvancedOptions = $state(false);
	let showSentDetailsModal = $state(false);
	let lastSendResults = $state<any>(null);
	
	// History state
	let selectedHistorySubject = $state('');
	let historyUserIds = $state<Set<string>>(new Set());
	
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

	// Fetch all users for recipient selection
	let usersQuery = $derived(createQuery({
		queryKey: ['admin-users-list'],
		queryFn: async () => {
			const response = await fetch('/api/admin/users');
			if (!response.ok) throw new Error('Failed to fetch users');
			return response.json();
		}
	}));

	let allUsers = $derived($usersQuery.data || []);
	
	// Fetch sent announcements for the current subject
	let sentAnnouncementsQuery = $derived(createQuery({
		queryKey: ['sent-announcements', announcementSubject],
		queryFn: async () => {
			if (!announcementSubject) return [];
			const response = await fetch(`/api/admin/announcements-sent?subject=${encodeURIComponent(announcementSubject)}`);
			if (!response.ok) return [];
			return response.json();
		},
		enabled: !!announcementSubject
	}));

	let sentAnnouncements = $derived($sentAnnouncementsQuery.data || []);
	let sentUserIds = $derived(new Set(sentAnnouncements.map((a: any) => a.userId)));
	
	// Fetch announcement history (all subjects)
	let historyQuery = $derived(createQuery({
		queryKey: ['announcement-history'],
		queryFn: async () => {
			const response = await fetch('/api/admin/announcement-history');
			if (!response.ok) return [];
			return response.json();
		}
	}));

	let announcementHistory = $derived($historyQuery.data || []);
	
	// Get sent users for selected history subject
	let historySentUserIds = $derived.by(() => {
		if (!selectedHistorySubject) return new Set();
		return new Set(
			sentAnnouncements
				.filter((a: any) => a.subject === selectedHistorySubject)
				.map((a: any) => a.userId)
		);
	});
	
	// Get users who didn't receive the selected announcement
	let historyUnsentUsers = $derived.by(() => {
		if (!selectedHistorySubject) return [];
		return allUsers.filter((u: any) => !historySentUserIds.has(u.id));
	});
	
	// Filter users based on target
	let filteredUsers = $derived.by(() => {
		if (announcementTarget === 'specific') return [];
		
		let users = allUsers;
		
		// Apply target filter
		if (announcementTarget === 'active') {
			users = users.filter((u: any) => u.tourCount > 0 || u.bookingCount > 0);
		} else if (announcementTarget === 'beta') {
			users = users.filter((u: any) => u.earlyAccessMember);
		}
		// 'all' and 'custom' show all users
		
		return users;
	});
	
	let recipientCount = $derived.by(() => {
		if (announcementTarget === 'specific') return specificEmail ? 1 : 0;
		// For custom or when users are selected, show selected count
		if (selectedUserIds.size > 0) return selectedUserIds.size;
		// Otherwise show filtered count
		return filteredUsers.length;
	});
	
	let unsentUsers = $derived(filteredUsers.filter((u: any) => !sentUserIds.has(u.id)));
	let alreadySentCount = $derived(filteredUsers.filter((u: any) => sentUserIds.has(u.id)).length);

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

		if (announcementTarget === 'specific' && !specificEmail) {
			results = [{ 
				time: new Date().toLocaleTimeString(), 
				action: 'Send Announcement', 
				status: 'error', 
				message: 'Please enter a specific email address' 
			}, ...results];
			return;
		}

		if (announcementTarget === 'custom' && selectedUserIds.size === 0) {
			results = [{ 
				time: new Date().toLocaleTimeString(), 
				action: 'Send Announcement', 
				status: 'error', 
				message: 'Please select at least one recipient' 
			}, ...results];
			return;
		}

		isLoading = true;
		try {
			// Build recipient filter
			let recipientType = announcementTarget;
			let recipientFilter;

			if (announcementTarget === 'specific') {
				recipientType = 'custom';
				recipientFilter = { emails: [specificEmail] };
			} else if (selectedUserIds.size > 0) {
				// If users are manually selected, always use custom type
				recipientType = 'custom';
				recipientFilter = { userIds: Array.from(selectedUserIds) };
			} else if (announcementTarget === 'custom') {
				recipientFilter = { userIds: Array.from(selectedUserIds) };
			} else if (announcementTarget === 'active' || announcementTarget === 'beta') {
				recipientFilter = { type: announcementTarget };
			}

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
					recipientType,
					recipientFilter
				})
			});

			const result = await response.json();

			if (response.ok) {
				// Store results for viewing
				lastSendResults = {
					subject: announcementSubject,
					timestamp: new Date().toISOString(),
					...result
				};

				results = [{ 
					time: new Date().toLocaleTimeString(), 
					action: 'Send Announcement', 
					status: 'success', 
					message: `Successfully sent to ${result.sent} out of ${result.totalRecipients} recipients` 
				}, ...results];
				
				// Show details modal
				showSentDetailsModal = true;
				
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
		<button 
			class="tab {activeTab === 'history' ? 'active' : ''}"
			onclick={() => activeTab = 'history'}
		>
			<History class="w-4 h-4" />
			Email History
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
				<label for="target">Send To *</label>
				<select id="target" bind:value={announcementTarget}>
					<option value="specific">Specific Email Address</option>
					<option value="beta">Beta Testers ({allUsers.filter((u: any) => u.earlyAccessMember).length})</option>
					<option value="active">Active Users ({allUsers.filter((u: any) => u.tourCount > 0 || u.bookingCount > 0).length})</option>
					<option value="all">All Users ({allUsers.length})</option>
					<option value="custom">Custom Selection</option>
				</select>
				<p class="help-text">
					{#if announcementTarget === 'specific'}
						Send to a single email address (useful for testing)
					{:else if announcementTarget === 'beta'}
						Send to all beta testers / early access members
					{:else if announcementTarget === 'active'}
						Send to users who have created tours or made bookings
					{:else if announcementTarget === 'all'}
						Send to all registered users
					{:else if announcementTarget === 'custom'}
						Manually select recipients from the list below
					{/if}
				</p>
			</div>

			{#if announcementTarget === 'specific'}
				<div class="form-group">
					<label for="specific-email">Recipient Email *</label>
					<input 
						type="email" 
						id="specific-email" 
						bind:value={specificEmail}
						placeholder="e.g., b.dymet@gmail.com"
					/>
					<p class="help-text">Enter the email address to send to</p>
				</div>
			{/if}

			{#if announcementTarget !== 'specific' && filteredUsers.length > 0}
				<div class="recipients-preview">
					<div class="recipients-header">
						<Users class="w-4 h-4" />
						<span>
							{#if selectedUserIds.size > 0}
								{selectedUserIds.size} selected
							{:else}
								{filteredUsers.length} recipients
							{/if}
							{#if alreadySentCount > 0}
								<span class="sent-badge">({alreadySentCount} already sent)</span>
							{/if}
						</span>
						<button 
							class="btn-link"
							onclick={() => {
								// Select only unsent users
								if (selectedUserIds.size > 0) {
									selectedUserIds = new Set();
								} else {
									selectedUserIds = new Set(unsentUsers.map((u: any) => u.id));
								}
							}}
						>
							{selectedUserIds.size > 0 ? 'Deselect All' : 'Select All Unsent'}
						</button>
					</div>
					<div class="recipients-list">
						{#each filteredUsers.slice(0, showAdvancedOptions ? undefined : 10) as user}
							{@const isSent = sentUserIds.has(user.id)}
							<div class="recipient-item {isSent ? 'already-sent' : ''}">
								<input 
									type="checkbox" 
									checked={selectedUserIds.has(user.id)}
									disabled={isSent}
									onchange={(e) => {
										const checked = (e.target as HTMLInputElement).checked;
										if (checked) {
											selectedUserIds.add(user.id);
										} else {
											selectedUserIds.delete(user.id);
										}
										selectedUserIds = selectedUserIds; // Trigger reactivity
									}}
								/>
								<div class="recipient-info">
									<strong>{user.name}</strong>
									<span class="email">{user.email}</span>
									{#if user.earlyAccessMember}
										<span class="badge beta">Beta</span>
									{/if}
									{#if user.tourCount > 0}
										<span class="badge">{user.tourCount} tours</span>
									{/if}
									{#if isSent}
										<span class="badge sent">✓ Sent</span>
									{/if}
								</div>
							</div>
						{/each}
						{#if !showAdvancedOptions && filteredUsers.length > 10}
							<button 
								class="btn-link show-more"
								onclick={() => showAdvancedOptions = true}
							>
								Show all {filteredUsers.length} recipients
							</button>
						{/if}
						{#if showAdvancedOptions && filteredUsers.length > 10}
							<button 
								class="btn-link show-more"
								onclick={() => showAdvancedOptions = false}
							>
								Show less
							</button>
						{/if}
					</div>
				</div>
			{/if}

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
				<strong>
					{#if announcementTarget === 'specific'}
						This will send 1 email to: {specificEmail || '(enter email above)'}
					{:else if selectedUserIds.size > 0}
						This will send emails to {selectedUserIds.size} selected user{selectedUserIds.size === 1 ? '' : 's'}!
					{:else}
						This will send emails to {filteredUsers.length} real user{filteredUsers.length === 1 ? '' : 's'}!
					{/if}
				</strong>
				<p>
					{#if selectedUserIds.size > 0}
						You have manually selected {selectedUserIds.size} out of {filteredUsers.length} users.
					{:else if announcementTarget !== 'specific'}
						All {filteredUsers.length} {announcementTarget} users will receive this email.
					{:else}
						Make sure to review your message carefully before sending.
					{/if}
				</p>
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

	<!-- Sent Details Modal -->
	{#if showSentDetailsModal && lastSendResults}
		<div class="modal-overlay" role="dialog" aria-modal="true" tabindex="-1" onclick={() => showSentDetailsModal = false} onkeydown={(e) => e.key === 'Escape' && (showSentDetailsModal = false)}>
			<div class="modal-content" role="document" onclick={(e) => e.stopPropagation()} onkeydown={(e) => e.stopPropagation()}>
				<div class="modal-header">
					<h2>📧 Announcement Sent Successfully</h2>
					<button class="modal-close" onclick={() => showSentDetailsModal = false}>
						<X class="w-5 h-5" />
					</button>
				</div>
				
				<div class="modal-body">
					<div class="summary-stats">
						<div class="stat-card success">
							<CheckCircle class="w-6 h-6" />
							<div>
								<div class="stat-value">{lastSendResults.sent}</div>
								<div class="stat-label">Successfully Sent</div>
							</div>
						</div>
						{#if lastSendResults.failed > 0}
							<div class="stat-card error">
								<XCircle class="w-6 h-6" />
								<div>
									<div class="stat-value">{lastSendResults.failed}</div>
									<div class="stat-label">Failed</div>
								</div>
							</div>
						{/if}
						<div class="stat-card">
							<Users class="w-6 h-6" />
							<div>
								<div class="stat-value">{lastSendResults.totalRecipients}</div>
								<div class="stat-label">Total Recipients</div>
							</div>
						</div>
					</div>

					<div class="details-section">
						<h3>📋 Detailed Results</h3>
						<div class="recipients-table">
							<div class="table-header">
								<span>Status</span>
								<span>Name</span>
								<span>Email</span>
							</div>
							{#each lastSendResults.details as detail}
								<div class="table-row {detail.success ? 'success' : 'error'}">
									<span class="status-col">
										{#if detail.success}
											<CheckCircle class="w-4 h-4 text-success" />
										{:else}
											<XCircle class="w-4 h-4 text-danger" />
										{/if}
									</span>
									<span class="name-col">{detail.name}</span>
									<span class="email-col">{detail.email}</span>
								</div>
								{#if !detail.success && detail.error}
									<div class="error-detail">
										⚠️ {detail.error}
									</div>
								{/if}
							{/each}
						</div>
					</div>

					<div class="info-box" style="margin-top: 1.5rem;">
						<AlertCircle class="w-5 h-5 text-info" />
						<div>
							<strong>Subject:</strong> {lastSendResults.subject}<br>
							<strong>Sent at:</strong> {new Date(lastSendResults.timestamp).toLocaleString()}
						</div>
					</div>
				</div>

				<div class="modal-footer">
					<button class="btn-secondary" onclick={() => showSentDetailsModal = false}>
						Close
					</button>
				</div>
			</div>
		</div>
	{/if}
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

	.recipients-preview {
		margin-bottom: 1.5rem;
		border: 1px solid var(--border-primary);
		border-radius: 0.5rem;
		overflow: hidden;
	}

	.recipients-header {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		padding: 0.75rem 1rem;
		background: var(--bg-secondary);
		border-bottom: 1px solid var(--border-primary);
		font-size: 0.875rem;
		font-weight: 500;
		color: var(--text-primary);
	}

	.recipients-list {
		max-height: 400px;
		overflow-y: auto;
	}

	.recipient-item {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		padding: 0.75rem 1rem;
		border-bottom: 1px solid var(--border-primary);
		transition: background 0.15s ease;
	}

	.recipient-item:last-child {
		border-bottom: none;
	}

	.recipient-item:hover {
		background: var(--bg-secondary);
	}

	.recipient-item input[type="checkbox"] {
		width: auto;
		margin: 0;
	}

	.recipient-info {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		flex-wrap: wrap;
		flex: 1;
	}

	.recipient-info strong {
		font-size: 0.875rem;
		color: var(--text-primary);
	}

	.recipient-info .email {
		font-size: 0.75rem;
		color: var(--text-secondary);
	}

	.badge {
		padding: 0.125rem 0.5rem;
		background: var(--bg-secondary);
		border: 1px solid var(--border-primary);
		border-radius: 0.25rem;
		font-size: 0.7rem;
		color: var(--text-secondary);
	}

	.badge.beta {
		background: var(--color-primary-100);
		border-color: var(--color-primary-400);
		color: var(--color-primary-700);
		font-weight: 500;
	}

	.badge.sent {
		background: #d4edda;
		border-color: #28a745;
		color: #155724;
		font-weight: 500;
	}

	.sent-badge {
		font-size: 0.75rem;
		color: var(--text-tertiary);
		font-weight: normal;
		margin-left: 0.5rem;
	}

	.recipient-item.already-sent {
		opacity: 0.6;
		background: var(--bg-secondary);
	}

	.recipient-item.already-sent input[type="checkbox"] {
		cursor: not-allowed;
	}

	.btn-link {
		padding: 0;
		background: none;
		border: none;
		color: var(--color-primary-600);
		font-size: 0.875rem;
		font-weight: 500;
		cursor: pointer;
		text-decoration: none;
		transition: color 0.15s ease;
		margin-left: auto;
	}

	.btn-link:hover {
		color: var(--color-primary-700);
		text-decoration: underline;
	}

	.show-more {
		display: block;
		width: 100%;
		padding: 0.75rem;
		text-align: center;
		border-top: 1px solid var(--border-primary);
	}

	/* Modal Styles */
	.modal-overlay {
		position: fixed;
		top: 0;
		left: 0;
		right: 0;
		bottom: 0;
		background: rgba(0, 0, 0, 0.5);
		display: flex;
		align-items: center;
		justify-content: center;
		z-index: 1000;
		padding: 1rem;
	}

	.modal-content {
		background: var(--bg-primary);
		border-radius: 1rem;
		max-width: 800px;
		width: 100%;
		max-height: 90vh;
		overflow: hidden;
		display: flex;
		flex-direction: column;
		box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
	}

	.modal-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 1.5rem;
		border-bottom: 1px solid var(--border-primary);
	}

	.modal-header h2 {
		margin: 0;
		font-size: 1.25rem;
		font-weight: 600;
		color: var(--text-primary);
	}

	.modal-close {
		padding: 0.5rem;
		background: none;
		border: none;
		cursor: pointer;
		color: var(--text-secondary);
		border-radius: 0.5rem;
		transition: all 0.15s ease;
	}

	.modal-close:hover {
		background: var(--bg-secondary);
		color: var(--text-primary);
	}

	.modal-body {
		padding: 1.5rem;
		overflow-y: auto;
		flex: 1;
	}

	.modal-footer {
		padding: 1rem 1.5rem;
		border-top: 1px solid var(--border-primary);
		display: flex;
		justify-content: flex-end;
		gap: 0.75rem;
	}

	.summary-stats {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
		gap: 1rem;
		margin-bottom: 2rem;
	}

	.stat-card {
		display: flex;
		align-items: center;
		gap: 1rem;
		padding: 1rem;
		background: var(--bg-secondary);
		border: 1px solid var(--border-primary);
		border-radius: 0.5rem;
	}

	.stat-card.success {
		background: #d4edda;
		border-color: #28a745;
		color: #155724;
	}

	.stat-card.error {
		background: #f8d7da;
		border-color: #dc3545;
		color: #721c24;
	}

	.stat-value {
		font-size: 1.5rem;
		font-weight: 700;
	}

	.stat-label {
		font-size: 0.75rem;
		opacity: 0.8;
	}

	.details-section {
		margin-top: 1.5rem;
	}

	.details-section h3 {
		margin: 0 0 1rem 0;
		font-size: 1rem;
		font-weight: 600;
		color: var(--text-primary);
	}

	.recipients-table {
		border: 1px solid var(--border-primary);
		border-radius: 0.5rem;
		overflow: hidden;
	}

	.table-header {
		display: grid;
		grid-template-columns: 60px 1fr 2fr;
		gap: 1rem;
		padding: 0.75rem 1rem;
		background: var(--bg-secondary);
		font-size: 0.75rem;
		font-weight: 600;
		text-transform: uppercase;
		color: var(--text-secondary);
	}

	.table-row {
		display: grid;
		grid-template-columns: 60px 1fr 2fr;
		gap: 1rem;
		padding: 0.75rem 1rem;
		border-top: 1px solid var(--border-primary);
		font-size: 0.875rem;
		align-items: center;
	}

	.table-row.success {
		background: rgba(212, 237, 218, 0.2);
	}

	.table-row.error {
		background: rgba(248, 215, 218, 0.2);
	}

	.status-col {
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.error-detail {
		padding: 0.5rem 1rem;
		background: rgba(248, 215, 218, 0.5);
		border-top: 1px solid var(--border-primary);
		font-size: 0.75rem;
		color: #721c24;
	}

	.btn-secondary {
		padding: 0.5rem 1rem;
		background: var(--bg-secondary);
		border: 1px solid var(--border-primary);
		border-radius: 0.5rem;
		color: var(--text-primary);
		font-size: 0.875rem;
		font-weight: 500;
		cursor: pointer;
		transition: all 0.15s ease;
	}

	.btn-secondary:hover {
		background: var(--bg-primary);
		border-color: var(--color-primary-400);
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

