<script lang="ts">
	import { browser } from '$app/environment';
	import type { Tour } from '$lib/types.js';
	import { updateTourStatusMutation } from '$lib/queries/mutations.js';
	
	// Icons
	import CheckCircle from 'lucide-svelte/icons/check-circle';
	import Package from 'lucide-svelte/icons/package';
	
	// Props
	interface Props {
		tour: Tour;
		size?: 'small' | 'default' | 'large';
		variant?: 'button' | 'menu-item' | 'inline';
		showLabel?: boolean;
		onSuccess?: (newStatus: 'active' | 'draft') => void;
		onError?: (error: Error) => void;
		class?: string;
	}
	
	let { 
		tour, 
		size = 'small',
		variant = 'button',
		showLabel = true,
		onSuccess,
		onError,
		class: className = ''
	}: Props = $props();
	
	// State
	let localStatus = $state(tour.status);
	
	// Initialize mutation
	const statusMutation = updateTourStatusMutation();
	
	// Update local status when tour prop changes
	$effect(() => {
		localStatus = tour.status;
	});
	
	// Toggle function using TanStack Query mutation
	async function handleToggle() {
		if (!browser || $statusMutation.isPending || !tour?.id) return;
		
		const newStatus = tour.status === 'active' ? 'draft' : 'active';
		console.log('🎯 TourStatusToggle: Starting toggle', tour.id, tour.status, '→', newStatus);
		
		// Optimistic update for immediate feedback
		localStatus = newStatus;
		
		try {
			await $statusMutation.mutateAsync({
				tourId: tour.id,
				status: newStatus
			});
			
			// Call success callback
			console.log('🎯 TourStatusToggle: Update successful');
			onSuccess?.(newStatus);
			
		} catch (error) {
			console.error('🎯 TourStatusToggle: Failed to toggle tour status:', error);
			// Rollback optimistic update on error
			localStatus = tour.status;
			onError?.(error as Error);
		}
	}
	
	// Button classes based on size and variant
	let buttonClasses = $derived(
		variant === 'menu-item' 
			? 'w-full px-3 py-2 text-left text-sm flex items-center gap-2 transition-colors ' + 
			  ($statusMutation.isPending ? 'opacity-50' : '')
			: variant === 'inline'
			? 'inline-flex items-center gap-1.5 text-sm font-medium transition-colors'
			: (() => {
				const sizeClass = size === 'large' ? 'button-large' : size === 'small' ? 'button-small' : '';
				const variantClass = localStatus === 'draft' ? 'button-primary' : 'button-secondary';
				return `${variantClass} ${sizeClass} button-gap ${className}`;
			})()
	);
</script>

{#if variant === 'menu-item'}
	<button
		onclick={handleToggle}
		disabled={$statusMutation.isPending}
		class={buttonClasses}
		style="color: {localStatus === 'draft' ? 'var(--color-primary)' : 'var(--text-secondary)'}; background: transparent;"
		onmouseenter={(e) => !$statusMutation.isPending && (e.currentTarget.style.backgroundColor = 'var(--bg-secondary)')}
		onmouseleave={(e) => !$statusMutation.isPending && (e.currentTarget.style.backgroundColor = 'transparent')}
	>
		{#if $statusMutation.isPending}
			<div class="w-4 h-4 rounded-full border-2 border-current border-t-transparent animate-spin"></div>
		{:else if localStatus === 'draft'}
			<CheckCircle class="h-4 w-4" />
		{:else}
			<Package class="h-4 w-4" />
		{/if}
		{#if showLabel}
			<span>{localStatus === 'draft' ? 'Activate Tour' : 'Set to Draft'}</span>
		{/if}
	</button>
{:else if variant === 'inline'}
	<button
		onclick={handleToggle}
		disabled={$statusMutation.isPending}
		class={buttonClasses}
		style="color: {localStatus === 'draft' ? 'var(--color-primary-600)' : 'var(--text-secondary)'}"
		onmouseenter={(e) => e.currentTarget.style.color = localStatus === 'draft' ? 'var(--color-primary-700)' : 'var(--text-primary)'}
		onmouseleave={(e) => e.currentTarget.style.color = localStatus === 'draft' ? 'var(--color-primary-600)' : 'var(--text-secondary)'}
	>
		{#if $statusMutation.isPending}
			<div class="w-4 h-4 rounded-full border-2 border-current border-t-transparent animate-spin"></div>
		{:else if localStatus === 'draft'}
			<CheckCircle class="h-4 w-4" />
		{:else}
			<Package class="h-4 w-4" />
		{/if}
		{#if showLabel}
			<span>{localStatus === 'draft' ? 'Activate' : 'Draft'}</span>
		{/if}
	</button>
{:else}
	<button
		onclick={handleToggle}
		disabled={$statusMutation.isPending}
		class={buttonClasses}
	>
		{#if $statusMutation.isPending}
			<div class="w-4 h-4 rounded-full border-2 border-current border-t-transparent animate-spin"></div>
			{#if showLabel}
				<span>{localStatus === 'draft' ? 'Activating...' : 'Setting to draft...'}</span>
			{/if}
		{:else if localStatus === 'draft'}
			<CheckCircle class="w-4 h-4" />
			{#if showLabel}
				<span>Activate</span>
			{/if}
		{:else}
			<Package class="w-4 h-4" />
			{#if showLabel}
				<span>Set to Draft</span>
			{/if}
		{/if}
	</button>
{/if} 