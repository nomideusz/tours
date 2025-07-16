<script lang="ts">
	import { browser } from '$app/environment';
	import { goto } from '$app/navigation';
	import { isAdmin, isLoading as authLoading } from '$lib/stores/auth.js';
	
	// Check admin access
	$effect(() => {
		if (browser && !$authLoading && !$isAdmin) {
			goto('/dashboard');
		}
	});
</script>

<svelte:head>
	<title>Sticker Preview - Admin - Zaur</title>
</svelte:head>

{#if $authLoading}
	<div class="flex items-center justify-center min-h-screen">
		<div class="text-center">
			<div class="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto mb-4"></div>
			<p>Loading...</p>
		</div>
	</div>
{:else if !$isAdmin}
	<div class="flex items-center justify-center min-h-screen">
		<div class="text-center">
			<h1 class="text-2xl font-bold mb-4">Access Denied</h1>
			<p>You don't have permission to access this page.</p>
		</div>
	</div>
{:else}
	<div style="width: 100%; height: 100vh; margin: 0; padding: 0;">
		<iframe 
			src="/api/admin/stickers-preview" 
			style="width: 100%; height: 100%; border: none; display: block;"
			title="Sticker Preview"
		></iframe>
	</div>
{/if}

<style>
	:global(html, body) {
		height: 100%;
		margin: 0;
		padding: 0;
		overflow: hidden;
	}
</style> 