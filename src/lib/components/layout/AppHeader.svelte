<script lang="ts">
	import NotificationPanel from '$lib/components/NotificationPanel.svelte';
	import Logo from '$lib/components/layout/Logo.svelte';
	import GlobalSearch from '$lib/components/GlobalSearch.svelte';
	
	let { 
		user, 
		class: className = "",
		hidden = false
	} = $props<{
		user: any;
		class?: string;
		hidden?: boolean;
	}>();
</script>

<!-- Professional App Header -->
<header class="app-header {className}" class:header-hidden={hidden}>
	<div class="app-header-container">
		<div class="app-header-content">
		<!-- Logo and branding -->
		<div class="app-header-brand">
			<Logo href="/calendar" size="xl" variant="bold" />
		</div>

			<!-- Right Side Actions -->
			<div class="header-actions">
				<!-- Global Search -->
				<GlobalSearch />
				
				<!-- Notifications -->
				<NotificationPanel tooltipPosition="bottom-left" />
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
		background: rgba(var(--bg-primary-rgb, 255, 255, 255), 0.7);
		border-bottom: 1.5px solid var(--border-primary);
		backdrop-filter: blur(20px) saturate(180%);
		-webkit-backdrop-filter: blur(20px) saturate(180%);
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
		z-index: 1;
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
		height: 4rem;
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
		position: relative;
		z-index: 20;
		pointer-events: auto;
	}
	
	/* Ensure all interactive elements in header actions are clickable */
	.header-actions > * {
		pointer-events: auto;
	}
	
	/* Hide header when scrolling down - mobile only */
	@media (max-width: 639px) {
		.app-header.header-hidden {
			transform: translateY(-100%);
			box-shadow: none;
		}
		
		/* Enhanced glassmorphism when re-appearing after scroll */
		.app-header {
			transition: transform 0.3s ease-out, background 0.3s ease-out;
		}
		
		.app-header:not(.header-hidden) {
			background: rgba(var(--bg-primary-rgb, 255, 255, 255), 0.7) !important;
			backdrop-filter: blur(20px) saturate(180%) !important;
			-webkit-backdrop-filter: blur(20px) saturate(180%) !important;
			box-shadow: 0 4px 30px rgba(0, 0, 0, 0.1) !important;
		}
	}
	
	/* Mobile optimizations */
	@media (max-width: 768px) {
		.app-header-content {
			height: 3.5rem; /* Smaller on mobile */
		}
		
		.header-actions {
			gap: 0.75rem;
		}
	}

	/* Responsive adjustments */
	@media (max-width: 480px) {
		.app-header-container {
			padding: 0 1rem;
		}
	}
</style> 