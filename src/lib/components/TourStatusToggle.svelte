<script lang="ts">
	import { browser } from '$app/environment';
	import type { Tour } from '$lib/types.js';
	import { toggleTourStatus } from '$lib/utils/tour-helpers-client.js';
	import { useQueryClient } from '@tanstack/svelte-query';
	import { queryKeys } from '$lib/queries/shared-stats.js';
	import { invalidatePublicTourData } from '$lib/queries/public-queries.js';
	
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
	let isUpdating = $state(false);
	let localStatus = $state(tour.status);
	
	// TanStack Query client
	const queryClient = useQueryClient();
	
	// Update local status when tour prop changes
	$effect(() => {
		localStatus = tour.status;
	});
	
	// Toggle function - same pattern as tour pages
	async function handleToggle() {
		if (!browser || isUpdating || !tour?.id) return;
		isUpdating = true;
		
		try {
			const newStatus = await toggleTourStatus(tour);
			
			if (newStatus) {
				// Update local state immediately
				localStatus = newStatus;
				
				// Update tour details cache for the details page
				queryClient.setQueryData(queryKeys.tourDetails(tour.id), (old: any) => {
					if (!old?.tour) return old;
					return {
						...old,
						tour: { ...old.tour, status: newStatus }
					};
				});
				
				// Call success callback - parent will handle state updates
				onSuccess?.(newStatus);
			}
		} catch (error) {
			console.error('Failed to toggle tour status:', error);
			onError?.(error as Error);
		} finally {
			isUpdating = false;
		}
	}
	
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