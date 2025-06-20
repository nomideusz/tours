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
	
	// Use the mutation
	const updateStatusMutation = updateTourStatusMutation();
	
	// Update local status when tour prop changes
	$effect(() => {
		localStatus = tour.status;
	});
	
	// Update local status when mutation succeeds (optimistic update handles this)
	$effect(() => {
		if ($updateStatusMutation.data?.status) {
			localStatus = $updateStatusMutation.data.status;
		}
	});
	
	// Toggle function using mutation
	async function handleToggle() {
		if (!browser || $updateStatusMutation.isPending || !tour?.id) return;
		
		const newStatus = tour.status === 'active' ? 'draft' : 'active';
		console.log('🎯 TourStatusToggle: Starting toggle', tour.id, tour.status, '→', newStatus);
		
		try {
			await $updateStatusMutation.mutateAsync({ 
				tourId: tour.id, 
				status: newStatus 
			});
			
			console.log('🎯 TourStatusToggle: Mutation successful, updating local state');
			// Update local state (optimistic update already handled by mutation)
			localStatus = newStatus;
			
			// Call success callback
			console.log('🎯 TourStatusToggle: Calling success callback');
			onSuccess?.(newStatus);
		} catch (error) {
			console.error('🎯 TourStatusToggle: Failed to toggle tour status:', error);
			onError?.(error as Error);
			// Rollback local state on error
			localStatus = tour.status;
		}
	}
	
	// Derive loading state
	let isUpdating = $derived($updateStatusMutation.isPending);
	
	// Button classes based on size and variant
	let buttonClasses = $derived(
		variant === 'menu-item' 
			? 'w-full px-3 py-2 text-left text-sm flex items-center gap-2 transition-colors ' + 
			  (isUpdating ? 'opacity-50' : 'hover:bg-gray-50')
			: variant === 'inline'
			? 'inline-flex items-center gap-1.5 text-sm font-medium transition-colors ' +
			  (localStatus === 'draft' ? 'text-green-600 hover:text-green-700' : 'text-gray-600 hover:text-gray-700')
			: (() => {
				const sizeClass = size === 'large' ? 'button--large' : size === 'small' ? 'button--small' : '';
				const variantClass = localStatus === 'draft' ? 'button-success' : 'button-secondary';
				return `${variantClass} ${sizeClass} button--gap ${className}`;
			})()
	);
</script>

{#if variant === 'menu-item'}
	<button
		onclick={handleToggle}
		disabled={isUpdating}
		class={buttonClasses}
		style="color: {localStatus === 'draft' ? 'var(--color-success-600)' : 'var(--text-secondary)'};"
	>
		{#if isUpdating}
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
		disabled={isUpdating}
		class={buttonClasses}
	>
		{#if isUpdating}
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
		disabled={isUpdating}
		class={buttonClasses}
	>
		{#if isUpdating}
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