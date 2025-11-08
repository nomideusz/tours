<!--
================================================================================
ENHANCED FORM SECTION
================================================================================
Modern card-based form section with better visual hierarchy, optional collapse,
completion indicators, and contextual help integration.
================================================================================
-->

<script lang="ts">
	import { cn } from '$lib/utils/cn.js';
	import CheckCircle from 'lucide-svelte/icons/check-circle';
	import ChevronDown from 'lucide-svelte/icons/chevron-down';
	import ChevronUp from 'lucide-svelte/icons/chevron-up';
	import AlertCircle from 'lucide-svelte/icons/alert-circle';

	interface Props {
		title: string;
		description?: string;
		icon?: any;
		completed?: boolean;
		hasErrors?: boolean;
		collapsible?: boolean;
		defaultExpanded?: boolean;
		required?: boolean;
		optional?: boolean;
		badge?: string;
		sectionId?: string;
	}

	let {
		title,
		description = '',
		icon = undefined,
		completed = false,
		hasErrors = false,
		collapsible = false,
		defaultExpanded = true,
		required = false,
		optional = false,
		badge = '',
		sectionId = '',
		children
	}: Props = $props();

	let expanded = $state(defaultExpanded);

	function toggleExpanded() {
		if (collapsible) {
			expanded = !expanded;
		}
	}
</script>

<section
	class={cn(
		"enhanced-form-section",
		completed && "enhanced-form-section--completed",
		hasErrors && "enhanced-form-section--error",
		collapsible && "enhanced-form-section--collapsible"
	)}
	id={sectionId}
	aria-labelledby="{sectionId}-title"
>
	<div
		class={cn(
			"enhanced-form-section__header",
			collapsible && "enhanced-form-section__header--clickable"
		)}
		onclick={toggleExpanded}
		role={collapsible ? "button" : undefined}
		tabindex={collapsible ? 0 : undefined}
		onkeydown={(e) => {
			if (collapsible && (e.key === 'Enter' || e.key === ' ')) {
				e.preventDefault();
				toggleExpanded();
			}
		}}
	>
		<div class="enhanced-form-section__header-main">
			{#if icon}
				<div class="enhanced-form-section__icon">
					<svelte:component this={icon} class="h-5 w-5" />
				</div>
			{/if}

			<div class="enhanced-form-section__header-text">
				<div class="enhanced-form-section__title-row">
					<h2 class="enhanced-form-section__title" id="{sectionId}-title">
						{title}
					</h2>

					{#if required}
						<span class="enhanced-form-section__required" aria-label="Required">*</span>
					{/if}

					{#if optional}
						<span class="enhanced-form-section__optional">Optional</span>
					{/if}

					{#if badge}
						<span class="enhanced-form-section__badge">{badge}</span>
					{/if}
				</div>

				{#if description}
					<p class="enhanced-form-section__description">{description}</p>
				{/if}
			</div>
		</div>

		<div class="enhanced-form-section__header-status">
			{#if hasErrors}
				<div class="enhanced-form-section__status enhanced-form-section__status--error">
					<AlertCircle class="h-5 w-5" />
				</div>
			{:else if completed}
				<div class="enhanced-form-section__status enhanced-form-section__status--completed">
					<CheckCircle class="h-5 w-5" />
				</div>
			{/if}

			{#if collapsible}
				<div class="enhanced-form-section__chevron">
					{#if expanded}
						<ChevronUp class="h-5 w-5" />
					{:else}
						<ChevronDown class="h-5 w-5" />
					{/if}
				</div>
			{/if}
		</div}
	</div>

	{#if !collapsible || expanded}
		<div class="enhanced-form-section__content">
			{@render children?.()}
		</div>
	{/if}
</section>

<style>
	.enhanced-form-section {
		background: var(--bg-primary);
		border-radius: var(--radius-lg);
		border: 1px solid var(--border-primary);
		box-shadow: var(--shadow-sm);
		transition: all var(--transition-base);
		overflow: hidden;
	}

	.enhanced-form-section:hover {
		box-shadow: var(--shadow-md);
	}

	.enhanced-form-section--completed {
		border-color: var(--color-success-200);
	}

	.enhanced-form-section--error {
		border-color: var(--color-error-300);
		background: var(--color-error-50);
	}

	.enhanced-form-section__header {
		display: flex;
		align-items: flex-start;
		justify-content: space-between;
		padding: 1.5rem;
		gap: 1rem;
		transition: background var(--transition-base);
	}

	.enhanced-form-section__header--clickable {
		cursor: pointer;
	}

	.enhanced-form-section__header--clickable:hover {
		background: var(--bg-secondary);
	}

	.enhanced-form-section__header--clickable:focus {
		outline: 2px solid var(--color-primary-500);
		outline-offset: -2px;
	}

	.enhanced-form-section__header-main {
		display: flex;
		align-items: flex-start;
		gap: 1rem;
		flex: 1;
	}

	.enhanced-form-section__icon {
		flex-shrink: 0;
		color: var(--color-primary-600);
		margin-top: 0.125rem;
	}

	.enhanced-form-section--completed .enhanced-form-section__icon {
		color: var(--color-success-600);
	}

	.enhanced-form-section--error .enhanced-form-section__icon {
		color: var(--color-error-600);
	}

	.enhanced-form-section__header-text {
		flex: 1;
	}

	.enhanced-form-section__title-row {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		flex-wrap: wrap;
		margin-bottom: 0.25rem;
	}

	.enhanced-form-section__title {
		font-size: 1.125rem;
		font-weight: 600;
		color: var(--text-primary);
		margin: 0;
		line-height: 1.4;
	}

	.enhanced-form-section__required {
		color: var(--color-error-600);
		font-size: 1.25rem;
		line-height: 1;
		font-weight: 600;
	}

	.enhanced-form-section__optional {
		font-size: 0.75rem;
		font-weight: 500;
		color: var(--text-tertiary);
		padding: 0.125rem 0.5rem;
		background: var(--bg-tertiary);
		border-radius: var(--radius-full);
		text-transform: uppercase;
		letter-spacing: 0.025em;
	}

	.enhanced-form-section__badge {
		font-size: 0.75rem;
		font-weight: 600;
		color: var(--color-primary-700);
		padding: 0.25rem 0.625rem;
		background: var(--color-primary-100);
		border-radius: var(--radius-full);
	}

	.enhanced-form-section__description {
		font-size: 0.875rem;
		color: var(--text-secondary);
		margin: 0;
		line-height: 1.5;
	}

	.enhanced-form-section__header-status {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		flex-shrink: 0;
	}

	.enhanced-form-section__status {
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.enhanced-form-section__status--completed {
		color: var(--color-success-600);
	}

	.enhanced-form-section__status--error {
		color: var(--color-error-600);
	}

	.enhanced-form-section__chevron {
		color: var(--text-tertiary);
		transition: transform var(--transition-base);
	}

	.enhanced-form-section__content {
		padding: 0 1.5rem 1.5rem;
		animation: fadeIn 0.2s ease-out;
	}

	@keyframes fadeIn {
		from {
			opacity: 0;
		}
		to {
			opacity: 1;
		}
	}

	/* Mobile responsiveness */
	@media (max-width: 640px) {
		.enhanced-form-section__header {
			padding: 1rem;
		}

		.enhanced-form-section__header-main {
			gap: 0.75rem;
		}

		.enhanced-form-section__icon :global(svg) {
			width: 1.125rem;
			height: 1.125rem;
		}

		.enhanced-form-section__title {
			font-size: 1rem;
		}

		.enhanced-form-section__content {
			padding: 0 1rem 1rem;
		}
	}
</style>
