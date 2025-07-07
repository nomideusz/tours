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
<header class="relative z-[100] {className}" style="background: var(--bg-primary); border-bottom: 1px solid var(--border-primary); height: 4rem;">
	<div class="flex items-center justify-between h-full px-2">
		<!-- Left: Logo -->
		<div class="flex items-center gap-3 h-full pl-2">
			<Logo variant="modern" class="px-0" />
		</div>

		<!-- Right: Actions -->
		<div class="flex items-center gap-3 pr-1 sm:pr-2">
			<!-- Notifications -->
			<NotificationPanel tooltipPosition="bottom-left" />

			<!-- Theme Toggle -->
			<ThemeToggle tooltipPosition="bottom" />
		</div>
	</div>
</header> 