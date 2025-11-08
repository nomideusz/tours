<!--
================================================================================
AUTOSAVE INDICATOR
================================================================================
Shows autosave status and last saved time to give users confidence their work
is being preserved. Prevents data loss and reduces anxiety.
================================================================================
-->

<script lang="ts">
	import Check from 'lucide-svelte/icons/check';
	import RefreshCw from 'lucide-svelte/icons/refresh-cw';
	import AlertCircle from 'lucide-svelte/icons/alert-circle';
	import { cn } from '$lib/utils/cn.js';

	interface Props {
		status: 'idle' | 'saving' | 'saved' | 'error';
		lastSaved?: Date;
		errorMessage?: string;
	}

	let {
		status = 'idle',
		lastSaved = undefined,
		errorMessage = ''
	}: Props = $props();

	// Format time ago
	function getTimeAgo(date: Date): string {
		const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);

		if (seconds < 10) return 'just now';
		if (seconds < 60) return `${seconds}s ago`;

		const minutes = Math.floor(seconds / 60);
		if (minutes < 60) return `${minutes}m ago`;

		const hours = Math.floor(minutes / 60);
		if (hours < 24) return `${hours}h ago`;

		return date.toLocaleDateString();
	}

	let timeAgoText = $derived(lastSaved ? getTimeAgo(lastSaved) : '');
</script>

<div class={cn("autosave-indicator", `autosave-indicator--${status}`)}>
	<div class="autosave-indicator__content">
		{#if status === 'saving'}
			<RefreshCw class="h-4 w-4 autosave-indicator__icon--spin" />
			<span>Saving...</span>
		{:else if status === 'saved'}
			<Check class="h-4 w-4" />
			<span>Saved {timeAgoText}</span>
		{:else if status === 'error'}
			<AlertCircle class="h-4 w-4" />
			<span>{errorMessage || 'Failed to save'}</span>
		{:else}
			<span class="autosave-indicator__draft-text">Draft</span>
		{/if}
	</div>
</div>

<style>
	.autosave-indicator {
		display: inline-flex;
		align-items: center;
		gap: 0.5rem;
		padding: 0.5rem 0.875rem;
		border-radius: var(--radius-full);
		font-size: 0.8125rem;
		font-weight: 500;
		transition: all var(--transition-base);
		border: 1px solid transparent;
	}

	.autosave-indicator--idle {
		background: var(--bg-secondary);
		color: var(--text-tertiary);
	}

	.autosave-indicator--saving {
		background: var(--color-accent-50);
		color: var(--color-accent-700);
		border-color: var(--color-accent-200);
	}

	.autosave-indicator--saved {
		background: var(--color-success-50);
		color: var(--color-success-700);
		border-color: var(--color-success-200);
	}

	.autosave-indicator--error {
		background: var(--color-error-50);
		color: var(--color-error-700);
		border-color: var(--color-error-200);
	}

	.autosave-indicator__content {
		display: flex;
		align-items: center;
		gap: 0.375rem;
	}

	.autosave-indicator__icon--spin {
		animation: spin 1s linear infinite;
	}

	.autosave-indicator__draft-text {
		text-transform: uppercase;
		letter-spacing: 0.025em;
		font-size: 0.75rem;
		font-weight: 600;
	}

	@keyframes spin {
		from {
			transform: rotate(0deg);
		}
		to {
			transform: rotate(360deg);
		}
	}

	/* Mobile */
	@media (max-width: 640px) {
		.autosave-indicator {
			padding: 0.375rem 0.75rem;
			font-size: 0.75rem;
		}

		.autosave-indicator__content :global(svg) {
			width: 0.875rem;
			height: 0.875rem;
		}
	}
</style>
