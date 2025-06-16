<script lang="ts">
	import Save from 'lucide-svelte/icons/save';
	import CheckCircle from 'lucide-svelte/icons/check-circle';
	import LoadingSpinner from './LoadingSpinner.svelte';

	interface Props {
		show: boolean;
		loading?: boolean;
		saved?: boolean;
		disabled?: boolean;
		text?: string;
		loadingText?: string;
		savedText?: string;
		onclick: () => void;
		position?: 'bottom-right' | 'bottom-left' | 'bottom-center';
		size?: 'small' | 'default' | 'large';
	}

	let {
		show,
		loading = false,
		saved = false,
		disabled = false,
		text = 'Save Changes',
		loadingText = 'Saving...',
		savedText = 'Saved!',
		onclick,
		position = 'bottom-right',
		size = 'default'
	}: Props = $props();

	// Position classes
	const positionClasses = {
		'bottom-right': 'bottom-6 right-6',
		'bottom-left': 'bottom-6 left-6',
		'bottom-center': 'bottom-6 left-1/2 transform -translate-x-1/2'
	};

	// Size classes
	const sizeClasses = {
		small: 'px-4 py-2 text-sm',
		default: 'px-6 py-3',
		large: 'px-8 py-4 text-lg'
	};

	// Icon size classes
	const iconSizeClasses = {
		small: 'h-3 w-3',
		default: 'h-4 w-4',
		large: 'h-5 w-5'
	};
</script>

{#if show}
	<div class="fixed {positionClasses[position]} z-50 transition-all duration-300 ease-in-out">
		<button
			onclick={onclick}
			disabled={disabled || loading}
			class="button-primary button--gap shadow-xl hover:shadow-2xl transition-all duration-200 {sizeClasses[size]}"
			style="border-radius: 50px; backdrop-filter: blur(8px);"
		>
			{#if loading}
				<LoadingSpinner size="small" variant="white" />
				{loadingText}
			{:else if saved}
				<CheckCircle class="{iconSizeClasses[size]}" />
				{savedText}
			{:else}
				<Save class="{iconSizeClasses[size]}" />
				{text}
			{/if}
		</button>
	</div>
{/if}

<style>
	/* Add a subtle animation when the button appears */
	.fixed {
		animation: slideUp 0.3s ease-out;
	}

	@keyframes slideUp {
		from {
			opacity: 0;
			transform: translateY(20px);
		}
		to {
			opacity: 1;
			transform: translateY(0);
		}
	}

	/* Ensure the button is above other floating elements */
	.z-50 {
		z-index: 50;
	}
</style> 