<script lang="ts">
	import ArrowUp from 'lucide-svelte/icons/arrow-up';
	import ArrowDown from 'lucide-svelte/icons/arrow-down';
	import ArrowUpDown from 'lucide-svelte/icons/arrow-up-down';

	interface SortColumn {
		key: string;
		label: string;
		sortable?: boolean;
	}

	interface Props {
		columns: SortColumn[];
		sortBy: string;
		sortOrder: 'asc' | 'desc';
		onSort: (field: string) => void;
		variant?: 'desktop' | 'mobile' | 'mobile-select';
		class?: string;
	}

	let { 
		columns, 
		sortBy, 
		sortOrder, 
		onSort, 
		variant = 'desktop',
		class: className = '' 
	}: Props = $props();

	function handleSort(field: string) {
		onSort(field);
	}

	function toggleSortOrder() {
		// Find current column and trigger sort to toggle order
		onSort(sortBy);
	}

	// Get sortable columns for mobile select
	let sortableColumns = $derived(columns.filter(col => col.sortable !== false));
</script>

{#if variant === 'desktop'}
	<!-- Desktop Sortable Headers -->
	<tr class={className}>
		{#each columns as column}
			<th class="px-4 py-3 text-left">
				{#if column.sortable !== false}
					<button 
						onclick={() => handleSort(column.key)} 
						class="flex items-center gap-1 text-xs font-medium hover:underline transition-colors {sortBy === column.key ? 'font-semibold' : ''}" 
						style="color: {sortBy === column.key ? 'var(--text-primary)' : 'var(--text-secondary)'};"
					>
						{column.label}
						{#if sortBy === column.key}
							{#if sortOrder === 'asc'}
								<ArrowUp class="h-3 w-3" />
							{:else}
								<ArrowDown class="h-3 w-3" />
							{/if}
						{:else}
							<ArrowUpDown class="h-3 w-3 opacity-50" />
						{/if}
					</button>
				{:else}
					<span class="text-xs font-medium" style="color: var(--text-secondary);">
						{column.label}
					</span>
				{/if}
			</th>
		{/each}
	</tr>
{:else if variant === 'mobile'}
	<!-- Mobile Sort Controls -->
	<div class="flex items-center gap-3 {className}">
		<div class="flex-1">
			<select 
				value={sortBy}
				onchange={(e) => handleSort((e.target as HTMLSelectElement).value)}
				class="form-select w-full"
			>
				{#each sortableColumns as column}
					<option value={column.key}>{column.label}</option>
				{/each}
			</select>
		</div>
		<button
			onclick={toggleSortOrder}
			class="button-secondary button-small button-icon"
			title={sortOrder === 'asc' ? 'Sort Descending' : 'Sort Ascending'}
		>
			{#if sortOrder === 'asc'}
				<ArrowUp class="h-4 w-4" />
			{:else}
				<ArrowDown class="h-4 w-4" />
			{/if}
		</button>
	</div>
{:else if variant === 'mobile-select'}
	<!-- Simplified Mobile Select -->
	<select 
		value={`${sortBy}-${sortOrder}`}
		onchange={(e) => {
			const [field, order] = (e.target as HTMLSelectElement).value.split('-');
			// This will require the parent to handle both field and order
			onSort(field);
		}}
		class="form-select w-full {className}"
	>
		{#each sortableColumns as column}
			<option value="{column.key}-desc">{column.label} (Newest First)</option>
			<option value="{column.key}-asc">{column.label} (Oldest First)</option>
		{/each}
	</select>
{/if}

<style>
	button:hover .opacity-50 {
		opacity: 0.75;
	}
</style> 