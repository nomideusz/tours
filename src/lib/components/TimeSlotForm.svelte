<script lang="ts">
	import TimeSlotForm from './time-slot-form/TimeSlotForm.svelte';
	import type { TimeSlotFormProps } from './time-slot-form/types.js';
	
	// Re-export the props
	let props: TimeSlotFormProps = $props();
</script>

<TimeSlotForm {...props} />