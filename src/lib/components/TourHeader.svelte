<script lang="ts">
	import type { Tour } from '$lib/types.js';
	type Props = {
		tour: Tour;
		countInfo?: {
			icon: any;
			label: string;
			detail?: string;
		};
	};

	let { tour, countInfo }: Props = $props();
</script>

<!-- Tour Status & Name Indicator -->
<div class="mb-4 flex flex-wrap items-center gap-3">
	<div class="flex items-center gap-2">
		<h1 class="text-lg font-semibold" style="color: var(--text-primary);">{tour.name}</h1>
		<span class="tour-status-badge tour-status-badge--{tour.status}">
			<div class="tour-status-indicator tour-status-indicator--{tour.status}"></div>
			{tour.status === 'active' ? 'Live' : 'Draft'}
		</span>
	</div>
	
	{#if countInfo}
		<div class="flex items-center gap-1 text-sm" style="color: var(--text-secondary);">
			<countInfo.icon class="h-4 w-4" />
			<span>{countInfo.label}</span>
			{#if countInfo.detail}
				<span style="color: var(--text-tertiary);">•</span>
				<span>{countInfo.detail}</span>
			{/if}
		</div>
	{/if}
</div> 