<script lang="ts">
	import { page } from '$app/state';
	import { browser } from '$app/environment';
	import QrCode from 'lucide-svelte/icons/qr-code';
	import AlertCircle from 'lucide-svelte/icons/alert-circle';
	import Lock from 'lucide-svelte/icons/lock';
	import Search from 'lucide-svelte/icons/search';
	import XCircle from 'lucide-svelte/icons/x-circle';
	import ArrowLeft from 'lucide-svelte/icons/arrow-left';
	import CalendarX from 'lucide-svelte/icons/calendar-x';
	import UserX from 'lucide-svelte/icons/user-x';
	
	let status = $derived(page.status);
	let message = $derived(page.error?.message || 'An error occurred');
	
	let errorInfo = $derived(() => {
		switch (status) {
			case 400:
				if (message.includes('Invalid ticket')) {
					return {
						icon: XCircle,
						title: 'Invalid Ticket Code',
						description: 'The ticket code format is not valid. Please check the QR code and try again.',
						showScanButton: true
					};
				}
				if (message.includes('payment is incomplete')) {
					return {
						icon: XCircle,
						title: 'Invalid Ticket',
						description: 'This ticket is not valid or the payment has not been completed.',
						showScanButton: true
					};
				}
				return {
					icon: AlertCircle,
					title: 'Invalid Request',
					description: message,
					showScanButton: true
				};
				
			case 401:
				return {
					icon: Lock,
					title: 'Authentication Required',
					description: 'You need to be logged in to check in customers.',
					showLoginButton: true
				};
				
			case 403:
				return {
					icon: UserX,
					title: 'Not Authorized',
					description: 'You are not authorized to check in this booking. Only the tour guide who owns this tour can check in customers.',
					showDashboard: true
				};
				
			case 404:
				// Check if this might be a past booking based on the URL
				const ticketCode = page.params.code;
				const isPastBookingHint = ticketCode && ticketCode.includes('-');
				
				return {
					icon: Search,
					title: 'Ticket Not Found',
					description: isPastBookingHint 
						? 'This ticket could not be found. If this is from a past tour date, it may no longer be available for check-in.'
						: 'The ticket code does not exist in our system. Please verify the code and try again.',
					showScanButton: true,
					additionalInfo: 'Common reasons:',
					reasons: [
						'The QR code may be damaged or unreadable',
						'The ticket may be from a past tour date',
						'The booking may have been cancelled',
						'You may have scanned a different type of QR code'
					]
				};
				
			case 410:
				return {
					icon: CalendarX,
					title: 'Tour Has Already Taken Place',
					description: 'This tour has already happened. Check-in is only available during the tour and up to 24 hours after it ends.',
					showDashboard: true,
					additionalInfo: 'What you can do:',
					reasons: [
						'View the booking details in your bookings history',
						'Check attendance reports for past tours',
						'Contact the customer directly if needed'
					]
				};
				
			case 500:
			default:
				return {
					icon: AlertCircle,
					title: 'Something Went Wrong',
					description: 'An unexpected error occurred while loading the check-in page. Please try again.',
					showScanButton: true,
					showDashboard: true
				};
		}
	});
	
	let info = $derived(errorInfo());
</script>

<svelte:head>
	<title>Error - Check-in</title>
	<meta name="viewport" content="width=device-width, initial-scale=1, user-scalable=no">
</svelte:head>

<div class="min-h-screen" style="background: var(--bg-secondary);">
	<!-- Mobile-optimized Header -->
	<div class="sticky top-0 z-10 mobile-header">
		<div class="px-4 py-3">
			<div class="flex items-center justify-between">
				<div class="flex items-center gap-3">
					<a href="/checkin-scanner" class="mobile-header-link">
						<ArrowLeft class="w-5 h-5" />
					</a>
					<div>
						<h1 class="text-lg font-semibold mobile-header-title">Check-in Error</h1>
						<p class="text-xs mobile-header-subtitle">Unable to process ticket</p>
					</div>
				</div>
			</div>
		</div>
	</div>
	
	<div class="max-w-2xl mx-auto px-4 py-8">
		<!-- Error Card -->
		<div class="rounded-xl overflow-hidden shadow-sm" style="background: var(--bg-primary);">
			<div class="p-8 text-center">
				<!-- Error Icon -->
				<div class="error-status-icon-wrapper {
					status === 404 ? 'status-warning' :
					status === 403 ? 'status-warning' :
					status === 401 ? 'status-info' :
					status === 410 ? 'status-warning' :
					'status-error'
				}">
					<info.icon class="w-10 h-10" />
				</div>
				
				<!-- Error Title -->
				<h2 class="text-2xl font-bold mb-3" style="color: var(--text-primary);">
					{info.title}
				</h2>
				
				<!-- Error Description -->
				<p class="text-base mb-6" style="color: var(--text-secondary);">
					{info.description}
				</p>
				
				<!-- Additional Info -->
				{#if info.additionalInfo && info.reasons}
					<div class="mt-6 p-4 rounded-lg text-left alert-info">
						<h3 class="alert-heading">
							{info.additionalInfo}
						</h3>
						<ul class="space-y-2">
							{#each info.reasons as reason}
								<li class="flex items-start gap-2 alert-body">
									<span class="error-bullet mt-0.5">•</span>
									<span>{reason}</span>
								</li>
							{/each}
						</ul>
					</div>
				{/if}
				
				<!-- Error Code -->
				<div class="mt-6 text-sm" style="color: var(--text-tertiary);">
					Error Code: {status}
				</div>
			</div>
		</div>
		
		<!-- Action Buttons -->
		<div class="mt-6 space-y-3">
			{#if info.showScanButton}
				<a href="/checkin-scanner" class="w-full button-primary button-gap button-large justify-center">
					<QrCode class="w-5 h-5" />
					Try Scanning Again
				</a>
			{/if}
			
			{#if info.showLoginButton}
				<a href="/auth/login?redirect=/checkin-scanner" class="w-full button-primary button-gap button-large justify-center">
					<Lock class="w-5 h-5" />
					Log In
				</a>
			{/if}
			
			{#if info.showDashboard}
				<a href="/dashboard" class="w-full button-secondary button-gap button-large justify-center">
					<ArrowLeft class="w-5 h-5" />
					Back to Dashboard
				</a>
			{/if}
			
			{#if !info.showDashboard && !info.showLoginButton}
				<a href="/dashboard" class="w-full button-secondary button-gap justify-center">
					<ArrowLeft class="w-4 h-4" />
					Back to Dashboard
				</a>
			{/if}
		</div>
		
		<!-- Help Text -->
		<div class="mt-8 text-center">
			<p class="text-sm" style="color: var(--text-tertiary);">
				Need help? Contact support if this issue persists.
			</p>
		</div>
	</div>
</div>

<style>
	/* Reuse existing mobile-header styles */
	.mobile-header {
		background: linear-gradient(135deg, var(--color-primary-600) 0%, var(--color-primary-700) 100%);
		color: white;
	}
	
	.mobile-header-link {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		width: 2.5rem;
		height: 2.5rem;
		border-radius: 0.5rem;
		background: rgba(255, 255, 255, 0.1);
		color: white;
		transition: all 0.2s;
	}
	
	.mobile-header-link:hover {
		background: rgba(255, 255, 255, 0.2);
	}
	
	.mobile-header-title {
		color: white;
	}
	
	.mobile-header-subtitle {
		color: rgba(255, 255, 255, 0.7);
	}
	
	/* Error page status icon wrapper - larger version of badges.css status-icon-wrapper */
	.error-status-icon-wrapper {
		margin: 0 auto 1.5rem;
		width: 5rem;
		height: 5rem;
		border-radius: 50%;
		display: flex;
		align-items: center;
		justify-content: center;
		border-width: 1px;
		border-style: solid;
	}
	
	/* Status variants using badge system colors */
	.error-status-icon-wrapper.status-error {
		border-color: var(--color-error-200);
		background: var(--color-error-50);
		color: var(--color-error-600);
	}
	
	.error-status-icon-wrapper.status-warning {
		border-color: var(--color-warning-200);
		background: var(--color-warning-50);
		color: var(--color-warning-600);
	}
	
	.error-status-icon-wrapper.status-info {
		border-color: var(--color-info-200);
		background: var(--color-info-50);
		color: var(--color-info-600);
	}
	
	/* Bullet points using warning color */
	.error-bullet {
		color: var(--color-warning-600);
	}
</style> 