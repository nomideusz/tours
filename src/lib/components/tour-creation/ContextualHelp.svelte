<!--
================================================================================
CONTEXTUAL HELP COMPONENT
================================================================================
Provides inline help, tips, and examples to guide users through form fields.
Supports tooltips, expandable help text, and example suggestions.
================================================================================
-->

<script lang="ts">
	import HelpCircle from 'lucide-svelte/icons/help-circle';
	import Info from 'lucide-svelte/icons/info';
	import Lightbulb from 'lucide-svelte/icons/lightbulb';
	import ChevronDown from 'lucide-svelte/icons/chevron-down';
	import ChevronUp from 'lucide-svelte/icons/chevron-up';
	import { cn } from '$lib/utils/cn.js';

	interface Props {
		type?: 'tooltip' | 'inline' | 'expandable';
		variant?: 'info' | 'tip' | 'help';
		title?: string;
		content: string;
		examples?: string[];
		expanded?: boolean;
	}

	let {
		type = 'inline',
		variant = 'help',
		title = '',
		content,
		examples = [],
		expanded = $bindable(false)
	}: Props = $props();

	let showTooltip = $state(false);

	function toggleExpanded() {
		expanded = !expanded;
	}

	const icons = {
		help: HelpCircle,
		info: Info,
		tip: Lightbulb
	};

	const Icon = icons[variant];
</script>

{#if type === 'tooltip'}
	<div class="contextual-help contextual-help--tooltip">
		<button
			type="button"
			class={cn("contextual-help__trigger", `contextual-help__trigger--${variant}`)}
			onmouseenter={() => showTooltip = true}
			onmouseleave={() => showTooltip = false}
			onfocus={() => showTooltip = true}
			onblur={() => showTooltip = false}
			aria-label={title || content}
		>
			<Icon class="h-4 w-4" />
		</button>
		{#if showTooltip}
			<div class="contextual-help__tooltip" role="tooltip">
				{#if title}
					<div class="contextual-help__tooltip-title">{title}</div>
				{/if}
				<div class="contextual-help__tooltip-content">{content}</div>
			</div>
		{/if}
	</div>
{:else if type === 'expandable'}
	<div class="contextual-help contextual-help--expandable">
		<button
			type="button"
			class="contextual-help__expandable-trigger"
			onclick={toggleExpanded}
		>
			<Icon class="h-4 w-4" />
			<span>{title || 'Show help'}</span>
			{#if expanded}
				<ChevronUp class="h-4 w-4 ml-auto" />
			{:else}
				<ChevronDown class="h-4 w-4 ml-auto" />
			{/if}
		</button>
		{#if expanded}
			<div class="contextual-help__expandable-content">
				<p class="contextual-help__text">{content}</p>
				{#if examples.length > 0}
					<div class="contextual-help__examples">
						<div class="contextual-help__examples-title">Examples:</div>
						<ul class="contextual-help__examples-list">
							{#each examples as example}
								<li>{example}</li>
							{/each}
						</ul>
					</div>
				{/if}
			</div>
		{/if}
	</div>
{:else}
	<!-- inline help -->
	<div class={cn("contextual-help contextual-help--inline", `contextual-help--${variant}`)}>
		<div class="contextual-help__icon">
			<Icon class="h-4 w-4" />
		</div>
		<div class="contextual-help__content">
			{#if title}
				<div class="contextual-help__title">{title}</div>
			{/if}
			<p class="contextual-help__text">{content}</p>
			{#if examples.length > 0}
				<div class="contextual-help__examples">
					<div class="contextual-help__examples-title">Examples:</div>
					<ul class="contextual-help__examples-list">
						{#each examples as example}
							<li>{example}</li>
						{/each}
					</ul>
				</div>
			{/if}
		</div>
	</div>
{/if}

<style>
	.contextual-help {
		position: relative;
	}

	/* Tooltip variant */
	.contextual-help--tooltip {
		display: inline-flex;
	}

	.contextual-help__trigger {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		border: none;
		background: transparent;
		cursor: pointer;
		color: var(--text-tertiary);
		transition: color var(--transition-base);
		padding: 0.25rem;
		border-radius: var(--radius-sm);
	}

	.contextual-help__trigger:hover,
	.contextual-help__trigger:focus {
		color: var(--text-secondary);
		background: var(--bg-secondary);
	}

	.contextual-help__trigger--help {
		color: var(--color-primary-500);
	}

	.contextual-help__trigger--info {
		color: var(--color-accent-500);
	}

	.contextual-help__trigger--tip {
		color: var(--color-warning-500);
	}

	.contextual-help__tooltip {
		position: absolute;
		top: calc(100% + 0.5rem);
		left: 50%;
		transform: translateX(-50%);
		background: var(--bg-primary);
		border: 1px solid var(--border-primary);
		border-radius: var(--radius-md);
		padding: 0.75rem 1rem;
		box-shadow: var(--shadow-lg);
		z-index: 1000;
		min-width: 200px;
		max-width: 300px;
		animation: fadeInUp 0.2s ease-out;
	}

	.contextual-help__tooltip-title {
		font-weight: 600;
		font-size: 0.875rem;
		color: var(--text-primary);
		margin-bottom: 0.25rem;
	}

	.contextual-help__tooltip-content {
		font-size: 0.8125rem;
		color: var(--text-secondary);
		line-height: 1.5;
	}

	/* Inline variant */
	.contextual-help--inline {
		display: flex;
		gap: 0.75rem;
		padding: 0.875rem 1rem;
		border-radius: var(--radius-md);
		background: var(--bg-secondary);
		border: 1px solid var(--border-primary);
	}

	.contextual-help--help {
		background: var(--color-primary-50);
		border-color: var(--color-primary-200);
	}

	.contextual-help--info {
		background: var(--color-accent-50);
		border-color: var(--color-accent-200);
	}

	.contextual-help--tip {
		background: var(--color-warning-50);
		border-color: var(--color-warning-200);
	}

	.contextual-help__icon {
		flex-shrink: 0;
		color: var(--text-secondary);
	}

	.contextual-help--help .contextual-help__icon {
		color: var(--color-primary-600);
	}

	.contextual-help--info .contextual-help__icon {
		color: var(--color-accent-600);
	}

	.contextual-help--tip .contextual-help__icon {
		color: var(--color-warning-600);
	}

	.contextual-help__content {
		flex: 1;
	}

	.contextual-help__title {
		font-weight: 600;
		font-size: 0.875rem;
		color: var(--text-primary);
		margin-bottom: 0.25rem;
	}

	.contextual-help__text {
		font-size: 0.8125rem;
		color: var(--text-secondary);
		line-height: 1.5;
		margin: 0;
	}

	.contextual-help__examples {
		margin-top: 0.75rem;
	}

	.contextual-help__examples-title {
		font-size: 0.75rem;
		font-weight: 600;
		color: var(--text-secondary);
		margin-bottom: 0.375rem;
		text-transform: uppercase;
		letter-spacing: 0.025em;
	}

	.contextual-help__examples-list {
		list-style: none;
		padding: 0;
		margin: 0;
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
	}

	.contextual-help__examples-list li {
		font-size: 0.8125rem;
		color: var(--text-tertiary);
		padding-left: 1rem;
		position: relative;
	}

	.contextual-help__examples-list li::before {
		content: '•';
		position: absolute;
		left: 0;
		color: var(--color-primary-400);
	}

	/* Expandable variant */
	.contextual-help--expandable {
		border: 1px solid var(--border-primary);
		border-radius: var(--radius-md);
		overflow: hidden;
	}

	.contextual-help__expandable-trigger {
		width: 100%;
		display: flex;
		align-items: center;
		gap: 0.5rem;
		padding: 0.75rem 1rem;
		background: var(--bg-secondary);
		border: none;
		cursor: pointer;
		font-size: 0.875rem;
		font-weight: 500;
		color: var(--text-primary);
		transition: background var(--transition-base);
	}

	.contextual-help__expandable-trigger:hover {
		background: var(--bg-tertiary);
	}

	.contextual-help__expandable-content {
		padding: 1rem;
		background: var(--bg-primary);
		border-top: 1px solid var(--border-primary);
	}

	@keyframes fadeInUp {
		from {
			opacity: 0;
			transform: translateX(-50%) translateY(-8px);
		}
		to {
			opacity: 1;
			transform: translateX(-50%) translateY(0);
		}
	}

	/* Mobile responsiveness */
	@media (max-width: 640px) {
		.contextual-help__tooltip {
			max-width: 250px;
			font-size: 0.75rem;
		}

		.contextual-help--inline {
			padding: 0.75rem;
			gap: 0.625rem;
		}
	}
</style>
