<script lang="ts">
	import { goto } from '$app/navigation';
	
	// Icons
	import ArrowLeft from 'lucide-svelte/icons/arrow-left';
	import Zap from 'lucide-svelte/icons/zap';
	import Calendar from 'lucide-svelte/icons/calendar';
</script>

<svelte:head>
	<title>Demo - Zaur</title>
	<meta name="description" content="Zaur demo page" />
</svelte:head>

<div class="min-h-screen flex items-center justify-center p-6">
	<div class="max-w-md mx-auto text-center">
		<div class="mb-8">
			<div class="w-16 h-16 mx-auto mb-4 flex items-center justify-center rounded-full" 
				style="background: var(--color-warning-100); color: var(--color-warning-600);">
				<Calendar class="w-8 h-8" />
			</div>
			<h1 class="text-2xl font-bold mb-2" style="color: var(--text-primary);">
				Demo Temporarily Unavailable
			</h1>
			<p class="text-sm" style="color: var(--text-secondary);">
				We're working on creating a better demo experience that shows real platform features instead of sample data.
			</p>
		</div>
		
		<div class="space-y-4">
			<button 
				onclick={() => goto('/')} 
				class="button-secondary button--gap w-full"
			>
				<ArrowLeft class="w-4 h-4" />
				Back to Home
			</button>
			
			<a href="/auth/register" class="button-primary button--gap w-full">
				<Zap class="w-4 h-4" />
				Start Free Trial
			</a>
		</div>
		
		<p class="text-xs mt-6" style="color: var(--text-tertiary);">
			Want to see Zaur in action? <a href="/contact" class="underline hover:no-underline" style="color: var(--color-primary-600);">Book a personal demo</a>
		</p>
	</div>
</div> 