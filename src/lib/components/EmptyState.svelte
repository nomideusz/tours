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
					container: 'bg-blue-50',
					icon: 'bg-blue-100 text-blue-600',
					title: 'text-blue-900',
					description: 'text-blue-700'
				};
			case 'error':
				return {
					container: 'bg-red-50',
					icon: 'bg-red-100 text-red-600',
					title: 'text-red-900',
					description: 'text-red-700'
				};
			default:
				return {
					container: 'bg-white',
					icon: 'bg-gray-100 text-gray-400',
					title: 'text-gray-900',
					description: 'text-gray-600'
				};
		}
	}
	
	let classes = $derived(getVariantClasses(variant));
</script>

<div class="{classes.container} rounded-xl border border-gray-200 p-12 text-center">
	<div class="max-w-md mx-auto">
		{#if Icon}
			<div class="w-16 h-16 {classes.icon} rounded-full flex items-center justify-center mx-auto mb-4">
				<Icon class="h-8 w-8" />
			</div>
		{/if}
		
		<h3 class="text-lg font-semibold {classes.title} mb-2">{title}</h3>
		<p class="{classes.description} mb-6">{description}</p>
		
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