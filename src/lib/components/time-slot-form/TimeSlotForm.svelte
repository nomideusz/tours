<script lang="ts">
	import SimpleTimeSlotForm from './SimpleTimeSlotForm.svelte';
	import EditTimeSlotForm from './EditTimeSlotForm.svelte';
	import type { TimeSlotFormProps } from './types.js';

	let {
		tourId,
		slotId,
		mode = 'page',
		onSuccess,
		onCancel,
		onSubmissionStart,
		onSubmissionEnd,
		class: className = '',
		tour: propTour,
		preselectedDate
	}: TimeSlotFormProps = $props();

	// Check if we're editing
	let isEditMode = $derived(!!slotId);
</script>
						
						{#if isEditMode}
	<EditTimeSlotForm
		{tourId}
		slotId={slotId!}
		{mode}
		{onSuccess}
		{onCancel}
		{onSubmissionStart}
		{onSubmissionEnd}
		class={className}
		tour={propTour}
	/>
														{:else}
	<SimpleTimeSlotForm
		{tourId}
		{onSuccess}
		{onCancel}
		tour={propTour}
	/>
							{/if}