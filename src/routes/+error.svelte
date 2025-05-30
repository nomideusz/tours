<script lang="ts">
	import { page } from '$app/stores';
	import { t, language } from '$lib/i18n.js';
	import '../app.css'
	import '../lib/styles/buttons.css'
	
	// Get the error status and message from the page store
	$: status = $page.status;
	$: message = $page.error?.message || '';

	// Determine error title and description based on status code
	$: errorTitle = getErrorTitle(status);
	$: errorDescription = getErrorDescription(status, message);
	$: errorImage = getErrorImage(status);

	// Get appropriate error title based on status code
	function getErrorTitle(status: number): string {
		switch (status) {
			case 404:
				return 'Page Not Found';
			case 403:
				return 'Access Forbidden';
			case 500:
				return 'Server Error';
			case 503:
				return 'Service Unavailable';
			default:
				return `Error ${status}`;
		}
	}

	// Get appropriate error description based on status code
	function getErrorDescription(status: number, message: string): string {
		if (message) return message;
		
		switch (status) {
			case 404:
				return 'The page you were looking for doesn\'t exist or has been moved.';
			case 403:
				return 'You don\'t have permission to access this resource.';
			case 500:
				return 'Something went wrong on our servers. We\'re working to fix the issue.';
			case 503:
				return 'The service is temporarily unavailable. Please try again later.';
			default:
				return 'An unexpected error has occurred.';
		}
	}

	// Get appropriate error image/emoji based on status code
	function getErrorImage(status: number): string {
		switch (status) {
			case 404:
				return '🔍';
			case 403:
				return '🔒';
			case 500:
				return '⚠️';
			case 503:
				return '🔧';
			default:
				return '❓';
		}
	}
	
	// Handle go back button click
	function goBack() {
		window.history.back();
	}
</script>

<div class="error-container">
	<div class="error-card">
		<div class="error-image">
			{errorImage}
		</div>
		
		<h1 class="error-status">{status}</h1>
		<h2 class="error-title">{errorTitle}</h2>
		
		<p class="error-message">{errorDescription}</p>
		
		<div class="error-actions">
			<a href="/" class="action-button">Go to Dashboard</a>
			<button on:click={goBack} class="action-button secondary">Go Back</button>
		</div>
		
		{#if status === 404}
			<div class="navigation-help">
				<h3>You might be looking for:</h3>
				<ul class="quick-links">
					<li><a href="/tests">Tests</a></li>
					<li><a href="/survey-viewer">Survey Viewer</a></li>
					<li><a href="/reports">Reports</a></li>
					<li><a href="/settings">Settings</a></li>
				</ul>
			</div>
		{/if}
	</div>
</div>

<style>
	:global(body), :global(html) {
		height: 100%;
		margin: 0;
		padding: 0;
		overflow: hidden;
	}

	.error-container {
		display: flex;
		align-items: center;
		justify-content: center;
		height: 100vh;
		background-color: #1e1e2e;
		color: #e2e8f0;
		position: fixed;
		top: 0;
		left: 0;
		right: 0;
		bottom: 0;
	}

	.error-card {
		background-color: #252538;
		border-radius: 0.5rem;
		box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
		padding: 2rem;
		text-align: center;
		max-width: 480px;
		width: 100%;
		animation: fadeIn 0.3s ease-out;
		margin: 0 1rem;
		overflow: auto;
		max-height: 90vh;
	}

	@keyframes fadeIn {
		from {
			opacity: 0;
			transform: translateY(20px);
		}
		to {
			opacity: 1;
			transform: translateY(0);
		}
	}

	.error-image {
		font-size: 4rem;
		margin-bottom: 1rem;
	}

	.error-status {
		font-size: 3.5rem;
		font-weight: 700;
		margin: 0;
		color: #38bdf8;
		line-height: 1;
	}

	.error-title {
		font-size: 1.5rem;
		font-weight: 600;
		margin: 0.5rem 0 1.5rem;
		color: #e2e8f0;
	}

	.error-message {
		font-size: 1rem;
		line-height: 1.6;
		color: #94a3b8;
		margin-bottom: 2rem;
	}

	.error-actions {
		display: flex;
		gap: 1rem;
		justify-content: center;
		margin-bottom: 1.5rem;
	}

	.action-button {
		padding: 0.7rem 1.5rem;
		border-radius: 0.375rem;
		font-size: 0.9rem;
		font-weight: 500;
		cursor: pointer;
		transition: all 0.2s;
		text-decoration: none;
		border: none;
	}

	.action-button:first-child {
		background-color: #2563eb;
		color: white;
	}

	.action-button:first-child:hover {
		background-color: #1d4ed8;
	}

	.action-button.secondary {
		background-color: transparent;
		border: 1px solid #4b5563;
		color: #e2e8f0;
	}

	.action-button.secondary:hover {
		background-color: rgba(75, 85, 99, 0.2);
	}

	.navigation-help {
		margin-top: 2rem;
		padding-top: 1.5rem;
		border-top: 1px solid #3a3a4f;
	}

	.navigation-help h3 {
		font-size: 1rem;
		color: #94a3b8;
		margin: 0 0 1rem 0;
		font-weight: 500;
	}

	.quick-links {
		display: flex;
		flex-wrap: wrap;
		gap: 0.5rem;
		justify-content: center;
		padding: 0;
		list-style: none;
	}

	.quick-links li a {
		display: block;
		padding: 0.5rem 1rem;
		background-color: #2a2a3c;
		border-radius: 0.25rem;
		color: #38bdf8;
		text-decoration: none;
		transition: all 0.2s;
		font-size: 0.9rem;
	}

	.quick-links li a:hover {
		background-color: #313147;
		transform: translateY(-2px);
	}
</style> 