<!--
================================================================================
SMART FIELD SUGGESTIONS
================================================================================
Provides inline suggestions and quick-fill options for form fields.
Helps users complete forms faster with relevant examples and templates.
================================================================================
-->

<script lang="ts">
	import Sparkles from 'lucide-svelte/icons/sparkles';
	import { cn } from '$lib/utils/cn.js';

	interface Suggestion {
		label: string;
		value: string;
		icon?: any;
	}

	interface Props {
		suggestions: Suggestion[];
		onSelect: (value: string) => void;
		title?: string;
		maxVisible?: number;
	}

	let {
		suggestions = [],
		onSelect,
		title = 'Quick suggestions',
		maxVisible = 6
	}: Props = $props();

	let showAll = $state(false);

	let visibleSuggestions = $derived(
		showAll ? suggestions : suggestions.slice(0, maxVisible)
	);

	let hasMore = $derived(suggestions.length > maxVisible);

	function handleSelect(value: string) {
		onSelect(value);
	}
</script>

{#if suggestions.length > 0}
	<div class="smart-suggestions">
		<div class="smart-suggestions__header">
			<Sparkles class="h-4 w-4" />
			<span class="smart-suggestions__title">{title}</span>
		</div>

		<div class="smart-suggestions__list">
			{#each visibleSuggestions as suggestion (suggestion.value)}
				<button
					type="button"
					class="smart-suggestions__item"
					onclick={() => handleSelect(suggestion.value)}
				>
					{#if suggestion.icon}
						<svelte:component this={suggestion.icon} class="h-3.5 w-3.5" />
					{/if}
					<span>{suggestion.label}</span>
				</button>
			{/each}
		</div>

		{#if hasMore && !showAll}
			<button
				type="button"
				class="smart-suggestions__show-more"
				onclick={() => showAll = true}
			>
				Show {suggestions.length - maxVisible} more
			</button>
		{/if}
	</div>
{/if}

<style>
	.smart-suggestions {
		background: var(--color-primary-50);
		border: 1px solid var(--color-primary-200);
		border-radius: var(--radius-md);
		padding: 0.875rem;
		margin-top: 0.5rem;
	}

	.smart-suggestions__header {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		margin-bottom: 0.625rem;
		color: var(--color-primary-700);
	}

	.smart-suggestions__header :global(svg) {
		flex-shrink: 0;
	}

	.smart-suggestions__title {
		font-size: 0.8125rem;
		font-weight: 600;
		text-transform: uppercase;
		letter-spacing: 0.025em;
	}

	.smart-suggestions__list {
		display: flex;
		flex-wrap: wrap;
		gap: 0.5rem;
	}

	.smart-suggestions__item {
		display: inline-flex;
		align-items: center;
		gap: 0.375rem;
		padding: 0.375rem 0.75rem;
		background: white;
		border: 1px solid var(--color-primary-200);
		border-radius: var(--radius-full);
		font-size: 0.8125rem;
		font-weight: 500;
		color: var(--color-primary-700);
		cursor: pointer;
		transition: all var(--transition-base);
	}

	.smart-suggestions__item:hover {
		background: var(--color-primary-100);
		border-color: var(--color-primary-300);
		transform: translateY(-1px);
		box-shadow: var(--shadow-sm);
	}

	.smart-suggestions__item:active {
		transform: translateY(0);
	}

	.smart-suggestions__show-more {
		display: block;
		width: 100%;
		margin-top: 0.5rem;
		padding: 0.5rem;
		background: transparent;
		border: 1px dashed var(--color-primary-300);
		border-radius: var(--radius-md);
		font-size: 0.8125rem;
		font-weight: 500;
		color: var(--color-primary-600);
		cursor: pointer;
		transition: all var(--transition-base);
	}

	.smart-suggestions__show-more:hover {
		background: var(--color-primary-100);
		border-style: solid;
	}

	/* Mobile */
	@media (max-width: 640px) {
		.smart-suggestions {
			padding: 0.75rem;
		}

		.smart-suggestions__item {
			padding: 0.3125rem 0.625rem;
			font-size: 0.75rem;
		}
	}
</style>
