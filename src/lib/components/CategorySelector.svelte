<script lang="ts">
	import X from 'lucide-svelte/icons/x';
	import Plus from 'lucide-svelte/icons/plus';
	import Users from 'lucide-svelte/icons/users';
	import Utensils from 'lucide-svelte/icons/utensils';
	import Building from 'lucide-svelte/icons/building';
	import BookOpen from 'lucide-svelte/icons/book-open';
	import Palette from 'lucide-svelte/icons/palette';
	import Mountain from 'lucide-svelte/icons/mountain';
	import Globe from 'lucide-svelte/icons/globe';
	
	interface Props {
		selectedCategories: string[];
		onchange?: (categories: string[]) => void;
		error?: boolean;
		maxCategories?: number;
	}
	
	let { 
		selectedCategories = $bindable([]), 
		onchange,
		error = false,
		maxCategories = 5
	}: Props = $props();
	
	let showDropdown = $state(false);
	let customInput = $state('');
	let showCustomInput = $state(false);
	let customInputRef = $state<HTMLInputElement>();
	
	const PRESET_CATEGORIES = [
		{ id: 'walking', name: 'Walking', icon: Users },
		{ id: 'food', name: 'Food', icon: Utensils },
		{ id: 'cultural', name: 'Cultural', icon: Building },
		{ id: 'historical', name: 'Historical', icon: BookOpen },
		{ id: 'art', name: 'Art', icon: Palette },
		{ id: 'adventure', name: 'Adventure', icon: Mountain }
	];
	
	// Determine which categories are preset vs custom
	let presetSelected = $derived(
		selectedCategories.filter(cat => PRESET_CATEGORIES.some(p => p.id === cat))
	);
	
	let customSelected = $derived(
		selectedCategories.filter(cat => !PRESET_CATEGORIES.some(p => p.id === cat))
	);
	
	let unselectedPresets = $derived(
		PRESET_CATEGORIES.filter(cat => !selectedCategories.includes(cat.id))
	);
	
	let canAddMore = $derived(selectedCategories.length < maxCategories);
	
	function toggleCategory(categoryId: string) {
		if (selectedCategories.includes(categoryId)) {
			selectedCategories = selectedCategories.filter(c => c !== categoryId);
		} else if (canAddMore) {
			selectedCategories = [...selectedCategories, categoryId];
		}
		if (onchange) onchange(selectedCategories);
	}
	
	function removeCategory(categoryId: string, event: MouseEvent) {
		event.stopPropagation();
		selectedCategories = selectedCategories.filter(c => c !== categoryId);
		if (onchange) onchange(selectedCategories);
	}
	
	function addCustomCategory() {
		const trimmed = customInput.trim();
		if (trimmed && !selectedCategories.includes(trimmed) && canAddMore) {
			selectedCategories = [...selectedCategories, trimmed];
			customInput = '';
			showCustomInput = false;
			showDropdown = false;
			if (onchange) onchange(selectedCategories);
		}
	}
	
	// Close dropdown when clicking outside
	function handleClickOutside(event: MouseEvent) {
		const target = event.target as HTMLElement;
		if (!target.closest('.category-selector')) {
			showDropdown = false;
			showCustomInput = false;
			customInput = '';
		}
	}
	
	$effect(() => {
		if (typeof document !== 'undefined') {
			if (showDropdown) {
				document.addEventListener('click', handleClickOutside);
				return () => document.removeEventListener('click', handleClickOutside);
			}
		}
	});
	
	// Focus custom input when shown
	$effect(() => {
		if (showCustomInput && customInputRef) {
			customInputRef.focus();
		}
	});
</script>

<div class="category-selector {error ? 'error' : ''}">
	<!-- Container for selected categories and add button -->
	<div class="category-container">
		{#if selectedCategories.length === 0}
			<!-- Empty state -->
			<button
				type="button"
				class="empty-state-button"
				onclick={() => showDropdown = !showDropdown}
			>
				<Palette class="w-4 h-4" style="color: var(--text-tertiary);" />
				<span>Select categories</span>
			</button>
		{:else}
			<!-- Selected category chips -->
			<div class="selected-categories">
				{#each selectedCategories as categoryId}
					{@const preset = PRESET_CATEGORIES.find(p => p.id === categoryId)}
					<div class="category-chip">
						{#if preset}
							{@const Icon = preset.icon}
							<Icon class="chip-icon" />
							<span class="chip-name">{preset.name}</span>
						{:else}
							<Globe class="chip-icon" />
							<span class="chip-name">{categoryId}</span>
						{/if}
						<button
							type="button"
							class="chip-remove"
							onclick={(e) => removeCategory(categoryId, e)}
							title="Remove {preset?.name || categoryId}"
						>
							<X class="w-3 h-3" />
						</button>
					</div>
				{/each}
				
				{#if canAddMore}
					<!-- Add category button -->
					<button
						type="button"
						class="add-category-button"
						onclick={() => showDropdown = !showDropdown}
					>
						<Plus class="w-4 h-4" />
						<span>Add</span>
					</button>
				{/if}
			</div>
		{/if}
		
		{#if !canAddMore}
			<div class="max-reached-hint">
				<span class="text-xs" style="color: var(--text-tertiary);">
					Maximum {maxCategories} categories
				</span>
			</div>
		{/if}
	</div>
	
	<!-- Dropdown (preset categories + custom option) -->
	{#if showDropdown && canAddMore}
		<div class="category-dropdown">
			{#if !showCustomInput}
				{#if unselectedPresets.length > 0}
					<div class="dropdown-header">
						<span class="text-xs font-medium" style="color: var(--text-secondary);">
							Add category
						</span>
					</div>
					<div class="category-list">
						{#each unselectedPresets as category}
							{@const Icon = category.icon}
							<button
								type="button"
								class="category-option"
								onclick={() => {
									toggleCategory(category.id);
									showDropdown = false;
								}}
							>
								<Icon class="option-icon" />
								<span class="category-name">{category.name}</span>
							</button>
						{/each}
					</div>
					<div class="dropdown-divider"></div>
				{/if}
				
				<!-- Custom category trigger -->
				<button
					type="button"
					class="custom-trigger"
					onclick={(e) => {
						e.preventDefault();
						e.stopPropagation();
						showCustomInput = true;
					}}
				>
					<Plus class="w-4 h-4" />
					<span>Add custom category</span>
				</button>
			{:else}
				<!-- Custom category input -->
				<div class="custom-input-section">
					<input
						bind:this={customInputRef}
						type="text"
						class="custom-category-input"
						placeholder="Enter category name..."
						bind:value={customInput}
						onkeydown={(e) => {
							if (e.key === 'Enter') {
								e.preventDefault();
								addCustomCategory();
							} else if (e.key === 'Escape') {
								showCustomInput = false;
								customInput = '';
							}
						}}
					/>
					<div class="custom-input-actions">
						<button
							type="button"
							class="custom-add-btn"
							onclick={addCustomCategory}
							disabled={!customInput.trim()}
						>
							Add
						</button>
						<button
							type="button"
							class="custom-cancel-btn"
							onclick={() => {
								showCustomInput = false;
								customInput = '';
							}}
						>
							Cancel
						</button>
					</div>
				</div>
			{/if}
		</div>
	{/if}
</div>

<style>
	.category-selector {
		position: relative;
		width: 100%;
	}
	
	.category-selector.error .category-container {
		border-color: var(--color-error-500);
		background: var(--color-danger-light);
	}
	
	.category-container {
		min-height: 42px;
		padding: 0.375rem;
		background: var(--bg-primary);
		border: 1px solid var(--border-primary);
		border-radius: 0.5rem;
		transition: all 0.2s;
	}
	
	.category-container:hover {
		border-color: var(--border-secondary);
	}
	
	/* Empty state button */
	.empty-state-button {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		width: 100%;
		padding: 0.25rem 0.5rem;
		background: transparent;
		border: none;
		color: var(--text-secondary);
		font-size: 0.875rem;
		cursor: pointer;
		transition: color 0.2s;
	}
	
	.empty-state-button:hover {
		color: var(--text-primary);
	}
	
	/* Selected categories container */
	.selected-categories {
		display: flex;
		flex-wrap: wrap;
		gap: 0.375rem;
		align-items: center;
	}
	
	/* Category chip */
	.category-chip {
		display: inline-flex;
		align-items: center;
		gap: 0.375rem;
		padding: 0.25rem 0.375rem;
		background: var(--bg-secondary);
		border: 1px solid var(--border-primary);
		border-radius: 0.375rem;
		font-size: 0.875rem;
		color: var(--text-primary);
		transition: all 0.15s;
	}
	
	.category-chip:hover {
		background: var(--bg-tertiary);
		border-color: var(--border-secondary);
	}
	
	.chip-icon {
		width: 1rem;
		height: 1rem;
		flex-shrink: 0;
		color: var(--text-tertiary);
	}
	
	.chip-name {
		line-height: 1.2;
	}
	
	.chip-remove {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 1.25rem;
		height: 1.25rem;
		padding: 0;
		margin: -0.125rem -0.125rem -0.125rem 0.125rem;
		background: transparent;
		border: none;
		border-radius: 0.25rem;
		color: var(--text-tertiary);
		cursor: pointer;
		transition: all 0.15s;
		flex-shrink: 0;
	}
	
	.chip-remove:hover {
		background: var(--bg-tertiary);
		color: var(--color-error-600);
	}
	
	/* Add category button */
	.add-category-button {
		display: inline-flex;
		align-items: center;
		gap: 0.25rem;
		padding: 0.25rem 0.625rem;
		background: transparent;
		border: 1px dashed var(--border-primary);
		border-radius: 0.375rem;
		color: var(--text-tertiary);
		font-size: 0.875rem;
		cursor: pointer;
		transition: all 0.15s;
	}
	
	.add-category-button:hover {
		border-color: var(--color-primary-400);
		color: var(--color-primary-600);
		background: var(--color-primary-50);
		border-style: solid;
	}
	
	/* Max reached hint */
	.max-reached-hint {
		padding: 0.25rem 0.5rem;
		text-align: center;
	}
	
	/* Dropdown */
	.category-dropdown {
		position: absolute;
		top: calc(100% + 0.5rem);
		left: 0;
		min-width: 220px;
		max-width: 320px;
		background: var(--bg-primary);
		border: 1px solid var(--border-primary);
		border-radius: 0.5rem;
		box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
		z-index: 50;
		max-height: 360px;
		overflow: hidden;
		display: flex;
		flex-direction: column;
	}
	
	.dropdown-header {
		padding: 0.625rem 0.875rem;
		border-bottom: 1px solid var(--border-primary);
		background: var(--bg-secondary);
		flex-shrink: 0;
	}
	
	.category-list {
		padding: 0.375rem;
		overflow-y: auto;
		flex: 1;
	}
	
	.category-option {
		display: flex;
		align-items: center;
		gap: 0.625rem;
		width: 100%;
		padding: 0.5rem 0.625rem;
		background: transparent;
		border: none;
		border-radius: 0.375rem;
		color: var(--text-primary);
		font-size: 0.875rem;
		cursor: pointer;
		transition: all 0.15s;
		text-align: left;
	}
	
	.category-option:hover {
		background: var(--bg-secondary);
	}
	
	.option-icon {
		width: 1.125rem;
		height: 1.125rem;
		flex-shrink: 0;
		color: var(--text-tertiary);
	}
	
	.category-name {
		flex: 1;
	}
	
	.dropdown-divider {
		height: 1px;
		background: var(--border-primary);
		margin: 0.25rem 0;
	}
	
	/* Custom trigger button */
	.custom-trigger {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		width: 100%;
		padding: 0.625rem 0.875rem;
		background: transparent;
		border: none;
		color: var(--text-secondary);
		font-size: 0.875rem;
		cursor: pointer;
		transition: all 0.15s;
		text-align: left;
	}
	
	.custom-trigger:hover {
		background: var(--bg-secondary);
		color: var(--text-primary);
	}
	
	/* Custom input section */
	.custom-input-section {
		padding: 0.75rem;
	}
	
	.custom-category-input {
		width: 100%;
		padding: 0.5rem 0.75rem;
		background: var(--bg-primary);
		border: 1px solid var(--border-primary);
		border-radius: 0.375rem;
		color: var(--text-primary);
		font-size: 0.875rem;
		margin-bottom: 0.5rem;
		transition: all 0.2s;
	}
	
	.custom-category-input:focus {
		outline: none;
		border-color: var(--color-primary-400);
		box-shadow: 0 0 0 3px var(--color-primary-100);
	}
	
	.custom-input-actions {
		display: flex;
		gap: 0.5rem;
	}
	
	.custom-add-btn,
	.custom-cancel-btn {
		flex: 1;
		padding: 0.5rem;
		border-radius: 0.375rem;
		font-size: 0.875rem;
		font-weight: 500;
		cursor: pointer;
		transition: all 0.15s;
		border: none;
	}
	
	.custom-add-btn {
		background: var(--color-primary-600);
		color: white;
	}
	
	.custom-add-btn:hover:not(:disabled) {
		background: var(--color-primary-700);
	}
	
	.custom-add-btn:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}
	
	.custom-cancel-btn {
		background: var(--bg-secondary);
		color: var(--text-secondary);
	}
	
	.custom-cancel-btn:hover {
		background: var(--bg-tertiary);
		color: var(--text-primary);
	}
	
	/* Responsive adjustments */
	@media (max-width: 640px) {
		.category-dropdown {
			left: 0;
			right: 0;
			max-width: none;
			max-height: 320px;
		}
		
		.selected-categories {
			gap: 0.5rem;
		}
		
		.category-chip {
			padding: 0.375rem 0.5rem;
		}
		
		.add-category-button {
			padding: 0.375rem 0.75rem;
		}
	}
	
	/* Focus styles */
	.category-container:has(:focus-visible) {
		outline: none;
		border-color: var(--color-primary-400);
		box-shadow: 0 0 0 3px var(--color-primary-100);
	}
</style>

