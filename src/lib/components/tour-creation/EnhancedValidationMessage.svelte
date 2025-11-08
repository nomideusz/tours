<!--
================================================================================
ENHANCED VALIDATION MESSAGE
================================================================================
Provides better validation feedback with contextual suggestions and examples.
More helpful than generic error messages.
================================================================================
-->

<script lang="ts">
	import AlertCircle from 'lucide-svelte/icons/alert-circle';
	import CheckCircle from 'lucide-svelte/icons/check-circle';
	import Info from 'lucide-svelte/icons/info';
	import { cn } from '$lib/utils/cn.js';

	interface Props {
		type?: 'error' | 'success' | 'info' | 'warning';
		message: string;
		suggestion?: string;
		examples?: string[];
		inline?: boolean;
	}

	let {
		type = 'error',
		message,
		suggestion = '',
		examples = [],
		inline = false
	}: Props = $props();

	const icons = {
		error: AlertCircle,
		success: CheckCircle,
		info: Info,
		warning: AlertCircle
	};

	const Icon = icons[type];
</script>

<div class={cn(
	"validation-message",
	`validation-message--${type}`,
	inline && "validation-message--inline"
)} role="alert">
	<div class="validation-message__icon">
		<Icon class="h-4 w-4" />
	</div>

	<div class="validation-message__content">
		<p class="validation-message__text">{message}</p>

		{#if suggestion}
			<p class="validation-message__suggestion">
				💡 {suggestion}
			</p>
		{/if}

		{#if examples.length > 0}
			<div class="validation-message__examples">
				<span class="validation-message__examples-label">Examples:</span>
				<ul class="validation-message__examples-list">
					{#each examples as example}
						<li>{example}</li>
					{/each}
				</ul>
			</div>
		{/if}
	</div>
</div>

<style>
	.validation-message {
		display: flex;
		gap: 0.75rem;
		padding: 0.875rem 1rem;
		border-radius: var(--radius-md);
		border: 1px solid;
		margin-top: 0.5rem;
		animation: slideDown 0.2s ease-out;
	}

	.validation-message--error {
		background: var(--color-error-50);
		border-color: var(--color-error-200);
		color: var(--color-error-800);
	}

	.validation-message--success {
		background: var(--color-success-50);
		border-color: var(--color-success-200);
		color: var(--color-success-800);
	}

	.validation-message--info {
		background: var(--color-accent-50);
		border-color: var(--color-accent-200);
		color: var(--color-accent-800);
	}

	.validation-message--warning {
		background: var(--color-warning-50);
		border-color: var(--color-warning-200);
		color: var(--color-warning-800);
	}

	.validation-message--inline {
		padding: 0.5rem 0.75rem;
		margin-top: 0.375rem;
	}

	.validation-message__icon {
		flex-shrink: 0;
		margin-top: 0.125rem;
	}

	.validation-message--error .validation-message__icon {
		color: var(--color-error-600);
	}

	.validation-message--success .validation-message__icon {
		color: var(--color-success-600);
	}

	.validation-message--info .validation-message__icon {
		color: var(--color-accent-600);
	}

	.validation-message--warning .validation-message__icon {
		color: var(--color-warning-600);
	}

	.validation-message__content {
		flex: 1;
	}

	.validation-message__text {
		font-size: 0.875rem;
		font-weight: 500;
		margin: 0;
		line-height: 1.5;
	}

	.validation-message__suggestion {
		font-size: 0.8125rem;
		margin: 0.5rem 0 0;
		padding: 0.5rem;
		background: rgba(255, 255, 255, 0.5);
		border-radius: var(--radius-sm);
		line-height: 1.5;
	}

	.validation-message__examples {
		margin-top: 0.625rem;
		padding-top: 0.625rem;
		border-top: 1px solid rgba(0, 0, 0, 0.1);
	}

	.validation-message__examples-label {
		font-size: 0.75rem;
		font-weight: 600;
		text-transform: uppercase;
		letter-spacing: 0.025em;
		opacity: 0.8;
	}

	.validation-message__examples-list {
		list-style: none;
		padding: 0;
		margin: 0.375rem 0 0;
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
	}

	.validation-message__examples-list li {
		font-size: 0.8125rem;
		padding-left: 1rem;
		position: relative;
		opacity: 0.9;
	}

	.validation-message__examples-list li::before {
		content: '→';
		position: absolute;
		left: 0;
		font-weight: 600;
	}

	@keyframes slideDown {
		from {
			opacity: 0;
			transform: translateY(-8px);
		}
		to {
			opacity: 1;
			transform: translateY(0);
		}
	}

	/* Mobile */
	@media (max-width: 640px) {
		.validation-message {
			padding: 0.75rem;
			gap: 0.625rem;
		}

		.validation-message__text {
			font-size: 0.8125rem;
		}

		.validation-message__suggestion {
			font-size: 0.75rem;
		}
	}
</style>
