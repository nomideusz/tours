<script lang="ts">
	import { formatDate } from '$lib/utils/date-helpers.js';
	import CheckCircle from 'lucide-svelte/icons/check-circle';
	import Plus from 'lucide-svelte/icons/plus';
	import { fade } from 'svelte/transition';
	
	interface Props {
		lastCreatedDate: string;
		onAddAnother: () => void;
		onDone: () => void;
		slotsCreated: number;
	}
	
	let { lastCreatedDate, onAddAnother, onDone, slotsCreated }: Props = $props();
</script>

{#if slotsCreated > 0}
	<div 
		transition:fade={{ duration: 300 }}
		class="mt-4 rounded-xl p-4 alert-success"
	>
		<div class="flex gap-3">
			<CheckCircle class="h-5 w-5 flex-shrink-0 mt-0.5" />
			<div>
				<p class="font-medium">
					{slotsCreated} time slot{slotsCreated > 1 ? 's' : ''} created successfully!
				</p>
				<p class="text-sm mt-1">
					Your tour schedule has been updated.
				</p>
			</div>
		</div>
	</div>
{/if}

<div class="mt-4 rounded-xl p-4 alert-success">
	<div class="flex gap-3">
		<CheckCircle class="h-5 w-5 flex-shrink-0 mt-0.5" />
		<div class="flex-1">
			<p class="font-medium">Time slot created successfully!</p>
			<p class="text-sm mt-1">
				Slot for {formatDate(lastCreatedDate)} has been added to your schedule.
			</p>
			<div class="flex gap-3 mt-3">
				<button
					onclick={onAddAnother}
					class="button-primary button--small button--gap"
				>
					<Plus class="h-4 w-4" />
					Add Another Slot
				</button>
				<button
					onclick={onDone}
					class="button-secondary button--small"
				>
					Done
				</button>
			</div>
		</div>
	</div>
</div> 