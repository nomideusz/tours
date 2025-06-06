<script lang="ts">
	import { enhance } from '$app/forms';
	import { t, language } from '$lib/i18n.js';
	import Loader from 'lucide-svelte/icons/loader';
	import User from 'lucide-svelte/icons/user';
	import Lock from 'lucide-svelte/icons/lock';
	import Mail from 'lucide-svelte/icons/mail';
	import Shield from 'lucide-svelte/icons/shield';
	import PageHeader from '$lib/components/PageHeader.svelte';
	import LoadingSpinner from '$lib/components/LoadingSpinner.svelte';
	import ErrorAlert from '$lib/components/ErrorAlert.svelte';
	import Calendar from 'lucide-svelte/icons/calendar';
	import Save from 'lucide-svelte/icons/save';
	import CreditCard from 'lucide-svelte/icons/credit-card';
	import DollarSign from 'lucide-svelte/icons/dollar-sign';
	import CheckCircle from 'lucide-svelte/icons/check-circle';
	import AlertCircle from 'lucide-svelte/icons/alert-circle';

	let { data, form } = $props();

	// Loading states
	let profileLoading = $state(false);
	let passwordLoading = $state(false);
	let verificationLoading = $state(false);
	let paymentStatusLoading = $state(true);

	// Form data
	let name = $state(data.user.name);
	let username = $state(data.user.username);
	let businessName = $state(data.user.businessName);
	let description = $state(data.user.description);
	let phone = $state(data.user.phone);
	let website = $state(data.user.website);

	// Password form data
	let currentPassword = $state('');
	let newPassword = $state('');
	let confirmPassword = $state('');

	// Payment status
	let paymentStatus: {
		hasAccount: boolean;
		isSetupComplete: boolean;
		canReceivePayments: boolean;
		accountInfo?: {
			businessName?: string;
			requiresAction?: boolean;
			[key: string]: any;
		} | null;
	} = $state({
		hasAccount: false,
		isSetupComplete: false,
		canReceivePayments: false,
		accountInfo: null
	});

	// Reset password form on success
	$effect(() => {
		if (form?.success && form?.message?.includes('Password')) {
			currentPassword = '';
			newPassword = '';
			confirmPassword = '';
		}
		
		// Handle Stripe redirect
		if (form?.success && form?.redirect) {
			window.location.href = form.redirect;
		}
	});

	// Load payment status
	$effect(() => {
		if (data.user.id) {
			loadPaymentStatus();
		}
	});

	async function loadPaymentStatus() {
		try {
			paymentStatusLoading = true;
			const response = await fetch(`/api/payments/connect/status?userId=${data.user.id}`);
			if (response.ok) {
				paymentStatus = await response.json();
			}
		} catch (error) {
			console.error('Failed to load payment status:', error);
		} finally {
			paymentStatusLoading = false;
		}
	}

	let isSubmitting = $state(false);
</script>

<svelte:head>
	<title>Profile Settings - Zaur</title>
</svelte:head>

<div class="max-w-screen-2xl mx-auto px-6 sm:px-8 lg:px-12 py-8">
	<PageHeader 
		title="Profile Settings"
		subtitle="Manage your account information and preferences"
	/>

	<div class="max-w-2xl">
		<!-- Profile Form -->
		<div class="rounded-xl p-6" style="background: var(--bg-primary); border: 1px solid var(--border-primary);">
			<div class="flex items-center gap-3 mb-6">
				<div class="p-2 rounded-lg" style="background: var(--color-primary-50);">
					<User class="h-5 w-5" style="color: var(--color-primary-600);" />
				</div>
				<div>
					<h2 class="text-lg font-semibold" style="color: var(--text-primary);">Personal Information</h2>
					<p class="text-sm" style="color: var(--text-secondary);">Update your profile details</p>
				</div>
			</div>

			{#if form?.error}
				<div class="mb-6">
					<ErrorAlert variant="error" message={form.error} />
				</div>
			{/if}

			{#if form?.success}
				<div class="mb-6">
					<ErrorAlert variant="info" title="Success" message="Profile updated successfully!" />
				</div>
			{/if}

			<form 
				method="POST" 
				action="?/updateProfile"
				use:enhance={() => {
					isSubmitting = true;
					return async ({ update }) => {
						await update();
						isSubmitting = false;
					};
				}}
			>
				<div class="space-y-6">
					<!-- Username -->
					<div>
						<label for="username" class="form-label">
							Username
						</label>
						<div class="relative">
							<User class="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4" style="color: var(--text-tertiary);" />
							<input
								type="text"
								id="username" 
								name="username"
								value={data.user?.username || ''}
								class="form-input pl-10"
								placeholder="Enter your username"
								required
							/>
						</div>
					</div>

					<!-- Name -->
					<div>
						<label for="name" class="form-label">
							Full Name
						</label>
						<div class="relative">
							<User class="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4" style="color: var(--text-tertiary);" />
							<input
								type="text"
								id="name"
								name="name" 
								value={data.user?.name || ''}
								class="form-input pl-10"
								placeholder="Enter your full name"
							/>
						</div>
					</div>

					<!-- Email -->
					<div>
						<label for="email" class="form-label">
							Email Address
						</label>
						<div class="relative">
							<Mail class="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4" style="color: var(--text-tertiary);" />
							<input
								type="email"
								id="email"
								name="email"
								value={data.user?.email || ''}
								class="form-input pl-10"
								placeholder="Enter your email"
								required
							/>
						</div>
					</div>


				</div>

				<!-- Submit Button -->
				<div class="flex justify-end pt-6 mt-8" style="border-top: 1px solid var(--border-primary);">
					<button
						type="submit"
						disabled={isSubmitting}
						class="button-primary button--gap"
					>
						{#if isSubmitting}
							<LoadingSpinner size="small" variant="white" text="Saving..." />
						{:else}
							<Save class="h-4 w-4" />
							Save Changes
						{/if}
					</button>
				</div>
			</form>
		</div>

		<!-- Payment Setup Section -->
		<div class="rounded-xl p-6 mt-6" style="background: var(--bg-primary); border: 1px solid var(--border-primary);">
			<div class="flex items-center gap-3 mb-6">
				<div class="p-2 rounded-lg" style="background: var(--color-success-light);">
					<DollarSign class="h-5 w-5" style="color: var(--color-success);" />
				</div>
				<div>
					<h2 class="text-lg font-semibold" style="color: var(--text-primary);">Payment Setup</h2>
					<p class="text-sm" style="color: var(--text-secondary);">Configure your account to receive payments from customers</p>
				</div>
			</div>

			{#if paymentStatusLoading}
				<div class="flex justify-center py-8">
					<LoadingSpinner size="medium" />
				</div>
			{:else}
				<div class="space-y-4">
					<!-- Account Status -->
					<div class="flex items-start gap-3 p-4 rounded-lg" style="background: var(--bg-secondary);">
						{#if paymentStatus.canReceivePayments}
							<CheckCircle class="h-5 w-5 mt-0.5" style="color: var(--color-success);" />
							<div>
								<p class="font-medium" style="color: var(--text-primary);">Payment account active</p>
								<p class="text-sm" style="color: var(--text-secondary);">You can receive payments from customers</p>
								{#if paymentStatus.accountInfo?.businessName}
									<p class="text-xs mt-1" style="color: var(--text-tertiary);">Business: {paymentStatus.accountInfo.businessName}</p>
								{/if}
							</div>
						{:else if paymentStatus.hasAccount && !paymentStatus.isSetupComplete}
							<AlertCircle class="h-5 w-5 mt-0.5" style="color: var(--color-warning);" />
							<div>
								<p class="font-medium" style="color: var(--text-primary);">Setup incomplete</p>
								<p class="text-sm" style="color: var(--text-secondary);">Complete your payment account setup to start receiving payments</p>
								{#if paymentStatus.accountInfo?.requiresAction}
									<p class="text-xs mt-1" style="color: var(--color-error);">Action required: Additional information needed</p>
								{/if}
							</div>
						{:else}
							<CreditCard class="h-5 w-5 mt-0.5" style="color: var(--text-tertiary);" />
							<div>
								<p class="font-medium" style="color: var(--text-primary);">No payment account</p>
								<p class="text-sm" style="color: var(--text-secondary);">Set up your account to receive payments directly from customers</p>
							</div>
						{/if}
					</div>

					<!-- Setup Button -->
					<div class="flex justify-end">
						{#if !paymentStatus.hasAccount}
							<form method="POST" action="?/setupPayments">
								<button
									type="submit"
									class="button-primary button--gap"
								>
									<CreditCard class="h-4 w-4" />
									Setup Payment Account
								</button>
							</form>
						{:else if !paymentStatus.isSetupComplete || paymentStatus.accountInfo?.requiresAction}
							<form method="POST" action="?/setupPayments">
								<button
									type="submit"
									class="button-secondary button--gap"
								>
									<AlertCircle class="h-4 w-4" />
									Complete Setup
								</button>
							</form>
						{:else}
							<form method="POST" action="?/setupPayments">
								<button
									type="submit"
									class="button-secondary button--gap"
								>
									<CreditCard class="h-4 w-4" />
									Manage Payment Account
								</button>
							</form>
						{/if}
					</div>

					<!-- Payment Info -->
					<div class="mt-4 p-4 rounded-lg" style="background: var(--color-primary-50);">
						<h4 class="font-medium mb-2" style="color: var(--color-primary-900);">How payments work</h4>
						<ul class="text-sm space-y-1" style="color: var(--color-primary-700);">
							<li>• Customers pay directly for tours through our secure payment system</li>
							<li>• Payments are automatically transferred to your account (minus our platform fee)</li>
							<li>• You'll receive payouts according to your Stripe schedule (typically 2-7 days)</li>
							<li>• All transactions are tracked and reported for your records</li>
						</ul>
					</div>
				</div>
			{/if}
		</div>
	</div>
</div> 