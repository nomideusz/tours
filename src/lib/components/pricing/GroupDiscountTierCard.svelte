<script lang="ts">
	import type { GroupDiscountTier } from '$lib/types.js';
	import Trash2 from 'lucide-svelte/icons/trash-2';
	import CurrencyInput from './CurrencyInput.svelte';
	
	interface Props {
		tier: GroupDiscountTier;
		index: number;
		currencySymbol: string;
		basePrice?: number;
		maxCapacity: number;
		isLastTier: boolean;
		onRemove: () => void;
		onUpdate: (updatedTier: GroupDiscountTier) => void;
	}
	
	let { 
		tier = $bindable(), 
		index, 
		currencySymbol,
		basePrice = 0,
		maxCapacity,
		isLastTier,
		onRemove, 
		onUpdate
	}: Props = $props();
	
	// Quick discount options
	const discountOptions = [
		{ label: '10% off', value: 10 },
		{ label: '20% off', value: 20 },
		{ label: '30% off', value: 30 },
		{ label: '50% off', value: 50 }
	];
	
	// Calculate discounted price from percentage
	let discountedPrice = $derived(() => {
		if (tier.discountType === 'percentage' && basePrice > 0) {
			return basePrice * (1 - tier.discountValue / 100);
		} else if (tier.discountType === 'fixed') {
			return tier.discountValue;
		}
		return 0;
	});
	
	// Calculate current discount percentage
	let currentDiscountPercent = $derived(() => {
		if (basePrice === 0) return 0;
		if (tier.discountType === 'percentage') {
			return tier.discountValue;
		} else {
			// Calculate percentage from fixed price
			return Math.round((1 - tier.discountValue / basePrice) * 100);
		}
	});
	
	// Find matching discount option
	let currentDiscountOption = $derived(
		discountOptions.find(opt => opt.value === currentDiscountPercent()) || null
	);
	
	// Apply a discount percentage
	function applyDiscount(percentage: number) {
		tier.discountType = 'percentage';
		tier.discountValue = percentage;
		onUpdate(tier);
	}
	
	// Handle custom percentage input
	function handlePercentageInput(e: Event) {
		const val = parseInt((e.target as HTMLInputElement).value);
		if (!isNaN(val) && val >= 0 && val <= 100) {
			applyDiscount(val);
		}
	}
	
	// Handle price change - update to fixed price mode
	function handlePriceChange(newPrice: number | null) {
		if (newPrice !== null) {
			tier.discountType = 'fixed';
			tier.discountValue = newPrice;
			onUpdate(tier);
		}
	}
	
	// Handlers for participant range
	function handleMinChange(e: Event) {
		const value = parseInt((e.target as HTMLInputElement).value);
		if (!isNaN(value) && value >= 1) {
			tier.minParticipants = value;
			if (tier.maxParticipants < value) {
				tier.maxParticipants = value;
			}
			onUpdate(tier);
		}
	}
	
	function handleMaxChange(e: Event) {
		const value = parseInt((e.target as HTMLInputElement).value);
		if (!isNaN(value) && value >= tier.minParticipants && value <= maxCapacity) {
			tier.maxParticipants = value;
			onUpdate(tier);
		}
	}
</script>

<div class="discount-card">
	<!-- Header with range and remove -->
	<div class="card-header">
		<div class="tier-range">
			<input
				type="number"
				min={index === 0 ? 2 : tier.minParticipants}
				max={tier.maxParticipants}
				value={tier.minParticipants}
				onchange={handleMinChange}
				class="range-input"
				aria-label="Minimum participants"
				disabled={index > 0}
			/>
			<span class="range-sep">-</span>
			{#if isLastTier}
				<span class="range-end">{maxCapacity}</span>
			{:else}
				<input
					type="number"
					min={tier.minParticipants}
					max={maxCapacity - 1}
					value={tier.maxParticipants}
					onchange={handleMaxChange}
					class="range-input"
					aria-label="Maximum participants"
				/>
			{/if}
			<span class="range-label">people</span>
		</div>
		
		<button
			type="button"
			onclick={onRemove}
			class="remove-btn"
			aria-label="Remove discount tier"
		>
			<Trash2 class="w-4 h-4" />
		</button>
	</div>
	
	<!-- Price and discount section -->
	<div class="price-section">
		<div class="price-row">
			<!-- Discount buttons on left -->
			{#if basePrice > 0}
				<div class="discount-buttons">
					{#each discountOptions as option}
						<button
							type="button"
							onclick={() => applyDiscount(option.value)}
							class="discount-btn"
							class:active={currentDiscountOption?.value === option.value}
							title="{option.label}"
						>
							-{option.value}%
						</button>
					{/each}
					<!-- Custom discount percentage -->
					<div class="custom-discount">
						<input
							type="number"
							min="0"
							max="100"
							placeholder="%"
							value={currentDiscountPercent()}
							oninput={handlePercentageInput}
							class="discount-input"
							title="Custom discount percentage"
						/>
						<span class="percent-sign">%</span>
					</div>
				</div>
			{/if}
			
			<!-- Discounted price on right -->
			<div class="price-input-wrapper">
				<CurrencyInput
					value={discountedPrice()}
					{currencySymbol}
					step={0.5}
					placeholder="0.00"
					class="price-input"
					ariaLabel="Discounted price per person"
					onInput={handlePriceChange}
				/>
			</div>
		</div>
	</div>
</div>

<style>
	.discount-card {
		background: var(--bg-secondary);
		border: 1px solid var(--border-primary);
		border-radius: 0.75rem;
		padding: 1rem;
		transition: all 0.2s ease;
	}
	
	.discount-card:hover {
		border-color: var(--border-secondary);
		box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
	}
	
	.card-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		gap: 0.75rem;
		margin-bottom: 0.75rem;
	}
	
	.tier-range {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		flex: 1;
	}
	
	.range-input {
		width: 3.5rem;
		padding: 0.375rem 0.5rem;
		font-size: 0.875rem;
		font-weight: 500;
		text-align: center;
		border: 1px solid var(--border-secondary);
		border-radius: 0.375rem;
		background: var(--bg-primary);
		color: var(--text-primary);
	}
	
	.range-input:focus {
		outline: none;
		border-color: var(--color-primary-500);
		box-shadow: 0 0 0 2px var(--color-primary-100);
	}
	
	.range-input:disabled {
		background: var(--bg-secondary);
		color: var(--text-tertiary);
		cursor: not-allowed;
		opacity: 0.7;
	}
	
	.range-sep {
		color: var(--text-tertiary);
		font-weight: 500;
		font-size: 0.875rem;
	}
	
	.range-end {
		width: 3.5rem;
		font-size: 0.875rem;
		font-weight: 600;
		color: var(--text-primary);
		text-align: center;
	}
	
	.range-label {
		font-size: 0.75rem;
		color: var(--text-secondary);
		white-space: nowrap;
	}
	
	.remove-btn {
		padding: 0.375rem;
		color: var(--color-error-600);
		background: transparent;
		border: none;
		border-radius: 0.375rem;
		cursor: pointer;
		transition: all 0.15s ease;
		flex-shrink: 0;
	}
	
	.remove-btn:hover {
		background: var(--color-error-50);
		color: var(--color-error-700);
	}
	
	/* Price section with discount buttons left, price right */
	.price-section {
		padding: 0.75rem;
		background: var(--bg-primary);
		border-radius: 0.5rem;
	}
	
	.price-row {
		display: flex;
		justify-content: space-between;
		align-items: center;
		gap: 0.75rem;
	}
	
	.discount-buttons {
		display: flex;
		align-items: center;
		gap: 0.375rem;
		flex-wrap: wrap;
		flex: 1;
		min-width: 0;
	}
	
	.discount-btn {
		padding: 0.375rem 0.625rem;
		font-size: 0.75rem;
		font-weight: 500;
		color: var(--text-secondary);
		background: var(--bg-secondary);
		border: 1px solid var(--border-secondary);
		border-radius: 0.375rem;
		cursor: pointer;
		transition: all 0.15s ease;
		white-space: nowrap;
	}
	
	.discount-btn:hover {
		background: var(--bg-primary);
		border-color: var(--border-primary);
		transform: translateY(-1px);
	}
	
	.discount-btn.active {
		background: var(--color-primary-100);
		border-color: var(--color-primary-400);
		color: var(--color-primary-700);
		font-weight: 600;
	}
	
	.custom-discount {
		display: flex;
		align-items: center;
		gap: 0.25rem;
		padding: 0.25rem 0.5rem;
		background: var(--bg-secondary);
		border: 1px solid var(--border-secondary);
		border-radius: 0.375rem;
		transition: all 0.15s ease;
	}
	
	.custom-discount:focus-within {
		border-color: var(--color-primary-500);
		box-shadow: 0 0 0 2px var(--color-primary-100);
	}
	
	.discount-input {
		width: 2.5rem;
		padding: 0.125rem 0.25rem;
		font-size: 0.75rem;
		font-weight: 500;
		text-align: center;
		border: none;
		background: transparent;
		color: var(--text-primary);
	}
	
	.discount-input:focus {
		outline: none;
	}
	
	.percent-sign {
		font-size: 0.75rem;
		font-weight: 500;
		color: var(--text-tertiary);
	}
	
	/* Hide number spinners */
	.discount-input::-webkit-inner-spin-button,
	.discount-input::-webkit-outer-spin-button {
		-webkit-appearance: none;
		appearance: none;
		margin: 0;
	}
	
	.discount-input[type="number"] {
		-moz-appearance: textfield;
		appearance: textfield;
	}
	
	.price-input-wrapper {
		width: 7rem;
		flex-shrink: 0;
	}
	
	:global(.price-input) {
		width: 100%;
		font-size: 1.125rem;
		font-weight: 600;
		text-align: right;
		padding: 0.375rem 0.5rem;
	}
	
	/* Mobile responsiveness */
	@media (max-width: 640px) {
		.card-header {
			flex-wrap: wrap;
		}
		
		.tier-range {
			flex-basis: 100%;
		}
		
		.price-row {
			flex-direction: column;
			align-items: stretch;
			gap: 0.5rem;
		}
		
		.discount-buttons {
			width: 100%;
			justify-content: flex-start;
		}
		
		.price-input-wrapper {
			width: 100%;
		}
		
		.discount-btn {
			flex: 1;
			min-width: fit-content;
		}
	}
</style>