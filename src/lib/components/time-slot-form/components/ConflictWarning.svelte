<script lang="ts">
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
	<div class="rounded-xl p-4 alert-warning">
		<div class="flex items-start gap-3">
			<AlertTriangle class="h-5 w-5 flex-shrink-0 mt-0.5" />
			<div>
				<h3 class="font-semibold mb-1">
					{conflicts.length} Conflicting Slot{conflicts.length > 1 ? 's' : ''} Found
				</h3>
				<p class="text-sm">
					Some existing time slots overlap with your new schedule. These slots will be removed when you save.
				</p>
				<ul class="text-sm mt-2 space-y-1">
					{#each conflicts as conflict}
						<li>• {formatDate(conflict.startTime)} at {formatTime(conflict.startTime)} - {formatTime(conflict.endTime)}</li>
					{/each}
				</ul>
			</div>
		</div>
	</div>
{/if} 