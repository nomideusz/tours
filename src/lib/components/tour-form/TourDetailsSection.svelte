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

<div class="rounded-xl" style="background: var(--bg-primary); border: 1px solid var(--border-primary);">
	<button
		type="button"
		onclick={() => {
			isExpanded = !isExpanded;
			onToggle?.();
		}}
		class="flex items-center justify-between w-full p-4 transition-colors hover:bg-opacity-80 {isExpanded ? 'border-b' : ''}"
		style="{isExpanded ? 'border-color: var(--border-primary);' : ''}"
	>
		<div class="flex items-center gap-2">
			{#if isExpanded}
				<ChevronDown class="w-4 h-4" />
			{:else}
				<ChevronRight class="w-4 h-4" />
			{/if}
			<h2 class="font-semibold text-base sm:text-lg" style="color: var(--text-primary);">Tour Details</h2>
			{#if includedItems.some(item => item.trim()) || requirements.some(req => req.trim())}
				<span class="text-xs px-2 py-1 rounded-full" style="background: var(--color-primary-100); color: var(--color-primary-700);">
					{includedItems.filter(item => item.trim()).length + requirements.filter(req => req.trim()).length} items
				</span>
			{/if}
		</div>
		<span class="text-xs" style="color: var(--text-secondary);">
			{isExpanded ? 'Hide' : 'Show'} included items & requirements
		</span>
	</button>
	
	{#if isExpanded}
		<div class="p-4">
			<!-- What's Included Section -->
			<div class="mb-8">
				<h3 class="font-medium text-sm mb-3" style="color: var(--text-primary);">What's Included</h3>
				
				<!-- Suggested Items -->
				<div class="mb-4">
					<p class="text-sm mb-2" style="color: var(--text-secondary);">Quick add popular items:</p>
					<div class="flex flex-wrap gap-2">
						{#each includedItemsSuggestions as suggestion}
							<button
								type="button"
								onclick={() => addIncludedItem(suggestion)}
								class="text-xs px-3 py-1.5 rounded-full border transition-colors hover:bg-gray-50"
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
					<div class="mb-4">
						<p class="text-sm mb-2" style="color: var(--text-secondary);">Included items:</p>
						<div class="flex flex-wrap gap-2">
							{#each includedItems.filter(item => item.trim()) as item}
								<span class="inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-sm border" style="background: var(--bg-secondary); border-color: var(--border-primary); color: var(--text-primary);">
									{item}
									<button
										type="button"
										onclick={() => removeIncludedItem(item)}
										class="ml-1 transition-colors"
										style="color: var(--text-tertiary);"
										aria-label="Remove {item}"
									>
										<X class="w-3 h-3" />
									</button>
								</span>
							{/each}
						</div>
					</div>
				{/if}

				<!-- Custom Item Input -->
				<div class="flex gap-2">
					<input
						type="text"
						placeholder="Add custom item..."
						class="form-input flex-1"
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
							const input = button.parentElement?.querySelector('input') as HTMLInputElement;
							const value = input?.value.trim();
							if (value) {
								addIncludedItem(value);
								input.value = '';
							}
						}}
						class="button-secondary button--small"
					>
						Add
					</button>
				</div>

				<!-- Hidden inputs for form submission -->
				{#each includedItems.filter(item => item.trim()) as item}
					<input type="hidden" name="includedItems" value={item} />
				{/each}
			</div>

			<!-- Requirements Section -->
			<div>
				<h3 class="font-medium text-sm mb-3" style="color: var(--text-primary);">Requirements</h3>
				
				<!-- Suggested Requirements -->
				<div class="mb-4">
					<p class="text-sm mb-2" style="color: var(--text-secondary);">Quick add common requirements:</p>
					<div class="flex flex-wrap gap-2">
						{#each requirementsSuggestions as suggestion}
							<button
								type="button"
								onclick={() => addRequirement(suggestion)}
								class="text-xs px-3 py-1.5 rounded-full border transition-colors hover:bg-gray-50"
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
					<div class="mb-4">
						<p class="text-sm mb-2" style="color: var(--text-secondary);">Requirements:</p>
						<div class="flex flex-wrap gap-2">
							{#each requirements.filter(req => req.trim()) as requirement}
								<span class="inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-sm border" style="background: var(--bg-secondary); border-color: var(--border-primary); color: var(--text-primary);">
									{requirement}
									<button
										type="button"
										onclick={() => removeRequirement(requirement)}
										class="ml-1 transition-colors"
										style="color: var(--text-tertiary);"
										aria-label="Remove {requirement}"
									>
										<X class="w-3 h-3" />
									</button>
								</span>
							{/each}
						</div>
					</div>
				{/if}

				<!-- Custom Requirement Input -->
				<div class="flex gap-2">
					<input
						type="text"
						placeholder="Add custom requirement..."
						class="form-input flex-1"
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
							const input = button.parentElement?.querySelector('input') as HTMLInputElement;
							const value = input?.value.trim();
							if (value) {
								addRequirement(value);
								input.value = '';
							}
						}}
						class="button-secondary button--small"
					>
						Add
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
