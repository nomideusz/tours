<script lang="ts">
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	import { useQueryClient } from '@tanstack/svelte-query';
	import { queryKeys } from '$lib/queries/shared-stats.js';
	import AddSlotsDrawer from '$lib/components/AddSlotsDrawer.svelte';

	// Get date from query param
	// Format current date in local time to avoid timezone shift
	const today = new Date();
	const defaultDate = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
	const selectedDate = $page.url.searchParams.get('date') || defaultDate;

	const queryClient = useQueryClient();

	// Open drawer immediately on mount
	let showAddSlotsDrawer = $state(true);

	// Format date for display
	const displayDate = new Date(selectedDate).toLocaleDateString('en-US', { 
		weekday: 'long', 
		month: 'long', 
		day: 'numeric',
		year: 'numeric'
	});
</script>

<svelte:head>
	<title>Add Time Slots - {displayDate} - Zaur</title>
</svelte:head>

<!-- Add Slots Drawer (with tour selection) -->
<AddSlotsDrawer
	bind:isOpen={showAddSlotsDrawer}
	initialDate={selectedDate}
	onClose={() => goto('/calendar')}
	onSuccess={async () => {
		// Navigate back to calendar
		goto('/calendar');
	}}
/>
