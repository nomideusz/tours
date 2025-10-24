<script lang="ts">
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	import { useQueryClient } from '@tanstack/svelte-query';
	import { queryKeys } from '$lib/queries/shared-stats.js';
	import AddSlotsDrawer from '$lib/components/AddSlotsDrawer.svelte';

	// Get date from query param
	const selectedDate = $page.url.searchParams.get('date') || new Date().toISOString().split('T')[0];

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
