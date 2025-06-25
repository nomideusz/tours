<script lang="ts">
	import { fade, scale } from 'svelte/transition';
	import { clickOutside } from '$lib/utils/click-outside.js';
	import { onMount } from 'svelte';
	
	// Icons
	import X from 'lucide-svelte/icons/x';

	interface Props {
		isOpen: boolean;
		title?: string;
		subtitle?: string;
		size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
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
		size = 'md',
		onClose,
		showCloseButton = true,
		closeOnClickOutside = true,
		closeOnEscape = true,
		class: className = '',
		children
	}: Props = $props();

	let modalElement: HTMLDivElement;

	const sizeClasses = {
		sm: 'max-w-md',
		md: 'max-w-2xl',
		lg: 'max-w-4xl',
		xl: 'max-w-6xl',
		full: 'max-w-[95vw]'
	};

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

	// Focus trap
	onMount(() => {
		if (isOpen && modalElement) {
			const focusableElements = modalElement.querySelectorAll(
				'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
			);
			const firstElement = focusableElements[0] as HTMLElement;
			const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement;

			firstElement?.focus();

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

			modalElement.addEventListener('keydown', handleTabKey);
			return () => modalElement?.removeEventListener('keydown', handleTabKey);
		}
	});

	// Prevent body scroll when modal is open
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
		class="fixed inset-0 flex items-center justify-center p-4 overflow-y-auto"
		style="z-index: var(--z-modal); background: var(--modal-backdrop, rgba(0, 0, 0, 0.5));"
		transition:fade={{ duration: 150 }}
	>
		<!-- Modal -->
		<div 
			bind:this={modalElement}
			class="relative w-full {sizeClasses[size]} my-8 rounded-xl shadow-xl {className}"
			style="background: var(--bg-primary); border: 1px solid var(--border-primary);"
			transition:scale={{ duration: 150, start: 0.95 }}
			use:clickOutside={handleClickOutside}
			role="dialog"
			aria-modal="true"
			aria-labelledby={title ? 'modal-title' : undefined}
		>
			<!-- Header -->
			{#if title || showCloseButton}
				<div class="flex items-start justify-between p-6 border-b" style="border-color: var(--border-primary);">
					<div>
						{#if title}
							<h2 id="modal-title" class="text-xl font-semibold" style="color: var(--text-primary);">
								{title}
							</h2>
						{/if}
						{#if subtitle}
							<p class="text-sm mt-1" style="color: var(--text-secondary);">
								{subtitle}
							</p>
						{/if}
					</div>
					
					{#if showCloseButton}
						<button 
							onclick={handleClose}
							class="modal-close-button flex-shrink-0 p-2 -mt-2 -mr-2 rounded-lg transition-colors"
							aria-label="Close modal"
						>
							<X class="h-5 w-5" style="color: var(--text-tertiary);" />
						</button>
					{/if}
				</div>
			{/if}
			
			<!-- Content -->
			<div class="overflow-y-auto max-h-[calc(100vh-16rem)]">
				{@render children?.()}
			</div>
		</div>
	</div>
{/if} 