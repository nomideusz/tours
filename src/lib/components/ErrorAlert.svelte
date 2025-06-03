<script lang="ts">
	import AlertCircle from 'lucide-svelte/icons/alert-circle';
	import X from 'lucide-svelte/icons/x';
	
	interface Props {
		title?: string;
		message: string;
		variant?: 'error' | 'warning' | 'info';
		dismissible?: boolean;
		onDismiss?: () => void;
	}
	
	let { title, message, variant = 'error', dismissible = false, onDismiss }: Props = $props();
	
	function getVariantClasses(variant: string) {
		switch (variant) {
			case 'warning':
				return {
					container: 'bg-yellow-50 border-yellow-200',
					icon: 'text-yellow-600',
					title: 'text-yellow-800',
					message: 'text-yellow-700'
				};
			case 'info':
				return {
					container: 'bg-blue-50 border-blue-200',
					icon: 'text-blue-600',
					title: 'text-blue-800',
					message: 'text-blue-700'
				};
			case 'error':
			default:
				return {
					container: 'bg-red-50 border-red-200',
					icon: 'text-red-600',
					title: 'text-red-800',
					message: 'text-red-700'
				};
		}
	}
	
	let classes = $derived(getVariantClasses(variant));
</script>

<div class="rounded-lg border p-4 {classes.container}">
	<div class="flex gap-3">
		<AlertCircle class="h-5 w-5 {classes.icon} flex-shrink-0 mt-0.5" />
		<div class="flex-1 min-w-0">
			{#if title}
				<p class="font-medium {classes.title} mb-1">{title}</p>
			{/if}
			<p class="text-sm {classes.message}">{message}</p>
		</div>
		{#if dismissible && onDismiss}
			<button
				onclick={onDismiss}
				class="flex-shrink-0 p-1 rounded hover:bg-black/5 transition-colors {classes.icon}"
				aria-label="Dismiss"
			>
				<X class="h-4 w-4" />
			</button>
		{/if}
	</div>
</div>

<style lang="postcss">
	@reference "tailwindcss";
</style> 