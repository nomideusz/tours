<script lang="ts">
	import { createQuery } from '@tanstack/svelte-query';
	import { globalCurrencyFormatter } from '$lib/utils/currency.js';
	import { formatDateTime } from '$lib/utils/date-helpers.js';
	import { getTransferStatusMessage } from '$lib/payment-transfers-client.js';
	import PageHeader from '$lib/components/PageHeader.svelte';
	import MobilePageHeader from '$lib/components/MobilePageHeader.svelte';
	
	// Icons
	import ArrowDownUp from 'lucide-svelte/icons/arrow-down-up';
	import Clock from 'lucide-svelte/icons/clock';
	import CheckCircle from 'lucide-svelte/icons/check-circle';
	import XCircle from 'lucide-svelte/icons/x-circle';
	import DollarSign from 'lucide-svelte/icons/dollar-sign';
	import Calendar from 'lucide-svelte/icons/calendar';
	import ExternalLink from 'lucide-svelte/icons/external-link';
	import Loader2 from 'lucide-svelte/icons/loader-2';
	
	let { data } = $props();
	
	// Fetch transfers data
	let transfersQuery = $derived(createQuery({
		queryKey: ['transfers'],
		queryFn: async () => {
			const response = await fetch('/api/transfers');
			if (!response.ok) throw new Error('Failed to fetch transfers');
			return response.json();
		},
		staleTime: 30 * 1000,
		refetchInterval: 60 * 1000 // Refresh every minute
	}));
	
	let transfers = $derived($transfersQuery.data || { pending: [], completed: [], failed: [], stats: {} });
	let isLoading = $derived($transfersQuery.isLoading);
	
	function getStatusIcon(status: string) {
		if (status === 'completed') return CheckCircle;
		if (status === 'failed') return XCircle;
		return Clock;
	}
	
	function getStatusColor(status: string) {
		if (status === 'completed') return 'success';
		if (status === 'failed') return 'error';
		return 'warning';
	}
</script>

<svelte:head>
	<title>Transfers - Zaur</title>
</svelte:head>

<div class="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8">
	<!-- Mobile Header -->
	<div class="sm:hidden mb-6">
		<MobilePageHeader
			title="Transfers"
			secondaryInfo="Payment transfers to your account"
		/>
	</div>
	
	<!-- Desktop Header -->
	<div class="hidden sm:block mb-8">
		<PageHeader
			title="Transfers"
			subtitle="Track when you'll receive booking payments"
			breadcrumbs={[
				{ label: 'Dashboard', href: '/dashboard' },
				{ label: 'Transfers' }
			]}
		/>
	</div>
	
	{#if isLoading}
		<div class="flex items-center justify-center py-12">
			<Loader2 class="h-8 w-8 animate-spin" style="color: var(--text-tertiary);" />
		</div>
	{:else}
		<!-- Stats Overview -->
		<div class="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
			<!-- Pending Transfers -->
			<div class="rounded-xl p-4 sm:p-6" style="background: var(--bg-primary); border: 1px solid var(--border-primary);">
				<div class="flex items-center gap-3 mb-2">
					<div class="rounded-lg p-2" style="background: var(--color-warning-100);">
						<Clock class="h-5 w-5" style="color: var(--color-warning-600);" />
					</div>
					<h3 class="font-semibold text-sm" style="color: var(--text-secondary);">Pending</h3>
				</div>
				<p class="text-2xl font-bold" style="color: var(--text-primary);">
					{$globalCurrencyFormatter(transfers.stats?.pendingAmount || 0)}
				</p>
				<p class="text-xs mt-1" style="color: var(--text-secondary);">
					{transfers.pending?.length || 0} booking{transfers.pending?.length !== 1 ? 's' : ''}
				</p>
			</div>
			
			<!-- Completed Transfers -->
			<div class="rounded-xl p-4 sm:p-6" style="background: var(--bg-primary); border: 1px solid var(--border-primary);">
				<div class="flex items-center gap-3 mb-2">
					<div class="rounded-lg p-2" style="background: var(--color-success-100);">
						<CheckCircle class="h-5 w-5" style="color: var(--color-success-600);" />
					</div>
					<h3 class="font-semibold text-sm" style="color: var(--text-secondary);">Transferred</h3>
				</div>
				<p class="text-2xl font-bold" style="color: var(--text-primary);">
					{$globalCurrencyFormatter(transfers.stats?.completedAmount || 0)}
				</p>
				<p class="text-xs mt-1" style="color: var(--text-secondary);">
					{transfers.completed?.length || 0} booking{transfers.completed?.length !== 1 ? 's' : ''}
				</p>
			</div>
			
			<!-- Failed Transfers -->
			{#if transfers.failed && transfers.failed.length > 0}
				<div class="rounded-xl p-4 sm:p-6" style="background: var(--color-error-50); border: 1px solid var(--color-error-200);">
					<div class="flex items-center gap-3 mb-2">
						<div class="rounded-lg p-2" style="background: var(--color-error-100);">
							<XCircle class="h-5 w-5" style="color: var(--color-error-600);" />
						</div>
						<h3 class="font-semibold text-sm" style="color: var(--color-error-900);">Failed</h3>
					</div>
					<p class="text-2xl font-bold" style="color: var(--color-error-900);">
						{transfers.failed.length}
					</p>
					<p class="text-xs mt-1" style="color: var(--color-error-700);">
						Requires attention
					</p>
				</div>
			{/if}
		</div>
		
		<!-- Pending Transfers -->
		{#if transfers.pending && transfers.pending.length > 0}
			<div class="rounded-xl overflow-hidden mb-6" style="background: var(--bg-primary); border: 1px solid var(--border-primary);">
				<div class="px-4 py-3 sm:px-6 sm:py-4" style="background: var(--bg-secondary); border-bottom: 1px solid var(--border-primary);">
					<div class="flex items-center justify-between">
						<h3 class="font-semibold" style="color: var(--text-primary);">Upcoming Transfers</h3>
						<span class="text-xs px-2 py-1 rounded-full" style="background: var(--color-warning-100); color: var(--color-warning-700);">
							{transfers.pending.length} pending
						</span>
					</div>
				</div>
				
				<div class="divide-y" style="border-color: var(--border-primary);">
					{#each transfers.pending as transfer}
						{@const statusInfo = getTransferStatusMessage(transfer)}
						<div class="p-4 sm:p-6 hover:bg-opacity-50 transition-colors" style="background: var(--bg-primary);">
							<div class="flex items-start justify-between gap-4 mb-3">
								<div class="flex-1">
									<h4 class="font-semibold text-sm sm:text-base mb-1" style="color: var(--text-primary);">
										{transfer.tourName}
									</h4>
									<p class="text-xs sm:text-sm" style="color: var(--text-secondary);">
										Booking {transfer.bookingReference}
									</p>
								</div>
								<div class="text-right">
									<p class="font-bold text-lg" style="color: var(--text-primary);">
										{$globalCurrencyFormatter(parseFloat(transfer.totalAmount))}
									</p>
								</div>
							</div>
							
							<div class="flex items-center gap-2 text-xs sm:text-sm" style="color: var(--text-secondary);">
								<Clock class="h-4 w-4" />
								<span>Transfer scheduled: {formatDateTime(transfer.transferScheduledFor)}</span>
							</div>
							
							<div class="mt-2 p-2 rounded" style="background: var(--color-warning-50);">
								<p class="text-xs" style="color: var(--color-warning-800);">
									{statusInfo.text}
								</p>
							</div>
							
							<div class="mt-3 flex gap-2">
								<a
									href="/bookings/{transfer.bookingId}"
									class="button-secondary button-small button-gap"
								>
									<ExternalLink class="h-4 w-4" />
									View Booking
								</a>
							</div>
						</div>
					{/each}
				</div>
			</div>
		{:else}
			<div class="rounded-xl p-6 text-center" style="background: var(--bg-secondary); border: 1px solid var(--border-primary);">
				<Clock class="h-12 w-12 mx-auto mb-3" style="color: var(--text-tertiary);" />
				<h3 class="font-semibold mb-2" style="color: var(--text-primary);">No Pending Transfers</h3>
				<p class="text-sm" style="color: var(--text-secondary);">
					Transfers will appear here after customers pay for bookings
				</p>
			</div>
		{/if}
		
		<!-- Recent Completed Transfers -->
		{#if transfers.completed && transfers.completed.length > 0}
			<div class="rounded-xl overflow-hidden" style="background: var(--bg-primary); border: 1px solid var(--border-primary);">
				<div class="px-4 py-3 sm:px-6 sm:py-4" style="background: var(--bg-secondary); border-bottom: 1px solid var(--border-primary);">
					<h3 class="font-semibold" style="color: var(--text-primary);">Transfer History</h3>
				</div>
				
				<div class="divide-y" style="border-color: var(--border-primary);">
					{#each transfers.completed.slice(0, 10) as transfer}
						<div class="p-4 sm:p-6">
							<div class="flex items-start justify-between gap-4 mb-2">
								<div class="flex-1">
									<h4 class="font-semibold text-sm sm:text-base mb-1" style="color: var(--text-primary);">
										{transfer.tourName}
									</h4>
									<p class="text-xs" style="color: var(--text-secondary);">
										{transfer.bookingReference}
									</p>
								</div>
								<div class="text-right">
									<p class="font-bold" style="color: var(--color-success-600);">
										{$globalCurrencyFormatter(parseFloat(transfer.totalAmount))}
									</p>
									<span class="inline-flex items-center gap-1 text-xs mt-1 px-2 py-0.5 rounded-full" style="background: var(--color-success-100); color: var(--color-success-700);">
										<CheckCircle class="h-3 w-3" />
										Transferred
									</span>
								</div>
							</div>
							
							<div class="flex items-center gap-2 text-xs" style="color: var(--text-secondary);">
								<Calendar class="h-3.5 w-3.5" />
								<span>{formatDateTime(transfer.transferProcessedAt)}</span>
							</div>
							
							{#if transfer.transferId}
								<p class="text-xs mt-2 font-mono" style="color: var(--text-tertiary);">
									{transfer.transferId}
								</p>
							{/if}
						</div>
					{/each}
				</div>
			</div>
		{/if}
		
		<!-- Failed Transfers (if any) -->
		{#if transfers.failed && transfers.failed.length > 0}
			<div class="rounded-xl overflow-hidden mt-6" style="background: var(--color-error-50); border: 2px solid var(--color-error-200);">
				<div class="px-4 py-3 sm:px-6 sm:py-4" style="background: var(--color-error-100); border-bottom: 1px solid var(--color-error-200);">
					<h3 class="font-semibold flex items-center gap-2" style="color: var(--color-error-900);">
						<XCircle class="h-5 w-5" />
						Failed Transfers - Action Required
					</h3>
				</div>
				
				<div class="divide-y" style="border-color: var(--color-error-200);">
					{#each transfers.failed as transfer}
						<div class="p-4 sm:p-6" style="background: var(--bg-primary);">
							<div class="flex items-start justify-between gap-4 mb-3">
								<div class="flex-1">
									<h4 class="font-semibold text-sm sm:text-base mb-1" style="color: var(--text-primary);">
										{transfer.tourName}
									</h4>
									<p class="text-xs" style="color: var(--text-secondary);">
										{transfer.bookingReference}
									</p>
								</div>
								<p class="font-bold" style="color: var(--text-primary);">
									{$globalCurrencyFormatter(parseFloat(transfer.totalAmount))}
								</p>
							</div>
							
							<div class="p-3 rounded-lg mb-3" style="background: var(--color-error-50); border: 1px solid var(--color-error-200);">
								<p class="text-xs font-medium" style="color: var(--color-error-900);">
									{transfer.transferNotes || 'Transfer failed - please contact support'}
								</p>
							</div>
							
							<a
								href="/bookings/{transfer.bookingId}"
								class="button-secondary button-small button-gap"
							>
								<ExternalLink class="h-4 w-4" />
								View Booking
							</a>
						</div>
					{/each}
				</div>
			</div>
		{/if}
		
		<!-- Info Box -->
		<div class="mt-6 p-4 rounded-lg" style="background: var(--color-info-50); border: 1px solid var(--color-info-200);">
			<h4 class="font-semibold text-sm mb-2" style="color: var(--color-info-900);">ℹ️ How Transfers Work</h4>
			<ul class="text-xs space-y-1" style="color: var(--color-info-800);">
				<li>• Payments are held on the platform until after the cancellation window</li>
				<li>• Transfers happen automatically based on your cancellation policy</li>
				<li>• Non-refundable bookings transfer immediately</li>
				<li>• Once transferred, funds are available for withdrawal to your bank account</li>
				<li>• Check individual bookings for detailed transfer timelines</li>
			</ul>
		</div>
	{/if}
</div>

