<!--
Simplified Participant Categories Component
Designed to be more intuitive for tour guides
-->

<script lang="ts">
	import type { ParticipantCategory } from '$lib/types.js';
	import SimpleCategoryCard from './SimpleCategoryCard.svelte';
	import Users from 'lucide-svelte/icons/users';
	import UserPlus from 'lucide-svelte/icons/user-plus';
	
	interface Props {
		categories?: ParticipantCategory[];
		currencySymbol: string;
		minCapacity?: number;
		maxCapacity?: number;
		countInfantsTowardCapacity?: boolean;
		allErrors?: any[];
		onUpdate: (categories: ParticipantCategory[]) => void;
		onValidate?: (field: string) => void;
		getFieldError?: (errors: any[], field: string) => string | null;
	}
	
	let {
		categories = $bindable([]),
		currencySymbol = '€',
		minCapacity = $bindable(1),
		maxCapacity = $bindable(20),
		countInfantsTowardCapacity = $bindable(false),
		allErrors = [],
		onUpdate,
		onValidate,
		getFieldError
	}: Props = $props();
	
	// Get adult price for discount calculations
	let adultPrice = $derived(() => {
		const adultCategory = categories.find(c => 
			c.id === 'adult' || c.label.toLowerCase().includes('adult')
		);
		return adultCategory?.price || 0;
	});
	
	// Initialize with simple defaults if empty - ONLY ADULT
	function initializeDefaults() {
		categories = [
			{
				id: 'adult',
				label: 'Adult (18-64)',
				price: 50,
				minAge: 18,
				maxAge: 64,
				sortOrder: 0,
				countsTowardCapacity: true
			}
		];
		onUpdate(categories);
	}
	
	// Add child category
	function addChildCategory() {
		const adult = adultPrice() || 50;
		const newCategory: ParticipantCategory = {
			id: 'child',
			label: 'Child (3-12)',
			price: Math.round(adult * 0.5 * 100) / 100,
			minAge: 3,
			maxAge: 12,
			sortOrder: categories.length,
			countsTowardCapacity: true
		};
		categories = [...categories, newCategory];
		onUpdate(categories);
	}
	
	// Add teenager category
	function addTeenagerCategory() {
		const adult = adultPrice() || 50;
		const newCategory: ParticipantCategory = {
			id: 'teenager',
			label: 'Teenager (13-17)',
			price: Math.round(adult * 0.7 * 100) / 100,
			minAge: 13,
			maxAge: 17,
			sortOrder: categories.length,
			countsTowardCapacity: true
		};
		categories = [...categories, newCategory];
		onUpdate(categories);
	}
	
	// Add student category
	function addStudentCategory() {
		const adult = adultPrice() || 50;
		const newCategory: ParticipantCategory = {
			id: 'student',
			label: 'Student (with ID)',
			price: Math.round(adult * 0.8 * 100) / 100,
			description: 'Valid student ID required',
			sortOrder: categories.length,
			countsTowardCapacity: true
		};
		categories = [...categories, newCategory];
		onUpdate(categories);
	}
	
	// Add senior category
	function addSeniorCategory() {
		const adult = adultPrice() || 50;
		const newCategory: ParticipantCategory = {
			id: 'senior',
			label: 'Senior (65+)',
			price: Math.round(adult * 0.8 * 100) / 100,
			minAge: 65,
			sortOrder: categories.length,
			countsTowardCapacity: true
		};
		categories = [...categories, newCategory];
		onUpdate(categories);
	}
	
	// Add custom category
	function addCustomCategory() {
		const adult = adultPrice() || 50;
		const newCategory: ParticipantCategory = {
			id: `custom_${Date.now()}`,
			label: '',
			price: adult,
			sortOrder: categories.length,
			countsTowardCapacity: true
		};
		categories = [...categories, newCategory];
		onUpdate(categories);
	}
	
	// Check if categories exist
	let hasChildCategory = $derived(
		categories.some(c => c.id === 'child' || c.label.toLowerCase().includes('child'))
	);
	
	let hasTeenagerCategory = $derived(
		categories.some(c => c.id === 'teenager' || c.label.toLowerCase().includes('teen'))
	);
	
	let hasStudentCategory = $derived(
		categories.some(c => c.id === 'student' || c.label.toLowerCase().includes('student'))
	);
	
	let hasSeniorCategory = $derived(
		categories.some(c => c.id === 'senior' || c.label.toLowerCase().includes('senior'))
	);
	
	function removeCategory(index: number) {
		const removedCategory = categories[index];
		
		// Don't allow removing the last category or adult category
		if (categories.length === 1 || 
			(removedCategory && (removedCategory.id === 'adult' || 
			removedCategory.label.toLowerCase().includes('adult')))) {
			return;
		}
		
		categories = categories.filter((_, i) => i !== index);
		// Reindex sort orders
		categories = categories.map((cat, i) => ({ ...cat, sortOrder: i }));
		onUpdate(categories);
	}
	
	function updateCategory(index: number, updated: ParticipantCategory) {
		categories[index] = updated;
		onUpdate(categories);
	}
	
	// Simple validation
	let hasValidPricing = $derived(
		categories.length > 0 && 
		categories.every(c => c.label && c.label.trim() !== '' && c.price >= 0)
	);
	
</script>

<div class="pricing-container">
	<!-- Tour Capacity at the top -->
	{#if categories.length > 0}
		<div class="capacity-card">
			<div class="capacity-header">
				<div class="header-with-icon">
					<Users class="capacity-icon" />
					<span class="capacity-title">Tour capacity</span>
				</div>
			</div>
			
			<div class="capacity-controls">
				<div class="capacity-range">
					<input
						type="number"
						min="1"
						max={maxCapacity || 200}
						bind:value={minCapacity}
						onblur={(e) => {
							const val = parseInt(e.currentTarget.value) || 1;
							minCapacity = Math.max(1, Math.min(maxCapacity || 200, val));
							e.currentTarget.value = minCapacity.toString();
							if (minCapacity && maxCapacity && minCapacity > maxCapacity) {
								maxCapacity = minCapacity;
							}
							if (onValidate) {
								onValidate('capacity');
							}
						}}
						class="capacity-input"
					/>
					<span class="capacity-separator">to</span>
					<input
						type="number"
						min={minCapacity || 1}
						max="200"
						bind:value={maxCapacity}
						onblur={(e) => {
							const val = parseInt(e.currentTarget.value) || 1;
							maxCapacity = Math.max(minCapacity || 1, Math.min(200, val));
							e.currentTarget.value = maxCapacity.toString();
							if (minCapacity && maxCapacity && maxCapacity < minCapacity) {
								minCapacity = maxCapacity;
							}
							if (onValidate) {
								onValidate('capacity');
							}
						}}
						class="capacity-input"
					/>
					<span class="capacity-label">people</span>
				</div>
				
				<label class="infant-checkbox">
					<input
						type="checkbox"
						bind:checked={countInfantsTowardCapacity}
					/>
					<span>Count infants toward capacity</span>
				</label>
			</div>
		</div>
		{#if getFieldError && getFieldError(allErrors, 'capacity')}
			<div class="capacity-error">
				{getFieldError(allErrors, 'capacity')}
			</div>
		{/if}
	{/if}
	
	<!-- Quick start for empty state -->
	{#if categories.length === 0}
		<div class="empty-state">
			<p>Get started with a simple pricing structure:</p>
			<button
				type="button"
				onclick={initializeDefaults}
				class="start-btn"
			>
				Start with Adult pricing
			</button>
		</div>
	{:else}
		<!-- Categories list -->
		<div class="categories-list">
			{#each categories as category, index (category.id)}
				<SimpleCategoryCard
					bind:category={categories[index]}
					allCategories={categories}
					{index}
					{currencySymbol}
					adultPrice={adultPrice()}
					isAdultCategory={category.id === 'adult' || category.label.toLowerCase().includes('adult')}
					onRemove={() => removeCategory(index)}
					onUpdate={(updated: ParticipantCategory) => updateCategory(index, updated)}
				/>
			{/each}
		</div>
		
		<!-- Quick add buttons for common categories -->
		<div class="quick-add-section-compact">
			<div class="quick-add-header">
				<div class="header-with-icon">
					<UserPlus class="add-icon" />
					<span class="add-label">Additional categories</span>
				</div>
				<div class="quick-add-buttons-inline">
					{#if !hasChildCategory}
						<button
							type="button"
							onclick={addChildCategory}
							class="quick-add-btn-compact"
							title="Add Child category (3-12)"
						>
							Child
						</button>
					{/if}
					{#if !hasTeenagerCategory}
						<button
							type="button"
							onclick={addTeenagerCategory}
							class="quick-add-btn-compact"
							title="Add Teenager category (13-17)"
						>
							Teenager
						</button>
					{/if}
					{#if !hasStudentCategory}
						<button
							type="button"
							onclick={addStudentCategory}
							class="quick-add-btn-compact"
							title="Add Student category"
						>
							Student
						</button>
					{/if}
					{#if !hasSeniorCategory}
						<button
							type="button"
							onclick={addSeniorCategory}
							class="quick-add-btn-compact"
							title="Add Senior category (65+)"
						>
							Senior
						</button>
					{/if}
					<button
						type="button"
						onclick={addCustomCategory}
						class="quick-add-btn-compact custom-btn"
						title="Add custom category"
					>
						Custom
					</button>
				</div>
			</div>
		</div>
	{/if}
</div>

<style>
	.pricing-container {
		display: flex;
		flex-direction: column;
		gap: 1rem;
	}
	
	.empty-state {
		padding: 2rem;
		text-align: center;
		background: var(--bg-secondary);
		border: 2px dashed var(--border-primary);
		border-radius: 0.75rem;
	}
	
	.empty-state p {
		margin: 0 0 1rem 0;
		font-size: 0.875rem;
		color: var(--text-secondary);
	}
	
	.start-btn {
		padding: 0.625rem 1.25rem;
		font-size: 0.875rem;
		font-weight: 500;
		color: white;
		background: var(--color-primary-600);
		border: none;
		border-radius: 0.5rem;
		cursor: pointer;
		transition: all 0.15s ease;
	}
	
	.start-btn:hover {
		background: var(--color-primary-700);
		transform: translateY(-1px);
		box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
	}
	
	.categories-list {
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
	}
	
	/* Animation for new items */
	.categories-list > :global(*) {
		animation: fadeSlideIn 0.3s ease-out;
	}
	
	@keyframes fadeSlideIn {
		from {
			opacity: 0;
			transform: translateY(-10px);
		}
		to {
			opacity: 1;
			transform: translateY(0);
		}
	}
	
	/* Compact quick add section to match Base Price design */
	.quick-add-section-compact {
		background: var(--bg-secondary);
		border: 1px solid var(--border-primary);
		border-radius: 0.75rem;
		padding: 1rem;
		transition: all 0.2s ease;
	}
	
	.quick-add-section-compact:hover {
		border-color: var(--border-secondary);
		box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
	}
	
	.quick-add-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		gap: 0.75rem;
	}
	
	.header-with-icon {
		display: flex;
		align-items: center;
		gap: 0.5rem;
	}
	
	:global(.add-icon) {
		width: 1.125rem;
		height: 1.125rem;
		color: var(--text-secondary);
		flex-shrink: 0;
	}
	
	.add-label {
		font-size: 0.9375rem;
		font-weight: 600;
		color: var(--text-primary);
	}
	
	.quick-add-buttons-inline {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		flex-wrap: wrap;
		justify-content: flex-end;
	}
	
	.quick-add-btn-compact {
		padding: 0.375rem 0.75rem;
		font-size: 0.8125rem;
		font-weight: 500;
		color: var(--text-secondary);
		background: var(--bg-primary);
		border: 1px solid var(--border-secondary);
		border-radius: 0.375rem;
		cursor: pointer;
		transition: all 0.15s ease;
		white-space: nowrap;
	}
	
	.quick-add-btn-compact:hover {
		background: var(--color-primary-50);
		border-color: var(--color-primary-400);
		color: var(--color-primary-700);
		transform: translateY(-1px);
	}
	
	.add-label {
		font-size: 0.9375rem;
		font-weight: 600;
		color: var(--text-primary);
	}
	
	
	.custom-btn {
		border-style: dashed;
		opacity: 0.85;
	}
	
	.custom-btn:hover {
		opacity: 1;
		border-style: solid;
	}
	
	/* Tour Capacity Card */
	.capacity-card {
		background: var(--bg-secondary);
		border: 1px solid var(--border-primary);
		border-radius: 0.75rem;
		padding: 1rem;
		margin-bottom: 0.75rem;
		transition: all 0.2s ease;
	}
	
	.capacity-card:hover {
		border-color: var(--border-secondary);
		box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
	}
	
	.capacity-header {
		margin-bottom: 0.75rem;
	}
	
	:global(.capacity-icon) {
		width: 1.125rem;
		height: 1.125rem;
		color: var(--text-secondary);
		flex-shrink: 0;
	}
	
	.capacity-title {
		font-size: 0.9375rem;
		font-weight: 600;
		color: var(--text-primary);
	}
	
	.capacity-controls {
		display: flex;
		justify-content: space-between;
		align-items: center;
		gap: 1rem;
		flex-wrap: wrap;
	}
	
	.capacity-range {
		display: flex;
		align-items: center;
		gap: 0.5rem;
	}
	
	.capacity-input {
		width: 4rem;
		padding: 0.375rem 0.5rem;
		font-size: 0.875rem;
		font-weight: 500;
		text-align: center;
		border: 1px solid var(--border-secondary);
		border-radius: 0.375rem;
		background: var(--bg-primary);
		color: var(--text-primary);
	}
	
	.capacity-input:focus {
		outline: none;
		border-color: var(--color-primary-500);
		box-shadow: 0 0 0 2px var(--color-primary-100);
	}
	
	.capacity-separator {
		font-size: 0.875rem;
		color: var(--text-tertiary);
		font-weight: 500;
	}
	
	.capacity-label {
		font-size: 0.875rem;
		color: var(--text-secondary);
		white-space: nowrap;
	}
	
	.infant-checkbox {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		cursor: pointer;
		font-size: 0.875rem;
		color: var(--text-secondary);
	}
	
	.infant-checkbox input[type="checkbox"] {
		width: 1rem;
		height: 1rem;
		cursor: pointer;
		accent-color: var(--color-primary-600);
	}
	
	.capacity-error {
		flex-basis: 100%;
		padding: 0.5rem;
		background: var(--color-error-50);
		border: 1px solid var(--color-error-200);
		border-radius: 0.25rem;
		font-size: 0.8125rem;
		color: var(--color-error-700);
	}
	
	/* Mobile responsiveness */
	@media (max-width: 640px) {
		.empty-state {
			padding: 1.5rem 1rem;
		}
		
		.quick-add-section-compact {
			padding: 0.75rem;
		}
		
		.quick-add-header {
			flex-wrap: wrap;
			gap: 0.5rem;
		}
		
		.header-with-icon {
			flex-basis: 100%;
		}
		
		.quick-add-buttons-inline {
			width: 100%;
			justify-content: flex-start;
		}
		
		.quick-add-btn-compact {
			flex: 1;
			min-width: fit-content;
			padding: 0.375rem 0.5rem;
			font-size: 0.75rem;
		}
		
	}
</style>
