<script lang="ts">
	import { formatDate, formatTime } from '$lib/utils/date-helpers.js';
	import AlertCircle from 'lucide-svelte/icons/alert-circle';
	import type { TimeSlotConflict } from '../types.js';
	
	interface Props {
		conflicts: TimeSlotConflict[];
		justCreatedSlot?: boolean;
	}
	
	let { conflicts, justCreatedSlot = false }: Props = $props();
</script>

{#if conflicts.length > 0 && !justCreatedSlot}
	<div class="rounded-xl p-4" style="background: var(--color-warning-50); border: 1px solid var(--color-warning-200);">
		<div class="flex gap-3">
			<AlertCircle class="h-5 w-5 flex-shrink-0 mt-0.5" style="color: var(--color-warning-600);" />
			<div>
				<p class="font-medium" style="color: var(--color-warning-900);">Time Conflict Detected</p>
				<p class="text-sm mt-1" style="color: var(--color-warning-700);">
					This time slot overlaps with {conflicts.length} existing slot{conflicts.length === 1 ? '' : 's'}:
				</p>
				<ul class="text-sm mt-2 space-y-1" style="color: var(--color-warning-700);">
					{#each conflicts as conflict}
						<li>• {formatDate(conflict.startTime)} at {formatTime(conflict.startTime)} - {formatTime(conflict.endTime)}</li>
					{/each}
				</ul>
			</div>
		</div>
	</div>
{/if} 