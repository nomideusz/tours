<script lang="ts">
	// About page - Team and company information
</script>

<svelte:head>
	<title>About Us - Zaur</title>
	<meta
		name="description"
		content="Learn about Zaur - The simplest booking system for independent tour guides. Our mission, values, and commitment to helping tour guides succeed."
	/>
	<meta name="robots" content="index, follow" />
</svelte:head>

<div class="subtle-retro-section py-20">
	<div class="mx-auto max-w-screen-2xl px-6 sm:px-8 lg:px-12">
		<!-- Header -->
		<div class="mb-16 text-center">
			<h1 class="marketing-heading marketing-heading-xl mb-6">Simple booking for tour guides</h1>
			<p class="text-secondary mx-auto max-w-2xl text-xl">
				Professional booking technology that's as simple as possible, but not simpler.
			</p>
		</div>

		<!-- What We Do -->
		<div class="professional-card mb-16 text-center">
			<h2 class="text-primary mb-6 text-2xl font-semibold">What is Zaur?</h2>
			<div class="text-secondary mx-auto max-w-3xl space-y-4 text-lg">
				<p>
					A booking system built specifically for independent tour guides. No commissions, no
					complexity, no clutter.
				</p>
				<p>Set up in 5 minutes. Keep 100% of your earnings. Works everywhere.</p>
			</div>
		</div>

		<!-- The Team -->
		<div class="professional-card mb-16">
			<h2 class="text-primary mb-12 text-center text-2xl font-semibold">The Team</h2>
			<div class="grid gap-8 md:grid-cols-2 lg:grid-cols-3 lg:gap-10">
				<!-- Bartosz -->
				<div class="team-member">
					<div class="text-center">
						<div
							class="mx-auto mb-4 h-40 w-40 overflow-hidden rounded-xl border-4 border-white shadow-lg"
						>
							<img
								src="/bartek.png"
								alt="Bartosz Dymet - Founder of Zaur"
								class="h-full w-full object-cover"
							/>
						</div>
						<h3 class="text-primary mb-1 text-lg font-semibold">Bartek Dymet</h3>
						<p class="text-secondary mb-3 text-sm font-medium">Founder & Developer</p>
						<div class="text-secondary mb-4 flex items-center justify-center gap-2 text-xs">
							<span>24 years building for the web</span>
						</div>
					</div>

					<div class="text-secondary space-y-2 text-center text-sm md:text-left">
						<p>
							I've been building for the web since 2000 and have experienced countless booking
							systems as both developer and traveler.
						</p>
						<p>
							Zaur was built to give tour guides professional tools without complexity. Simple,
							reliable software that works.
						</p>
					</div>
				</div>

			<!-- Magda Makaruk -->
			<div class="team-member">
				<div class="text-center">
					<div
						class="mx-auto mb-4 h-40 w-40 overflow-hidden rounded-xl border-4 border-white shadow-lg"
					>
					<img
						src="/magda.png"
						alt="Magda Makaruk - Graphic Designer, AI tools specialist at Zaur"
						class="h-full w-full object-cover"
					/>
					</div>
					<h3 class="text-primary mb-1 text-lg font-semibold">Magda Makaruk</h3>
					<p class="text-secondary mb-3 text-sm font-medium">Graphic Designer, AI tools specialist</p>
					<div class="text-secondary mb-4 flex items-center justify-center gap-2 text-xs">
						<span>Graphic design & AI tools</span>
					</div>
				</div>

				<div class="text-secondary space-y-2 text-center text-sm md:text-left">
					<p>
						I create visual designs and leverage AI tools to enhance our creative process. My focus is on delivering high-quality graphics that communicate effectively.
					</p>
					<p>
						At Zaur, I bring modern design techniques and AI-powered workflows to create compelling visuals that resonate with tour guides and travelers.
					</p>
				</div>
			</div>

				<!-- Kasia Kucaj -->
				<div class="team-member">
					<div class="text-center">
						<div
							class="mx-auto mb-4 h-40 w-40 overflow-hidden rounded-xl border-4 border-white shadow-lg"
						>
							<img
								src="/kasiak.png"
								alt="Kasia Kucaj - Operations & Growth at Zaur"
								class="h-full w-full object-cover"
							/>
						</div>
						<h3 class="text-primary mb-1 text-lg font-semibold">Kasia Kucaj</h3>
						<p class="text-secondary mb-3 text-sm font-medium">Operations & Growth</p>
						<div class="text-secondary mb-4 flex items-center justify-center gap-2 text-xs">
							<span>Project management & marketing</span>
						</div>
					</div>

					<div class="text-secondary space-y-2 text-center text-sm md:text-left">
						<p>
							I bring experience in project management, marketing, and research to ensure we build
							features that tour guides actually need and use.
						</p>
						<p>
							At Zaur, I handle operations, growth strategy, and making sure the platform serves
							our users well as we scale.
						</p>
					</div>
				</div>
			</div>
		</div>

		<!-- How We Work -->
		<div class="professional-card mb-16">
			<h2 class="text-primary mb-8 text-center text-2xl font-semibold">How We Work</h2>
			<div class="mx-auto max-w-3xl space-y-6">
				<div class="space-y-4 text-center">
					<div class="text-secondary grid gap-6 md:grid-cols-3">
						<div>
							<h3 class="text-primary mb-2 font-semibold">Small by Choice</h3>
							<p class="text-sm">
								A focused core team means faster decisions, clearer communication, and software that
								stays simple. When we need specialized expertise, we work with trusted developers
								and specialists.
							</p>
						</div>
						<div>
							<h3 class="text-primary mb-2 font-semibold">Built to Last</h3>
							<p class="text-sm">
								We write clean code, use proven technologies, and make decisions that work for
								years, not months.
							</p>
						</div>
						<div>
							<h3 class="text-primary mb-2 font-semibold">No Bloat Policy</h3>
							<p class="text-sm">
								Every feature must solve a real problem. If it doesn't help guides or travelers, it
								doesn't exist.
							</p>
						</div>
					</div>
				</div>
			</div>
		</div>

		<!-- Get Started -->
		<div class="text-center">
			<div class="professional-card mx-auto max-w-2xl">
				<h3 class="text-primary mb-4 text-2xl font-semibold">Try Zaur</h3>
				<p class="text-secondary mb-6 text-lg">
					Join our early access program and start taking bookings today.
				</p>
				<button
					onclick={() => {
						window.location.href = '/auth/register';
					}}
					class="button-primary button-large"
				>
					Get Started
				</button>
			</div>
		</div>
	</div>
</div>

<style>
	/* Subtle retro section with minimal color - matches marketing pages */
	.subtle-retro-section {
		background: linear-gradient(180deg, var(--bg-primary) 0%, var(--bg-secondary) 100%);
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

	/* Team member cards */
	.team-member {
		display: flex;
		flex-direction: column;
		gap: 1.5rem;
	}

	/* Responsive adjustments */
	@media (max-width: 768px) {
		.professional-card {
			padding: 1.5rem;
		}
	}
</style>
