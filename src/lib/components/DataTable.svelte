<script lang="ts">
	import { onMount } from 'svelte';
	import ChevronLeft from 'lucide-svelte/icons/chevron-left';
	import ChevronRight from 'lucide-svelte/icons/chevron-right';
	
	interface Column {
		key: string;
		label: string;
		sortable?: boolean;
		width?: string;
		align?: 'left' | 'center' | 'right';
		mobile?: boolean; // Show on mobile
	}
	
	interface Props {
		columns: Column[];
		data: Record<string, any>[];
		loading?: boolean;
		emptyMessage?: string;
		sortBy?: string;
		sortDirection?: 'asc' | 'desc';
		onSort?: (key: string) => void;
		children?: import('svelte').Snippet<[any, number]>;
	}
	
	let { 
		columns, 
		data, 
		loading = false, 
		emptyMessage = 'No data available',
		sortBy,
		sortDirection = 'asc',
		onSort,
		children 
	}: Props = $props();
	
	let tableContainer: HTMLElement;
	let canScrollLeft = $state(false);
	let canScrollRight = $state(false);
	
	function checkScrollPosition() {
		if (!tableContainer) return;
		
		const { scrollLeft, scrollWidth, clientWidth } = tableContainer;
		canScrollLeft = scrollLeft > 0;
		canScrollRight = scrollLeft < scrollWidth - clientWidth - 1;
	}
	
	function scrollTable(direction: 'left' | 'right') {
		if (!tableContainer) return;
		
		const scrollAmount = 200;
		const currentScroll = tableContainer.scrollLeft;
		const targetScroll = direction === 'left' 
			? currentScroll - scrollAmount 
			: currentScroll + scrollAmount;
			
		tableContainer.scrollTo({
			left: targetScroll,
			behavior: 'smooth'
		});
	}
	
	function handleSort(column: Column) {
		if (!column.sortable || !onSort) return;
		onSort(column.key);
	}
	
	onMount(() => {
		if (tableContainer) {
			checkScrollPosition();
			tableContainer.addEventListener('scroll', checkScrollPosition);
			
			// Check on resize
			const resizeObserver = new ResizeObserver(checkScrollPosition);
			resizeObserver.observe(tableContainer);
			
			return () => {
				tableContainer.removeEventListener('scroll', checkScrollPosition);
				resizeObserver.disconnect();
			};
		}
	});
	
	// Mobile-friendly columns (only show columns marked as mobile-friendly)
	let mobileColumns = $derived(columns.filter(col => col.mobile !== false));
</script>

<div class="bg-white rounded-xl border border-gray-200 overflow-hidden">
	<!-- Desktop Table -->
	<div class="hidden md:block">
		<div class="relative">
			<!-- Scroll indicators -->
			{#if canScrollLeft}
				<button
					onclick={() => scrollTable('left')}
					class="absolute left-0 top-0 bottom-0 z-10 bg-gradient-to-r from-white to-transparent px-4 flex items-center hover:from-gray-50"
				>
					<ChevronLeft class="h-5 w-5 text-gray-600" />
				</button>
			{/if}
			
			{#if canScrollRight}
				<button
					onclick={() => scrollTable('right')}
					class="absolute right-0 top-0 bottom-0 z-10 bg-gradient-to-l from-white to-transparent px-4 flex items-center hover:from-gray-50"
				>
					<ChevronRight class="h-5 w-5 text-gray-600" />
				</button>
			{/if}
			
			<div bind:this={tableContainer} class="overflow-x-auto">
				<table class="min-w-full divide-y divide-gray-200">
					<thead class="bg-gray-50">
						<tr>
							{#each columns as column}
								<th 
									scope="col" 
									class="px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider {
										column.align === 'center' ? 'text-center' :
										column.align === 'right' ? 'text-right' : 'text-left'
									} {column.sortable ? 'cursor-pointer hover:bg-gray-100' : ''}"
									style={column.width ? `width: ${column.width}` : ''}
									onclick={() => handleSort(column)}
								>
									<div class="flex items-center gap-1 {
										column.align === 'center' ? 'justify-center' :
										column.align === 'right' ? 'justify-end' : 'justify-start'
									}">
										{column.label}
										{#if column.sortable && sortBy === column.key}
											<span class="text-primary-600">
												{sortDirection === 'asc' ? '↑' : '↓'}
											</span>
										{/if}
									</div>
								</th>
							{/each}
						</tr>
					</thead>
					<tbody class="bg-white divide-y divide-gray-200">
						{#if loading}
							<tr>
								<td colspan={columns.length} class="px-6 py-8 text-center text-gray-500">
									<div class="flex items-center justify-center">
										<div class="w-5 h-5 border-2 border-gray-200 border-t-gray-600 rounded-full animate-spin mr-2"></div>
										Loading...
									</div>
								</td>
							</tr>
						{:else if data.length === 0}
							<tr>
								<td colspan={columns.length} class="px-6 py-8 text-center text-gray-500">
									{emptyMessage}
								</td>
							</tr>
						{:else}
							{#each data as row, index}
								<tr class="hover:bg-gray-50">
									{#if children}
										{@render children(row, index)}
									{:else}
										{#each columns as column}
											<td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900 {
												column.align === 'center' ? 'text-center' :
												column.align === 'right' ? 'text-right' : ''
											}">
												{row[column.key] || '-'}
											</td>
										{/each}
									{/if}
								</tr>
							{/each}
						{/if}
					</tbody>
				</table>
			</div>
		</div>
	</div>
	
	<!-- Mobile Cards -->
	<div class="md:hidden divide-y divide-gray-200">
		{#if loading}
			<div class="p-6 text-center text-gray-500">
				<div class="flex items-center justify-center">
					<div class="w-5 h-5 border-2 border-gray-200 border-t-gray-600 rounded-full animate-spin mr-2"></div>
					Loading...
				</div>
			</div>
		{:else if data.length === 0}
			<div class="p-6 text-center text-gray-500">
				{emptyMessage}
			</div>
		{:else}
			{#each data as row, index}
				<div class="p-4 space-y-2">
					{#if children}
						{@render children(row, index)}
					{:else}
						{#each mobileColumns as column}
							<div class="flex justify-between">
								<span class="text-sm font-medium text-gray-600">{column.label}:</span>
								<span class="text-sm text-gray-900">{row[column.key] || '-'}</span>
							</div>
						{/each}
					{/if}
				</div>
			{/each}
		{/if}
	</div>
</div>

<style lang="postcss">
	@reference "tailwindcss";
</style> 