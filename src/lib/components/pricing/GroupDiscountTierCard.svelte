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
		tier, 
		index, 
		currencySymbol,
		basePrice = 0,
		maxCapacity,
		isLastTier,
		onRemove, 
		onUpdate
	}: Props = $props();
	
	// Refs to input elements for syncing
	let minInput: HTMLInputElement | undefined = $state(undefined);
	let maxInput: HTMLInputElement | undefined = $state(undefined);
	
	// Sync input values when tier changes (e.g., from cascade)
	$effect(() => {
		if (minInput && index === 0) {
			minInput.value = tier.minParticipants.toString();
		}
		if (maxInput && !isLastTier) {
			maxInput.value = tier.maxParticipants.toString();
		}
	});
	
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
	
	// Check if this is a surcharge (price higher than base)
	let isSurcharge = $derived(() => {
		if (basePrice === 0) return false;
		return discountedPrice() > basePrice;
	});
	
	// Check if range exceeds capacity
	let exceedsCapacity = $derived(() => {
		return tier.minParticipants > maxCapacity || tier.maxParticipants > maxCapacity;
	});
	
	// Apply a discount percentage
	function applyDiscount(percentage: number) {
		onUpdate({
			...tier,
			discountType: 'percentage',
			discountValue: percentage
		});
	}
	
	// Handle custom percentage input
	function handlePercentageInput(e: Event) {
		let val = parseInt((e.target as HTMLInputElement).value);
		if (!isNaN(val)) {
			// Allow -100 to 99 (negative = surcharge, 99% max discount to keep min price)
			val = Math.max(-100, Math.min(99, val));
			applyDiscount(val);
		}
	}
	
	// Handle price change - update to fixed price mode
	function handlePriceChange(newPrice: number | null) {
		if (newPrice !== null) {
			// Allow prices higher than base (surcharge) or lower (discount)
			// Just ensure it's not negative and not absurdly high
			if (newPrice < 0) {
				newPrice = 0;
			} else if (basePrice > 0 && newPrice > basePrice * 3) {
				// Cap at 3x base price for sanity
				newPrice = basePrice * 3;
			}
			onUpdate({
				...tier,
				discountType: 'fixed',
				discountValue: newPrice
			});
		}
	}
	
	// Handlers for participant range
	function handleMinChange(e: Event) {
		let value = parseInt((e.target as HTMLInputElement).value);
		if (!isNaN(value)) {
			// Clamp to valid range: min 2 for first tier, max = maxCapacity
			const minAllowed = index === 0 ? 2 : tier.minParticipants;
			value = Math.max(minAllowed, Math.min(maxCapacity - 1, value));
			const newMax = tier.maxParticipants < value ? value : tier.maxParticipants;
			onUpdate({
				...tier,
				minParticipants: value,
				maxParticipants: newMax
			});
		}
	}
	
	function handleMaxChange(e: Event) {
		let value = parseInt((e.target as HTMLInputElement).value);
		if (!isNaN(value)) {
			// Clamp to valid range: min = tier min, max = maxCapacity
			value = Math.max(tier.minParticipants, Math.min(maxCapacity, value));
			
			// Force the input to show the clamped value immediately
			(e.target as HTMLInputElement).value = value.toString();
			
			onUpdate({
				...tier,
				maxParticipants: value
			});
		}
	}
</script>

<div class="discount-card">
	<!-- Header with range and remove -->
	<div class="card-header">
		<div class="tier-range">
			{#if index > 0}
				<!-- Non-first tiers: show static min (auto-calculated) -->
				<span class="range-value">{tier.minParticipants}</span>
			{:else}
				<!-- First tier: editable min -->
				<input
					bind:this={minInput}
					type="number"
					min={2}
					max={maxCapacity - 1}
					value={tier.minParticipants}
					oninput={handleMinChange}
					onchange={handleMinChange}
					onblur={(e) => {
						const val = parseInt(e.currentTarget.value) || 2;
						const clamped = Math.max(2, Math.min(maxCapacity - 1, val));
						e.currentTarget.value = clamped.toString();
						if (clamped !== tier.minParticipants) {
							handleMinChange({ target: e.currentTarget } as any);
						}
					}}
					class="range-input"
					aria-label="Minimum participants"
				/>
			{/if}
			<span class="range-sep">-</span>
			{#if isLastTier}
				<span class="range-end">{maxCapacity}</span>
			{:else}
				<input
					bind:this={maxInput}
					type="number"
					min={tier.minParticipants}
					max={maxCapacity}
					value={tier.maxParticipants}
					oninput={handleMaxChange}
					onchange={handleMaxChange}
					onblur={(e) => {
						const val = parseInt(e.currentTarget.value) || tier.minParticipants;
						const clamped = Math.max(tier.minParticipants, Math.min(maxCapacity, val));
						e.currentTarget.value = clamped.toString();
						if (clamped !== tier.maxParticipants) {
							handleMaxChange({ target: e.currentTarget } as any);
						}
					}}
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
							{option.value}%
						</button>
					{/each}
					<!-- Custom discount percentage -->
					<div class="custom-discount">
						<input
							type="number"
							min="-100"
							max="99"
							placeholder="%"
							value={currentDiscountPercent()}
							oninput={handlePercentageInput}
							onblur={(e) => {
								// Force update display to clamped value on blur
								const val = Math.max(-100, Math.min(99, parseInt(e.currentTarget.value) || 0));
								e.currentTarget.value = val.toString();
							}}
							class="discount-input"
							title="Discount % (negative for surcharge)"
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
					min={0}
					max={basePrice > 0 ? basePrice * 3 : 50000}
					step={0.5}
					placeholder="0.00"
					class="price-input"
					ariaLabel="Tier price per person"
					onInput={handlePriceChange}
				/>
			</div>
		</div>
		
		<!-- Info for surcharge -->
		{#if isSurcharge()}
			<div class="surcharge-info">
				ℹ️ Surcharge: {((discountedPrice() - basePrice) / basePrice * 100).toFixed(0)}% more than base price
			</div>
		{/if}
		
		<!-- Warning if range exceeds capacity -->
		{#if exceedsCapacity()}
			<div class="capacity-warning">
				⚠️ Range exceeds tour capacity (max {maxCapacity} people)
			</div>
		{/if}
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
		border-color: var(--color-accent-500);
		box-shadow: 0 0 0 2px var(--color-accent-100);
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
	
	.range-value,
	.range-end {
		width: 3.5rem;
		font-size: 0.875rem;
		font-weight: 600;
		color: var(--text-primary);
		text-align: center;
		display: inline-block;
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
		display: inline-flex;
		align-items: center;
		gap: 0.375rem;
		flex-wrap: wrap;
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
		min-height: 2.5rem;
		height: 2.5rem;
		display: inline-flex;
		align-items: center;
		justify-content: center;
		box-sizing: border-box;
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
		gap: 0.125rem;
		padding: 0.25rem 0.375rem;
		background: var(--bg-secondary);
		border: 1px solid var(--border-secondary);
		border-radius: 0.375rem;
		transition: all 0.15s ease;
		min-height: 2.5rem;
		height: 2.5rem;
		box-sizing: border-box;
		min-width: 4.5rem;
		flex: 1;
		max-width: 6rem;
	}
	
	.custom-discount input {
		min-height: 2rem !important;
		height: 2rem !important;
		max-height: 2rem !important;
	}
	
	.custom-discount:focus-within {
		border-color: var(--color-accent-500);
		box-shadow: 0 0 0 2px var(--color-accent-100);
	}
	
	.discount-input {
		flex: 1 !important;
		min-width: 3rem !important;
		width: auto !important;
		min-height: 2rem !important;
		height: 2rem !important;
		max-height: 2rem !important;
		padding: 0.25rem 0.375rem 0.25rem 0.25rem !important;
		font-size: 0.75rem !important;
		font-weight: 500 !important;
		text-align: right !important;
		border: none !important;
		background: transparent !important;
		color: var(--text-primary) !important;
		line-height: 1.5 !important;
		box-sizing: border-box !important;
		margin: 0 !important;
		margin-left: 0 !important;
	}
	
	.discount-input:focus {
		outline: none;
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
		min-height: 2rem !important;
		height: 2rem !important;
		max-height: 2rem !important;
		line-height: 1.5 !important;
		padding: 0.25rem 0.375rem 0.25rem 0.25rem !important;
		box-sizing: border-box !important;
		flex: 1 !important;
		min-width: 3rem !important;
		width: auto !important;
		text-align: right !important;
		margin-left: 0 !important;
	}
	
	.percent-sign {
		font-size: 0.75rem;
		font-weight: 500;
		color: var(--text-tertiary);
		flex-shrink: 0;
		margin-left: 0;
		padding-left: 0;
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
	
	.surcharge-info,
	.capacity-warning {
		margin-top: 0.5rem;
		padding: 0.5rem;
		font-size: 0.75rem;
		border-radius: 0.375rem;
		text-align: center;
	}
	
	.surcharge-info {
		color: var(--color-info-700);
		background: var(--color-info-50);
		border: 1px solid var(--color-info-200);
	}
	
	.capacity-warning {
		color: var(--color-warning-700);
		background: var(--color-warning-50);
		border: 1px solid var(--color-warning-200);
	}
	
	/* Mobile responsiveness */
	@media (max-width: 640px) {
		.card-header {
			flex-direction: row;
			justify-content: space-between;
			align-items: center;
		}
		
		.tier-range {
			flex: 1;
			justify-content: flex-start;
		}
		
		.price-row {
			flex-direction: column;
			align-items: stretch;
			gap: 0.5rem;
		}
		
		.discount-buttons {
			width: 100%;
			justify-content: center;
		}
		
		.discount-input {
			flex: 1 !important;
			min-width: 3rem !important;
			width: auto !important;
			min-height: 2rem !important;
			height: 2rem !important;
			text-align: right !important;
			font-size: 0.75rem !important;
			padding: 0.25rem 0.375rem 0.25rem 0.25rem !important;
			margin-left: 0 !important;
		}
		
		.custom-discount {
			flex: 1 !important;
			min-width: 4.5rem !important;
			max-width: 6rem !important;
			gap: 0.125rem !important;
			justify-content: center;
		}
		
		.price-input-wrapper {
			width: 100%;
		}
		
		.discount-btn {
			flex: 1;
			min-width: fit-content;
		}
		
		.discount-buttons {
			justify-content: center;
			gap: 0.5rem;
		}
	}
</style>