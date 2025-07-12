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
<header class="professional-header {className}">
	<div class="professional-header-container">
		<div class="professional-header-content">
			<!-- Logo and branding -->
			<div class="professional-header-brand">
				<Logo showIcon={true} showIconBackground={false} href="/dashboard" size="xl" textSize="large" iconSrc="/favicon-32x32.png" />
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
	/* Professional Header - matches marketing style */
	.professional-header {
		position: fixed;
		top: 0;
		left: 0;
		right: 0;
		z-index: 100;
		background: color-mix(in srgb, var(--bg-primary) 95%, transparent);
		border-bottom: 1px solid var(--border-primary);
		backdrop-filter: blur(12px);
		-webkit-backdrop-filter: blur(12px);
		box-shadow: var(--shadow-sm);
		transition: all var(--transition-base) ease;
	}

	/* Very subtle texture overlay - matches marketing header */
	.professional-header::before {
		content: '';
		position: absolute;
		top: 0;
		left: 0;
		right: 0;
		bottom: 0;
		background-image: repeating-linear-gradient(
			0deg,
			transparent,
			transparent 40px,
			rgba(0, 0, 0, 0.01) 40px,
			rgba(0, 0, 0, 0.01) 41px
		);
		pointer-events: none;
	}

	.professional-header-container {
		width: 100%;
		padding: 0 1.5rem;
		position: relative;
		z-index: 2;
	}

	@media (min-width: 640px) {
		.professional-header-container {
			padding: 0 2rem;
		}
	}

	@media (min-width: 1024px) {
		.professional-header-container {
			padding: 0 2rem;
		}
	}

	.professional-header-content {
		display: flex;
		height: 5rem;
		align-items: center;
		justify-content: space-between;
	}

	/* Brand */
	.professional-header-brand {
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
	[data-theme="dark"] .professional-header::before {
		background-image: repeating-linear-gradient(
			0deg,
			transparent,
			transparent 40px,
			rgba(255, 255, 255, 0.02) 40px,
			rgba(255, 255, 255, 0.02) 41px
		);
	}

	/* Responsive adjustments */
	@media (max-width: 480px) {
		.professional-header-container {
			padding: 0 1rem;
		}
	}
</style> 