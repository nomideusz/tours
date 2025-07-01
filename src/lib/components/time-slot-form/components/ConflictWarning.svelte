<script lang="ts">
	import { fly } from 'svelte/transition';
	import { formatDate, formatTime } from '$lib/utils/date-helpers.js';
	import AlertTriangle from 'lucide-svelte/icons/alert-triangle';
	import type { TimeSlotConflict } from '../types.js';
	
	interface Props {
		conflicts: TimeSlotConflict[];
		justCreatedSlot?: boolean;
	}
	
	let { conflicts, justCreatedSlot = false }: Props = $props();
</script>

{#if conflicts.length > 0 && !justCreatedSlot}
	<div class="rounded-lg p-3 alert-warning mb-3" transition:fly={{ y: -5, duration: 150 }}>
		<div class="flex items-center gap-2">
			<AlertTriangle class="h-4 w-4 flex-shrink-0" />
			<div class="flex-1 min-w-0">
				<p class="text-sm font-medium" style="color: var(--color-warning-900);">
					{conflicts.length} conflict{conflicts.length > 1 ? 's' : ''} found - choose a different time
				</p>
				{#if conflicts.length === 1}
					<p class="text-xs mt-0.5" style="color: var(--color-warning-700);">
						{formatDate(conflicts[0].startTime)} at {formatTime(conflicts[0].startTime)} - {formatTime(conflicts[0].endTime)}
					</p>
				{:else if conflicts.length > 1}
					<p class="text-xs mt-0.5" style="color: var(--color-warning-700);">
						{conflicts.length} overlapping slots found
					</p>
				{/if}
			</div>
		</div>
	</div>
{/if} 