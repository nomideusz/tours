<script lang="ts">
	import type { ComponentType } from 'svelte';
	
	interface Props {
		title: string;
		value: string | number;
		subtitle?: string;
		icon?: ComponentType;
		trend?: {
			value: string;
			positive?: boolean;
		};
		variant?: 'default' | 'small';
		href?: string;
		children?: import('svelte').Snippet;
	}
	
	let { title, value, subtitle, icon: Icon, trend, variant = 'default', href, children }: Props = $props();
</script>

{#if href}
	<a {href} class="stats-card-link">
		<div class="stats-card stats-card--{variant}">
			<!-- Card content -->
			<div class="stats-card__header">
				<span class="stats-card__title">{title}</span>
				{#if Icon}
					<Icon class="stats-card__icon" />
				{/if}
			</div>
			
					<div class="stats-card__content">
			{#if value !== undefined && value !== null && value !== ''}
				<p class="stats-card__value">{value}</p>
			{/if}
				{#if subtitle}
					<p class="stats-card__subtitle">{subtitle}</p>
				{/if}
				{#if trend}
					<div class="stats-card__trend {trend.positive ? 'stats-card__trend--positive' : 'stats-card__trend--negative'}">
						{trend.value}
					</div>
				{/if}
				{#if children}
					<div class="stats-card__children">
						{@render children()}
					</div>
				{/if}
			</div>
		</div>
	</a>
{:else}
	<div class="stats-card stats-card--{variant}">
		<!-- Same content as above -->
		<div class="stats-card__header">
			<span class="stats-card__title">{title}</span>
			{#if Icon}
				<Icon class="stats-card__icon" />
			{/if}
		</div>
		
		<div class="stats-card__content">
			{#if value !== undefined && value !== null && value !== ''}
				<p class="stats-card__value">{value}</p>
			{/if}
			{#if subtitle}
				<p class="stats-card__subtitle">{subtitle}</p>
			{/if}
			{#if trend}
				<div class="stats-card__trend {trend.positive ? 'stats-card__trend--positive' : 'stats-card__trend--negative'}">
					{trend.value}
				</div>
			{/if}
			{#if children}
				<div class="stats-card__children">
					{@render children()}
				</div>
			{/if}
		</div>
	</div>
{/if}

<style lang="postcss">
	@reference "tailwindcss";
	
	.stats-card {
		@apply bg-white rounded-xl border border-gray-200 hover:shadow-md transition-shadow;
	}
	
	.stats-card--default {
		@apply p-6;
	}
	
	.stats-card--small {
		@apply p-4;
	}
	
	.stats-card-link {
		@apply block;
	}
	
	.stats-card__header {
		@apply flex items-center justify-between mb-4;
	}
	
	.stats-card__title {
		@apply text-sm text-gray-600;
	}
	
	.stats-card__icon {
		@apply h-5 w-5 text-gray-400;
	}
	
	.stats-card--small .stats-card__icon {
		@apply h-4 w-4;
	}
	
	.stats-card__content {
		@apply space-y-1;
	}
	
	.stats-card__value {
		@apply text-2xl font-bold text-gray-900;
	}
	
	.stats-card--small .stats-card__value {
		@apply text-xl;
	}
	
	.stats-card__subtitle {
		@apply text-xs text-gray-500;
	}
	
	.stats-card__trend {
		@apply text-sm font-medium flex items-center gap-1;
	}
	
	.stats-card__trend--positive {
		@apply text-green-600;
	}
	
	.stats-card__trend--negative {
		@apply text-red-600;
	}
	
	.stats-card__children {
		@apply mt-3;
	}
</style> 