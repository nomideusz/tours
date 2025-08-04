<script lang="ts">
	import { goto } from '$app/navigation';
	import { onMount } from 'svelte';
	import FlaskConical from 'lucide-svelte/icons/flask-conical';
	import ArrowRight from 'lucide-svelte/icons/arrow-right';
	import Users from 'lucide-svelte/icons/users';
	
	// Redirect immediately to beta application
	onMount(() => {
		// Small delay to show the message briefly, then redirect
		setTimeout(() => {
			goto('/beta/apply');
		}, 2000);
	});

	function goToBetaApplication() {
		goto('/beta/apply');
	}

	function goToLogin() {
		goto('/auth/login');
	}
</script>



<div class="min-h-[calc(100vh-5rem)] sm:min-h-[calc(100vh-8.5rem)] flex flex-col justify-center items-center px-4 sm:px-6 lg:px-8 py-4 sm:py-8">
	<div class="w-full max-w-lg relative z-10">
		<!-- Beta Program Notice -->
		<div class="card card--gradient text-center">
			<div class="card-header card-header--center">
				<div class="flex items-center justify-center mb-4">
					<FlaskConical class="w-8 h-8 text-white" />
				</div>
				<h2 class="card-title card-title--large text-white mb-2">
					Currently in Beta Program
				</h2>
				<p class="card-description card-description--large text-white/90 mb-6">
					We're currently in a closed beta program, selecting 50 tour guides to help shape the future of Zaur.
				</p>
			</div>
			
			<div class="card-content">
				<div class="mb-6">
					<div class="flex items-center justify-center gap-2 text-white/80 text-sm">
						<Users class="w-4 h-4" />
						<span>Limited spots available</span>
					</div>
				</div>
				
				<div class="space-y-3">
					<button
						onclick={goToBetaApplication}
						class="w-full bg-white text-primary font-semibold py-3 px-6 rounded-lg hover:bg-gray-50 transition-colors duration-200 flex items-center justify-center gap-2"
					>
						<span>Apply for Beta Access</span>
						<ArrowRight class="w-4 h-4" />
					</button>
					
					<button
						onclick={goToLogin}
						class="w-full bg-transparent border border-white/30 text-white font-medium py-3 px-6 rounded-lg hover:bg-white/10 transition-colors duration-200"
					>
						Already a beta member? Sign in
					</button>
				</div>
			</div>
			
			<div class="card-footer">
				<p class="text-white/60 text-xs">
					Redirecting to beta application in a moment...
				</p>
			</div>
		</div>
	</div>
</div>

 