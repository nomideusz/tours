<script lang="ts">
	import { onMount } from 'svelte';
	import X from 'lucide-svelte/icons/x';
	import Share from 'lucide-svelte/icons/share';
	import Plus from 'lucide-svelte/icons/plus';
	
	interface Props {
		navHidden?: boolean;
	}
	
	let { navHidden = false }: Props = $props();
	
	let showIOSPrompt = $state(false);
	let showAndroidPrompt = $state(false);
	let deferredPrompt: any = null;
	
	onMount(() => {
		// Check if already installed
		const isInstalled = window.matchMedia('(display-mode: standalone)').matches 
			|| (window.navigator as any).standalone 
			|| document.referrer.includes('android-app://');
			
		if (isInstalled) return;
		
		// Check if user already dismissed
		const dismissed = localStorage.getItem('pwa-prompt-dismissed');
		if (dismissed === 'true') return;
		
		// Detect iOS
		const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
		const isInSafari = isIOS && /Safari/.test(navigator.userAgent) && !/CriOS/.test(navigator.userAgent);
		
		if (isIOS && isInSafari) {
			// Show iOS instructions after a delay
			setTimeout(() => {
				showIOSPrompt = true;
			}, 3000);
		}
		
		// Handle Android/Chrome install prompt
		window.addEventListener('beforeinstallprompt', (e) => {
			e.preventDefault();
			deferredPrompt = e;
			// Show custom install button after a delay
			setTimeout(() => {
				showAndroidPrompt = true;
			}, 3000);
		});
	});
	
	function dismissPrompt() {
		showIOSPrompt = false;
		showAndroidPrompt = false;
		localStorage.setItem('pwa-prompt-dismissed', 'true');
	}
	
	async function installAndroid() {
		if (!deferredPrompt) return;
		
		deferredPrompt.prompt();
		const { outcome } = await deferredPrompt.userChoice;
		
		if (outcome === 'accepted') {
			console.log('User accepted the install prompt');
		}
		
		deferredPrompt = null;
		showAndroidPrompt = false;
	}
</script>

{#if showIOSPrompt}
	<div class="pwa-prompt fixed left-4 right-4 z-50 animate-slide-up sm:left-auto sm:right-6 sm:max-w-sm transition-all duration-300 lg:bottom-4" class:nav-hidden={navHidden} style="bottom: calc(4.5rem + env(safe-area-inset-bottom, 0))">
		<div class="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-4">
			<div class="flex items-start justify-between mb-3">
				<h3 class="font-semibold text-gray-900 dark:text-white">
					Install Zaur App
				</h3>
				<button
					onclick={dismissPrompt}
					class="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 -mt-1 -mr-1 p-1"
					aria-label="Dismiss"
				>
					<X class="w-4 h-4" />
				</button>
			</div>
			
			<p class="text-sm text-gray-600 dark:text-gray-400 mb-4">
				Install Zaur on your iPhone for quick access to your tours and bookings.
			</p>
			
			<div class="space-y-3 text-sm">
				<div class="flex items-center gap-3">
					<div class="flex-shrink-0 w-8 h-8 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center">
						<Share class="w-4 h-4 text-blue-600 dark:text-blue-400" />
					</div>
					<span class="text-gray-700 dark:text-gray-300">
						Tap the share button in Safari
					</span>
				</div>
				
				<div class="flex items-center gap-3">
					<div class="flex-shrink-0 w-8 h-8 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center">
						<Plus class="w-4 h-4 text-blue-600 dark:text-blue-400" />
					</div>
					<span class="text-gray-700 dark:text-gray-300">
						Select "Add to Home Screen"
					</span>
				</div>
			</div>
		</div>
	</div>
{/if}

{#if showAndroidPrompt}
	<div class="pwa-prompt fixed left-4 right-4 z-50 animate-slide-up sm:left-auto sm:right-6 sm:max-w-sm transition-all duration-300 lg:bottom-4" class:nav-hidden={navHidden} style="bottom: calc(4.5rem + env(safe-area-inset-bottom, 0))">
		<div class="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-4">
			<div class="flex items-start justify-between mb-3">
				<h3 class="font-semibold text-gray-900 dark:text-white">
					Install Zaur App
				</h3>
				<button
					onclick={dismissPrompt}
					class="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 -mt-1 -mr-1 p-1"
					aria-label="Dismiss"
				>
					<X class="w-4 h-4" />
				</button>
			</div>
			
			<p class="text-sm text-gray-600 dark:text-gray-400 mb-4">
				Install Zaur for offline access and a native app experience.
			</p>
			
			<div class="flex gap-2">
				<button
					onclick={installAndroid}
					class="button-primary button-small flex-1"
				>
					Install App
				</button>
				<button
					onclick={dismissPrompt}
					class="button-secondary button-small"
				>
					Not Now
				</button>
			</div>
		</div>
	</div>
{/if}

<style>
	@keyframes slide-up {
		from {
			transform: translateY(100%);
			opacity: 0;
		}
		to {
			transform: translateY(0);
			opacity: 1;
		}
	}
	
	.animate-slide-up {
		animation: slide-up 0.3s ease-out;
	}
	
	/* When nav is hidden, move to bottom */
	.pwa-prompt.nav-hidden {
		bottom: 1rem !important;
	}
</style> 