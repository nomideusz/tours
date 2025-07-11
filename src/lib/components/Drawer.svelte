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

	let drawerElement = $state.raw<HTMLDivElement>();
	let isMobile = $state(false);
	
	// Touch/drag state for mobile swipe-down
	let isDragging = $state(false);
	let startY = $state(0);
	let currentY = $state(0);
	let dragThreshold = 100; // pixels to drag before closing
	let dragStartedFromHandle = $state(false);
	let minDragDistance = 20; // minimum pixels to move before starting drag visual feedback

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

	// Mobile drag handlers - only for drag handle
	// Fix: Only handle drag-to-close from the drag handle to prevent conflicts with scrolling in content
	function handleDragHandleTouchStart(e: TouchEvent) {
		if (!isMobile) return;
		
		const touch = e.touches[0];
		startY = touch.clientY;
		currentY = touch.clientY;
		isDragging = true;
		dragStartedFromHandle = true;
		
		// Prevent default to avoid interference with scrolling
		e.preventDefault();
	}

	function handleTouchMove(e: TouchEvent) {
		if (!isMobile || !isDragging || !dragStartedFromHandle) return;
		
		const touch = e.touches[0];
		currentY = touch.clientY;
		
		// Only allow downward drag
		const deltaY = currentY - startY;
		if (deltaY > minDragDistance) {
			// Apply transform to drawer element only after minimum drag distance
			if (drawerElement) {
				drawerElement.style.transform = `translateY(${deltaY}px)`;
			}
			// Prevent default to avoid scrolling
			e.preventDefault();
		}
	}

	function handleTouchEnd() {
		if (!isMobile || !isDragging || !dragStartedFromHandle) return;
		
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
		dragStartedFromHandle = false;
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

<style>
	/* Mobile drawer animations */
	.mobile-drawer-backdrop {
		animation: fadeIn 0.2s ease-out;
	}
	
	.mobile-drawer-panel {
		animation: slideUp 0.2s ease-out;
	}
	
	@keyframes fadeIn {
		from { opacity: 0; }
		to { opacity: 1; }
	}
	
	@keyframes slideUp {
		from { transform: translateY(100%); }
		to { transform: translateY(0); }
	}
</style>

<svelte:window on:keydown={handleKeydown} on:touchmove={handleTouchMove} on:touchend={handleTouchEnd} />

{#if isOpen}
	{#if isMobile}
		<!-- Mobile: Full-screen overlay with bottom drawer (like mobile menu) -->
		<div 
			class="lg:hidden fixed inset-0 mobile-drawer-backdrop" 
			style="z-index: 60; background: rgba(0, 0, 0, 0.5);"
			onclick={handleClickOutside}
			onkeydown={(e) => (e.key === 'Enter' || e.key === ' ') && handleClickOutside()}
			role="button"
			tabindex="-1"
			aria-label="Close drawer"
		>
					<div 
			bind:this={drawerElement}
			class="fixed bottom-0 left-0 right-0 mobile-drawer-panel {className}"
			onclick={(e) => e.stopPropagation()}
			onkeydown={(e) => e.stopPropagation()}
			role="dialog"
			aria-modal="true"
			aria-labelledby={title ? 'drawer-title' : undefined}
			tabindex="-1"
			style="z-index: 60; max-height: 90vh; padding-bottom: env(safe-area-inset-bottom, 0);"
		>
				<div class="rounded-t-xl shadow-lg overflow-hidden" style="background: var(--bg-primary); border-top: 1px solid var(--border-primary); max-height: 90vh; display: flex; flex-direction: column;">
					<!-- Mobile drag handle -->
					<div 
						class="flex justify-center py-3 px-6 flex-shrink-0" 
						style="cursor: grab; touch-action: none;"
						ontouchstart={handleDragHandleTouchStart}
						ontouchmove={handleTouchMove}
						ontouchend={handleTouchEnd}
						onkeydown={(e) => e.key === 'Escape' && handleClose()}
						role="button"
						tabindex="0"
						aria-label="Drag to close drawer"
					>
						<div class="w-12 h-1.5 rounded-full transition-colors" style="background: var(--text-tertiary);"></div>
					</div>
					
					<!-- Header -->
					{#if title || showCloseButton}
						<div class="flex-shrink-0 flex items-start justify-between px-6 py-4 border-b" style="border-color: var(--border-primary);">
							<div class="flex-1 min-w-0 pr-4">
								{#if title}
									<h2 id="drawer-title" class="text-lg font-semibold leading-tight" style="color: var(--text-primary);">
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
									class="flex-shrink-0 p-2 -mt-1 -mr-1 rounded-lg transition-colors"
									style="color: var(--text-tertiary);"
									onmouseenter={(e) => e.currentTarget.style.backgroundColor = 'var(--bg-tertiary)'}
									onmouseleave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
									aria-label="Close"
								>
									<X class="h-5 w-5" />
								</button>
							{/if}
						</div>
					{/if}
					
					<!-- Content -->
					<div class="flex-1 overflow-y-auto overscroll-contain min-h-0" style="touch-action: pan-y;">
						<div class="px-6 py-6">
							{@render children?.()}
						</div>
					</div>
				</div>
			</div>
		</div>
	{:else}
		<!-- Desktop: Centered modal -->
		<div 
			class="fixed flex items-center justify-center p-4 inset-0"
			style="z-index: var(--z-modal); background: rgba(0, 0, 0, 0.5);"
			transition:fade={{ duration: 150 }}
		>
			<div 
				bind:this={drawerElement}
				class="relative w-full max-w-6xl max-h-[92vh] my-4 flex flex-col rounded-xl shadow-xl overflow-hidden {className}"
				style="background: var(--bg-primary); border: 1px solid var(--border-primary); transition: transform 0.2s ease-out;"
				transition:fly={{ y: 0, duration: 200 }}
				use:clickOutside={handleClickOutside}
				role="dialog"
				aria-modal="true"
				aria-labelledby={title ? 'drawer-title' : undefined}
				tabindex="-1"
			>
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
								class="flex-shrink-0 p-2 -mt-1 -mr-1 rounded-lg transition-colors"
								style="color: var(--text-tertiary);"
								onmouseenter={(e) => e.currentTarget.style.backgroundColor = 'var(--bg-tertiary)'}
								onmouseleave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
								aria-label="Close"
							>
								<X class="h-5 w-5" />
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
{/if} 