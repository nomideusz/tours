<script lang="ts">
	import { fly } from 'svelte/transition';
	import { formatDate, formatTime } from '$lib/utils/date-helpers.js';
	import AlertTriangle from 'lucide-svelte/icons/alert-triangle';
	import Clock from 'lucide-svelte/icons/clock';
	import Calendar from 'lucide-svelte/icons/calendar';
	import X from 'lucide-svelte/icons/x';
	import type { TimeSlotConflict } from '../types.js';
	
	interface Props {
		conflicts: TimeSlotConflict[];
		justCreatedSlot?: boolean;
	}
	
	let { conflicts, justCreatedSlot = false }: Props = $props();
	
	// Format conflicting slot details
	function formatConflictTime(conflict: TimeSlotConflict) {
		const date = formatDate(conflict.startTime);
		const timeRange = `${formatTime(conflict.startTime)} - ${formatTime(conflict.endTime)}`;
		return { date, timeRange };
	}
</script>

{#if conflicts.length > 0 && !justCreatedSlot}
	<div class="conflict-warning" transition:fly={{ y: -5, duration: 150 }}>
		<div class="conflict-header">
			<div class="conflict-icon">
				<AlertTriangle class="w-5 h-5" />
			</div>
			<div class="conflict-content">
				<h3 class="conflict-title">
					{#if conflicts.length === 1}
						Time Conflict Detected
					{:else}
						{conflicts.length} Time Conflicts Detected
					{/if}
				</h3>
				<p class="conflict-message">
					{#if conflicts.length === 1}
						This time slot overlaps with an existing booking. Please choose a different time.
					{:else}
						Multiple existing time slots overlap with your selection. Please adjust your schedule.
					{/if}
				</p>
			</div>
		</div>
		
		<div class="conflict-details">
			{#each conflicts as conflict}
				{@const { date, timeRange } = formatConflictTime(conflict)}
				<div class="conflict-item">
					<div class="conflict-item-header">
						<Calendar class="w-4 h-4" />
						<span class="conflict-date">{date}</span>
					</div>
					<div class="conflict-item-time">
						<Clock class="w-4 h-4" />
						<span class="conflict-time">{timeRange}</span>
					</div>
				</div>
			{/each}
		</div>
		
		<div class="conflict-suggestion">
			<p class="suggestion-text">
				💡 Try selecting a different time or adjust the duration to avoid conflicts.
			</p>
		</div>
	</div>
{/if}

<style>
	.conflict-warning {
		background: linear-gradient(135deg, var(--color-warning-50) 0%, var(--color-warning-100) 100%);
		border: 1px solid var(--color-warning-200);
		border-left: 4px solid var(--color-warning-500);
		border-radius: 0.75rem;
		padding: 1.25rem;
		margin-bottom: 1rem;
		box-shadow: 0 2px 8px rgba(245, 158, 11, 0.1);
		position: relative;
		overflow: hidden;
	}
	
	.conflict-warning::before {
		content: '';
		position: absolute;
		top: 0;
		left: 0;
		right: 0;
		height: 2px;
		background: linear-gradient(90deg, var(--color-warning-400), var(--color-warning-600), var(--color-warning-400));
	}
	
	.conflict-header {
		display: flex;
		align-items: flex-start;
		gap: 0.75rem;
		margin-bottom: 1rem;
	}
	
	.conflict-icon {
		flex-shrink: 0;
		width: 2.5rem;
		height: 2.5rem;
		background: var(--color-warning-200);
		color: var(--color-warning-700);
		border-radius: 0.5rem;
		display: flex;
		align-items: center;
		justify-content: center;
		box-shadow: 0 2px 4px rgba(245, 158, 11, 0.15);
	}
	
	.conflict-content {
		flex: 1;
		min-width: 0;
	}
	
	.conflict-title {
		font-size: 1rem;
		font-weight: 600;
		color: var(--color-warning-900);
		margin: 0 0 0.25rem 0;
		line-height: 1.4;
	}
	
	.conflict-message {
		font-size: 0.875rem;
		color: var(--color-warning-700);
		margin: 0;
		line-height: 1.5;
	}
	
	.conflict-details {
		background: var(--color-warning-50);
		border: 1px solid var(--color-warning-200);
		border-radius: 0.5rem;
		padding: 0.75rem;
		margin-bottom: 1rem;
	}
	
	.conflict-item {
		display: flex;
		align-items: center;
		gap: 1rem;
		padding: 0.5rem 0;
	}
	
	.conflict-item:not(:last-child) {
		border-bottom: 1px solid var(--color-warning-200);
		margin-bottom: 0.5rem;
		padding-bottom: 0.75rem;
	}
	
	.conflict-item-header,
	.conflict-item-time {
		display: flex;
		align-items: center;
		gap: 0.375rem;
		color: var(--color-warning-800);
	}
	
	.conflict-item-header {
		min-width: 7rem;
	}
	
	.conflict-date,
	.conflict-time {
		font-size: 0.875rem;
		font-weight: 500;
		font-variant-numeric: tabular-nums;
	}
	
	.conflict-suggestion {
		background: rgba(255, 255, 255, 0.6);
		border: 1px solid var(--color-warning-300);
		border-radius: 0.5rem;
		padding: 0.75rem;
		text-align: center;
	}
	
	.suggestion-text {
		font-size: 0.875rem;
		color: var(--color-warning-800);
		margin: 0;
		font-weight: 500;
	}
	
	/* Mobile optimizations */
	@media (max-width: 640px) {
		.conflict-warning {
			padding: 1rem;
		}
		
		.conflict-header {
			gap: 0.5rem;
		}
		
		.conflict-icon {
			width: 2rem;
			height: 2rem;
		}
		
		.conflict-title {
			font-size: 0.9375rem;
		}
		
		.conflict-message {
			font-size: 0.8125rem;
		}
		
		.conflict-item {
			flex-direction: column;
			align-items: flex-start;
			gap: 0.5rem;
		}
		
		.conflict-item-header {
			min-width: auto;
		}
	}
	
	/* Dark mode adjustments */
	@media (prefers-color-scheme: dark) {
		.conflict-warning {
			background: linear-gradient(135deg, var(--color-warning-900) 0%, var(--color-warning-800) 100%);
			border-color: var(--color-warning-700);
			box-shadow: 0 2px 8px rgba(245, 158, 11, 0.2);
		}
		
		.conflict-icon {
			background: var(--color-warning-800);
			color: var(--color-warning-200);
		}
		
		.conflict-title {
			color: var(--color-warning-100);
		}
		
		.conflict-message {
			color: var(--color-warning-300);
		}
		
		.conflict-details {
			background: var(--color-warning-900);
			border-color: var(--color-warning-700);
		}
		
		.conflict-item-header,
		.conflict-item-time {
			color: var(--color-warning-200);
		}
		
		.conflict-suggestion {
			background: rgba(0, 0, 0, 0.3);
			border-color: var(--color-warning-600);
		}
		
		.suggestion-text {
			color: var(--color-warning-200);
		}
	}
</style> 