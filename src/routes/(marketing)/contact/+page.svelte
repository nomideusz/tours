<script lang="ts">
	import Mail from 'lucide-svelte/icons/mail';
</script>

<svelte:head>
	<title>Contact Us - Zaur</title>
	<meta name="description" content="Get in touch with Zaur - Support for tour guides using our QR booking system. Email support, beta program inquiries, and help getting started." />
	<meta name="robots" content="index, follow" />
</svelte:head>

<div class="subtle-retro-section py-20">
	<div class="max-w-screen-2xl mx-auto px-6 sm:px-8 lg:px-12">
		<!-- Header -->
		<div class="text-center mb-16">
			<h1 class="marketing-heading marketing-heading-xl mb-6">
				Get in touch
			</h1>
			<p class="text-xl max-w-2xl mx-auto text-secondary">
				Questions? Problems? Ideas? Just email us.
			</p>
		</div>

		<!-- Contact -->
		<div class="professional-card mb-16 text-center">
			<div class="max-w-2xl mx-auto">
				<Mail class="w-12 h-12 mx-auto mb-6" style="color: var(--color-primary-500)" />
				<h2 class="text-2xl font-semibold text-primary mb-4">Email Us</h2>
				<p class="text-lg text-secondary mb-6">
					We read every email and typically respond within 24 hours.
				</p>
				<button onclick={() => {
					window.location.href = 'mailto:support@zaur.app';
				}} class="button-primary button-large">
					support@zaur.app
				</button>
			</div>
		</div>

	<!-- Beta 2 CTA -->
	<div class="professional-card mb-16 text-center">
		<div class="max-w-2xl mx-auto">
			<h2 class="text-2xl font-semibold text-primary mb-4">Join Beta 2</h2>
			<p class="text-lg text-secondary mb-6">
				Apply now to lock in your 20% lifetime discount before we launch publicly in Q1 2026.
			</p>
			<button onclick={() => {
				window.location.href = '/beta-2/apply';
			}} class="button-secondary button-large">
				Apply for Beta 2
			</button>
		</div>
	</div>
	</div>
</div>

<style>
	/* Subtle retro section with minimal color - matches marketing pages */
	.subtle-retro-section {
		background: linear-gradient(
			180deg,
			var(--bg-primary) 0%,
			var(--bg-secondary) 100%
		);
		position: relative;
		overflow: hidden;
		min-height: 70vh;
		display: flex;
		align-items: center;
	}
	
	/* Very subtle texture overlay */
	.subtle-retro-section::before {
		content: '';
		position: absolute;
		top: 0;
		left: 0;
		right: 0;
		bottom: 0;
		background-image: repeating-linear-gradient(
			0deg,
			transparent,
			transparent 40px,
			rgba(0, 0, 0, 0.02) 40px,
			rgba(0, 0, 0, 0.02) 41px
		);
		pointer-events: none;
	}

	/* Professional cards */
	.professional-card {
		background: var(--bg-primary);
		border: 1px solid var(--border-primary);
		border-radius: var(--radius-lg);
		padding: 2rem;
		box-shadow: var(--shadow-sm);
	}
</style> 