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
	
	function getAlertClass(variant: string) {
		switch (variant) {
			case 'warning':
				return 'alert-warning';
			case 'info':
				return 'alert-info';
			case 'error':
			default:
				return 'alert-error';
		}
	}
	
	let alertClass = $derived(getAlertClass(variant));
</script>

<div class="alert {alertClass}" class:dismissible>
	<div class="alert-content">
		<AlertCircle class="alert-icon" style="color: var(--color-error-600);" />
		<div class="alert-text">
			{#if title}
				<p class="alert-title">{title}</p>
			{/if}
			<p class="alert-message">{message}</p>
		</div>
	</div>
	{#if dismissible && onDismiss}
		<button
			onclick={onDismiss}
			class="alert-dismiss"
			aria-label="Dismiss"
		>
			<X class="w-4 h-4" />
		</button>
	{/if}
</div>

<style>
	.alert {
		position: relative;
		border-radius: var(--radius-lg);
		border-width: 1px;
		border-style: solid;
		padding: 1rem;
		transition: all var(--transition-fast) ease;
	}
	
	.alert.dismissible {
		padding-right: 2.5rem;
	}
	
	.alert-content {
		display: flex;
		gap: 0.75rem;
	}
	
	.alert-icon {
		width: 1.25rem;
		height: 1.25rem;
		flex-shrink: 0;
		margin-top: 0.125rem;
	}
	
	.alert-text {
		flex: 1;
		min-width: 0;
	}
	
	.alert-title {
		font-weight: 500;
		margin-bottom: 0.25rem;
		font-size: var(--text-sm);
		line-height: 1.5;
	}
	
	.alert-message {
		font-size: var(--text-sm);
		line-height: 1.5;
	}
	
	.alert-dismiss {
		position: absolute;
		top: 0.75rem;
		right: 0.75rem;
		flex-shrink: 0;
		padding: 0.375rem;
		border-radius: var(--radius-md);
		transition: all var(--transition-fast) ease;
		cursor: pointer;
		background: transparent;
		border: none;
		display: flex;
		align-items: center;
		justify-content: center;
		opacity: 0.6;
	}
	
	.alert-dismiss:hover {
		background-color: rgba(0, 0, 0, 0.1);
		opacity: 1;
	}
	
	[data-theme="dark"] .alert-dismiss:hover {
		background-color: rgba(255, 255, 255, 0.1);
	}
</style> 