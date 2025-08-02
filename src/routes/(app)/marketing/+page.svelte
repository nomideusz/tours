<script lang="ts">
	import { goto } from '$app/navigation';
	import { onMount } from 'svelte';
	
	// Redirect to business cards as the default marketing page
	onMount(() => {
		goto('/marketing/business-cards', { replaceState: true });
	});
</script>

<!-- Page redirects to /marketing/business-cards -->