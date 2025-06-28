<script lang="ts">
	import { onDestroy } from 'svelte';
	import { browser } from '$app/environment';
	import { useNotifications } from '$lib/hooks/useNotifications.js';
	
	// Singleton tracking
	let notificationInstance: ReturnType<typeof useNotifications> | null = null;
	
	// Track if this component instance has initialized
	let hasInitialized = false;
	
	if (browser && !hasInitialized) {
		// Mark as initialized immediately to prevent race conditions
		hasInitialized = true;
		
		// Initialize notifications - this runs inside QueryClientProvider context
		notificationInstance = useNotifications();
		
		console.log('🔌 NotificationInitializer: Created notification instance');
	}
	
	// Clean up on destroy
	onDestroy(() => {
		if (notificationInstance) {
			console.log('🔌 NotificationInitializer: Cleaning up notification instance');
			notificationInstance.disconnect();
			notificationInstance = null;
		}
		hasInitialized = false;
	});
</script>

<!-- This component has no template - it just initializes notifications --> 