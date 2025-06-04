<script lang="ts">
	import type { ComponentType } from 'svelte';
	
	interface Props {
		icon?: ComponentType;
		title: string;
		description: string;
		actionText?: string;
		actionHref?: string;
		onAction?: () => void;
		variant?: 'default' | 'search' | 'error';
	}
	
	let { icon: Icon, title, description, actionText, actionHref, onAction, variant = 'default' }: Props = $props();
	
	function getVariantClasses(variant: string) {
		switch (variant) {
			case 'search':
				return {
					containerStyle: 'background: var(--bg-primary); border: 1px solid var(--border-primary);',
					iconStyle: 'background: rgb(219 234 254); color: rgb(37 99 235);',
					titleStyle: 'color: var(--text-primary);',
					descriptionStyle: 'color: var(--text-secondary);'
				};
			case 'error':
				return {
					containerStyle: 'background: var(--bg-primary); border: 1px solid var(--border-primary);',
					iconStyle: 'background: rgb(254 226 226); color: rgb(220 38 38);',
					titleStyle: 'color: var(--text-primary);',
					descriptionStyle: 'color: var(--text-secondary);'
				};
			default:
				return {
					containerStyle: 'background: var(--bg-primary); border: 1px solid var(--border-primary);',
					iconStyle: 'background: var(--bg-secondary); color: var(--text-tertiary);',
					titleStyle: 'color: var(--text-primary);',
					descriptionStyle: 'color: var(--text-secondary);'
				};
		}
	}
	
	let classes = $derived(getVariantClasses(variant));
</script>

<div class="rounded-xl p-12 text-center" style="{classes.containerStyle}">
	<div class="max-w-md mx-auto">
		{#if Icon}
			<div class="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4" style="{classes.iconStyle}">
				<Icon class="h-8 w-8" />
			</div>
		{/if}
		
		<h3 class="text-lg font-semibold mb-2" style="{classes.titleStyle}">{title}</h3>
		<p class="mb-6" style="{classes.descriptionStyle}">{description}</p>
		
		{#if actionText && (actionHref || onAction)}
			{#if actionHref}
				<a href={actionHref} class="button-primary button--gap">
					{actionText}
				</a>
			{:else if onAction}
				<button onclick={onAction} class="button-primary button--gap">
					{actionText}
				</button>
			{/if}
		{/if}
	</div>
</div> 