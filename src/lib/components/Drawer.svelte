<script lang="ts">
	import { fade, fly } from 'svelte/transition';
	import { clickOutside } from '$lib/utils/click-outside.js';
	import { onMount } from 'svelte';
	
	// Icons
	import X from 'lucide-svelte/icons/x';

	interface Props {
		isOpen: boolean;
		title?: string;
		subtitle?: string;
		onClose?: () => void;
		showCloseButton?: boolean;
		closeOnClickOutside?: boolean;
		closeOnEscape?: boolean;
		class?: string;
		children?: any;
	}

	let {
		isOpen = $bindable(false),
		title,
		subtitle,
		onClose,
		showCloseButton = true,
		closeOnClickOutside = true,
		closeOnEscape = true,
		class: className = '',
		children
	}: Props = $props();

	let drawerElement: HTMLDivElement;
	let isMobile = $state(false);
	
	// Touch/drag state for mobile swipe-down
	let isDragging = $state(false);
	let startY = $state(0);
	let currentY = $state(0);
	let dragThreshold = 100; // pixels to drag before closing

	// Check if mobile on mount and window resize
	onMount(() => {
		const checkMobile = () => {
			isMobile = window.innerWidth < 768;
		};
		
		checkMobile();
		window.addEventListener('resize', checkMobile);
		
		return () => window.removeEventListener('resize', checkMobile);
	});

	function handleClose() {
		isOpen = false;
		onClose?.();
	}

	function handleKeydown(event: KeyboardEvent) {
		if (closeOnEscape && event.key === 'Escape') {
			handleClose();
		}
	}

	function handleClickOutside() {
		if (closeOnClickOutside) {
			handleClose();
		}
	}

	// Mobile drag handlers
	function handleTouchStart(e: TouchEvent) {
		if (!isMobile) return;
		
		const touch = e.touches[0];
		startY = touch.clientY;
		currentY = touch.clientY;
		isDragging = true;
	}

	function handleTouchMove(e: TouchEvent) {
		if (!isMobile || !isDragging) return;
		
		const touch = e.touches[0];
		currentY = touch.clientY;
		
		// Only allow downward drag
		const deltaY = currentY - startY;
		if (deltaY > 0) {
			// Apply transform to drawer element
			if (drawerElement) {
				drawerElement.style.transform = `translateY(${deltaY}px)`;
			}
		}
	}

	function handleTouchEnd() {
		if (!isMobile || !isDragging) return;
		
		const deltaY = currentY - startY;
		
		// Reset transform
		if (drawerElement) {
			drawerElement.style.transform = '';
		}
		
		// Close if dragged down enough
		if (deltaY > dragThreshold) {
			handleClose();
		}
		
		isDragging = false;
		startY = 0;
		currentY = 0;
	}

	// Focus trap
	onMount(() => {
		if (isOpen && drawerElement) {
			const focusableElements = drawerElement.querySelectorAll(
				'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
			);
			const firstElement = focusableElements[0] as HTMLElement;
			const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement;

			// Delay focus to after transition
			setTimeout(() => firstElement?.focus(), 100);

			const handleTabKey = (e: KeyboardEvent) => {
				if (e.key !== 'Tab') return;

				if (e.shiftKey) {
					if (document.activeElement === firstElement) {
						e.preventDefault();
						lastElement?.focus();
					}
				} else {
					if (document.activeElement === lastElement) {
						e.preventDefault();
						firstElement?.focus();
					}
				}
			};

			drawerElement.addEventListener('keydown', handleTabKey);
			return () => drawerElement?.removeEventListener('keydown', handleTabKey);
		}
	});

	// Prevent body scroll when drawer is open
	$effect(() => {
		if (isOpen) {
			document.body.style.overflow = 'hidden';
			return () => {
				document.body.style.overflow = '';
			};
		}
	});
</script>

<svelte:window on:keydown={handleKeydown} />

{#if isOpen}
	<!-- Backdrop -->
	<div 
		class="fixed flex {isMobile ? 'items-end inset-x-0 top-0 bottom-[3.8rem]' : 'items-center justify-center p-4 inset-0'}"
		style="z-index: var(--z-modal); background: rgba(0, 0, 0, 0.5);"
		transition:fade={{ duration: 150 }}
	>
		<!-- Drawer/Modal -->
		<div 
			bind:this={drawerElement}
			class="relative w-full {isMobile ? 'max-h-[80vh]' : 'max-w-4xl max-h-[85vh] my-8'} flex flex-col {isMobile ? 'rounded-t-xl' : 'rounded-xl'} shadow-xl overflow-hidden {className}"
			style="background: var(--bg-primary); border: 1px solid var(--border-primary); {isMobile ? 'border-bottom: none;' : ''} transition: transform 0.2s ease-out;"
			transition:fly={{ y: isMobile ? 300 : 0, duration: 200 }}
			use:clickOutside={handleClickOutside}
			role="dialog"
			aria-modal="true"
			aria-labelledby={title ? 'drawer-title' : undefined}
			ontouchstart={handleTouchStart}
			ontouchmove={handleTouchMove}
			ontouchend={handleTouchEnd}
		>
			<!-- Mobile drag handle -->
			{#if isMobile}
				<div class="flex justify-center py-3 px-6" style="cursor: grab;">
					<div class="w-12 h-1 rounded-full" style="background: var(--border-primary);"></div>
				</div>
			{/if}
			
			<!-- Header -->
			{#if title || showCloseButton}
				<div class="flex-shrink-0 flex items-start justify-between px-6 py-4 border-b" style="border-color: var(--border-primary);">
					<div class="flex-1 min-w-0 pr-4">
						{#if title}
							<h2 id="drawer-title" class="text-lg sm:text-xl font-semibold leading-tight" style="color: var(--text-primary);">
								{title}
							</h2>
						{/if}
						{#if subtitle}
							<p class="text-sm mt-1 leading-relaxed" style="color: var(--text-secondary);">
								{subtitle}
							</p>
						{/if}
					</div>
					
					{#if showCloseButton}
						<button 
							onclick={handleClose}
							class="flex-shrink-0 p-2 -mt-1 -mr-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
							aria-label="Close"
						>
							<X class="h-5 w-5" style="color: var(--text-tertiary);" />
						</button>
					{/if}
				</div>
			{/if}
			
			<!-- Content -->
			<div class="flex-1 overflow-y-auto overscroll-contain">
				<div class="px-6 py-6">
					{@render children?.()}
				</div>
			</div>
		</div>
	</div>
{/if} 