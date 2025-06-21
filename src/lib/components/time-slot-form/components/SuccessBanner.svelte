<script lang="ts">
	import { formatDate } from '$lib/utils/date-helpers.js';
	import CheckCircle from 'lucide-svelte/icons/check-circle';
	import Plus from 'lucide-svelte/icons/plus';
	
	interface Props {
		lastCreatedDate: string;
		onAddAnother: () => void;
		onDone: () => void;
	}
	
	let { lastCreatedDate, onAddAnother, onDone }: Props = $props();
</script>

<div class="mt-4 rounded-xl p-4" style="background: var(--color-success-50); border: 1px solid var(--color-success-200);">
	<div class="flex gap-3">
		<CheckCircle class="h-5 w-5 flex-shrink-0 mt-0.5" style="color: var(--color-success-600);" />
		<div class="flex-1">
			<p class="font-medium" style="color: var(--color-success-900);">Time slot created successfully!</p>
			<p class="text-sm mt-1" style="color: var(--color-success-700);">
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