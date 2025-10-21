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

<!-- Professional App Header -->
<header class="app-header {className}">
	<div class="app-header-container">
		<div class="app-header-content">
		<!-- Logo and branding -->
		<div class="app-header-brand">
			<Logo href="/calendar" size="xl" variant="bold" />
		</div>

			<!-- Right Side Actions -->
			<div class="header-actions">
			<!-- Notifications -->
			<NotificationPanel tooltipPosition="bottom-left" />

			<!-- Theme Toggle -->
			<ThemeToggle tooltipPosition="bottom" />
			</div>
		</div>
	</div>
</header> 

<style>
	/* App Header - refined and professional */
	.app-header {
		position: fixed;
		top: 0;
		left: 0;
		right: 0;
		z-index: var(--z-70);
		background: color-mix(in srgb, var(--bg-primary) 98%, transparent);
		border-bottom: 1.5px solid var(--border-primary);
		backdrop-filter: blur(16px) saturate(180%);
		-webkit-backdrop-filter: blur(16px) saturate(180%);
		box-shadow: var(--shadow-md);
		transition: all var(--transition-base);
	}

	/* Subtle refined overlay */
	.app-header::before {
		content: '';
		position: absolute;
		top: 0;
		left: 0;
		right: 0;
		bottom: 0;
		background: linear-gradient(
			to bottom,
			transparent 0%,
			rgba(0, 0, 0, 0.01) 100%
		);
		pointer-events: none;
	}

	.app-header-container {
		width: 100%;
		padding: 0 1.5rem;
		position: relative;
		z-index: 2;
	}

	@media (min-width: 640px) {
		.app-header-container {
			padding: 0 2rem;
		}
	}

	@media (min-width: 1024px) {
		.app-header-container {
			padding: 0 2rem;
		}
	}

	.app-header-content {
		display: flex;
		height: 5rem;
		align-items: center;
		justify-content: space-between;
	}

	/* Brand */
	.app-header-brand {
		display: flex;
		align-items: center;
		height: 100%;
	}

	/* Header Actions */
	.header-actions {
		display: flex;
		align-items: center;
		gap: 1rem;
	}

	/* Dark Mode Support */
	[data-theme="dark"] .app-header::before {
		background: linear-gradient(
			to bottom,
			transparent 0%,
			rgba(255, 255, 255, 0.01) 100%
		);
	}

	/* Responsive adjustments */
	@media (max-width: 480px) {
		.app-header-container {
			padding: 0 1rem;
		}
	}
</style> 