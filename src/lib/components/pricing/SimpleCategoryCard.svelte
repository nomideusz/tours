<script lang="ts">
	import type { ParticipantCategory } from '$lib/types.js';
	import { getCategoryDisplayLabel } from '$lib/utils/category-age-ranges.js';
	import Trash2 from 'lucide-svelte/icons/trash-2';
	import Users from 'lucide-svelte/icons/users';
	import Baby from 'lucide-svelte/icons/baby';
	import User from 'lucide-svelte/icons/user';
	import CurrencyInput from './CurrencyInput.svelte';

	interface Props {
		category: ParticipantCategory;
		allCategories: ParticipantCategory[];
		index: number;
		currencySymbol: string;
		adultPrice?: number;
		onRemove: () => void;
		onUpdate: (updatedCategory: ParticipantCategory) => void;
		isAdultCategory?: boolean;
		simplifiedMode?: boolean;
	}

	let { 
		category = $bindable(),
		allCategories,
		index, 
		currencySymbol, 
		adultPrice, 
		onRemove, 
		onUpdate,
		isAdultCategory = false,
		simplifiedMode = true
	}: Props = $props();
	
	// Get intelligent display label
	let displayLabel = $derived(getCategoryDisplayLabel(category, allCategories));

	// Icon mapping for known categories (Child is 3-12, not 3-17)
	const categoryIcons: Record<string, any> = {
		'adult': User,
		'child': Baby,
		'infant': Baby,
		'senior': Users,
		'student': Users,
		'youth': Users
	};

	// Find matching icon for category
	let categoryIcon = $derived(() => {
		const label = category.label.toLowerCase();
		for (const [key, icon] of Object.entries(categoryIcons)) {
			if (category.id === key || label.includes(key)) {
				return icon;
			}
		}
		return User; // Default icon
	});
	
	// Check if this is an infant category
	let isInfantCategory = $derived(
		category.id === 'infant' || 
		category.label.toLowerCase().includes('infant') ||
		category.label.toLowerCase().includes('baby')
	);
	
	// Check if this is a child category
	let isChildCategory = $derived(
		category.id === 'child' || 
		category.label.toLowerCase().includes('child')
	);
	
	// Check if this is a senior category
	let isSeniorCategory = $derived(
		category.id === 'senior' || 
		category.label.toLowerCase().includes('senior')
	);

	// Simple discount options
	const discountOptions = [
		{ label: 'Full Price', value: 0 },
		{ label: '20% off', value: 20 },
		{ label: '50% off', value: 50 },
		{ label: 'Free', value: 100 }
	];

	function applyDiscount(percentage: number) {
		if (adultPrice) {
			category.price = percentage === 100 ? 0 : Math.round(adultPrice * (1 - percentage / 100) * 100) / 100;
			onUpdate(category);
		}
	}

	function handleUpdate() {
		onUpdate(category);
	}

	// Get current discount percentage
	let discountPercent = $derived(
		!adultPrice || adultPrice === 0 
			? 0 
			: Math.round((1 - category.price / adultPrice) * 100)
	);
	
	// Find matching discount option
	let currentDiscountOption = $derived(
		discountOptions.find(opt => opt.value === discountPercent) || null
	);
</script>

<div class="category-card" class:adult-card={isAdultCategory}>
	<!-- Header with icon and controls -->
	<div class="card-header">
		<div class="header-left">
			{#key category.id}
				{@const Icon = categoryIcon()}
				<Icon class="category-icon" />
			{/key}
			
			{#if isAdultCategory || isChildCategory || isSeniorCategory || isInfantCategory}
				<span class="category-label-fixed">{displayLabel}</span>
			{:else}
				<input
					type="text"
					placeholder="Category name"
					bind:value={category.label}
					oninput={handleUpdate}
					class="category-input"
				/>
			{/if}
		</div>

		{#if isAdultCategory}
			<!-- Inline adult price -->
			<div class="adult-price-input-wrapper">
				<CurrencyInput
					bind:value={category.price}
					{currencySymbol}
					min={0}
					max={100000}
					step={0.5}
					placeholder="0.00"
					class="adult-price-input"
					ariaLabel="Base Price"
					onInput={handleUpdate}
				/>
			</div>
		{:else}
			<button
				type="button"
				onclick={onRemove}
				class="remove-btn"
				aria-label="Remove category"
			>
				<Trash2 class="w-4 h-4" />
			</button>
		{/if}
	</div>

	<!-- Price and discount section (for all non-adult categories) -->
	{#if !isAdultCategory}
		<div class="price-section">
			<div class="price-row-flex">
				<!-- Discount buttons first (only if adult price exists) -->
				{#if adultPrice && adultPrice > 0}
					<div class="discount-buttons-left">
						{#each discountOptions as option}
							<button
								type="button"
								onclick={() => applyDiscount(option.value)}
								class="discount-btn-small"
								class:active={currentDiscountOption?.value === option.value}
								title="{option.label}"
							>
								{option.value === 0 ? '100%' : option.value === 100 ? 'Free' : `${option.value}%`}
							</button>
						{/each}
						<!-- Custom discount percentage -->
						<div class="custom-discount-input">
							<input
								type="number"
								min="-100"
								max="100"
								placeholder="%"
								value={discountPercent}
								oninput={(e) => {
									let val = parseInt(e.currentTarget.value);
									if (!isNaN(val)) {
										// Clamp between -100 to 100 (negative = surcharge)
										val = Math.max(-100, Math.min(100, val));
										applyDiscount(val);
									}
								}}
								onblur={(e) => {
									// Force update display to clamped value on blur
									const val = Math.max(-100, Math.min(100, parseInt(e.currentTarget.value) || 0));
									e.currentTarget.value = val.toString();
								}}
								class="discount-number-input"
								title="Discount % (negative for surcharge)"
							/>
							<span class="percent-sign">%</span>
						</div>
					</div>
				{/if}
				
				<!-- Price input on the right -->
				<div class="price-input-right">
					<CurrencyInput
						bind:value={category.price}
						{currencySymbol}
						min={0}
						max={adultPrice ? adultPrice * 2 : 50000}
						step={0.5}
						placeholder="0.00"
						class="category-price-input"
						ariaLabel="Price"
						onInput={handleUpdate}
					/>
				</div>
			</div>
		</div>
		

	{/if}
</div>

<style>
	.category-card {
		background: var(--bg-secondary);
		border: 1px solid var(--border-primary);
		border-radius: 0.75rem;
		padding: 1rem;
		transition: all 0.2s ease;
	}

	.category-card:hover {
		border-color: var(--border-secondary);
		box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
	}

	.category-card.adult-card {
		background: var(--color-primary-50);
		border-color: var(--color-primary-200);
	}

	/* Dark mode - softer adult card colors */
	:root[data-theme='dark'] .category-card.adult-card {
		background: rgba(99, 102, 241, 0.08);
		border-color: rgba(99, 102, 241, 0.25);
	}

	.card-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		gap: 0.75rem;
		margin-bottom: 0.75rem;
	}
	
	.category-card.adult-card .card-header {
		margin-bottom: 0;
	}

	.header-left {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		flex: 1;
		min-width: 0;
	}
	
	.category-label-fixed {
		font-size: 0.9375rem;
		font-weight: 600;
		color: var(--text-primary);
	}

	:global(.category-icon) {
		width: 1.25rem;
		height: 1.25rem;
		color: var(--text-secondary);
		flex-shrink: 0;
	}

	.category-input {
		flex: 1;
		font-size: 0.9375rem;
		font-weight: 600;
		padding: 0.375rem 0.5rem;
		border: 1px solid var(--border-secondary);
		border-radius: 0.375rem;
		background: var(--bg-primary);
		color: var(--text-primary);
	}

	.category-input:focus {
		outline: none;
		border-color: var(--color-primary-500);
		box-shadow: 0 0 0 3px var(--color-primary-100);
	}


	.remove-btn {
		padding: 0.375rem;
		color: var(--color-error-600);
		background: transparent;
		border: none;
		border-radius: 0.375rem;
		cursor: pointer;
		transition: all 0.15s ease;
	}

	.remove-btn:hover {
		background: var(--color-error-50);
		color: var(--color-error-700);
	}

	/* Adult price - inline and emphasized */
	.category-card.adult-card .adult-price-input-wrapper {
		width: 8rem;
		flex-shrink: 0;
	}

	:global(.adult-price-input) {
		width: 100%;
		font-size: 1.5rem;
		font-weight: 700;
		text-align: right;
		padding: 0.5rem 0.75rem;
		background: var(--bg-primary);
	}

	/* Price and discount section with right-aligned price */
	.price-section {
		padding: 0.75rem;
		background: var(--bg-primary);
		border-radius: 0.5rem;
	}

	.price-row-flex {
		display: flex;
		justify-content: space-between;
		align-items: center;
		gap: 0.75rem;
	}

	.discount-buttons-left {
		display: flex;
		align-items: center;
		gap: 0.375rem;
		flex-wrap: wrap;
		flex: 1;
		min-width: 0;
	}

	.discount-btn-small {
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

	.discount-btn-small:hover {
		background: var(--bg-primary);
		border-color: var(--border-primary);
		transform: translateY(-1px);
	}

	.discount-btn-small.active {
		background: var(--color-primary-100);
		border-color: var(--color-primary-400);
		color: var(--color-primary-700);
		font-weight: 600;
	}
	
	.custom-discount-input {
		display: flex;
		align-items: center;
		gap: 0.25rem;
		padding: 0.25rem 0.5rem;
		background: var(--bg-secondary);
		border: 1px solid var(--border-secondary);
		border-radius: 0.375rem;
		transition: all 0.15s ease;
	}
	
	.custom-discount-input:focus-within {
		border-color: var(--color-primary-500);
		box-shadow: 0 0 0 2px var(--color-primary-100);
	}
	
	.discount-number-input {
		width: 3.25rem;
		padding: 0.125rem 0.25rem;
		font-size: 0.75rem;
		font-weight: 500;
		text-align: center;
		border: none;
		background: transparent;
		color: var(--text-primary);
	}
	
	.discount-number-input:focus {
		outline: none;
	}
	
	.percent-sign {
		font-size: 0.75rem;
		font-weight: 500;
		color: var(--text-tertiary);
	}
	
	/* Hide number spinners */
	.discount-number-input::-webkit-inner-spin-button,
	.discount-number-input::-webkit-outer-spin-button {
		-webkit-appearance: none;
		appearance: none;
		margin: 0;
	}

	.discount-number-input[type="number"] {
		-moz-appearance: textfield;
		appearance: textfield;
	}
	
	.price-input-right {
		width: 7rem;
		flex-shrink: 0;
	}
	
	:global(.category-price-input) {
		width: 100%;
		font-size: 1.125rem;
		font-weight: 600;
		text-align: right;
		padding: 0.375rem 0.5rem;
	}
	
	/* Mobile responsiveness */
	@media (max-width: 640px) {
		.category-card.adult-card .card-header {
			flex-wrap: wrap;
		}

		.category-card.adult-card .header-left {
			flex-basis: 100%;
			margin-bottom: 0.5rem;
		}

		.category-card.adult-card .adult-price-input-wrapper {
			width: 100%;
			flex: 1;
		}

		.price-row-flex {
			flex-direction: column;
			align-items: stretch;
			gap: 0.5rem;
		}

		.discount-buttons-left {
			width: 100%;
			justify-content: center;
			gap: 0.5rem;
		}

		.price-input-right {
			width: 100%;
		}
		
		.discount-btn-small {
			flex: 1;
			min-width: fit-content;
		}
		
		.discount-number-input {
			width: 4rem;
			text-align: center;
		}
		
		.custom-discount-input {
			flex: 0 0 auto;
			justify-content: center;
		}
	}
</style>
