<script lang="ts">
	import { onMount } from 'svelte';
	import Wallet from 'lucide-svelte/icons/wallet';
	import Calendar from 'lucide-svelte/icons/calendar';
	import Clock from 'lucide-svelte/icons/clock';
	import TrendingUp from 'lucide-svelte/icons/trending-up';
	import Building from 'lucide-svelte/icons/building';
	import CheckCircle from 'lucide-svelte/icons/check-circle';
	import AlertCircle from 'lucide-svelte/icons/alert-circle';
	import Loader2 from 'lucide-svelte/icons/loader-2';
	import RefreshCcw from 'lucide-svelte/icons/refresh-ccw';
	import { formatCurrency } from '$lib/utils/currency.js';
	import type { Currency } from '$lib/stores/currency.js';
	
	let {
		userId,
		currency = 'EUR'
	}: {
		userId: string;
		currency: string;
	} = $props();

	let loading = $state(true);
	let error = $state<string | null>(null);
	let pendingBalance = $state(0);
	let nextPayoutDate = $state<Date | null>(null);
	let lastPayoutDate = $state<Date | null>(null);
	let payoutHistory = $state<any[]>([]);
	let bankAccount = $state<any>(null);
	let totalPaidOut = $state(0);

	async function loadPayoutData() {
		loading = true;
		error = null;

		try {
			// Fetch payout status
			const response = await fetch('/api/payouts/status');
			if (!response.ok) {
				const errorData = await response.text();
				console.error('Payout API error:', response.status, errorData);
				throw new Error(`Failed to load payout data: ${response.status}`);
			}

			const data = await response.json();
			pendingBalance = data.pendingBalance || 0;
			payoutHistory = data.recentPayouts || [];
			totalPaidOut = data.totalPaidOut || 0;

			// Calculate next payout date (next Monday)
			const today = new Date();
			const daysUntilMonday = (8 - today.getDay()) % 7 || 7;
			nextPayoutDate = new Date(today);
			nextPayoutDate.setDate(today.getDate() + daysUntilMonday);
			nextPayoutDate.setHours(9, 0, 0, 0); // 9 AM

			// Get last payout date from history
			if (payoutHistory.length > 0) {
				lastPayoutDate = new Date(payoutHistory[0].completedAt || payoutHistory[0].createdAt);
			}

			// Fetch bank account info
			const bankResponse = await fetch('/api/payments/bank-account');
			if (bankResponse.ok) {
				const bankData = await bankResponse.json();
				if (bankData.hasBankAccount) {
					bankAccount = bankData.bankAccount;
				}
			}
		} catch (err) {
			error = err instanceof Error ? err.message : 'An error occurred';
		} finally {
			loading = false;
		}
	}

	// Format date for display
	function formatPayoutDate(date: Date) {
		return new Intl.DateTimeFormat('en-US', {
			weekday: 'long',
			month: 'long',
			day: 'numeric'
		}).format(date);
	}

	// Format relative time
	function formatRelativeTime(date: Date) {
		const days = Math.ceil((date.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
		if (days === 0) return 'Today';
		if (days === 1) return 'Tomorrow';
		if (days <= 7) return `In ${days} days`;
		return formatPayoutDate(date);
	}

	// Get payout status color
	function getPayoutStatusColor(status: string) {
		switch (status) {
			case 'completed': return 'success';
			case 'processing': return 'info';
			case 'failed': return 'error';
			default: return 'warning';
		}
	}

	onMount(() => {
		loadPayoutData();
	});
</script>

<div class="payout-dashboard">
	{#if loading}
		<div class="loading-state">
			<Loader2 class="h-5 w-5 animate-spin" />
			<p>Loading payout information...</p>
		</div>
	{:else if error}
		<div class="error-state">
			<AlertCircle class="h-5 w-5" />
			<p>{error}</p>
			<button onclick={loadPayoutData} class="button-secondary button-gap button-small">
				<RefreshCcw class="h-4 w-4" />
				Retry
			</button>
		</div>
	{:else}
		<!-- Payout Overview -->
		<div class="payout-grid">
			<!-- Pending Balance -->
			<div class="payout-card">
				<div class="payout-card-header">
					<Wallet class="h-4 w-4" />
					<span>Pending Balance</span>
				</div>
				<div class="payout-card-value">
					{formatCurrency(pendingBalance, { currency: currency as Currency })}
				</div>
				<p class="payout-card-description">
					To be paid out on next payout date
				</p>
			</div>

			<!-- Next Payout -->
			<div class="payout-card">
				<div class="payout-card-header">
					<Calendar class="h-4 w-4" />
					<span>Next Payout</span>
				</div>
				{#if nextPayoutDate && pendingBalance > 0}
					<div class="payout-card-value">
						{formatRelativeTime(nextPayoutDate)}
					</div>
					<p class="payout-card-description">
						{formatPayoutDate(nextPayoutDate)}
					</p>
				{:else}
					<div class="payout-card-value text-sm">
						No pending payouts
					</div>
					<p class="payout-card-description">
						Payouts process weekly on Mondays
					</p>
				{/if}
			</div>

			<!-- Total Paid Out -->
			<div class="payout-card">
				<div class="payout-card-header">
					<TrendingUp class="h-4 w-4" />
					<span>Total Paid Out</span>
				</div>
				<div class="payout-card-value">
					{formatCurrency(totalPaidOut, { currency: currency as Currency })}
				</div>
				<p class="payout-card-description">
					Lifetime earnings transferred
				</p>
			</div>
		</div>

		<!-- Bank Account Info -->
		{#if bankAccount}
			<div class="bank-info-card">
				<div class="bank-info-header">
					<Building class="h-4 w-4" />
					<span>Bank Account</span>
				</div>
				<div class="bank-info-details">
					<p><strong>{bankAccount.bankName}</strong></p>
					<p>{bankAccount.accountHolderName}</p>
					<p class="masked-account">{bankAccount.maskedAccount}</p>
				</div>
				<p class="bank-info-note">
					Last updated: {new Date(bankAccount.lastUpdated).toLocaleDateString()}
				</p>
			</div>
		{/if}

		<!-- Payout History -->
		{#if payoutHistory.length > 0}
			<div class="payout-history">
				<h4 class="payout-history-title">Recent Payouts</h4>
				<div class="payout-list">
					{#each payoutHistory as payout}
						<div class="payout-item">
							<div class="payout-item-left">
								{#if payout.status === 'completed'}
									<CheckCircle class="h-4 w-4" style="color: var(--color-success-600);" />
								{:else if payout.status === 'processing'}
									<Clock class="h-4 w-4" style="color: var(--color-info-600);" />
								{:else}
									<AlertCircle class="h-4 w-4" style="color: var(--color-error-600);" />
								{/if}
								<div>
									<p class="payout-item-amount">
										{formatCurrency(payout.totalAmount, { currency: (payout.payoutCurrency || currency) as Currency })}
									</p>
									<p class="payout-item-date">
										{new Date(payout.completedAt || payout.createdAt).toLocaleDateString()}
									</p>
								</div>
							</div>
							<div class="payout-item-status status-{getPayoutStatusColor(payout.status)}">
								{payout.status}
							</div>
						</div>
					{/each}
				</div>
			</div>
		{:else}
			<div class="empty-state">
				<Clock class="h-8 w-8" style="color: var(--text-tertiary);" />
				<p>No payouts yet</p>
				<p class="text-sm" style="color: var(--text-tertiary);">
					Your first payout will appear here after processing
				</p>
			</div>
		{/if}
	{/if}
</div>

<style>
	.payout-dashboard {
		display: flex;
		flex-direction: column;
		gap: 1.5rem;
	}

	.loading-state,
	.error-state {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 1rem;
		padding: 3rem;
		text-align: center;
		color: var(--text-secondary);
	}

	.error-state {
		color: var(--color-error-600);
	}

	.payout-grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
		gap: 1rem;
	}

	.payout-card {
		background: var(--bg-primary);
		border: 1px solid var(--border-primary);
		border-radius: 0.75rem;
		padding: 1.25rem;
	}

	.payout-card-header {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		font-size: 0.875rem;
		color: var(--text-secondary);
		margin-bottom: 0.75rem;
	}

	.payout-card-header svg {
		color: var(--text-tertiary);
	}

	.payout-card-value {
		font-size: 1.5rem;
		font-weight: 600;
		color: var(--text-primary);
		margin-bottom: 0.25rem;
	}

	.payout-card-description {
		font-size: 0.75rem;
		color: var(--text-tertiary);
	}

	.bank-info-card {
		background: var(--bg-primary);
		border: 1px solid var(--border-primary);
		border-radius: 0.75rem;
		padding: 1.25rem;
	}

	.bank-info-header {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		font-size: 0.875rem;
		font-weight: 500;
		color: var(--text-primary);
		margin-bottom: 1rem;
	}

	.bank-info-details {
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
		font-size: 0.875rem;
		color: var(--text-secondary);
	}

	.masked-account {
		font-family: monospace;
		color: var(--text-tertiary);
	}

	.bank-info-note {
		font-size: 0.75rem;
		color: var(--text-tertiary);
		margin-top: 0.75rem;
	}

	.payout-history {
		background: var(--bg-primary);
		border: 1px solid var(--border-primary);
		border-radius: 0.75rem;
		padding: 1.25rem;
	}

	.payout-history-title {
		font-size: 0.875rem;
		font-weight: 500;
		color: var(--text-primary);
		margin-bottom: 1rem;
	}

	.payout-list {
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
	}

	.payout-item {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 0.75rem;
		background: var(--bg-secondary);
		border-radius: 0.5rem;
	}

	.payout-item-left {
		display: flex;
		align-items: center;
		gap: 0.75rem;
	}

	.payout-item-amount {
		font-weight: 500;
		color: var(--text-primary);
	}

	.payout-item-date {
		font-size: 0.75rem;
		color: var(--text-tertiary);
	}

	.payout-item-status {
		font-size: 0.75rem;
		font-weight: 500;
		padding: 0.25rem 0.5rem;
		border-radius: 0.25rem;
		text-transform: capitalize;
	}

	.status-success {
		background: var(--color-success-bg);
		color: var(--color-success-text);
	}

	.status-info {
		background: var(--color-info-bg);
		color: var(--color-info-text);
	}

	.status-error {
		background: var(--color-error-bg);
		color: var(--color-error-text);
	}

	.status-warning {
		background: var(--color-warning-bg);
		color: var(--color-warning-text);
	}

	.empty-state {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 0.5rem;
		padding: 3rem;
		text-align: center;
		color: var(--text-secondary);
		background: var(--bg-secondary);
		border-radius: 0.75rem;
		border: 1px dashed var(--border-secondary);
	}
</style>