<script lang="ts">
	import ChevronDown from 'lucide-svelte/icons/chevron-down';
	import Search from 'lucide-svelte/icons/search';
	
	// Props
	interface Option {
		value: string;
		label: string;
	}
	
	let {
		value = $bindable(''),
		options = [],
		placeholder = 'Select...',
		icon = null,
		disabled = false,
		class: className = '',
		searchable = false,
		searchPlaceholder = 'Search...',
		onchange = undefined
	}: {
		value?: string;
		options: Option[];
		placeholder?: string;
		icon?: any;
		disabled?: boolean;
		class?: string;
		searchable?: boolean;
		searchPlaceholder?: string;
		onchange?: (value: string) => void;
	} = $props();
	
	// State
	let isOpen = $state(false);
	let dropdownRef: HTMLDivElement | null = $state(null);
	let buttonRef: HTMLButtonElement | null = $state(null);
	let searchInputRef: HTMLInputElement | null = $state(null);
	let highlightedIndex = $state(-1);
	let searchQuery = $state('');
	
	// Computed
	let selectedOption = $derived(options.find(opt => opt.value === value));
	let displayText = $derived(selectedOption?.label || placeholder);
	
	// Filter options based on search query
	let filteredOptions = $derived(
		searchQuery.trim()
			? options.filter(opt => 
				opt.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
				opt.value.toLowerCase().includes(searchQuery.toLowerCase())
			)
			: options
	);
	
	// Methods
	function toggleDropdown() {
		if (disabled) return;
		isOpen = !isOpen;
		if (isOpen) {
			searchQuery = '';
			highlightedIndex = filteredOptions.findIndex(opt => opt.value === value);
			
			// Focus search input if searchable
			if (searchable) {
				setTimeout(() => searchInputRef?.focus(), 50);
			}
		}
	}
	
	function closeDropdown() {
		isOpen = false;
		highlightedIndex = -1;
		searchQuery = '';
		buttonRef?.focus();
	}
	
	function selectOption(option: Option) {
		const previousValue = value;
		value = option.value;
		
		// Call onchange callback if value changed
		if (previousValue !== option.value && onchange) {
			onchange(option.value);
		}
		closeDropdown();
	}
	
	function handleKeydown(event: KeyboardEvent) {
		if (disabled) return;
		
		switch (event.key) {
			case 'Enter':
			case ' ':
				event.preventDefault();
				if (!isOpen) {
					toggleDropdown();
				} else if (highlightedIndex >= 0 && highlightedIndex < filteredOptions.length) {
					selectOption(filteredOptions[highlightedIndex]);
				}
				break;
			case 'Escape':
				event.preventDefault();
				closeDropdown();
				break;
			case 'ArrowDown':
				event.preventDefault();
				if (!isOpen) {
					toggleDropdown();
				} else {
					highlightedIndex = Math.min(highlightedIndex + 1, filteredOptions.length - 1);
				}
				break;
			case 'ArrowUp':
				event.preventDefault();
				if (isOpen) {
					highlightedIndex = Math.max(highlightedIndex - 1, 0);
				}
				break;
			case 'Home':
				event.preventDefault();
				if (isOpen) {
					highlightedIndex = 0;
				}
				break;
			case 'End':
				event.preventDefault();
				if (isOpen) {
					highlightedIndex = filteredOptions.length - 1;
				}
				break;
		}
	}
	
	function handleSearchKeydown(event: KeyboardEvent) {
		// Allow arrow keys to navigate filtered options while in search input
		if (event.key === 'ArrowDown' || event.key === 'ArrowUp' || 
		    event.key === 'Enter' || event.key === 'Escape') {
			handleKeydown(event);
		}
	}
	
	// Scroll highlighted option into view
	$effect(() => {
		if (isOpen && highlightedIndex >= 0 && dropdownRef) {
			const highlightedElement = dropdownRef.querySelector(`[data-index="${highlightedIndex}"]`);
			highlightedElement?.scrollIntoView({ block: 'nearest' });
		}
	});
	
	// Click outside handler
	let containerRef: HTMLDivElement | null = $state(null);
	
	$effect(() => {
		if (!containerRef) return;
		
		const handleClickOutside = (event: MouseEvent) => {
			if (isOpen && containerRef && !containerRef.contains(event.target as Node)) {
				closeDropdown();
			}
		};
		
		document.addEventListener('click', handleClickOutside, true);
		
		return () => {
			document.removeEventListener('click', handleClickOutside, true);
		};
	});
</script>

<div bind:this={containerRef} class="custom-select {className}">
	<button
		bind:this={buttonRef}
		type="button"
		class="select-button"
		class:open={isOpen}
		class:disabled={disabled}
		onclick={toggleDropdown}
		onkeydown={handleKeydown}
		aria-haspopup="listbox"
		aria-expanded={isOpen}
		{disabled}
	>
		{#if icon}
			{@const IconComponent = icon}
			<span class="select-icon">
				<IconComponent class="w-4 h-4" />
			</span>
		{/if}
		<span class="select-text" class:placeholder={!selectedOption}>
			{displayText}
		</span>
		<span class={isOpen ? 'chevron-icon rotated' : 'chevron-icon'}>
			<ChevronDown class="w-4 h-4" />
		</span>
	</button>
	
	{#if isOpen}
		<div
			bind:this={dropdownRef}
			class="select-dropdown"
			role="listbox"
			aria-label={placeholder}
		>
			{#if searchable}
				<div class="search-container">
					<Search class="search-icon" />
					<input
						bind:this={searchInputRef}
						type="text"
						bind:value={searchQuery}
						placeholder={searchPlaceholder}
						class="search-input"
						onkeydown={handleSearchKeydown}
					/>
				</div>
			{/if}
			
			<div class="options-container">
				{#if filteredOptions.length > 0}
					{#each filteredOptions as option, index}
						<button
							type="button"
							class="select-option"
							class:selected={option.value === value}
							class:highlighted={index === highlightedIndex}
							role="option"
							aria-selected={option.value === value}
							data-index={index}
							onclick={() => selectOption(option)}
							onmouseenter={() => highlightedIndex = index}
						>
							{option.label}
						</button>
					{/each}
				{:else}
					<div class="no-results">
						No results found
					</div>
				{/if}
			</div>
		</div>
	{/if}
</div>

<style>
	.custom-select {
		position: relative;
		display: inline-flex;
		min-width: fit-content;
		max-width: 100%;
	}
	
	/* When parent sets width, respect it */
	:global(.custom-select[style*="width"]),
	:global([style*="width"] .custom-select) {
		width: 100%;
	}
	
	.select-button {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		width: 100%;
		min-width: 150px;
		padding: 0.625rem 1rem;
		background: var(--bg-primary);
		border: 1px solid var(--border-primary);
		border-radius: 0.5rem;
		color: var(--text-primary);
		font-size: 0.875rem;
		font-weight: 500;
		cursor: pointer;
		transition: all 0.2s ease;
		min-height: 2.5rem;
		white-space: nowrap;
	}
	
	.select-button:hover:not(.disabled) {
		border-color: var(--color-primary-300);
		background: var(--bg-secondary);
	}
	
	.select-button.open,
	.select-button:focus {
		border-color: var(--color-primary-400);
		box-shadow: 0 0 0 3px rgba(var(--color-primary-rgb), 0.1);
		outline: none;
	}
	
	.select-button.disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}
	
	.select-icon {
		display: flex;
		align-items: center;
		color: var(--text-tertiary);
		flex-shrink: 0;
	}
	
	.select-text {
		flex: 1;
		text-align: left;
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}
	
	.select-text.placeholder {
		color: var(--text-tertiary);
	}
	
	.chevron-icon {
		display: flex;
		align-items: center;
		color: var(--text-tertiary);
		flex-shrink: 0;
		transition: transform 0.2s ease;
	}
	
	.chevron-icon.rotated {
		transform: rotate(180deg);
	}
	
	.select-dropdown {
		position: absolute;
		top: calc(100% + 0.25rem);
		left: 0;
		right: 0;
		background: var(--bg-primary);
		border: 1px solid var(--border-primary);
		border-radius: 0.5rem;
		box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
		z-index: 50;
		overflow: hidden;
	}
	
	.search-container {
		position: relative;
		padding: 0.5rem;
		border-bottom: 1px solid var(--border-primary);
	}
	
	.search-icon {
		position: absolute;
		left: 1rem;
		top: 50%;
		transform: translateY(-50%);
		width: 1rem;
		height: 1rem;
		color: var(--text-tertiary);
		pointer-events: none;
	}
	
	.search-input {
		width: 100%;
		padding: 0.5rem 0.75rem 0.5rem 2.25rem;
		background: var(--bg-secondary);
		border: 1px solid var(--border-primary);
		border-radius: 0.375rem;
		color: var(--text-primary);
		font-size: 0.875rem;
		transition: all 0.2s ease;
	}
	
	.search-input:focus {
		outline: none;
		border-color: var(--color-primary-400);
		background: var(--bg-primary);
	}
	
	.search-input::placeholder {
		color: var(--text-tertiary);
	}
	
	.options-container {
		max-height: 14rem;
		overflow-y: auto;
		padding: 0.25rem;
	}
	
	.no-results {
		padding: 1.5rem 1rem;
		text-align: center;
		color: var(--text-tertiary);
		font-size: 0.875rem;
	}
	
	.select-option {
		display: block;
		width: 100%;
		padding: 0.75rem 1rem;
		text-align: left;
		background: transparent;
		border: none;
		border-radius: 0.375rem;
		color: var(--text-primary);
		font-size: 0.875rem;
		cursor: pointer;
		transition: all 0.15s ease;
	}
	
	.select-option:hover,
	.select-option.highlighted {
		background: var(--bg-secondary);
	}
	
	.select-option.selected {
		background: var(--color-primary-100);
		color: var(--color-primary-700);
		font-weight: 600;
	}
	
	.select-option.selected:hover,
	.select-option.selected.highlighted {
		background: var(--color-primary-200);
	}
	
	/* Scrollbar styling */
	.options-container {
		scrollbar-width: thin;
		scrollbar-color: var(--border-secondary) transparent;
	}
	
	.options-container::-webkit-scrollbar {
		width: 0.375rem;
	}
	
	.options-container::-webkit-scrollbar-track {
		background: transparent;
	}
	
	.options-container::-webkit-scrollbar-thumb {
		background: var(--border-secondary);
		border-radius: 0.25rem;
	}
	
	.options-container::-webkit-scrollbar-thumb:hover {
		background: var(--border-primary);
	}
</style>

