<script lang="ts">
	import ChevronDown from 'lucide-svelte/icons/chevron-down';
	import ChevronRight from 'lucide-svelte/icons/chevron-right';
	import X from 'lucide-svelte/icons/x';

	interface Props {
		includedItems: string[];
		requirements: string[];
		isExpanded?: boolean;
		onToggle?: () => void;
		onUpdate: (data: { includedItems: string[]; requirements: string[] }) => void;
	}

	let { 
		includedItems = $bindable([]),
		requirements = $bindable([]),
		isExpanded = $bindable(false),
		onToggle,
		onUpdate
	}: Props = $props();

	const includedItemsSuggestions = [
		'Professional tour guide',
		'Historical insights',
		'Photo opportunities',
		'Small group experience',
		'Route map',
		'Local recommendations'
	];

	const requirementsSuggestions = [
		'Comfortable walking shoes',
		'Basic fitness level',
		'Weather-appropriate clothing',
		'Minimum age 12+',
		'No mobility issues',
		'English speaking'
	];

	function addIncludedItem(item: string) {
		if (!includedItems.includes(item)) {
			includedItems = [...includedItems.filter(i => i.trim()), item];
			onUpdate({ includedItems, requirements });
		}
	}

	function removeIncludedItem(item: string) {
		includedItems = includedItems.filter(i => i !== item);
		onUpdate({ includedItems, requirements });
	}

	function addRequirement(req: string) {
		if (!requirements.includes(req)) {
			requirements = [...requirements.filter(r => r.trim()), req];
			onUpdate({ includedItems, requirements });
		}
	}

	function removeRequirement(req: string) {
		requirements = requirements.filter(r => r !== req);
		onUpdate({ includedItems, requirements });
	}
</script>

<div class="rounded-xl form-section-card" style="background: var(--bg-primary); border: 1px solid var(--border-primary);">
	<button
		type="button"
		onclick={() => {
			isExpanded = !isExpanded;
			onToggle?.();
		}}
		class="flex items-center justify-between w-full px-4 py-4 sm:p-4 transition-colors hover:bg-opacity-80 {isExpanded ? 'border-b' : ''}"
		style="{isExpanded ? 'border-color: var(--border-primary);' : ''}"
	>
		<div class="flex items-center gap-2">
			{#if isExpanded}
				<ChevronDown class="w-5 h-5" />
			{:else}
				<ChevronRight class="w-5 h-5" />
			{/if}
			<h2 class="font-semibold text-lg sm:text-xl" style="color: var(--text-primary);">Inclusions & Requirements</h2>
			{#if includedItems.some(item => item.trim()) || requirements.some(req => req.trim())}
				<span class="text-xs px-2 py-1 rounded-full" style="background: var(--color-primary-100); color: var(--color-primary-700);">
					{includedItems.filter(item => item.trim()).length + requirements.filter(req => req.trim()).length} items
				</span>
			{/if}
		</div>
	</button>
	
	{#if isExpanded}
		<div class="px-4 py-3 sm:p-4">
			<!-- What's Included Section -->
			<div class="mb-6 sm:mb-8">
				<h3 class="font-medium text-sm mb-3 section-heading" style="color: var(--text-primary);">What's Included</h3>
				
				<!-- Suggested Items -->
				<div class="mb-3 sm:mb-4">
					<div class="flex flex-wrap gap-2">
						{#each includedItemsSuggestions as suggestion}
							<button
								type="button"
								onclick={() => addIncludedItem(suggestion)}
								class="suggestion-btn text-xs sm:text-sm px-3 py-2 sm:py-1.5 rounded-full border transition-colors"
								style="border-color: var(--border-primary); color: var(--text-secondary);"
								disabled={includedItems.includes(suggestion)}
							>
								{suggestion}
							</button>
						{/each}
					</div>
				</div>

				<!-- Selected Items as Tags -->
				{#if includedItems.filter(item => item.trim()).length > 0}
					<div class="mb-3 sm:mb-4">
						<p class="text-xs sm:text-sm mb-2 selected-label" style="color: var(--text-secondary);">Added:</p>
						<div class="flex flex-wrap gap-2">
							{#each includedItems.filter(item => item.trim()) as item}
								<span class="selected-tag inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm border" style="background: var(--bg-secondary); border-color: var(--border-primary); color: var(--text-primary);">
									<span class="flex-1">{item}</span>
									<button
										type="button"
										onclick={() => removeIncludedItem(item)}
										class="remove-tag-btn flex-shrink-0 p-1 rounded transition-colors"
										style="color: var(--text-tertiary);"
										aria-label="Remove {item}"
									>
										<X class="w-3.5 h-3.5 sm:w-3 sm:h-3" />
									</button>
								</span>
							{/each}
						</div>
					</div>
				{/if}

				<!-- Custom Item Input -->
				<div class="custom-input-wrapper flex flex-col sm:flex-row gap-2">
					<input
						type="text"
						placeholder="Add custom item..."
						class="form-input form-input--no-transform flex-1 text-center sm:text-left"
						onkeydown={(e) => {
							if (e.key === 'Enter') {
								e.preventDefault();
								const input = e.target as HTMLInputElement;
								const value = input.value.trim();
								if (value) {
									addIncludedItem(value);
									input.value = '';
								}
							}
						}}
					/>
					<button
						type="button"
						onclick={(e) => {
							const button = e.target as HTMLButtonElement;
							const wrapper = button.closest('.custom-input-wrapper');
							const input = wrapper?.querySelector('input') as HTMLInputElement;
							const value = input?.value.trim();
							if (value) {
								addIncludedItem(value);
								input.value = '';
							}
						}}
						class="button-secondary button-small w-full sm:w-auto"
					>
						Add Item
					</button>
				</div>

				<!-- Hidden inputs for form submission -->
				{#each includedItems.filter(item => item.trim()) as item}
					<input type="hidden" name="includedItems" value={item} />
				{/each}
			</div>

			<!-- Requirements Section -->
			<div>
				<h3 class="font-medium text-sm mb-3 section-heading" style="color: var(--text-primary);">Requirements</h3>
				
				<!-- Suggested Requirements -->
				<div class="mb-3 sm:mb-4">
					<div class="flex flex-wrap gap-2">
						{#each requirementsSuggestions as suggestion}
							<button
								type="button"
								onclick={() => addRequirement(suggestion)}
								class="suggestion-btn text-xs sm:text-sm px-3 py-2 sm:py-1.5 rounded-full border transition-colors"
								style="border-color: var(--border-primary); color: var(--text-secondary);"
								disabled={requirements.includes(suggestion)}
							>
								{suggestion}
							</button>
						{/each}
					</div>
				</div>

				<!-- Selected Requirements as Tags -->
				{#if requirements.filter(req => req.trim()).length > 0}
					<div class="mb-3 sm:mb-4">
						<p class="text-xs sm:text-sm mb-2 selected-label" style="color: var(--text-secondary);">Added:</p>
						<div class="flex flex-wrap gap-2">
							{#each requirements.filter(req => req.trim()) as requirement}
								<span class="selected-tag inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm border" style="background: var(--bg-secondary); border-color: var(--border-primary); color: var(--text-primary);">
									<span class="flex-1">{requirement}</span>
									<button
										type="button"
										onclick={() => removeRequirement(requirement)}
										class="remove-tag-btn flex-shrink-0 p-1 rounded transition-colors"
										style="color: var(--text-tertiary);"
										aria-label="Remove {requirement}"
									>
										<X class="w-3.5 h-3.5 sm:w-3 sm:h-3" />
									</button>
								</span>
							{/each}
						</div>
					</div>
				{/if}

				<!-- Custom Requirement Input -->
				<div class="custom-input-wrapper flex flex-col sm:flex-row gap-2">
					<input
						type="text"
						placeholder="Add custom requirement..."
						class="form-input form-input--no-transform flex-1 text-center sm:text-left"
						onkeydown={(e) => {
							if (e.key === 'Enter') {
								e.preventDefault();
								const input = e.target as HTMLInputElement;
								const value = input.value.trim();
								if (value) {
									addRequirement(value);
									input.value = '';
								}
							}
						}}
					/>
					<button
						type="button"
						onclick={(e) => {
							const button = e.target as HTMLButtonElement;
							const wrapper = button.closest('.custom-input-wrapper');
							const input = wrapper?.querySelector('input') as HTMLInputElement;
							const value = input?.value.trim();
							if (value) {
								addRequirement(value);
								input.value = '';
							}
						}}
						class="button-secondary button-small w-full sm:w-auto"
					>
						Add Requirement
					</button>
				</div>

				<!-- Hidden inputs for form submission -->
				{#each requirements.filter(req => req.trim()) as requirement}
					<input type="hidden" name="requirements" value={requirement} />
				{/each}
			</div>
		</div>
	{/if}
</div>

<style>
	/* Mobile: Better touch targets for suggestion buttons */
	.suggestion-btn {
		min-height: 44px;
		touch-action: manipulation;
	}
	
	.suggestion-btn:disabled {
		opacity: 0.4;
		cursor: not-allowed;
	}
	
	.suggestion-btn:not(:disabled):active {
		transform: scale(0.97);
	}
	
	/* Selected tags styling */
	.selected-tag {
		min-height: 40px;
		touch-action: manipulation;
	}
	
	.remove-tag-btn {
		min-width: 28px;
		min-height: 28px;
		display: flex;
		align-items: center;
		justify-content: center;
		touch-action: manipulation;
	}
	
	.remove-tag-btn:hover {
		background: var(--color-danger-100);
		color: var(--color-danger-600);
	}
	
	.remove-tag-btn:active {
		transform: scale(0.95);
	}

	@media (max-width: 640px) {
		.form-section-card {
			border: none !important;
			background: transparent !important;
		}
		
		/* Mobile: Center section title */
		.form-section-card button {
			justify-content: center !important;
			text-align: center;
		}
		
		.form-section-card button > div {
			justify-content: center !important;
		}
		
		/* Mobile: Add divider after section */
		.form-section-card::after {
			content: '';
			display: block;
			height: 1px;
			background: linear-gradient(to right, transparent, var(--border-primary), transparent);
			margin: 0.5rem 0;
		}
		
		/* Mobile: Center section headings */
		.section-heading {
			text-align: center;
			font-size: 0.875rem;
		}
		
		/* Mobile: Center and reduce size of labels */
		.selected-label {
			text-align: center;
			font-size: 0.75rem;
		}
		
		/* Mobile: Larger suggestion buttons for better touch */
		.suggestion-btn {
			font-size: 0.75rem;
			padding: 0.625rem 0.875rem;
			min-height: 44px;
		}
		
		/* Mobile: Center suggestion buttons container */
		.mb-3 > .flex.flex-wrap {
			justify-content: center;
		}
		
		/* Mobile: Full-width selected tags with better spacing */
		.selected-tag {
			width: 100%;
			justify-content: space-between;
			padding: 0.75rem 0.875rem;
		}
		
		/* Mobile: Larger remove buttons */
		.remove-tag-btn {
			min-width: 32px;
			min-height: 32px;
		}
		
		/* Mobile: Center input placeholders */
		.custom-input-wrapper input::placeholder {
			text-align: center;
		}
		
		/* Mobile: Full-width buttons with better touch targets */
		.custom-input-wrapper button {
			min-height: 44px;
		}
	}
	
	/* Desktop: Keep compact design */
	@media (min-width: 640px) {
		.section-heading {
			text-align: left;
		}
		
		.selected-label {
			text-align: left;
		}
		
		.selected-tag {
			width: auto;
		}
	}
</style>
