<script lang="ts">
	// Auth form component to provide consistent styling across auth routes
	import Loader from 'lucide-svelte/icons/loader';
	
	export let title = '';
	export let loading = false;
	export let error = '';
</script>

<div class="auth-form {loading ? 'is-loading' : ''}">
	{#if title}
		<h1 class="auth-form__title">{title}</h1>
	{/if}
	
	{#if error}
		<div class="message message--error">
			{error}
		</div>
	{/if}
	
	<slot />
	
	{#if loading}
		<div class="loader-container">
			<Loader size={28} class="loader-icon" />
		</div>
	{/if}
</div>

<style>
	.auth-form {
		position: relative;
		width: 100%;
		text-align: left;
	}
	
	.auth-form.is-loading::after {
		content: '';
		position: absolute;
		top: 0;
		left: 0;
		right: 0;
		bottom: 0;
		background-color: rgba(var(--rgb-bg-card), 0.7);
		backdrop-filter: blur(2px);
		border-radius: var(--radius-md);
		z-index: 10;
	}
	
	.auth-form__title {
		font-size: 1.75rem;
		font-weight: 700;
		color: var(--text-primary);
		margin-bottom: 1.5rem;
		text-align: center;
	}
	
	:global(.auth-form .form__group) {
		margin-bottom: 1.25rem;
	}
	
	:global(.auth-form .form__label) {
		display: block;
		margin-bottom: 0.5rem;
		font-weight: 500;
		color: var(--text-secondary);
	}
	
	:global(.auth-form .form__input) {
		width: 100%;
		padding: 0.75rem 1rem;
		border: 1px solid var(--border-primary);
		border-radius: var(--radius-md);
		background-color: var(--bg-input);
		color: var(--text-primary);
		font-size: 1rem;
		transition: border-color 0.2s, box-shadow 0.2s;
	}
	
	:global(.auth-form .form__input:focus) {
		border-color: var(--accent-primary);
		box-shadow: 0 0 0 2px rgba(var(--rgb-accent-primary), 0.2);
		outline: none;
	}
	
	:global(.auth-form .form__input--error) {
		border-color: var(--color-error);
	}
	
	:global(.auth-form .form__error) {
		color: var(--color-error);
		font-size: 0.85rem;
		margin-top: 0.5rem;
	}
	
	:global(.auth-form .button--full-width) {
		width: 100%;
	}
	
	:global(.auth-form .button--gap) {
		gap: 0.5rem;
	}
	
	:global(.auth-form .button__spinner) {
		display: inline-flex;
		animation: spin 1s linear infinite;
	}
	
	:global(.auth-form .message) {
		padding: 0.75rem 1rem;
		border-radius: var(--radius-md);
		margin-bottom: 1.5rem;
		font-size: 0.95rem;
	}
	
	:global(.auth-form .message--error) {
		background-color: rgba(var(--rgb-color-error), 0.1);
		border: 1px solid var(--color-error);
		color: var(--color-error);
	}
	
	:global(.auth-form .message--success) {
		background-color: rgba(var(--rgb-color-success), 0.1);
		border: 1px solid var(--color-success);
		color: var(--color-success);
	}
	
	.loader-container {
		position: absolute;
		top: 50%;
		left: 50%;
		transform: translate(-50%, -50%);
		z-index: 20;
		color: var(--accent-primary);
	}
	
	@keyframes spin {
		to {
			transform: rotate(360deg);
		}
	}
	
	:global(.auth-form .links) {
		margin-top: 1.5rem;
		text-align: center;
		font-size: 0.95rem;
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 0.75rem;
		flex-wrap: wrap;
	}
	
	:global(.auth-form .links__item) {
		color: var(--accent-primary);
		text-decoration: none;
		transition: color 0.2s, text-decoration 0.2s;
		white-space: nowrap;
	}
	
	:global(.auth-form .links__item:hover) {
		text-decoration: underline;
	}
	
	:global(.auth-form .links__separator) {
		color: var(--text-secondary);
		user-select: none;
	}
	
	@media (max-width: 520px) {
		:global(.auth-form .links) {
			flex-direction: column;
			gap: 0.5rem;
		}
		
		:global(.auth-form .links__separator) {
			display: none;
		}
	}
</style> 