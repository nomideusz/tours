<script lang="ts">
	import X from 'lucide-svelte/icons/x';
	import Plus from 'lucide-svelte/icons/plus';
	import Sparkles from 'lucide-svelte/icons/sparkles';
	
	interface Props {
		items: string[];
		suggestions?: string[];
		placeholder?: string;
		addButtonText?: string;
		error?: boolean;
		onchange?: (items: string[]) => void;
	}
	
	let {
		items = $bindable([]),
		suggestions = [],
		placeholder = 'Add item...',
		addButtonText = 'Add',
		error = false,
		onchange
	}: Props = $props();
	
	let showDropdown = $state(false);
	let customInput = $state('');
	let showCustomInput = $state(false);
	let customInputRef = $state<HTMLInputElement>();
	
	// Filter out suggestions that are already selected
	let availableSuggestions = $derived(
		suggestions.filter(s => !items.includes(s))
	);
	
	function addItem(item: string) {
		const trimmed = item.trim();
		if (trimmed && !items.includes(trimmed)) {
			items = [...items, trimmed];
			if (onchange) onchange(items);
		}
	}
	
	function removeItem(item: string, event: MouseEvent) {
		event.stopPropagation();
		items = items.filter(i => i !== item);
		if (onchange) onchange(items);
	}
	
	function addCustomItem() {
		const trimmed = customInput.trim();
		if (trimmed && !items.includes(trimmed)) {
			items = [...items, trimmed];
			customInput = '';
			showCustomInput = false;
			showDropdown = false;
			if (onchange) onchange(items);
		}
	}
	
	// Close dropdown when clicking outside
	function handleClickOutside(event: MouseEvent) {
		const target = event.target as HTMLElement;
		if (!target.closest('.chip-input')) {
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

<div class="chip-input {error ? 'error' : ''}">
	<!-- Container for selected items and add button -->
	<div class="chip-container">
		{#if items.length === 0}
			<!-- Empty state -->
			<button
				type="button"
				class="empty-state-button"
				onclick={() => showDropdown = !showDropdown}
			>
				<Plus class="w-4 h-4" style="color: var(--text-tertiary);" />
				<span>{placeholder}</span>
			</button>
		{:else}
			<!-- Selected item chips -->
			<div class="selected-items">
				{#each items as item}
					<div class="item-chip">
						<span class="chip-text">{item}</span>
						<button
							type="button"
							class="chip-remove"
							onclick={(e) => removeItem(item, e)}
							title="Remove {item}"
						>
							<X class="w-3 h-3" />
						</button>
					</div>
				{/each}
				
				<!-- Add item button -->
				<button
					type="button"
					class="add-item-button"
					onclick={() => showDropdown = !showDropdown}
				>
					<Plus class="w-4 h-4" />
					<span>{addButtonText}</span>
				</button>
			</div>
		{/if}
	</div>
	
	<!-- Dropdown (suggestions + custom option) -->
	{#if showDropdown}
		<div class="chip-dropdown">
			{#if !showCustomInput}
				{#if availableSuggestions.length > 0}
					<div class="dropdown-header">
						<Sparkles class="w-3.5 h-3.5" style="color: var(--text-tertiary);" />
						<span class="text-xs font-medium" style="color: var(--text-secondary);">
							Quick add
						</span>
					</div>
					<div class="suggestion-list">
						{#each availableSuggestions as suggestion}
							<button
								type="button"
								class="suggestion-option"
								onclick={() => {
									addItem(suggestion);
									if (availableSuggestions.length === 1) {
										showDropdown = false;
									}
								}}
							>
								<span>{suggestion}</span>
							</button>
						{/each}
					</div>
					<div class="dropdown-divider"></div>
				{/if}
				
				<!-- Custom item trigger -->
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
					<span>Add custom item</span>
				</button>
			{:else}
				<!-- Custom item input -->
				<div class="custom-input-section">
					<input
						bind:this={customInputRef}
						type="text"
						class="custom-item-input"
						placeholder={placeholder}
						bind:value={customInput}
						onkeydown={(e) => {
							if (e.key === 'Enter') {
								e.preventDefault();
								addCustomItem();
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
							onclick={addCustomItem}
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
	.chip-input {
		position: relative;
		width: 100%;
	}
	
	.chip-input.error .chip-container {
		border-color: var(--color-error-500);
		background: var(--color-danger-light);
	}
	
	.chip-container {
		min-height: 42px;
		padding: 0.375rem;
		background: var(--bg-primary);
		border: 1px solid var(--border-primary);
		border-radius: 0.5rem;
		transition: all 0.2s;
	}
	
	.chip-container:hover {
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
	
	/* Selected items container */
	.selected-items {
		display: flex;
		flex-wrap: wrap;
		gap: 0.375rem;
		align-items: center;
	}
	
	/* Item chip */
	.item-chip {
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
		max-width: 100%;
	}
	
	.item-chip:hover {
		background: var(--bg-tertiary);
		border-color: var(--border-secondary);
	}
	
	.chip-text {
		line-height: 1.2;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
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
	
	/* Add item button */
	.add-item-button {
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
		flex-shrink: 0;
	}
	
	.add-item-button:hover {
		border-color: var(--color-primary-400);
		color: var(--color-primary-600);
		background: var(--color-primary-50);
		border-style: solid;
	}
	
	/* Dropdown */
	.chip-dropdown {
		position: absolute;
		top: calc(100% + 0.5rem);
		left: 0;
		right: 0;
		background: var(--bg-primary);
		border: 1px solid var(--border-primary);
		border-radius: 0.5rem;
		box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
		z-index: 50;
		max-height: 320px;
		overflow: hidden;
		display: flex;
		flex-direction: column;
	}
	
	.dropdown-header {
		display: flex;
		align-items: center;
		gap: 0.375rem;
		padding: 0.625rem 0.875rem;
		border-bottom: 1px solid var(--border-primary);
		background: var(--bg-secondary);
		flex-shrink: 0;
	}
	
	.suggestion-list {
		padding: 0.375rem;
		overflow-y: auto;
		flex: 1;
	}
	
	.suggestion-option {
		display: flex;
		align-items: center;
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
	
	.suggestion-option:hover {
		background: var(--bg-secondary);
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
	
	.custom-item-input {
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
	
	.custom-item-input:focus {
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
		.chip-dropdown {
			max-height: 280px;
		}
		
		.selected-items {
			gap: 0.5rem;
		}
		
		.item-chip {
			padding: 0.375rem 0.5rem;
		}
		
		.add-item-button {
			padding: 0.375rem 0.75rem;
		}
	}
	
	/* Focus styles */
	.chip-container:has(:focus-visible) {
		outline: none;
		border-color: var(--color-primary-400);
		box-shadow: 0 0 0 3px var(--color-primary-100);
	}
</style>

