<script lang="ts">
	/**
	 * Unified Badge Component
	 * 
	 * Consistent badge/chip styling across all form elements
	 * Used for categories, languages, requirements, included items, etc.
	 */
	import X from 'lucide-svelte/icons/x';
	
	interface Props {
		label: string;
		icon?: any; // Lucide icon component
		removable?: boolean;
		onRemove?: () => void;
		variant?: 'default' | 'primary' | 'accent' | 'success' | 'warning';
		size?: 'sm' | 'md';
	}
	
	let {
		label,
		icon = undefined,
		removable = false,
		onRemove,
		variant = 'default',
		size = 'md'
	}: Props = $props();
</script>

{#if removable}
	<button
		type="button"
		class="badge badge-{variant} badge-{size}"
		onclick={onRemove}
	>
		{#if icon}
			<svelte:component this={icon} class="badge-icon" />
		{/if}
		<span class="badge-label">{label}</span>
		<X class="badge-remove" />
	</button>
{:else}
	<span class="badge badge-{variant} badge-{size}">
		{#if icon}
			<svelte:component this={icon} class="badge-icon" />
		{/if}
		<span class="badge-label">{label}</span>
	</span>
{/if}

<style>
	/* Base Badge Styles */
	.badge {
		display: inline-flex;
		align-items: center;
		gap: 0.375rem;
		border: 1px solid var(--border-primary);
		border-radius: 0.375rem;
		font-size: 0.875rem;
		color: var(--text-primary);
		transition: all 0.15s ease;
		white-space: nowrap;
		font-weight: 500;
	}
	
	/* Size Variants */
	.badge-sm {
		padding: 0.25rem 0.5rem;
		font-size: 0.75rem;
		min-height: 1.75rem;
	}
	
	.badge-md {
		padding: 0.5rem 0.75rem;
		min-height: 2.25rem;
	}
	
	/* Color Variants */
	.badge-default {
		background: var(--bg-secondary);
		border-color: var(--border-primary);
		color: var(--text-primary);
	}
	
	.badge-primary {
		background: var(--color-primary-50);
		border-color: var(--color-primary-200);
		color: var(--color-primary-700);
	}
	
	.badge-accent {
		background: var(--color-accent-50);
		border-color: var(--color-accent-200);
		color: var(--color-accent-700);
	}
	
	.badge-success {
		background: var(--color-success-50);
		border-color: var(--color-success-200);
		color: var(--color-success-700);
	}
	
	.badge-warning {
		background: var(--color-warning-50);
		border-color: var(--color-warning-200);
		color: var(--color-warning-700);
	}
	
	/* Interactive States */
	button.badge {
		cursor: pointer;
		background: var(--bg-secondary);
	}
	
	button.badge:hover {
		background: var(--bg-tertiary);
		border-color: var(--border-secondary);
		transform: translateY(-1px);
	}
	
	button.badge:active {
		transform: translateY(0);
	}
	
	/* Icon */
	.badge-icon {
		width: 1rem;
		height: 1rem;
		flex-shrink: 0;
	}
	
	/* Label */
	.badge-label {
		line-height: 1;
	}
	
	/* Remove Button */
	.badge-remove {
		width: 0.875rem;
		height: 0.875rem;
		flex-shrink: 0;
		opacity: 0.6;
		transition: opacity 0.15s ease;
	}
	
	button.badge:hover .badge-remove {
		opacity: 1;
	}
	
	/* Dark Mode */
	:root[data-theme='dark'] .badge-default {
		background: var(--bg-tertiary);
	}
	
	:root[data-theme='dark'] button.badge:hover {
		background: var(--bg-secondary);
	}
</style>

