<script lang="ts">
	import type { ParticipantCategory } from '$lib/types.js';
	import Trash2 from 'lucide-svelte/icons/trash-2';
	import Percent from 'lucide-svelte/icons/percent';
	import Lock from 'lucide-svelte/icons/lock';
	import CurrencyInput from './CurrencyInput.svelte';
	import AgeRangeSelector from './AgeRangeSelector.svelte';

	interface Props {
		category: ParticipantCategory;
		index: number;
		currencySymbol: string;
		adultPrice?: number; // Pass adult price for child discount calculations
		onRemove: () => void;
		onUpdate: (updatedCategory: ParticipantCategory) => void;
		isAdultCategory?: boolean; // To prevent adult category removal
		onAgeConflict?: (error: string | null) => void;
	}

	let { 
		category = $bindable(), 
		index, 
		currencySymbol, 
		adultPrice, 
		onRemove, 
		onUpdate,
		isAdultCategory = false,
		onAgeConflict
	}: Props = $props();

	// State for custom discount
	let showCustomDiscount = $state(false);
	let customDiscountPercent = $state(30);
	let discountLocked = $state(false);
	let appliedDiscount = $state<number | null>(null);

	// Check if this is a child category based on label or id
	let isChildCategory = $derived(
		category.id === 'child' || 
		category.label.toLowerCase().includes('child') ||
		category.label.toLowerCase().includes('kid')
	);

	// Calculate discount percentage if price is based on adult price
	let currentDiscount = $derived(
		!adultPrice || adultPrice === 0 || !discountLocked 
			? null 
			: Math.round((1 - category.price / adultPrice) * 100)
	);

	// Trigger update when category changes
	function handleUpdate() {
		onUpdate(category);
	}

	// Quick discount functions
	function applyDiscount(percentage: number) {
		if (adultPrice) {
			category.price = Math.round(adultPrice * (1 - percentage / 100) * 100) / 100;
			appliedDiscount = percentage;
			discountLocked = true;
			handleUpdate();
		}
	}

	function applyCustomDiscount() {
		if (adultPrice && customDiscountPercent >= 0 && customDiscountPercent <= 100) {
			applyDiscount(customDiscountPercent);
			showCustomDiscount = false;
		}
	}

	function unlockDiscount() {
		discountLocked = false;
		appliedDiscount = null;
	}

	function setFree() {
		category.price = 0;
		appliedDiscount = 100;
		discountLocked = true;
		handleUpdate();
	}

	// Auto-recalculate child price when adult price changes if discount is locked
	$effect(() => {
		if (discountLocked && appliedDiscount !== null && adultPrice) {
			category.price = Math.round(adultPrice * (1 - appliedDiscount / 100) * 100) / 100;
			handleUpdate();
		}
	});

	// Handle age range updates and update label
	function handleAgeUpdate(minAge?: number, maxAge?: number) {
		category.minAge = minAge;
		category.maxAge = maxAge;
		
		// Auto-update label with age range if it's a standard category
		if (category.id === 'adult' || category.id === 'child' || category.id === 'infant' || 
			category.label.toLowerCase().includes('adult') || 
			category.label.toLowerCase().includes('child') || 
			category.label.toLowerCase().includes('infant')) {
			
			let baseName = category.label.split('(')[0].trim();
			if (minAge !== undefined || maxAge !== undefined) {
				const ageText = minAge !== undefined && maxAge !== undefined 
					? `${minAge}-${maxAge}`
					: minAge !== undefined 
						? `${minAge}+`
						: `0-${maxAge}`;
				category.label = `${baseName} (${ageText})`;
			} else {
				category.label = baseName;
			}
		}
		
		handleUpdate();
	}
</script>

<div class="category-card" class:adult-locked={isAdultCategory}>
	<div class="category-main">
		<!-- Category Header -->
		<div class="category-header">
			<div class="category-title-row">
				<input
					type="text"
					placeholder="e.g., Adult, Student, Senior"
					bind:value={category.label}
					oninput={handleUpdate}
					class="category-label-input"
					class:locked={isAdultCategory}
					readonly={isAdultCategory}
					aria-label="Category name"
				/>
				
				{#if isAdultCategory}
					<span class="adult-badge">
						<Lock class="w-3 h-3" />
						Base Price
					</span>
				{:else}
					<button
						type="button"
						onclick={onRemove}
						class="button-danger button--icon button--small"
						aria-label="Remove category {index + 1}"
					>
						<Trash2 class="w-3 h-3" />
					</button>
				{/if}
			</div>

			<!-- Price Row -->
			<div class="price-row">
				<div class="price-input-group">
					<div style="width: 8rem;">
						<CurrencyInput
							bind:value={category.price}
							{currencySymbol}
							step={0.5}
							placeholder="0.00"
							class="form-input text-sm"
							ariaLabel="Category price"
							onInput={() => {
								if (!isAdultCategory) unlockDiscount();
								handleUpdate();
							}}
						/>
					</div>
					<span class="price-label">per person</span>
				</div>

				{#if discountLocked && appliedDiscount !== null}
					<div class="discount-indicator">
						<Percent class="w-3 h-3" />
						<span>{appliedDiscount}% off</span>
					</div>
				{/if}
			</div>
		</div>
		
		<!-- Discount Controls (for non-adult categories when adult price exists) -->
		{#if !isAdultCategory && adultPrice && adultPrice > 0}
			<div class="discount-section">
				<div class="discount-header">
					<span class="discount-title">Apply discount from base price</span>
					{#if discountLocked}
						<button
							type="button"
							onclick={unlockDiscount}
							class="unlock-btn"
							title="Unlock to set custom price"
						>
							Unlock price
						</button>
					{/if}
				</div>
				
				<div class="discount-buttons">
					<button 
						type="button" 
						onclick={() => applyDiscount(20)} 
						class="discount-btn"
						class:active={appliedDiscount === 20}
					>
						20% off
					</button>
					<button 
						type="button" 
						onclick={() => applyDiscount(30)} 
						class="discount-btn"
						class:active={appliedDiscount === 30}
					>
						30% off
					</button>
					<button 
						type="button" 
						onclick={() => applyDiscount(50)} 
						class="discount-btn"
						class:active={appliedDiscount === 50}
					>
						50% off
					</button>
					<button 
						type="button" 
						onclick={setFree} 
						class="discount-btn"
						class:active={appliedDiscount === 100}
					>
						Free
					</button>
					<button
						type="button"
						onclick={() => showCustomDiscount = !showCustomDiscount}
						class="discount-btn custom-btn"
						class:active={showCustomDiscount}
					>
						Custom
					</button>
				</div>

				{#if showCustomDiscount}
					<div class="custom-discount-input">
						<input
							type="number"
							min="0"
							max="100"
							bind:value={customDiscountPercent}
							class="discount-input"
							placeholder="0-100"
						/>
						<span class="discount-percent">%</span>
						<button
							type="button"
							onclick={applyCustomDiscount}
							class="apply-btn"
						>
							Apply
						</button>
					</div>
				{/if}
			</div>
		{/if}
		
		<!-- Age Range Selector -->
		<div class="age-range-row">
			<AgeRangeSelector
				minAge={category.minAge}
				maxAge={category.maxAge}
				onUpdate={handleAgeUpdate}
				label="Age Range (optional)"
			/>
		</div>

		<!-- Additional Settings -->
		<div class="settings-row">
			<!-- Counts toward capacity checkbox -->
			<label class="capacity-checkbox-label">
				<input
					type="checkbox"
					bind:checked={category.countsTowardCapacity}
					oninput={handleUpdate}
					class="capacity-checkbox"
				/>
				<span class="capacity-label-text">Counts toward capacity</span>
			</label>
			
			<!-- Optional Note Field -->
			<input
				type="text"
				placeholder="Optional note (e.g., Valid ID required)"
				bind:value={category.description}
				oninput={handleUpdate}
				class="category-note-input"
				aria-label="Category note"
			/>
		</div>
	</div>
	
	<!-- Preview -->
	{#if category.label}
		<div class="category-preview">
			<div class="preview-content">
				<div class="preview-main">
					<strong>{category.label}</strong>
					{#if category.minAge !== undefined || category.maxAge !== undefined}
						<span class="age-badge">
							{category.minAge ?? 0}{category.maxAge !== undefined ? `-${category.maxAge}` : '+'} years
						</span>
					{/if}
				</div>
				<div class="preview-price">
					{currencySymbol}{(category.price || 0).toFixed(2)}
					{#if discountLocked && appliedDiscount !== null}
						<span class="discount-badge">{appliedDiscount}% off</span>
					{/if}
				</div>
			</div>
			{#if category.description}
				<div class="preview-note">{category.description}</div>
			{/if}
		</div>
	{/if}
</div>

<style>
	.category-card {
		padding: 1.25rem;
		border: 1px solid var(--border-primary);
		border-radius: 0.75rem;
		background: var(--bg-secondary);
		transition: all 0.2s ease;
		position: relative;
	}

	.category-card:hover {
		border-color: var(--border-secondary);
		box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
	}

	.category-card.adult-locked {
		background: var(--color-primary-50);
		border-color: var(--color-primary-200);
	}

	.category-main {
		display: flex;
		flex-direction: column;
		gap: 1rem;
	}

	.category-header {
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
	}

	.category-title-row {
		display: flex;
		align-items: center;
		gap: 0.5rem;
	}

	.category-label-input {
		flex: 1;
		min-width: 150px;
		font-weight: 600;
		font-size: 0.9375rem;
		padding: 0.625rem 0.75rem;
		border: 1px solid var(--border-secondary);
		border-radius: 0.375rem;
		background: var(--bg-primary);
		color: var(--text-primary);
		transition: all 0.15s ease;
	}

	.category-label-input:focus {
		outline: none;
		border-color: var(--color-primary-500);
		box-shadow: 0 0 0 3px var(--color-primary-100);
	}

	.category-label-input.locked {
		background: var(--bg-secondary);
		border-style: dashed;
		cursor: not-allowed;
	}

	.adult-badge {
		display: flex;
		align-items: center;
		gap: 0.375rem;
		padding: 0.375rem 0.75rem;
		font-size: 0.75rem;
		font-weight: 600;
		color: var(--color-primary-700);
		background: var(--color-primary-100);
		border: 1px solid var(--color-primary-300);
		border-radius: 0.375rem;
		white-space: nowrap;
	}

	.price-row {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 0.75rem;
	}

	.price-input-group {
		display: flex;
		align-items: center;
		gap: 0.5rem;
	}

	.price-label {
		font-size: 0.75rem;
		color: var(--text-tertiary);
		white-space: nowrap;
	}

	.discount-indicator {
		display: flex;
		align-items: center;
		gap: 0.375rem;
		padding: 0.25rem 0.625rem;
		font-size: 0.75rem;
		font-weight: 600;
		color: var(--color-success-700);
		background: var(--color-success-50);
		border: 1px solid var(--color-success-200);
		border-radius: 0.375rem;
	}

	/* Discount Section */
	.discount-section {
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
		padding: 0.875rem;
		background: var(--bg-primary);
		border-radius: 0.5rem;
		border: 1px solid var(--border-primary);
	}

	.discount-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
	}

	.discount-title {
		font-size: 0.75rem;
		font-weight: 500;
		color: var(--text-secondary);
	}

	.unlock-btn {
		padding: 0.25rem 0.625rem;
		font-size: 0.75rem;
		font-weight: 500;
		color: var(--color-primary-600);
		background: transparent;
		border: 1px solid var(--color-primary-300);
		border-radius: 0.25rem;
		cursor: pointer;
		transition: all 0.15s ease;
	}

	.unlock-btn:hover {
		background: var(--color-primary-50);
		border-color: var(--color-primary-400);
	}

	.discount-buttons {
		display: flex;
		gap: 0.5rem;
		flex-wrap: wrap;
	}

	.discount-btn {
		padding: 0.375rem 0.875rem;
		font-size: 0.8125rem;
		font-weight: 500;
		border: 1px solid var(--border-secondary);
		border-radius: 0.375rem;
		background: var(--bg-secondary);
		color: var(--text-secondary);
		cursor: pointer;
		transition: all 0.15s ease;
		white-space: nowrap;
	}

	.discount-btn:hover {
		background: var(--bg-primary);
		border-color: var(--border-primary);
		color: var(--text-primary);
	}

	.discount-btn.active {
		background: var(--color-primary-100);
		border-color: var(--color-primary-400);
		color: var(--color-primary-700);
		font-weight: 600;
	}

	.discount-btn.custom-btn {
		border-style: dashed;
	}

	.custom-discount-input {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		padding: 0.5rem;
		background: var(--bg-secondary);
		border-radius: 0.375rem;
	}

	.discount-input {
		width: 5rem;
		padding: 0.375rem 0.5rem;
		font-size: 0.875rem;
		font-weight: 500;
		text-align: center;
		background: var(--bg-primary);
		border: 1px solid var(--border-secondary);
		border-radius: 0.25rem;
		color: var(--text-primary);
	}

	.discount-input:focus {
		outline: none;
		border-color: var(--color-primary-500);
		box-shadow: 0 0 0 2px var(--color-primary-100);
	}

	.discount-percent {
		font-size: 0.875rem;
		font-weight: 500;
		color: var(--text-secondary);
	}

	.apply-btn {
		padding: 0.375rem 0.875rem;
		font-size: 0.8125rem;
		font-weight: 600;
		color: white;
		background: var(--color-primary-600);
		border: none;
		border-radius: 0.25rem;
		cursor: pointer;
		transition: all 0.15s ease;
	}

	.apply-btn:hover {
		background: var(--color-primary-700);
	}

	.apply-btn:active {
		transform: scale(0.95);
	}

	/* Age Range Row */
	.age-range-row {
		padding: 0.75rem;
		background: var(--bg-primary);
		border-radius: 0.5rem;
		border: 1px solid var(--border-primary);
	}

	/* Settings Row */
	.settings-row {
		display: flex;
		gap: 0.75rem;
		align-items: center;
		flex-wrap: wrap;
	}

	.capacity-checkbox-label {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		cursor: pointer;
		user-select: none;
		min-width: fit-content;
	}

	.capacity-checkbox {
		width: 1rem;
		height: 1rem;
		cursor: pointer;
		accent-color: var(--color-primary-600);
	}

	.capacity-label-text {
		font-size: 0.75rem;
		color: var(--text-secondary);
		white-space: nowrap;
	}

	.category-note-input {
		flex: 1;
		min-width: 200px;
		font-size: 0.75rem;
		padding: 0.375rem 0.5rem;
		border: 1px solid var(--border-secondary);
		border-radius: 0.375rem;
		background: var(--bg-primary);
		color: var(--text-secondary);
		transition: all 0.15s ease;
	}

	.category-note-input:focus {
		outline: none;
		border-color: var(--color-primary-500);
		box-shadow: 0 0 0 3px var(--color-primary-100);
		color: var(--text-primary);
	}

	.category-note-input::placeholder {
		color: var(--text-tertiary);
		font-size: 0.75rem;
	}

	/* Preview Section */
	.category-preview {
		padding: 0.875rem;
		background: var(--bg-primary);
		border-radius: 0.5rem;
		border: 1px solid var(--border-primary);
		margin-top: 0.25rem;
	}

	.preview-content {
		display: flex;
		flex-direction: column;
		gap: 0.375rem;
	}

	.preview-main {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		font-size: 0.875rem;
		color: var(--text-primary);
	}

	.age-badge {
		padding: 0.125rem 0.5rem;
		font-size: 0.75rem;
		font-weight: 500;
		color: var(--text-secondary);
		background: var(--bg-secondary);
		border: 1px solid var(--border-secondary);
		border-radius: 0.25rem;
	}

	.preview-price {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		font-size: 0.875rem;
		font-weight: 600;
		color: var(--text-primary);
	}

	.discount-badge {
		padding: 0.125rem 0.375rem;
		font-size: 0.6875rem;
		font-weight: 600;
		color: var(--color-success-700);
		background: var(--color-success-100);
		border-radius: 0.25rem;
	}

	.preview-note {
		font-size: 0.75rem;
		color: var(--text-tertiary);
		font-style: italic;
	}

	/* Mobile Responsiveness */
	@media (max-width: 640px) {
		.category-card {
			padding: 1rem;
		}

		.category-title-row {
			flex-wrap: wrap;
		}

		.category-label-input {
			min-width: 100%;
			margin-bottom: 0.5rem;
		}

		.price-row {
			flex-direction: column;
			align-items: stretch;
		}

		.discount-buttons {
			display: grid;
			grid-template-columns: repeat(2, 1fr);
		}

		.settings-row {
			flex-direction: column;
			align-items: stretch;
		}

		.category-note-input {
			min-width: 100%;
		}
	}

	/* Accessibility */
	.category-label-input:focus-visible,
	.category-note-input:focus-visible,
	.discount-input:focus-visible {
		outline: 2px solid var(--color-primary-500);
		outline-offset: 2px;
	}

	/* Animations */
	@keyframes slideIn {
		from {
			opacity: 0;
			transform: translateY(-0.5rem);
		}
		to {
			opacity: 1;
			transform: translateY(0);
		}
	}

	.custom-discount-input {
		animation: slideIn 0.2s ease-out;
	}
</style>

