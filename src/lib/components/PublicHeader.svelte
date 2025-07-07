<script lang="ts">
	import { page } from '$app/stores';
	import { tourOwnerStore } from '$lib/stores/tourOwner.js';
	import { auth } from '$lib/stores/auth.js';
	import ThemeToggle from '$lib/components/ThemeToggle.svelte';
	import ChevronLeft from 'lucide-svelte/icons/chevron-left';
	import Logo from '$lib/components/Logo.svelte';

	// Simple logo/brand
	const isAuthPage = $derived($page.route.id?.includes('/auth/'));
	const isBookingPage = $derived($page.route.id?.includes('/book/'));
	const isProfilePage = $derived($page.route.id?.includes('/[username]'));
	const isTicketPage = $derived($page.route.id?.includes('/ticket/'));
	
	// Check if user is authenticated
	const isAuthenticated = $derived($auth.isAuthenticated);
	
	// Get tour owner info if on profile/booking pages
	const tourOwner = $derived($tourOwnerStore);
	
	// Show back button on certain pages
	const showBackButton = $derived(isBookingPage || isTicketPage);
</script>

<!-- Professional Public Header -->
<header class="professional-header">
	<div class="professional-header-container">
		<div class="professional-header-content">
			<!-- Logo/Brand with contextual info -->
			<div class="professional-header-brand">
				{#if showBackButton && tourOwner}
					<button 
						onclick={() => history.back()} 
						class="back-button"
						aria-label="Go back"
					>
						<ChevronLeft class="w-5 h-5" />
					</button>
				{/if}
				
				<Logo variant="modern" href="/" size="large" />
				
				{#if tourOwner && (isProfilePage || isBookingPage)}
					<span class="tour-owner-context">
						• {tourOwner.name}
					</span>
				{/if}
			</div>

			<!-- Right Side Actions -->
			<div class="header-actions">
				<!-- Theme Toggle - Less prominent on public pages -->
				<div class="theme-toggle-wrapper">
					<ThemeToggle tooltipPosition="bottom" />
				</div>
				
				<!-- Navigation based on page type and auth status -->
				{#if isAuthPage}
					<!-- Auth page navigation -->
					<div class="auth-navigation">
						{#if $page.route.id?.includes('/login')}
							<span class="auth-prompt">Don't have an account?</span>
							<a href="/auth/register" class="auth-link">
								Sign up
							</a>
						{:else if $page.route.id?.includes('/register')}
							<span class="auth-prompt">Already have an account?</span>
							<a href="/auth/login" class="auth-link">
								Sign in
							</a>
						{:else}
							<a href="/auth/login" class="auth-link">
								Sign in
							</a>
						{/if}
					</div>
				{:else}
					<!-- Public pages - show dashboard if authenticated -->
					{#if isAuthenticated}
						<a href="/dashboard" class="dashboard-link">
							Dashboard
						</a>
					{/if}
				{/if}
			</div>
		</div>
	</div>
</header>

<style>
	/* Professional Header - matches marketing style */
	.professional-header {
		position: sticky;
		top: 0;
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
		max-width: 1536px;
		margin: 0 auto;
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
			padding: 0 3rem;
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
		gap: 0.75rem;
	}

	.back-button {
		display: flex;
		align-items: center;
		justify-content: center;
		padding: 0.5rem;
		border-radius: var(--radius-md);
		background: transparent;
		border: none;
		color: var(--text-secondary);
		cursor: pointer;
		transition: all var(--transition-base) ease;
	}

	.back-button:hover {
		background: var(--bg-secondary);
		color: var(--text-primary);
	}

	.tour-owner-context {
		font-size: 0.875rem;
		color: var(--text-tertiary);
		display: none;
	}

	@media (min-width: 640px) {
		.tour-owner-context {
			display: inline;
		}
	}

	/* Header Actions */
	.header-actions {
		display: flex;
		align-items: center;
		gap: 1rem;
	}

	.theme-toggle-wrapper {
		opacity: 0.6;
		transition: opacity var(--transition-base) ease;
	}

	.theme-toggle-wrapper:hover {
		opacity: 1;
	}

	/* Auth Navigation */
	.auth-navigation {
		display: flex;
		align-items: center;
		gap: 0.75rem;
	}

	.auth-prompt {
		font-size: 0.875rem;
		color: var(--text-secondary);
		display: none;
	}

	@media (min-width: 640px) {
		.auth-prompt {
			display: inline;
		}
	}

	.auth-link {
		font-size: 0.875rem;
		font-weight: 600;
		color: var(--color-coral-600);
		text-decoration: none;
		transition: color var(--transition-base) ease;
		position: relative;
	}

	.auth-link:hover {
		color: var(--color-coral-700);
	}

	/* Coral accent underline on hover - matches marketing header */
	.auth-link::after {
		content: '';
		position: absolute;
		bottom: -0.125rem;
		left: 0;
		width: 0;
		height: 0.125rem;
		background: var(--color-coral-500);
		transition: width var(--transition-base) ease;
	}

	.auth-link:hover::after {
		width: 100%;
	}

	.dashboard-link {
		font-size: 0.875rem;
		font-weight: 600;
		color: var(--color-coral-600);
		text-decoration: none;
		transition: color var(--transition-base) ease;
		position: relative;
	}

	.dashboard-link:hover {
		color: var(--color-coral-700);
	}

	/* Coral accent underline on hover - matches marketing header */
	.dashboard-link::after {
		content: '';
		position: absolute;
		bottom: -0.125rem;
		left: 0;
		width: 0;
		height: 0.125rem;
		background: var(--color-coral-500);
		transition: width var(--transition-base) ease;
	}

	.dashboard-link:hover::after {
		width: 100%;
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

		.professional-header-content {
			height: 4rem;
		}

		.header-actions {
			gap: 0.5rem;
		}
	}
</style> 