<script lang="ts">
	import { createForm } from 'felte';
	import { validator } from '@felte/validator-yup';
	import * as yup from 'yup';
	import Building from 'lucide-svelte/icons/building';
	import CreditCard from 'lucide-svelte/icons/credit-card';
	import Globe from 'lucide-svelte/icons/globe';
	import User from 'lucide-svelte/icons/user';
	import Hash from 'lucide-svelte/icons/hash';
	import MapPin from 'lucide-svelte/icons/map-pin';
	import AlertCircle from 'lucide-svelte/icons/alert-circle';
	import CheckCircle from 'lucide-svelte/icons/check-circle';
	import Loader2 from 'lucide-svelte/icons/loader-2';
	
	let {
		country,
		currency,
		onSuccess,
		onCancel
	}: {
		country: string;
		currency: string;
		onSuccess: () => void;
		onCancel: () => void;
	} = $props();

	let isSubmitting = $state(false);
	let submitError = $state<string | null>(null);
	let submitSuccess = $state(false);

	// Different validation schemas based on country
	const getValidationSchema = (country: string) => {
		const baseSchema = {
			accountHolderName: yup.string().required('Account holder name is required'),
			bankName: yup.string().required('Bank name is required'),
			accountType: yup.string().oneOf(['checking', 'savings']).required('Account type is required')
		};

		// Country-specific validations
		if (['US', 'CA'].includes(country)) {
			return yup.object({
				...baseSchema,
				accountNumber: yup.string().required('Account number is required'),
				routingNumber: yup.string().required('Routing number is required')
			});
		} else if (['GB', 'IE', 'DE', 'FR', 'IT', 'ES', 'NL', 'BE', 'AT', 'PT'].includes(country)) {
			return yup.object({
				...baseSchema,
				iban: yup.string()
					.required('IBAN is required')
					.matches(/^[A-Z]{2}[0-9]{2}[A-Z0-9]+$/, 'Invalid IBAN format'),
				swiftCode: yup.string()
					.required('SWIFT/BIC code is required')
					.matches(/^[A-Z]{6}[A-Z0-9]{2}([A-Z0-9]{3})?$/, 'Invalid SWIFT/BIC format')
			});
		} else {
			// Default for other countries
			return yup.object({
				...baseSchema,
				accountNumber: yup.string().required('Account number is required'),
				swiftCode: yup.string()
					.required('SWIFT/BIC code is required')
					.matches(/^[A-Z]{6}[A-Z0-9]{2}([A-Z0-9]{3})?$/, 'Invalid SWIFT/BIC format')
			});
		}
	};

	const { form, errors, isValid } = createForm({
		extend: validator({ schema: getValidationSchema(country) }),
		onSubmit: async (values) => {
			isSubmitting = true;
			submitError = null;
			submitSuccess = false;

			try {
				const response = await fetch('/api/payments/bank-account', {
					method: 'POST',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify({
						...values,
						currency,
						country
					})
				});

				if (!response.ok) {
					const data = await response.json();
					throw new Error(data.error || 'Failed to save bank account');
				}

				submitSuccess = true;
				setTimeout(() => {
					onSuccess();
				}, 1500); // Show success briefly before closing
			} catch (err) {
				submitError = err instanceof Error ? err.message : 'An error occurred';
			} finally {
				isSubmitting = false;
			}
		}
	});

	// Check if we need IBAN for this country
	const needsIBAN = ['GB', 'IE', 'DE', 'FR', 'IT', 'ES', 'NL', 'BE', 'AT', 'PT'].includes(country);
	const needsRoutingNumber = ['US', 'CA'].includes(country);
</script>

<div class="bank-account-setup">
	<div class="bank-header">
		<Building class="h-5 w-5" style="color: var(--color-primary-600);" />
		<h3 class="text-lg font-semibold">Bank Account Setup</h3>
	</div>

	<div class="bank-info">
		<p class="text-sm" style="color: var(--text-secondary);">
			We'll use this bank account to send your weekly payouts in <strong>{currency}</strong>.
		</p>
		<div class="info-box">
			<AlertCircle class="h-4 w-4" />
			<p>Payouts are processed every Monday for the previous week's bookings.</p>
		</div>
	</div>

	<form use:form class="bank-form">
		<!-- Account Holder Name -->
		<div class="form-group">
			<label for="accountHolderName" class="form-label">
				<User class="h-4 w-4" />
				Account Holder Name
			</label>
			<input
				id="accountHolderName"
				name="accountHolderName"
				type="text"
				class="form-input"
				placeholder="As it appears on your bank account"
			/>
			{#if $errors.accountHolderName}
				<p class="form-error">{$errors.accountHolderName}</p>
			{/if}
		</div>

		<!-- Bank Name -->
		<div class="form-group">
			<label for="bankName" class="form-label">
				<Building class="h-4 w-4" />
				Bank Name
			</label>
			<input
				id="bankName"
				name="bankName"
				type="text"
				class="form-input"
				placeholder="Your bank's name"
			/>
			{#if $errors.bankName}
				<p class="form-error">{$errors.bankName}</p>
			{/if}
		</div>

		<!-- Account Type -->
		<div class="form-group">
			<label for="accountType" class="form-label">
				<CreditCard class="h-4 w-4" />
				Account Type
			</label>
			<select
				id="accountType"
				name="accountType"
				class="form-select"
			>
				<option value="checking">Checking</option>
				<option value="savings">Savings</option>
			</select>
			{#if $errors.accountType}
				<p class="form-error">{$errors.accountType}</p>
			{/if}
		</div>

		{#if needsIBAN}
			<!-- IBAN -->
			<div class="form-group">
				<label for="iban" class="form-label">
					<Hash class="h-4 w-4" />
					IBAN
				</label>
				<input
					id="iban"
					name="iban"
					type="text"
					class="form-input"
					placeholder="GB29 NWBK 6016 1331 9268 19"
					style="font-family: monospace;"
				/>
				{#if $errors.iban}
					<p class="form-error">{$errors.iban}</p>
				{/if}
			</div>
		{:else}
			<!-- Account Number -->
			<div class="form-group">
				<label for="accountNumber" class="form-label">
					<Hash class="h-4 w-4" />
					Account Number
				</label>
				<input
					id="accountNumber"
					name="accountNumber"
					type="text"
					class="form-input"
					placeholder="Your bank account number"
				/>
				{#if $errors.accountNumber}
					<p class="form-error">{$errors.accountNumber}</p>
				{/if}
			</div>
		{/if}

		{#if needsRoutingNumber}
			<!-- Routing Number -->
			<div class="form-group">
				<label for="routingNumber" class="form-label">
					<Hash class="h-4 w-4" />
					Routing Number
				</label>
				<input
					id="routingNumber"
					name="routingNumber"
					type="text"
					class="form-input"
					placeholder="9-digit routing number"
				/>
				{#if $errors.routingNumber}
					<p class="form-error">{$errors.routingNumber}</p>
				{/if}
			</div>
		{/if}

		<!-- SWIFT/BIC Code -->
		<div class="form-group">
			<label for="swiftCode" class="form-label">
				<Globe class="h-4 w-4" />
				SWIFT/BIC Code
			</label>
			<input
				id="swiftCode"
				name="swiftCode"
				type="text"
				class="form-input"
				placeholder="NWBKGB2L"
				style="font-family: monospace; text-transform: uppercase;"
			/>
			{#if $errors.swiftCode}
				<p class="form-error">{$errors.swiftCode}</p>
			{/if}
			<p class="form-hint">International bank identifier code</p>
		</div>

		<!-- Bank Address (Optional) -->
		<div class="form-group">
			<label for="bankAddress" class="form-label">
				<MapPin class="h-4 w-4" />
				Bank Address (Optional)
			</label>
			<textarea
				id="bankAddress"
				name="bankAddress"
				class="form-input"
				rows="2"
				placeholder="Bank branch address"
			></textarea>
		</div>

		{#if submitError}
			<div class="error-message">
				<AlertCircle class="h-4 w-4" />
				<p>{submitError}</p>
			</div>
		{/if}

		{#if submitSuccess}
			<div class="success-message">
				<CheckCircle class="h-4 w-4" />
				<p>Bank account saved successfully!</p>
			</div>
		{/if}

		<div class="form-actions">
			<button
				type="button"
				onclick={onCancel}
				class="button-secondary"
				disabled={isSubmitting}
			>
				Cancel
			</button>
			<button
				type="submit"
				class="button-primary"
				disabled={isSubmitting || !$isValid}
			>
				{#if isSubmitting}
					<Loader2 class="h-4 w-4 animate-spin" />
					Saving...
				{:else}
					Save Bank Account
				{/if}
			</button>
		</div>
	</form>
</div>

<style>
	.bank-account-setup {
		max-width: 500px;
		margin: 0 auto;
	}

	.bank-header {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		margin-bottom: 1.5rem;
	}

	.bank-info {
		margin-bottom: 2rem;
	}

	.info-box {
		display: flex;
		align-items: start;
		gap: 0.5rem;
		margin-top: 1rem;
		padding: 0.75rem;
		background: var(--color-info-50);
		border: 1px solid var(--color-info-200);
		border-radius: 0.5rem;
		font-size: 0.875rem;
		color: var(--color-info-700);
	}

	.info-box svg {
		flex-shrink: 0;
		margin-top: 0.125rem;
		color: var(--color-info-600);
	}

	.bank-form {
		display: flex;
		flex-direction: column;
		gap: 1.25rem;
	}

	.form-group {
		display: flex;
		flex-direction: column;
		gap: 0.375rem;
	}

	.form-label {
		display: flex;
		align-items: center;
		gap: 0.375rem;
		font-size: 0.875rem;
		font-weight: 500;
		color: var(--text-primary);
	}

	.form-label svg {
		width: 1rem;
		height: 1rem;
		color: var(--text-tertiary);
	}

	.form-hint {
		font-size: 0.75rem;
		color: var(--text-tertiary);
		margin-top: 0.25rem;
	}

	.form-error {
		font-size: 0.75rem;
		color: var(--color-error-600);
	}

	.error-message,
	.success-message {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		padding: 0.75rem;
		border-radius: 0.5rem;
		font-size: 0.875rem;
	}

	.error-message {
		background: var(--color-error-50);
		border: 1px solid var(--color-error-200);
		color: var(--color-error-700);
	}

	.error-message svg {
		color: var(--color-error-600);
	}

	.success-message {
		background: var(--color-success-50);
		border: 1px solid var(--color-success-200);
		color: var(--color-success-700);
	}

	.success-message svg {
		color: var(--color-success-600);
	}

	.form-actions {
		display: flex;
		gap: 0.75rem;
		justify-content: flex-end;
		margin-top: 1.5rem;
		padding-top: 1.5rem;
		border-top: 1px solid var(--border-primary);
	}
</style>