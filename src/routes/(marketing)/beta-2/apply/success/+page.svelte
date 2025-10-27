<script lang="ts">
	import { fade } from 'svelte/transition';
	import { goto } from '$app/navigation';
	import CheckCircle from 'lucide-svelte/icons/check-circle';
	import Mail from 'lucide-svelte/icons/mail';
	import Clock from 'lucide-svelte/icons/clock';
	import Users from 'lucide-svelte/icons/users';
	import ArrowRight from 'lucide-svelte/icons/arrow-right';
</script>

<svelte:head>
	<title>Application Submitted - Zaur Beta 2</title>
</svelte:head>

<div class="min-h-screen py-12" style="background: var(--bg-primary);" in:fade={{ duration: 300 }}>
	<div class="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
		<div class="text-center mb-8">
			<div class="inline-flex items-center justify-center w-20 h-20 rounded-full mb-6" style="background: var(--color-success-100);">
				<CheckCircle class="w-10 h-10" style="color: var(--color-success-600);" />
			</div>

			<h1 class="text-3xl sm:text-4xl font-bold mb-4" style="color: var(--text-primary);">
				Application Submitted!
			</h1>
			<p class="text-lg mb-2" style="color: var(--text-secondary);">
				Thank you for applying to Zaur Beta 2
			</p>
		</div>

		<!-- What's Next Section -->
		<div class="rounded-xl p-6 mb-6" style="background: var(--bg-secondary); border: 1px solid var(--border-primary);">
			<h2 class="text-xl font-semibold mb-4" style="color: var(--text-primary);">What happens next?</h2>
			
			<div class="space-y-4">
				<div class="flex items-start gap-4">
					<div class="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center" style="background: var(--color-primary-100); color: var(--color-primary-700);">
						1
					</div>
					<div>
						<h3 class="font-medium mb-1" style="color: var(--text-primary);">Review Process</h3>
						<p class="text-sm" style="color: var(--text-secondary);">
							Our team will review your application within 24-48 hours.
						</p>
					</div>
				</div>

				<div class="flex items-start gap-4">
					<div class="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center" style="background: var(--color-primary-100); color: var(--color-primary-700);">
						2
					</div>
					<div>
						<h3 class="font-medium mb-1" style="color: var(--text-primary);">Account Creation</h3>
						<p class="text-sm" style="color: var(--text-secondary);">
							If accepted, we'll create your account and send login credentials to your email.
						</p>
					</div>
				</div>

				<div class="flex items-start gap-4">
					<div class="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center" style="background: var(--color-primary-100); color: var(--color-primary-700);">
						3
					</div>
					<div>
						<h3 class="font-medium mb-1" style="color: var(--text-primary);">Get Started</h3>
						<p class="text-sm" style="color: var(--text-secondary);">
							Start creating tours immediately with your 120-day free trial + 20% lifetime discount.
						</p>
					</div>
				</div>
			</div>
		</div>

		<!-- Benefits Reminder -->
		<div class="rounded-xl p-6 mb-6" style="background: var(--color-success-50); border: 1px solid var(--color-success-200);">
			<h3 class="font-semibold mb-3" style="color: var(--color-success-900);">Your Beta 2 Benefits</h3>
			<div class="grid gap-2">
				<div class="flex items-center gap-2">
					<CheckCircle class="w-4 h-4" style="color: var(--color-success-600);" />
					<span class="text-sm" style="color: var(--color-success-800);">120 days free access (4 months)</span>
				</div>
				<div class="flex items-center gap-2">
					<CheckCircle class="w-4 h-4" style="color: var(--color-success-600);" />
					<span class="text-sm" style="color: var(--color-success-800);">20% discount forever after trial</span>
				</div>
				<div class="flex items-center gap-2">
					<CheckCircle class="w-4 h-4" style="color: var(--color-success-600);" />
					<span class="text-sm" style="color: var(--color-success-800);">Essential: €20/month instead of €25/month</span>
				</div>
				<div class="flex items-center gap-2">
					<CheckCircle class="w-4 h-4" style="color: var(--color-success-600);" />
					<span class="text-sm" style="color: var(--color-success-800);">Premium: €39/month instead of €49/month</span>
				</div>
			</div>
		</div>

		<!-- Quick Info Cards -->
		<div class="grid sm:grid-cols-3 gap-4 mb-8">
			<div class="rounded-lg p-4 text-center" style="background: var(--bg-secondary); border: 1px solid var(--border-primary);">
				<Clock class="w-6 h-6 mx-auto mb-2" style="color: var(--color-primary-600);" />
				<div class="text-sm font-medium" style="color: var(--text-primary);">24-48 hours</div>
				<div class="text-xs" style="color: var(--text-secondary);">Review time</div>
			</div>

			<div class="rounded-lg p-4 text-center" style="background: var(--bg-secondary); border: 1px solid var(--border-primary);">
				<Users class="w-6 h-6 mx-auto mb-2" style="color: var(--color-primary-600);" />
				<div class="text-sm font-medium" style="color: var(--text-primary);">100 spots</div>
				<div class="text-xs" style="color: var(--text-secondary);">Beta 2 limit</div>
			</div>

			<div class="rounded-lg p-4 text-center" style="background: var(--bg-secondary); border: 1px solid var(--border-primary);">
				<Mail class="w-6 h-6 mx-auto mb-2" style="color: var(--color-primary-600);" />
				<div class="text-sm font-medium" style="color: var(--text-primary);">Check email</div>
				<div class="text-xs" style="color: var(--text-secondary);">For updates</div>
			</div>
		</div>

		<!-- Actions -->
		<div class="text-center">
			<button
				onclick={() => goto('/')}
				class="button-secondary"
			>
				Back to Home
			</button>
		</div>

		<!-- Contact Info -->
		<div class="text-center mt-8">
			<p class="text-sm mb-2" style="color: var(--text-tertiary);">
				Questions about your application?
			</p>
			<a href="mailto:beta@zaur.app" class="text-sm font-medium" style="color: var(--color-primary-600);">
				Contact us at beta@zaur.app
			</a>
		</div>
	</div>
</div>

