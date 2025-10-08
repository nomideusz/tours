<script lang="ts">
	import type { GroupPricingTier } from '$lib/types.js';
	import type { ValidationError } from '$lib/validation.js';
	import TierCard from './TierCard.svelte';
	import QuickTemplates from './QuickTemplates.svelte';
	import ConfirmationModal from '../ConfirmationModal.svelte';
	import Plus from 'lucide-svelte/icons/plus';
	import AlertCircle from 'lucide-svelte/icons/alert-circle';
	import RefreshCw from 'lucide-svelte/icons/refresh-cw';
	import { validatePricingTiers } from '$lib/utils/pricing-calculations.js';

	interface Props {
		tiers: GroupPricingTier[];
		currencySymbol: string;
		privateBooking?: boolean;
		onUpdate: (tiers: GroupPricingTier[], privateBooking?: boolean) => void;
		allErrors?: ValidationError[];
	}

	let { 
		tiers = $bindable([]), 
		currencySymbol, 
		privateBooking = $bindable(false),
		onUpdate, 
		allErrors = [] 
	}: Props = $props();
	
	// Modal state
	let showResetConfirmation = $state(false);
	
	// Track which tiers have been interacted with (by index)
	let touchedTiers = $state<Set<number>>(new Set());
	let hasInitialized = $state(false);
	
	// Get error for a specific tier
	function getTierError(index: number): string | null {
		if (!allErrors) return null;
		const error = allErrors.find(e => e.field === `groupPricingTiers.tiers.${index}`);
		return error ? error.message : null;
	}
	
	// Handle reset confirmation
	function handleResetConfirm() {
		tiers = [];
		onUpdate(tiers, privateBooking);
	}

	// Validation errors - manually updated
	let validationErrors = $state<string[]>([]);
	
	// Function to update validation errors
	function updateValidationErrors() {
		if (tiers.length === 0) {
			validationErrors = [];
			return;
		}
		
		const validation = validatePricingTiers(tiers);
		// Filter errors to only show for touched tiers
		validationErrors = validation.errors.filter(error => {
			// Check if error is for a specific tier (format: "Tier X: ...")
			const match = error.match(/^Tier (\d+):/);
			if (match) {
				const tierIndex = parseInt(match[1]) - 1;
				return touchedTiers.has(tierIndex);
			}
			// Show non-tier-specific errors (like overlaps) only if any tier is touched
			return touchedTiers.size > 0;
		});
	}

	function addTier() {
		const newTier: GroupPricingTier = {
			minParticipants: 1,
			maxParticipants: 10,
			price: 0,
			label: ''
		};
		tiers = [...tiers, newTier];
		onUpdate(tiers, privateBooking);
	}

	function removeTier(index: number) {
		tiers = tiers.filter((_, i) => i !== index);
		// Adjust touched indices after removal
		const newTouched = new Set<number>();
		touchedTiers.forEach(touchedIndex => {
			if (touchedIndex < index) {
				newTouched.add(touchedIndex);
			} else if (touchedIndex > index) {
				newTouched.add(touchedIndex - 1);
			}
			// Skip the removed index
		});
		touchedTiers = newTouched;
		onUpdate(tiers, privateBooking);
	}

	function updateTier(index: number, updatedTier: GroupPricingTier) {
		// Mark this tier as touched when user interacts with it
		touchedTiers = new Set([...touchedTiers, index]);
		tiers[index] = updatedTier;
		tiers = [...tiers]; // Trigger reactivity
		onUpdate(tiers, privateBooking);
		updateValidationErrors();
	}

	function applyTemplate(templateTiers: GroupPricingTier[]) {
		tiers = templateTiers;
		// Mark all template tiers as touched (they're pre-filled)
		touchedTiers = new Set(tiers.map((_, index) => index));
		onUpdate(tiers, privateBooking);
		updateValidationErrors();
	}
	
	// Handle private booking toggle
	function handlePrivateBookingChange() {
		onUpdate(tiers, privateBooking);
	}
	
	// On mount: if tiers already exist (edit mode), mark them as touched
	$effect(() => {
		if (!hasInitialized && tiers.length > 0) {
			// This is edit mode - tiers already exist on load
			// Mark all existing tiers as touched in edit mode
			touchedTiers = new Set(tiers.map((_, index) => index));
			updateValidationErrors();
			hasInitialized = true;
		} else if (!hasInitialized) {
			// This is create mode - no tiers on load
			hasInitialized = true;
		}
	});
</script>

<div class="tiers-section">
	<div>
		<h4 class="section-title">Pricing Tiers by Group Size</h4>
	</div>
	
	<!-- Private Booking Option -->
	<label class="private-booking-option" class:active={privateBooking}>
		<input
			type="checkbox"
			bind:checked={privateBooking}
			onchange={handlePrivateBookingChange}
		/>
		<div class="private-booking-content">
			<div class="private-booking-title">
				Private Tour (Exclusive Booking)
			</div>
			<div class="private-booking-desc">
				Each booking reserves the entire time slot
			</div>
		</div>
	</label>
	
	{#if tiers.length === 0}
		<!-- Show templates when no tiers exist -->
		<QuickTemplates onApplyTemplate={applyTemplate} />
		
		<!-- Add First Tier Button -->
		<button
			type="button"
			onclick={addTier}
			class="add-tier-btn"
		>
			<Plus class="w-4 h-4" />
			<span class="text-sm font-medium">Add First Tier</span>
		</button>
	{:else}
		<!-- Show tier cards -->
		<div class="tiers-list">
			{#each tiers as tier, index (index)}
				<div>
					<TierCard
						bind:tier={tiers[index]}
						{index}
						{currencySymbol}
						onRemove={() => removeTier(index)}
						onUpdate={(updated) => updateTier(index, updated)}
					/>
					{#if getTierError(index)}
						<div class="tier-error">
							<AlertCircle class="w-4 h-4 flex-shrink-0" style="color: var(--color-error-600);" />
							<p class="text-sm" style="color: var(--color-error-900);">
								{getTierError(index)}
							</p>
						</div>
					{/if}
				</div>
			{/each}
		</div>
		
		<!-- Add Tier Button (below tiers list) -->
		<button
			type="button"
			onclick={addTier}
			class="add-another-tier-btn"
		>
			<Plus class="w-4 h-4" />
			<span class="text-sm font-medium">Add Tier</span>
		</button>
		
		<!-- Validation Errors -->
		{#if validationErrors.length > 0}
			<div class="rounded-lg p-3 alert-error">
				<div class="flex items-start gap-2">
					<AlertCircle class="w-5 h-5 flex-shrink-0" />
					<div class="flex-1">
						<p class="font-medium text-sm mb-1">Tier Configuration Issues:</p>
						<ul class="text-xs space-y-1">
							{#each validationErrors as error}
								<li>• {error}</li>
							{/each}
						</ul>
					</div>
				</div>
			</div>
		{/if}
		
		<!-- Option to reset and use templates -->
		<div class="pt-2">
			<button
				type="button"
				onclick={() => showResetConfirmation = true}
				class="text-xs hover:underline"
				style="color: var(--text-tertiary);"
			>
				Start over with template
			</button>
		</div>
	{/if}
</div>

<!-- Reset Confirmation Modal -->
<ConfirmationModal
	bind:isOpen={showResetConfirmation}
	title="Start over with template?"
	message="This will remove all your current pricing tiers. You can then select a template to start fresh."
	confirmText="Yes, start over"
	cancelText="Keep current tiers"
	variant="warning"
	icon={RefreshCw}
	onConfirm={handleResetConfirm}
/>

<style>
	.tiers-section {
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
	}
	
	.section-title {
		font-size: 0.9375rem;
		font-weight: 600;
		color: var(--text-primary);
		margin: 0;
	}
	
	.private-booking-option {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		padding: 0.75rem;
		background: var(--bg-secondary);
		border: 1px solid var(--border-primary);
		border-radius: 0.5rem;
		cursor: pointer;
		transition: all 0.15s ease;
	}
	
	.private-booking-option:hover {
		border-color: var(--border-secondary);
		box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
	}
	
	.private-booking-option.active {
		border-color: var(--color-primary-300);
		background: var(--color-primary-50);
	}
	
	.private-booking-option input[type="checkbox"] {
		width: 1rem;
		height: 1rem;
		cursor: pointer;
		accent-color: var(--color-primary-600);
		flex-shrink: 0;
	}
	
	.private-booking-content {
		flex: 1;
		min-width: 0;
	}
	
	.private-booking-title {
		font-size: 0.875rem;
		font-weight: 500;
		color: var(--text-primary);
	}
	
	.private-booking-desc {
		font-size: 0.75rem;
		color: var(--text-secondary);
		margin-top: 0.125rem;
	}
	
	.tiers-list {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}
	
	.tier-error {
		display: flex;
		align-items: flex-start;
		gap: 0.5rem;
		margin-top: 0.5rem;
		padding: 0.75rem;
		background: var(--color-error-50);
		border: 1px solid var(--color-error-200);
		border-radius: 0.5rem;
	}
	
	.add-tier-btn {
		width: 100%;
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 0.5rem;
		padding: 0.75rem;
		background: var(--bg-secondary);
		border: 1px solid var(--border-primary);
		border-radius: 0.75rem;
		color: var(--text-primary);
		cursor: pointer;
		transition: all 0.15s ease;
	}
	
	.add-tier-btn:hover {
		border-color: var(--border-secondary);
		box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
	}
	
	.add-another-tier-btn {
		width: 100%;
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 0.5rem;
		padding: 0.625rem;
		background: var(--bg-primary);
		border: 1px dashed var(--border-secondary);
		border-radius: 0.5rem;
		color: var(--text-secondary);
		font-size: 0.8125rem;
		font-weight: 500;
		cursor: pointer;
		transition: all 0.15s ease;
	}
	
	.add-another-tier-btn:hover {
		border-color: var(--color-primary-400);
		background: var(--color-primary-50);
		color: var(--color-primary-700);
		border-style: solid;
	}
</style>

