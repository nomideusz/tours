<!--
================================================================================
PARTICIPANT CATEGORIES COMPONENT
================================================================================

Allows tour guides to configure flexible participant pricing categories.
More powerful than simple adult/child - supports seniors, students, youth, etc.

Key Features:
- Add/Remove custom categories
- Configure price for each category
- Optional age ranges and descriptions
- Quick templates for common setups
- Drag-to-reorder (via sortOrder)
- Clean, intuitive UI

================================================================================
-->

<script lang="ts">
	import type { ParticipantCategory } from '$lib/types.js';
	import Plus from 'lucide-svelte/icons/plus';
	import AlertCircle from 'lucide-svelte/icons/alert-circle';
	import { validateParticipantCategories } from '$lib/utils/pricing-calculations.js';
	import CategoryCard from './CategoryCard.svelte';
	
	interface Props {
		categories?: ParticipantCategory[];
		currencySymbol: string;
		allErrors?: any[];
		onUpdate: (categories: ParticipantCategory[]) => void;
	}
	
	let {
		categories = $bindable([]),
		currencySymbol = '€',
		allErrors = [],
		onUpdate
	}: Props = $props();
	
	let validationErrors = $state<string[]>([]);
	let touchedCategories = $state<Set<string>>(new Set());
	let hasInitialized = $state(false);
	
	// Get adult price for discount calculations
	let adultPrice = $derived(() => {
		const adultCategory = categories.find(c => c.id === 'adult' || c.label.toLowerCase().includes('adult'));
		return adultCategory?.price || 0;
	});
	
	// Quick templates for common category setups
	const templates = [
		{
			id: 'standard',
			name: 'Standard (Adult/Child)',
			description: 'Simple adult and child pricing',
			categories: [
				{ id: 'adult', label: 'Adult', price: 50, sortOrder: 0, countsTowardCapacity: true },
				{ id: 'child', label: 'Child (3-12)', price: 25, sortOrder: 1, countsTowardCapacity: true }
			]
		},
		{
			id: 'age_based',
			name: 'Age-Based',
			description: 'Adult, senior, youth, and child',
			categories: [
				{ id: 'adult', label: 'Adult (18-64)', price: 50, sortOrder: 0, countsTowardCapacity: true },
				{ id: 'senior', label: 'Senior (65+)', price: 40, description: 'Valid ID required', sortOrder: 1, countsTowardCapacity: true },
				{ id: 'youth', label: 'Youth (13-17)', price: 35, sortOrder: 2, countsTowardCapacity: true },
				{ id: 'child', label: 'Child (3-12)', price: 25, sortOrder: 3, countsTowardCapacity: true },
				{ id: 'infant', label: 'Infant (0-2)', price: 0, sortOrder: 4, countsTowardCapacity: false }
			]
		},
		{
			id: 'student_friendly',
			name: 'Student-Friendly',
			description: 'Special student pricing',
			categories: [
				{ id: 'adult', label: 'Adult', price: 50, sortOrder: 0, countsTowardCapacity: true },
				{ id: 'student', label: 'Student', price: 35, description: 'Valid student ID required', sortOrder: 1, countsTowardCapacity: true },
				{ id: 'child', label: 'Child (under 18)', price: 25, sortOrder: 2, countsTowardCapacity: true }
			]
		},
		{
			id: 'family',
			name: 'Family Tour',
			description: 'Family-friendly pricing',
			categories: [
				{ id: 'adult', label: 'Adult', price: 40, sortOrder: 0, countsTowardCapacity: true },
				{ id: 'child', label: 'Child (5-17)', price: 20, sortOrder: 1, countsTowardCapacity: true },
				{ id: 'toddler', label: 'Toddler (2-4)', price: 10, sortOrder: 2, countsTowardCapacity: true },
				{ id: 'infant', label: 'Infant (0-1)', price: 0, sortOrder: 3, countsTowardCapacity: false }
			]
		}
	];
	
	function applyTemplate(templateId: string) {
		const template = templates.find(t => t.id === templateId);
		if (template) {
			categories = [...template.categories];
			// Mark all template categories as touched (they're pre-filled)
			touchedCategories = new Set(categories.map(c => c.id));
			onUpdate(categories);
			validateCategories();
		}
	}
	
	function addCategory() {
		const newCategory: ParticipantCategory = {
			id: `category_${Date.now()}`,
			label: '',
			price: 0,
			sortOrder: categories.length,
			countsTowardCapacity: true // Default: categories count toward capacity
		};
		categories = [...categories, newCategory];
		onUpdate(categories);
		// Don't validate immediately - wait for user interaction
	}
	
	function removeCategory(index: number) {
		const removedCategory = categories[index];
		
		// Prevent removing adult category
		if (removedCategory && (removedCategory.id === 'adult' || removedCategory.label.toLowerCase().includes('adult'))) {
			return; // Silently ignore
		}
		
		categories = categories.filter((_, i) => i !== index);
		// Reindex sort orders
		categories = categories.map((cat, i) => ({ ...cat, sortOrder: i }));
		// Remove from touched set
		if (removedCategory) {
			const newTouched = new Set(touchedCategories);
			newTouched.delete(removedCategory.id);
			touchedCategories = newTouched;
		}
		onUpdate(categories);
		validateCategories();
	}
	
	function updateCategory(index: number, updates: Partial<ParticipantCategory>) {
		const category = categories[index];
		if (category) {
			// Mark this category as touched when user interacts with it
			touchedCategories = new Set([...touchedCategories, category.id]);
		}
		categories = categories.map((cat, i) => 
			i === index ? { ...cat, ...updates } : cat
		);
		onUpdate(categories);
		validateCategories();
	}
	
	// Check for age range conflicts between categories
	function checkAgeRangeConflicts(): string[] {
		const conflicts: string[] = [];
		const categoriesWithAges = categories.filter(c => 
			c.minAge !== undefined || c.maxAge !== undefined
		);

		for (let i = 0; i < categoriesWithAges.length; i++) {
			for (let j = i + 1; j < categoriesWithAges.length; j++) {
				const cat1 = categoriesWithAges[i];
				const cat2 = categoriesWithAges[j];
				
				const min1 = cat1.minAge ?? 0;
				const max1 = cat1.maxAge ?? 999;
				const min2 = cat2.minAge ?? 0;
				const max2 = cat2.maxAge ?? 999;

				// Check if ranges overlap
				if (min1 <= max2 && min2 <= max1) {
					conflicts.push(`Age ranges overlap between "${cat1.label}" and "${cat2.label}"`);
				}
			}
		}

		return conflicts;
	}

	function validateCategories() {
		if (!hasInitialized) return; // Skip validation during initial setup
		
		const newErrors: string[] = [];
		
		// Only validate touched categories
		const categoriesToValidate = categories.filter(cat => touchedCategories.has(cat.id));
		
		if (categoriesToValidate.length === 0) {
			validationErrors = [];
			return;
		}
		
		// Check for empty labels in touched categories
		categoriesToValidate.forEach(cat => {
			if (!cat.label || cat.label.trim() === '') {
				newErrors.push('Category label cannot be empty');
			}
		});
		
		// Check for duplicate labels among all categories (not just touched)
		const labels = categories.map(c => c.label.toLowerCase().trim()).filter(l => l !== '');
		const duplicateLabels = labels.filter((label, index) => labels.indexOf(label) !== index);
		if (duplicateLabels.length > 0) {
			newErrors.push('Duplicate category names found');
		}
		
		// Check for age range conflicts
		const ageConflicts = checkAgeRangeConflicts();
		if (ageConflicts.length > 0) {
			newErrors.push(...ageConflicts);
		}
		
		// Ensure at least one category with price > 0 among touched categories
		if (categoriesToValidate.length > 0 && !categoriesToValidate.some(c => c.price > 0)) {
			newErrors.push('At least one category must have a price greater than 0');
		}
		
		// Must have at least one adult category
		const hasAdult = categories.some(c => c.id === 'adult' || c.label.toLowerCase().includes('adult'));
		if (!hasAdult) {
			newErrors.push('At least one adult category is required');
		}
		
		validationErrors = newErrors;
	}
	
	// On mount: if categories already exist (edit mode), mark them as touched and validate
	// Toggle age group on/off
	function toggleAgeGroup(type: 'adult' | 'child' | 'infant', currentlyExists: boolean) {
		if (currentlyExists) {
			// Remove the category
			const index = categories.findIndex(c => 
				c.id === type || c.label.toLowerCase().includes(type)
			);
			if (index !== -1) {
				removeCategory(index);
			}
		} else {
			// Add the category
			const adultCat = categories.find(c => c.id === 'adult' || c.label.toLowerCase().includes('adult'));
			const defaultPrice = adultCat?.price || 25;
			
			let newCategory: ParticipantCategory;
			if (type === 'adult') {
				newCategory = {
					id: 'adult',
					label: 'Adult (13+)',
					price: defaultPrice,
					sortOrder: categories.length,
					countsTowardCapacity: true
				};
			} else if (type === 'child') {
				newCategory = {
					id: 'child',
					label: 'Child (3-12)',
					price: defaultPrice,
					sortOrder: categories.length,
					countsTowardCapacity: true
				};
			} else {
				newCategory = {
					id: 'infant',
					label: 'Infant (0-2)',
					price: 0,
					sortOrder: categories.length,
					countsTowardCapacity: false
				};
			}
			
			categories = [...categories, newCategory];
			touchedCategories = new Set([...touchedCategories, newCategory.id]);
			onUpdate(categories);
			validateCategories();
		}
	}
	
	$effect(() => {
		if (!hasInitialized && categories.length > 0) {
			// This is edit mode - categories already exist on load
			// Mark all existing categories as touched in edit mode
			touchedCategories = new Set(categories.map(c => c.id));
			validateCategories();
			hasInitialized = true;
		} else if (!hasInitialized) {
			// This is create mode - no categories on load
			hasInitialized = true;
		}
	});
</script>

<div class="space-y-4">
	<!-- Header -->
	<div>
		<h4 class="font-medium" style="color: var(--text-primary);">Participant Categories</h4>
	</div>
	
	<!-- Quick Templates - shown when no categories exist -->
	{#if categories.length === 0}
		<div class="p-4 rounded-lg border" style="background: var(--bg-secondary); border-color: var(--border-primary);">
			<p class="text-sm mb-3" style="color: var(--text-secondary);">
				Quick Start Templates:
			</p>
			<div class="grid grid-cols-2 sm:grid-cols-4 gap-2">
				{#each templates as template}
					<button
						type="button"
						onclick={() => applyTemplate(template.id)}
						class="button-secondary button--small text-xs"
					>
						{template.name}
					</button>
				{/each}
			</div>
		</div>
	{/if}
	
	<!-- Categories List -->
	{#if categories.length > 0}
		<div class="space-y-3">
			{#each categories as category, index (category.id)}
				<CategoryCard
					bind:category={categories[index]}
					{index}
					{currencySymbol}
					adultPrice={adultPrice()}
					isAdultCategory={category.id === 'adult' || category.label.toLowerCase().includes('adult')}
					onRemove={() => removeCategory(index)}
					onUpdate={(updated) => updateCategory(index, updated)}
				/>
			{/each}
		</div>
		
		<!-- Add Category Button (below categories list) -->
		<button
			type="button"
			onclick={addCategory}
			class="w-full flex items-center justify-center gap-2 p-3 rounded-lg border transition-colors"
			style="
				background: var(--bg-secondary);
				border-color: var(--border-primary);
				color: var(--text-primary);
			"
		>
			<Plus class="w-4 h-4" />
			<span class="text-sm font-medium">Add Category</span>
		</button>
	{:else}
		<!-- Add First Category Button (when no categories exist) -->
		<button
			type="button"
			onclick={addCategory}
			class="w-full flex items-center justify-center gap-2 p-3 rounded-lg border transition-colors"
			style="
				background: var(--bg-secondary);
				border-color: var(--border-primary);
				color: var(--text-primary);
			"
		>
			<Plus class="w-4 h-4" />
			<span class="text-sm font-medium">Add First Category</span>
		</button>
	{/if}
	
	
	<!-- Validation Errors -->
	{#if validationErrors.length > 0}
		<div class="p-3 rounded-lg" style="background: var(--color-error-50); border: 1px solid var(--color-error-200);">
			<div class="flex items-start gap-2">
				<AlertCircle class="w-5 h-5 flex-shrink-0 mt-0.5" style="color: var(--color-error-600);" />
				<div class="flex-1">
					<p class="text-sm font-medium mb-1" style="color: var(--color-error-900);">
						Category Configuration Issues:
					</p>
					<ul class="text-sm space-y-1" style="color: var(--color-error-700);">
						{#each validationErrors as error}
							<li>• {error}</li>
						{/each}
					</ul>
				</div>
			</div>
		</div>
	{/if}
	
	<!-- Age Coverage Toggle Buttons -->
	{#if categories.length > 0}
		{@const hasAdult = categories.some(c => c.id === 'adult' || c.label.toLowerCase().includes('adult'))}
		{@const hasChild = categories.some(c => c.id === 'child' || c.label.toLowerCase().includes('child'))}
		{@const hasInfant = categories.some(c => c.id === 'infant' || c.label.toLowerCase().includes('infant'))}
		
		<div class="p-3 rounded-lg" style="background: var(--bg-secondary); border: 1px solid var(--border-primary);">
			<div class="text-xs font-medium mb-2" style="color: var(--text-secondary);">
				Age Group Coverage:
			</div>
			<div class="flex gap-2 text-xs flex-wrap">
				<button
					type="button"
					class="age-toggle {hasInfant ? 'active' : 'inactive'}"
					onclick={() => toggleAgeGroup('infant', hasInfant)}
				>
					{#if hasInfant}✓{:else}+{/if} 0-2 (Infant)
				</button>
				<button
					type="button"
					class="age-toggle {hasChild ? 'active' : 'inactive'}"
					onclick={() => toggleAgeGroup('child', hasChild)}
				>
					{#if hasChild}✓{:else}+{/if} 3-12 (Child)
				</button>
				<button
					type="button"
					class="age-toggle {hasAdult ? 'active' : 'inactive'}"
					onclick={() => toggleAgeGroup('adult', hasAdult)}
				>
					{#if hasAdult}✓{:else}+{/if} 13+ (Adult)
				</button>
			</div>
		</div>
	{/if}
</div>

<style>
	.age-toggle {
		display: inline-flex;
		align-items: center;
		gap: 0.25rem;
		padding: 0.375rem 0.625rem;
		border-radius: 0.375rem;
		font-weight: 500;
		cursor: pointer;
		transition: all 0.15s ease;
		border: 1px solid;
	}

	.age-toggle.active {
		background: var(--color-success-50);
		color: var(--color-success-700);
		border-color: var(--color-success-200);
	}

	.age-toggle.active:hover {
		background: var(--color-success-100);
		border-color: var(--color-success-300);
	}

	.age-toggle.inactive {
		background: var(--bg-tertiary);
		color: var(--text-tertiary);
		border-color: var(--border-secondary);
	}

	.age-toggle.inactive:hover {
		background: var(--bg-secondary);
		color: var(--text-secondary);
		border-color: var(--border-primary);
	}
</style>

