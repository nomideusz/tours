<script lang="ts">
	interface Props {
		title: string;
		value: string | number;
		subtitle?: string;
		icon?: any;
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
				<Icon class="stats-card__icon" style="color: var(--text-tertiary); stroke: var(--text-tertiary);" />
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
				<Icon class="stats-card__icon" style="color: var(--text-tertiary); stroke: var(--text-tertiary);" />
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
		background: var(--bg-primary);
		border: 1px solid var(--border-primary);
		border-radius: 0.75rem;
		transition: box-shadow 0.15s ease-in-out;
	}
	
	.stats-card:hover {
		box-shadow: 0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1);
	}
	
	.stats-card--default {
		padding: 1.5rem;
	}
	
	.stats-card--small {
		padding: 1rem;
	}
	
	.stats-card-link {
		display: block;
	}
	
	.stats-card__header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		margin-bottom: 1rem;
	}
	
	.stats-card__title {
		font-size: 0.875rem;
		color: var(--text-secondary);
	}
	
	.stats-card__icon {
		height: 1.25rem;
		width: 1.25rem;
		color: var(--text-tertiary);
	}
	
	.stats-card__icon :global(svg) {
		stroke: var(--text-tertiary) !important;
		fill: none;
		color: var(--text-tertiary);
	}
	
	.stats-card__icon :global(svg path) {
		stroke: var(--text-tertiary) !important;
	}
	
	.stats-card--small .stats-card__icon {
		height: 1rem;
		width: 1rem;
	}
	
	.stats-card__content {
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
	}
	
	.stats-card__value {
		font-size: 1.5rem;
		font-weight: 700;
		color: var(--text-primary);
	}
	
	.stats-card--small .stats-card__value {
		font-size: 1.25rem;
	}
	
	.stats-card__subtitle {
		font-size: 0.75rem;
		color: var(--text-tertiary);
	}
	
	.stats-card__trend {
		font-size: 0.875rem;
		font-weight: 500;
		display: flex;
		align-items: center;
		gap: 0.25rem;
	}
	
	.stats-card__trend--positive {
		color: #059669;
	}
	
	.stats-card__trend--negative {
		color: #dc2626;
	}
	
	.stats-card__children {
		margin-top: 0.75rem;
	}
</style> 