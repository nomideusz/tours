<script lang="ts">
	import { fade, scale } from 'svelte/transition';
	import { clickOutside } from '$lib/utils/click-outside.js';
	
	// Icons
	import AlertTriangle from 'lucide-svelte/icons/alert-triangle';
	import X from 'lucide-svelte/icons/x';

	// Components
	import FlagIcon from './FlagIcon.svelte';

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

	// New props for flag icon support in message
	export let showFlagInMessage = false;
	export let flagCountryCode: string | null = null;
	export let flagCountryName: string | null = null;

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
			iconClass: 'confirmation-icon-danger',
			confirmButton: 'button--danger'
		},
		warning: {
			iconClass: 'confirmation-icon-warning',
			confirmButton: 'button-primary confirmation-button-enhanced'
		},
		info: {
			iconClass: 'confirmation-icon-info',
			confirmButton: 'button-primary confirmation-button-enhanced'
		}
	}[variant];
</script>

<svelte:window on:keydown={handleKeydown} />

{#if isOpen}
	<!-- Backdrop -->
	<div 
		class="fixed inset-0 flex items-center justify-center p-4"
		style="z-index: var(--z-modal); background: var(--modal-backdrop, rgba(0, 0, 0, 0.5));"
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
				<div class="flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center {variantStyles.iconClass}">
					<svelte:component this={icon} class="h-5 w-5" />
				</div>
				
				<!-- Content -->
				<div class="flex-1 min-w-0">
					<h3 class="text-lg font-semibold mb-2" style="color: var(--text-primary);">
						{title}
					</h3>
					<div class="text-sm message-content" style="color: var(--text-secondary);">
						{#if showFlagInMessage && flagCountryCode && flagCountryName}
							{@html message.replace(flagCountryName, `<span class="inline-flex items-center gap-1 font-medium"><span class="flag-wrapper"><img src="/flags/1x1/${flagCountryCode.toLowerCase()}.svg" alt="${flagCountryName} flag" width="16" height="16" class="flag-in-text" /></span>${flagCountryName}</span>`)}
						{:else}
							{message}
						{/if}
					</div>
				</div>
				
				<!-- Close button -->
				<button 
					onclick={handleClose}
					class="modal-close-button flex-shrink-0 p-1 rounded-md transition-colors"
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

	/* Enhanced confirmation button styling for better dark mode contrast */
	:global(.confirmation-button-enhanced) {
		font-weight: 600 !important;
		/* Ensure proper text contrast in dark mode */
		color: var(--text-on-primary, var(--color-primary-900)) !important;
		/* Better background contrast */
		background: var(--bg-button-primary, var(--color-primary-100)) !important;
		border-color: var(--border-button-primary, var(--color-primary-200)) !important;
	}

	:global(.confirmation-button-enhanced:hover:not(:disabled)) {
		background: var(--bg-button-primary-hover, var(--color-primary-200)) !important;
		border-color: var(--border-button-primary-hover, var(--color-primary-300)) !important;
		color: var(--text-on-primary-hover, var(--color-primary-900)) !important;
	}

	/* Styles for flag in message text */
	.message-content :global(.flag-wrapper) {
		display: inline-flex;
		align-items: center;
		margin-right: 0.25rem;
	}

	.message-content :global(.flag-in-text) {
		border-radius: 0.125rem;
		box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.1);
		object-fit: cover;
	}

	.message-content :global(span) {
		white-space: nowrap;
	}
</style> 