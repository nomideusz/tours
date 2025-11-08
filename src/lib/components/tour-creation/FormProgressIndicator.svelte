<!--
================================================================================
FORM PROGRESS INDICATOR
================================================================================
Visual progress tracker showing completion status of each form section.
Helps users understand where they are in the form and what's remaining.
================================================================================
-->

<script lang="ts">
	import CheckCircle from 'lucide-svelte/icons/check-circle';
	import Circle from 'lucide-svelte/icons/circle';
	import { cn } from '$lib/utils/cn.js';

	interface Section {
		id: string;
		label: string;
		completed: boolean;
		current?: boolean;
	}

	interface Props {
		sections: Section[];
		currentSection?: string;
		onSectionClick?: (sectionId: string) => void;
	}

	let {
		sections = [],
		currentSection = '',
		onSectionClick
	}: Props = $props();

	function handleSectionClick(sectionId: string) {
		if (onSectionClick) {
			onSectionClick(sectionId);
		}
	}
</script>

<div class="progress-indicator">
	<div class="progress-indicator__header">
		<h3 class="progress-indicator__title">Your Progress</h3>
		<span class="progress-indicator__count">
			{sections.filter(s => s.completed).length}/{sections.length} completed
		</span>
	</div>

	<div class="progress-indicator__sections">
		{#each sections as section, index (section.id)}
			<button
				type="button"
				class={cn(
					"progress-indicator__section",
					section.completed && "progress-indicator__section--completed",
					section.id === currentSection && "progress-indicator__section--current"
				)}
				onclick={() => handleSectionClick(section.id)}
				aria-label={`${section.label} - ${section.completed ? 'Completed' : 'Incomplete'}`}
			>
				<div class="progress-indicator__section-icon">
					{#if section.completed}
						<CheckCircle class="h-5 w-5" />
					{:else}
						<Circle class="h-5 w-5" />
					{/if}
				</div>
				<div class="progress-indicator__section-content">
					<span class="progress-indicator__section-label">{section.label}</span>
					<span class="progress-indicator__section-status">
						{section.completed ? 'Complete' : 'Incomplete'}
					</span>
				</div>
			</button>
			{#if index < sections.length - 1}
				<div class={cn(
					"progress-indicator__connector",
					section.completed && sections[index + 1]?.completed && "progress-indicator__connector--completed"
				)}></div>
			{/if}
		{/each}
	</div>
</div>

<style>
	.progress-indicator {
		background: var(--bg-primary);
		border-radius: var(--radius-lg);
		padding: 1.5rem;
		border: 1px solid var(--border-primary);
		box-shadow: var(--shadow-sm);
	}

	.progress-indicator__header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		margin-bottom: 1.25rem;
	}

	.progress-indicator__title {
		font-size: 1rem;
		font-weight: 600;
		color: var(--text-primary);
		margin: 0;
	}

	.progress-indicator__count {
		font-size: 0.875rem;
		color: var(--text-secondary);
		font-weight: 500;
		padding: 0.25rem 0.75rem;
		background: var(--color-primary-50);
		color: var(--color-primary-700);
		border-radius: var(--radius-full);
	}

	.progress-indicator__sections {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}

	.progress-indicator__section {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		padding: 0.75rem;
		border-radius: var(--radius-md);
		background: transparent;
		border: none;
		cursor: pointer;
		transition: all var(--transition-base);
		text-align: left;
		width: 100%;
	}

	.progress-indicator__section:hover {
		background: var(--bg-secondary);
	}

	.progress-indicator__section--current {
		background: var(--color-primary-50);
		border: 1px solid var(--color-primary-200);
	}

	.progress-indicator__section--completed {
		opacity: 0.8;
	}

	.progress-indicator__section-icon {
		flex-shrink: 0;
		color: var(--text-tertiary);
		transition: color var(--transition-base);
	}

	.progress-indicator__section--completed .progress-indicator__section-icon {
		color: var(--color-success-600);
	}

	.progress-indicator__section--current .progress-indicator__section-icon {
		color: var(--color-primary-600);
	}

	.progress-indicator__section-content {
		display: flex;
		flex-direction: column;
		gap: 0.125rem;
		flex: 1;
	}

	.progress-indicator__section-label {
		font-size: 0.875rem;
		font-weight: 500;
		color: var(--text-primary);
	}

	.progress-indicator__section-status {
		font-size: 0.75rem;
		color: var(--text-tertiary);
	}

	.progress-indicator__section--completed .progress-indicator__section-status {
		color: var(--color-success-600);
	}

	.progress-indicator__connector {
		width: 2px;
		height: 0.75rem;
		background: var(--border-primary);
		margin-left: 1.625rem;
		transition: background var(--transition-base);
	}

	.progress-indicator__connector--completed {
		background: var(--color-success-600);
	}

	/* Mobile responsiveness */
	@media (max-width: 640px) {
		.progress-indicator {
			padding: 1rem;
		}

		.progress-indicator__section {
			padding: 0.625rem;
		}

		.progress-indicator__section-icon :global(svg) {
			width: 1.125rem;
			height: 1.125rem;
		}
	}
</style>
