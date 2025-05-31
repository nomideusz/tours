<script lang="ts">
	import { page } from '$app/stores';
	import { t, language } from '$lib/i18n.js';
	import '../app.css'
	import Header from '$lib/components/Header.svelte';
	import Footer from '$lib/components/Footer.svelte';
	
	// Get the error status and message from the page store
	$: status = $page.status;
	$: message = $page.error?.message || '';

	// Determine error title and description based on status code
	$: errorTitle = getErrorTitle(status);
	$: errorDescription = getErrorDescription(status, message);
	$: errorIcon = getErrorIcon(status);

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

	// Get appropriate error SVG icon based on status code
	function getErrorIcon(status: number): string {
		switch (status) {
			case 404:
				return 'M9.172 16.172a4 4 0 015.656 0M9 12h6m-6-4h6m2 5.291A7.962 7.962 0 0112 15c-2.34 0-4.291-1.1-5.291-2.709M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9';
			case 403:
				return 'M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z';
			case 500:
				return 'M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.464 0L4.34 16.5c-.77.833.192 2.5 1.732 2.5z';
			case 503:
				return 'M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z M15 12a3 3 0 11-6 0 3 3 0 016 0z';
			default:
				return 'M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z';
		}
	}
	
	// Handle go back button click
	function goBack() {
		window.history.back();
	}
</script>

<!-- Header Component -->
<Header 
	isAuthenticated={false}
	currentUser={null}
/>

<!-- Main Error Content -->
<div class="min-h-screen bg-gray-50 pt-20">
	<div class="max-w-screen-2xl mx-auto px-6 sm:px-8 lg:px-12 py-8">
		<div class="flex items-center justify-center min-h-[calc(100vh-200px)]">
			<div class="bg-white rounded-lg shadow-sm p-8 sm:p-12 max-w-lg w-full text-center">
				<!-- Error Icon -->
				<div class="w-16 h-16 mx-auto mb-6 bg-red-100 rounded-full flex items-center justify-center">
					<svg class="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="{errorIcon}" />
					</svg>
				</div>
				
				<!-- Error Status and Title -->
				<h1 class="text-6xl font-bold text-gray-900 mb-2">{status}</h1>
				<h2 class="text-2xl font-semibold text-gray-900 mb-4">{errorTitle}</h2>
				
				<!-- Error Message -->
				<p class="text-gray-600 mb-8 leading-relaxed">{errorDescription}</p>
				
				<!-- Action Buttons -->
				<div class="flex flex-col sm:flex-row gap-3 justify-center">
					<a href="/" class="button-primary button--gap">
						<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
						</svg>
						Go to Dashboard
					</a>
					<button onclick={goBack} class="button-secondary button--gap">
						<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
						</svg>
						Go Back
					</button>
				</div>
				
				{#if status === 404}
					<div class="mt-8 pt-6 border-t border-gray-200">
						<h3 class="text-sm font-medium text-gray-900 mb-4">You might be looking for:</h3>
						<div class="flex flex-wrap gap-2 justify-center">
							<a href="/tours" class="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-50 text-blue-700 hover:bg-blue-100 transition-colors">
								Tours
							</a>
							<a href="/auth/login" class="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-50 text-blue-700 hover:bg-blue-100 transition-colors">
								Login
							</a>
							<a href="/profile" class="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-50 text-blue-700 hover:bg-blue-100 transition-colors">
								Profile
							</a>
						</div>
					</div>
				{/if}
			</div>
		</div>
	</div>
</div>

<!-- Footer -->
<Footer />

 