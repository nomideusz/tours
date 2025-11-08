<script lang="ts">
	import { fade } from 'svelte/transition';
	import { goto } from '$app/navigation';
	import { onMount } from 'svelte';
	
	// Components
	import PageHeader from '$lib/components/layout/PageHeader.svelte';
	import MobilePageHeader from '$lib/components/layout/MobilePageHeader.svelte';
	import PageContainer from '$lib/components/layout/PageContainer.svelte';
	
	// Icons
	import FlaskConical from 'lucide-svelte/icons/flask-conical';
	import CheckCircle from 'lucide-svelte/icons/check-circle';
	import Users from 'lucide-svelte/icons/users';
	import Clock from 'lucide-svelte/icons/clock';
	import ArrowRight from 'lucide-svelte/icons/arrow-right';
	import Calendar from 'lucide-svelte/icons/calendar';

	// Redirect to Beta 2 application
	onMount(() => {
		goto('/beta-2/apply');
	});
</script>

<svelte:head>
	<title>Beta 2 Applications Open - Zaur</title>
	<meta name="description" content="Join Zaur Beta 2 - 100 spots available with 4 months free + 20% lifetime discount." />
</svelte:head>

<PageContainer>
	<div class="max-w-3xl mx-auto pb-16">
		<!-- Header -->
		<div class="mb-6 sm:mb-8">
			<!-- Mobile Header -->
			<MobilePageHeader
				title="Beta Applications"
				secondaryInfo="Closed"
				primaryAction={{
					label: 'Closed',
					icon: FlaskConical,
					variant: 'secondary',
					disabled: true,
					onclick: () => {}
				}}
			/>
			
			<!-- Desktop Header -->
			<div class="hidden sm:block">
				<PageHeader 
					title="Beta Applications Closed"
					subtitle="Working with 50 selected beta testers"
				>
					<div class="flex items-center gap-4">
						<div class="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium" style="background: var(--color-success-100); color: var(--color-success-700);">
							<CheckCircle class="h-4 w-4" />
							Applications Closed
						</div>
					</div>
				</PageHeader>
			</div>
		</div>

		<!-- Main Content Card -->
		<div class="rounded-xl p-6 sm:p-8 mb-6" style="background: var(--bg-primary); border: 1px solid var(--border-primary);" in:fade={{ duration: 300 }}>
			<div class="text-center mb-8">
				<div class="inline-flex items-center justify-center w-20 h-20 rounded-full mb-6" style="background: var(--color-success-100); color: var(--color-success-600);">
					<CheckCircle class="h-10 w-10" />
				</div>
				
				<h2 class="text-2xl sm:text-3xl font-bold mb-4" style="color: var(--text-primary);">
					Thank You for Your Interest!
				</h2>
				
				<p class="text-lg mb-6" style="color: var(--text-secondary);">
					We've received an amazing response and have selected 50 tour guides 
					from around the world to participate in our beta program.
				</p>
			</div>

			<!-- Stats Grid -->
			<div class="grid sm:grid-cols-3 gap-4 mb-8">
				<div class="rounded-lg p-4 text-center" style="background: var(--bg-secondary); border: 1px solid var(--border-primary);">
					<Users class="h-8 w-8 mx-auto mb-2" style="color: var(--color-primary-600);" />
					<div class="text-2xl font-bold mb-1" style="color: var(--text-primary);">50</div>
					<div class="text-sm" style="color: var(--text-secondary);">Beta Testers</div>
				</div>
				
				<div class="rounded-lg p-4 text-center" style="background: var(--bg-secondary); border: 1px solid var(--border-primary);">
					<Clock class="h-8 w-8 mx-auto mb-2" style="color: var(--color-primary-600);" />
					<div class="text-2xl font-bold mb-1" style="color: var(--text-primary);">3 months</div>
					<div class="text-sm" style="color: var(--text-secondary);">Beta Period</div>
				</div>
				
				<div class="rounded-lg p-4 text-center" style="background: var(--bg-secondary); border: 1px solid var(--border-primary);">
					<Calendar class="h-8 w-8 mx-auto mb-2" style="color: var(--color-primary-600);" />
					<div class="text-2xl font-bold mb-1" style="color: var(--text-primary);">Q1 2026</div>
					<div class="text-sm" style="color: var(--text-secondary);">Public Launch</div>
				</div>
			</div>

			<!-- What's Next Section -->
			<div class="rounded-xl p-6 mb-6" style="background: var(--color-primary-50); border: 1px solid var(--color-primary-200);">
				<h3 class="text-lg font-semibold mb-4" style="color: var(--color-primary-900);">
					What's happening now?
				</h3>
				<ul class="space-y-3">
					<li class="flex items-start gap-3">
						<CheckCircle class="h-5 w-5 mt-0.5 flex-shrink-0" style="color: var(--color-primary-600);" />
						<div>
							<div class="font-medium mb-1" style="color: var(--color-primary-900);">Working with beta testers</div>
							<p class="text-sm" style="color: var(--color-primary-700);">
								Our 50 selected tour guides are actively using Zaur and providing valuable feedback to shape the platform.
							</p>
						</div>
					</li>
					<li class="flex items-start gap-3">
						<CheckCircle class="h-5 w-5 mt-0.5 flex-shrink-0" style="color: var(--color-primary-600);" />
						<div>
							<div class="font-medium mb-1" style="color: var(--color-primary-900);">Refining features</div>
							<p class="text-sm" style="color: var(--color-primary-700);">
								Based on real-world usage, we're continuously improving the booking experience and adding requested features.
							</p>
						</div>
					</li>
					<li class="flex items-start gap-3">
						<CheckCircle class="h-5 w-5 mt-0.5 flex-shrink-0" style="color: var(--color-primary-600);" />
						<div>
							<div class="font-medium mb-1" style="color: var(--color-primary-900);">Preparing for launch</div>
							<p class="text-sm" style="color: var(--color-primary-700);">
								We're working toward a public launch in early 2025 with a platform that's been battle-tested by real tour guides.
							</p>
						</div>
					</li>
				</ul>
			</div>

			<!-- CTA Section -->
			<div class="text-center">
				<h3 class="text-lg font-semibold mb-3" style="color: var(--text-primary);">
				Ready to join Beta 2?
			</h3>
			<p class="mb-6" style="color: var(--text-secondary);">
				Beta 1 applications are closed. Apply for Beta 2 now to lock in your 20% lifetime discount!
			</p>
			
			<div class="flex flex-col sm:flex-row gap-4 justify-center">
				<button 
					class="button-primary button-large button-gap"
					onclick={() => goto('/beta-2/apply')}
				>
					<span>Apply for Beta 2</span>
					<ArrowRight class="h-5 w-5" />
				</button>
					
					<button 
						class="button-secondary button-large"
						onclick={() => goto('/beta')}
					>
						Learn More About Beta
					</button>
				</div>
			</div>
		</div>

		<!-- Additional Info -->
		<div class="text-center">
			<p class="text-sm mb-2" style="color: var(--text-tertiary);">
				Questions about the beta program?
			</p>
			<a href="mailto:beta@zaur.app" class="text-sm font-medium" style="color: var(--color-primary-600);">
				Contact us at beta@zaur.app
			</a>
		</div>
	</div>
</PageContainer>

<style lang="postcss">
	/* Button styles */
	:global(.button-gap) {
		display: inline-flex;
		align-items: center;
		gap: 0.5rem;
	}
</style>
