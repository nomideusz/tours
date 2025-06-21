<script lang="ts">
	import { fade, scale } from 'svelte/transition';
	import { clickOutside } from '$lib/utils/click-outside.js';
	
	// Icons
	import AlertTriangle from 'lucide-svelte/icons/alert-triangle';
	import X from 'lucide-svelte/icons/x';

	export let isOpen = false;
	export let title = 'Are you sure?';
	export let message = 'This action cannot be undone.';
	export let confirmText = 'Confirm';
	export let cancelText = 'Cancel';
	export let variant: 'danger' | 'warning' | 'info' = 'warning';
	export let icon = AlertTriangle;
	export let onConfirm: (() => void) | undefined = undefined;
	export let onCancel: (() => void) | undefined = undefined;
	export let onClose: (() => void) | undefined = undefined;

	function handleConfirm() {
		onConfirm?.();
		isOpen = false;
	}

	function handleCancel() {
		onCancel?.();
		isOpen = false;
	}

	function handleClose() {
		onClose?.();
		isOpen = false;
	}

	function handleKeydown(event: KeyboardEvent) {
		if (event.key === 'Escape') {
			handleClose();
		}
	}

	$: variantStyles = {
		danger: {
			iconColor: 'text-red-600',
			iconBg: 'bg-red-100',
			confirmButton: 'button--danger'
		},
		warning: {
			iconColor: 'text-amber-600',
			iconBg: 'bg-amber-100',
			confirmButton: 'button-primary'
		},
		info: {
			iconColor: 'text-blue-600',
			iconBg: 'bg-blue-100',
			confirmButton: 'button-primary'
		}
	}[variant];
</script>

<svelte:window on:keydown={handleKeydown} />

{#if isOpen}
	<!-- Backdrop -->
	<div 
		class="fixed inset-0 flex items-center justify-center p-4"
		style="z-index: var(--z-modal); background: rgba(0, 0, 0, 0.5);"
		transition:fade={{ duration: 150 }}
	>
		<!-- Modal -->
		<div 
			class="relative w-full max-w-md rounded-xl shadow-lg"
			style="background: var(--bg-primary); border: 1px solid var(--border-primary);"
			transition:scale={{ duration: 150, start: 0.95 }}
			use:clickOutside={handleClose}
		>
			<!-- Header -->
			<div class="flex items-start gap-4 p-6">
				<!-- Icon -->
				<div class="flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center {variantStyles.iconBg}">
					<svelte:component this={icon} class="h-5 w-5 {variantStyles.iconColor}" />
				</div>
				
				<!-- Content -->
				<div class="flex-1 min-w-0">
					<h3 class="text-lg font-semibold mb-2" style="color: var(--text-primary);">
						{title}
					</h3>
					<p class="text-sm" style="color: var(--text-secondary);">
						{message}
					</p>
				</div>
				
				<!-- Close button -->
				<button 
					onclick={handleClose}
					class="flex-shrink-0 p-1 rounded-md hover:bg-gray-100 transition-colors"
					aria-label="Close"
				>
					<X class="h-4 w-4" style="color: var(--text-tertiary);" />
				</button>
			</div>
			
			<!-- Actions -->
			<div class="flex flex-col-reverse sm:flex-row gap-3 px-6 pb-6">
				<button 
					onclick={handleCancel}
					class="button-secondary button--full-width sm:button--auto"
				>
					{cancelText}
				</button>
				<button 
					onclick={handleConfirm}
					class="{variantStyles.confirmButton} button--full-width sm:button--auto"
				>
					{confirmText}
				</button>
			</div>
		</div>
	</div>
{/if}

<style>
	/* Ensure modal appears above everything */
	:global(body:has(.fixed.inset-0.z-50)) {
		overflow: hidden;
	}
</style> 