<script lang="ts">
	import ChevronDown from 'lucide-svelte/icons/chevron-down';
	import ChevronRight from 'lucide-svelte/icons/chevron-right';
	import Package from 'lucide-svelte/icons/package';
	import AlertCircle from 'lucide-svelte/icons/alert-circle';
	import ChipInput from '$lib/components/form/inputs/ChipInput.svelte';

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
		<div class="px-4 py-3 sm:p-4 space-y-6">
			<!-- What's Included Section -->
			<div>
				<label class="form-label flex items-center gap-2 mb-2">
					<Package class="w-4 h-4" style="color: var(--text-tertiary);" />
					<span>What's Included</span>
				</label>
				<ChipInput
					bind:items={includedItems}
					suggestions={includedItemsSuggestions}
					placeholder="Add included item..."
					addButtonText="Add"
					onchange={(items) => onUpdate({ includedItems: items, requirements })}
				/>
				<!-- Hidden inputs for form submission -->
				{#each includedItems.filter(item => item.trim()) as item}
					<input type="hidden" name="includedItems" value={item} />
				{/each}
			</div>

			<!-- Requirements Section -->
			<div>
				<label class="form-label flex items-center gap-2 mb-2">
					<AlertCircle class="w-4 h-4" style="color: var(--text-tertiary);" />
					<span>Requirements</span>
				</label>
				<ChipInput
					bind:items={requirements}
					suggestions={requirementsSuggestions}
					placeholder="Add requirement..."
					addButtonText="Add"
					onchange={(items) => onUpdate({ includedItems, requirements: items })}
				/>
				<!-- Hidden inputs for form submission -->
				{#each requirements.filter(req => req.trim()) as requirement}
					<input type="hidden" name="requirements" value={requirement} />
				{/each}
			</div>
		</div>
	{/if}
</div>

<style>
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
	}
</style>
