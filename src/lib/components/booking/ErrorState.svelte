<script lang="ts">
	import AlertCircle from 'lucide-svelte/icons/alert-circle';
	
	interface Props {
		message?: string;
		onRetry: () => void;
	}
	
	let { message = 'There was an error loading the tour details. Please try again.', onRetry }: Props = $props();
</script>

<div class="flex items-center justify-center min-h-[400px]">
	<div class="text-center max-w-md mx-auto px-6">
		<AlertCircle class="w-16 h-16 mx-auto mb-4" style="color: var(--color-danger-600);" />
		<h1 class="text-2xl font-bold mb-2" style="color: var(--text-primary);">Unable to Load Tour</h1>
		<p class="mb-4" style="color: var(--text-secondary);">
			{message}
		</p>
		<button 
			onclick={onRetry}
			class="button-primary"
		>
			Try Again
		</button>
	</div>
</div>

