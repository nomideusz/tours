<script lang="ts">
	import { language, t } from '$lib/i18n.js';
	import { languageContext, languageStore } from '$lib/context.js';
	import { auth } from '$lib/stores/auth.js';
	import PublicHeader from '$lib/components/PublicHeader.svelte';
	import PublicFooter from '$lib/components/PublicFooter.svelte';
	import { QueryClientProvider } from '@tanstack/svelte-query';
	import { themeStore } from '$lib/stores/theme.js';
	import { onMount } from 'svelte';
	import { browser } from '$app/environment';

	let { children, data } = $props<{ data?: any }>();

	// Set language context from the store
	languageContext.set(languageStore);

	// Initialize auth store with server data (may be null for public routes)
	$effect(() => {
		if (data) {
			auth.initialize(data);
		}
	});
	
	// Mobile detection
	let isMobileDevice = false;
	$effect(() => {
		if (browser) {
			isMobileDevice = window.innerWidth <= 639;
		}
	});
	
	// Auto-hide navigation on scroll
	let navHidden = $state(false);
	let lastScrollY = 0;
	let scrollTimeout: ReturnType<typeof setTimeout> | null = null;
	
	function handleScroll() {
		if (!browser || !isMobileDevice) return;
		
		const currentScrollY = window.pageYOffset || document.documentElement.scrollTop || document.body.scrollTop || 0;
		const scrollDelta = currentScrollY - lastScrollY;
		
		if (Math.abs(scrollDelta) < 5) return;
		
		if (currentScrollY > lastScrollY) {
			// Scrolling down
			navHidden = true;
		} else if (currentScrollY < lastScrollY) {
			// Scrolling up
			navHidden = false;
		}
		
		lastScrollY = currentScrollY;
		
		if (scrollTimeout) clearTimeout(scrollTimeout);
		scrollTimeout = setTimeout(() => {
			navHidden = false;
		}, 1500);
	}
	
	// Touch handlers for mobile
	let touchStartY = 0;
	let lastTouchY = 0;
	let touchAccumulator = 0;
	
	function handleTouchStart(event: TouchEvent) {
		if (!isMobileDevice) return;
		touchStartY = event.touches[0].clientY;
		lastTouchY = touchStartY;
		touchAccumulator = 0;
	}
	
	function handleTouchMove(event: TouchEvent) {
		if (!isMobileDevice) return;
		
		const currentTouchY = event.touches[0].clientY;
		const touchDelta = lastTouchY - currentTouchY;
		
		touchAccumulator += touchDelta;
		
		if (Math.abs(touchAccumulator) > 20) {
			if (touchAccumulator > 0) {
				// Scrolling down
				navHidden = true;
			} else if (touchAccumulator < 0) {
				// Scrolling up
				navHidden = false;
			}
			
			touchAccumulator = 0;
			
			if (scrollTimeout) clearTimeout(scrollTimeout);
			scrollTimeout = setTimeout(() => {
				navHidden = false;
			}, 1500);
		}
		
		lastTouchY = currentTouchY;
	}
	
	// Initialize theme and scroll listeners
	onMount(() => {
		const cleanup = themeStore.init();
		
		// Add scroll listeners for mobile
		if (browser && isMobileDevice) {
			document.addEventListener('touchstart', handleTouchStart, { passive: true });
			document.addEventListener('touchmove', handleTouchMove, { passive: true });
			window.addEventListener('scroll', handleScroll, { passive: true });
		}
		
		// Handle resize
		const handleResize = () => {
			isMobileDevice = window.innerWidth <= 639;
		};
		window.addEventListener('resize', handleResize);
		
		return () => {
			if (cleanup) cleanup();
			if (browser) {
				document.removeEventListener('touchstart', handleTouchStart);
				document.removeEventListener('touchmove', handleTouchMove);
				window.removeEventListener('scroll', handleScroll);
				window.removeEventListener('resize', handleResize);
			}
			if (scrollTimeout) clearTimeout(scrollTimeout);
		};
	});
</script>

<!-- TanStack Query Provider for Public -->
<QueryClientProvider client={data.queryClient}>
	<!-- Public Layout: Minimal header + main + footer -->
	<div class="min-h-screen flex flex-col subtle-retro-section">
		<PublicHeader hidden={navHidden} />
		
		<main class="flex-1 pt-14 sm:pt-20 relative z-10">
			{@render children()}
		</main>
		
		<PublicFooter />
	</div>
</QueryClientProvider>

<style lang="postcss">
	/* Ensure consistent background and text colors */
	:global(body) {
		background-color: var(--bg-primary);
		color: var(--text-primary);
	}
</style> 