<script lang="ts">
	import ThemeToggle from '$lib/components/ThemeToggle.svelte';
	import Tooltip from '$lib/components/Tooltip.svelte';
	import NotificationPanel from '$lib/components/NotificationPanel.svelte';
	import Logo from '$lib/components/Logo.svelte';
	
	let { 
		user, 
		class: className = ""
	} = $props<{
		user: any;
		class?: string;
	}>();
</script>

<!-- Minimal App Header -->
<header class="{className}" style="background: var(--bg-primary); border-bottom: 1px solid var(--border-primary); height: 4rem;">
	<div class="flex items-center justify-between h-full px-4 lg:px-6">
		<!-- Left: Logo -->
		<div class="flex items-center gap-3 h-full">
			<Logo variant="minimal" />
		</div>

		<!-- Right: Actions -->
		<div class="flex items-center gap-3">
			<!-- Theme Toggle -->
			<ThemeToggle tooltipPosition="bottom" />

			<!-- Notifications -->
			<NotificationPanel tooltipPosition="bottom-left" />
		</div>
	</div>
</header> 