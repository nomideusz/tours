<script lang="ts">
	import { enhance } from '$app/forms';
	import { goto } from '$app/navigation';
	import LoadingSpinner from '$lib/components/LoadingSpinner.svelte';
	import { onMount } from 'svelte';
	
	let isLoggingOut = $state(true);
	
	// Auto-submit the logout form when the page loads
	onMount(() => {
		const form = document.getElementById('logout-form') as HTMLFormElement;
		if (form) {
			form.submit();
		}
	});
</script>

<div class="min-h-screen flex items-center justify-center bg-gray-50">
	<div class="max-w-md w-full space-y-8">
		<div class="text-center">
			<h2 class="mt-6 text-3xl font-bold text-gray-900">
				Logging out...
			</h2>
			<p class="mt-2 text-sm text-gray-600">
				Please wait while we sign you out.
			</p>
		</div>
		
		<div class="flex justify-center">
			<LoadingSpinner size="large" />
		</div>
		
		<!-- Hidden form for logout action -->
		<form 
			id="logout-form"
			method="POST" 
			class="hidden"
			use:enhance={() => {
				return async ({ result }) => {
					if (result.type === 'redirect') {
						goto(result.location);
					}
				};
			}}
		>
			<!-- Form will auto-submit via onMount -->
		</form>
	</div>
</div> 