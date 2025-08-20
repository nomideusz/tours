<script lang="ts">
	import Heart from 'lucide-svelte/icons/heart';
	import Users from 'lucide-svelte/icons/users';
	import Target from 'lucide-svelte/icons/target';
	import Rocket from 'lucide-svelte/icons/rocket';
	import CheckCircle from 'lucide-svelte/icons/check-circle';
	import Zap from 'lucide-svelte/icons/zap';
	import Shield from 'lucide-svelte/icons/shield';
	import Globe from 'lucide-svelte/icons/globe';
	import Crown from 'lucide-svelte/icons/crown';
</script>

<svelte:head>
	<title>About Us - Zaur</title>
	<meta name="description" content="Learn about Zaur - The simplest booking system for independent tour guides. Our mission, values, and commitment to helping tour guides succeed." />
	<meta name="robots" content="index, follow" />
</svelte:head>

<div class="subtle-retro-section py-20">
	<div class="max-w-screen-2xl mx-auto px-6 sm:px-8 lg:px-12">
		<!-- Header -->
		<div class="text-center mb-16">
			<h1 class="marketing-heading marketing-heading-xl mb-6">
				Simple booking for tour guides
			</h1>
			<p class="text-xl max-w-2xl mx-auto text-secondary">
				Professional booking technology that's as simple as possible, but not simpler.
			</p>
		</div>

		<!-- What We Do -->
		<div class="professional-card mb-16 text-center">
			<h2 class="text-2xl font-semibold text-primary mb-6">What is Zaur?</h2>
			<div class="max-w-3xl mx-auto space-y-4 text-lg text-secondary">
				<p>
					A booking system built specifically for independent tour guides. 
					No commissions, no complexity, no clutter.
				</p>
				<p>
					Set up in 5 minutes. Keep 100% of your earnings. Works everywhere.
				</p>
			</div>
		</div>

		<!-- Founder Section -->
		<!-- Meet the Founder -->
<div class="professional-card mb-16">
	<h2 class="text-2xl font-semibold text-primary text-center mb-12">
		Meet the Founder
	</h2>
	<div class="grid lg:grid-cols-2 gap-12 items-center">
		<div class="text-center lg:text-left">
			<div class="w-48 h-48 mx-auto lg:mx-0 mb-6 rounded-xl overflow-hidden border-4 border-white shadow-lg">
				<img src="/bartosz.png" alt="Bartosz - Founder of Zaur" class="w-full h-full object-cover" />
			</div>
			<h3 class="text-xl font-semibold text-primary mb-2">Bartosz</h3>
			<p class="text-secondary font-medium mb-4">Founder & Developer</p>
			<div class="flex items-center justify-center lg:justify-start gap-2 text-sm text-secondary">
				<span>24 years building for the web</span>
				<span>•</span>
				<span>Svelte enthusiast</span>
			</div>
		</div>
		
		<div class="space-y-4">
			<p class="text-lg text-secondary">
				I've been building websites since 2000. I've also traveled extensively, booking tours 
				all over the world. As a developer, I hate bad software. As a traveler, I hate bad booking systems.
			</p>
			<p class="text-secondary">
				Every tour booking system I've used has been terrible. Confusing forms. Hidden fees. 
				Broken mobile experiences. Systems that seemed designed to frustrate both travelers and guides.
			</p>
			<p class="text-secondary">
				Zaur exists because I got tired of this. Tour guides deserve better tools. Travelers 
				deserve better experiences. So I built what I wished existed.
			</p>
			<p class="text-secondary">
				Every feature in Zaur has to answer one question: "Does this actually help?" 
				If it doesn't make booking easier for travelers or running tours simpler for guides, it's gone.
			</p>
		</div>
	</div>
</div>

<!-- The Team -->
<div class="professional-card mb-16">
	<h2 class="text-2xl font-semibold text-primary text-center mb-8">
		The Team
	</h2>
	<div class="max-w-3xl mx-auto text-center space-y-4 text-secondary">
		<p class="text-lg">
			Right now, Zaur is mostly me, plus a few talented people I work with when needed.
		</p>
		<p>
			I collaborate with designers and developers who get it — people who believe 
			software should solve problems, not create them.
		</p>
		<p>
			Small team. Focused mission. Better tools for tour guides.
		</p>
	</div>
</div>

		<!-- Get Started -->
		<div class="text-center">
			<div class="professional-card max-w-2xl mx-auto">
				<h3 class="text-2xl font-semibold text-primary mb-4">Try Zaur</h3>
				<p class="text-lg mb-6 text-secondary">
					Join our early access program and start taking bookings today.
				</p>
				<button onclick={() => {
					window.location.href = '/auth/register';
				}} class="button-primary button--large">
					Get Started
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

	/* Professional badge */
	.professional-badge {
		display: inline-flex;
		align-items: center;
		gap: 0.5rem;
		background: var(--bg-primary);
		border: 2px solid var(--color-primary-500);
		color: var(--text-primary);
		padding: 0.5rem 1.5rem;
		border-radius: 2rem;
		font-weight: 600;
		font-size: 0.875rem;
		box-shadow: var(--shadow-sm);
	}

	.professional-badge-small {
		display: inline-flex;
		align-items: center;
		gap: 0.25rem;
		background: var(--color-primary-100);
		border: 1px solid var(--color-primary-300);
		color: var(--color-primary-800);
		padding: 0.25rem 0.75rem;
		border-radius: var(--radius-full);
		font-weight: 500;
		font-size: 0.75rem;
	}

	/* Professional cards */
	.professional-card {
		background: var(--bg-primary);
		border: 1px solid var(--border-primary);
		border-radius: var(--radius-lg);
		padding: 2rem;
		box-shadow: var(--shadow-sm);
	}

	/* Professional icons */
	.professional-icon {
		width: 4rem;
		height: 4rem;
		border-radius: var(--radius-lg);
		display: flex;
		align-items: center;
		justify-content: center;
		color: white;
		box-shadow: var(--shadow-md);
		flex-shrink: 0;
	}

	.professional-icon--coral {
		background: var(--color-primary-500);
	}

	.professional-icon--orange {
		background: var(--color-secondary-500);
	}

	.professional-icon--teal {
		background: var(--color-accent-500);
	}

	.professional-icon--navy {
		background: var(--color-gray-700);
	}

	/* Responsive adjustments */
	@media (max-width: 768px) {
		.professional-card {
			padding: 1.5rem;
		}

		.professional-icon {
			width: 3rem;
			height: 3rem;
		}
	}
</style> 