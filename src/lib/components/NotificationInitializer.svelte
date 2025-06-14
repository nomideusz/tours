<script lang="ts">
	import { useNotifications } from '$lib/hooks/useNotifications.js';
	
	// Initialize notifications - this runs inside QueryClientProvider context
	useNotifications();
</script>

<!-- This component has no template - it just initializes notifications --> 