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
		<!-- Professional Header -->
		<div class="text-center mb-16">
			<div class="professional-badge mb-6">
				<Heart class="w-4 h-4" />
				<span>About Zaur</span>
			</div>
			<h1 class="marketing-heading marketing-heading-xl mb-6">
				Built for Tour Guides, By Tour Guides
			</h1>
			<p class="text-lg max-w-2xl mx-auto text-secondary">
				We're on a mission to help independent tour guides succeed with simple, 
				powerful booking technology that puts you first.
			</p>
		</div>

		<!-- Mission Section -->
		<div class="professional-card mb-16">
			<div class="text-center mb-12">
				<div class="professional-icon professional-icon--coral mx-auto mb-6">
					<Target class="w-8 h-8" strokeWidth={2} />
				</div>
				<h2 class="text-2xl font-semibold text-primary mb-4">Our Mission</h2>
				<p class="text-lg text-secondary max-w-3xl mx-auto">
					To empower independent tour guides with professional booking technology 
					that's as simple as WhatsApp but as powerful as enterprise systems.
				</p>
			</div>
			
			<div class="grid md:grid-cols-3 gap-8">
				<div class="text-center">
					<div class="professional-icon professional-icon--teal mx-auto mb-4">
						<Zap class="w-6 h-6" strokeWidth={2} />
					</div>
					<h3 class="text-lg font-semibold text-primary mb-2">Simple</h3>
					<p class="text-secondary text-sm">
						Technology should work for you, not against you. 
						Everything is intuitive and straightforward.
					</p>
				</div>
				
				<div class="text-center">
					<div class="professional-icon professional-icon--orange mx-auto mb-4">
						<Shield class="w-6 h-6" strokeWidth={2} />
					</div>
					<h3 class="text-lg font-semibold text-primary mb-2">Reliable</h3>
					<p class="text-secondary text-sm">
						Your business depends on us working perfectly. 
						We take that responsibility seriously.
					</p>
				</div>
				
				<div class="text-center">
					<div class="professional-icon professional-icon--navy mx-auto mb-4">
						<Heart class="w-6 h-6" strokeWidth={2} />
					</div>
					<h3 class="text-lg font-semibold text-primary mb-2">Fair</h3>
					<p class="text-secondary text-sm">
						No commissions, no hidden fees. You keep 100% 
						of your earnings, always.
					</p>
				</div>
			</div>
		</div>

		<!-- Why We Started Section -->
		<div class="grid lg:grid-cols-2 gap-16 mb-16">
			<div class="professional-card">
				<div class="professional-badge-small mb-4">
					<Users class="w-3 h-3" />
					<span>The Problem</span>
				</div>
				<h2 class="text-2xl font-semibold text-primary mb-6">
					Tour Guides Deserve Better
				</h2>
				<div class="space-y-4 text-secondary">
					<p>
						Independent tour guides are the heart of the travel industry, but they've been 
						underserved by technology that's either too complex or takes too much of their earnings.
					</p>
					<p>
						We saw talented guides struggling with:</p>
					<ul class="list-disc list-inside space-y-2 ml-4">
						<li>Complex booking systems designed for big companies</li>
						<li>High commission fees eating into their income</li>
						<li>Unreliable technology that breaks at the worst times</li>
						<li>Poor customer support when they need help most</li>
					</ul>
				</div>
			</div>

			<div class="professional-card">
				<div class="professional-badge-small mb-4">
					<CheckCircle class="w-3 h-3" />
					<span>Our Solution</span>
				</div>
				<h2 class="text-2xl font-semibold text-primary mb-6">
					Technology That Works for You
				</h2>
				<div class="space-y-4 text-secondary">
					<p>
						Zaur is built specifically for independent tour guides who want professional 
						results without the complexity or costs of enterprise systems.
					</p>
					<p>
						What makes us different:</p>
					<ul class="list-disc list-inside space-y-2 ml-4">
						<li>Simple enough to set up in 5 minutes</li>
						<li>No commissions - you keep 100% of your earnings</li>
						<li>Works reliably, even in remote locations</li>
						<li>Real human support when you need it</li>
					</ul>
				</div>
			</div>
		</div>

		<!-- Values Section -->
		<div class="professional-card mb-16">
			<h2 class="text-2xl font-semibold text-primary text-center mb-12">Our Values</h2>
			<div class="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
				<div class="text-center">
					<div class="professional-icon professional-icon--coral mx-auto mb-4">
						<Users class="w-6 h-6" strokeWidth={2} />
					</div>
					<h3 class="text-lg font-semibold text-primary mb-3">Guides First</h3>
					<p class="text-secondary text-sm">
						Every decision we make is guided by what's best for tour guides. 
						You're not just customers, you're partners.
					</p>
				</div>
				
				<div class="text-center">
					<div class="professional-icon professional-icon--teal mx-auto mb-4">
						<Heart class="w-6 h-6" strokeWidth={2} />
					</div>
					<h3 class="text-lg font-semibold text-primary mb-3">Transparency</h3>
					<p class="text-secondary text-sm">
						No hidden fees, no complex contracts. What you see is what you get. 
						Clear pricing, clear communication.
					</p>
				</div>
				
				<div class="text-center">
					<div class="professional-icon professional-icon--orange mx-auto mb-4">
						<Rocket class="w-6 h-6" strokeWidth={2} />
					</div>
					<h3 class="text-lg font-semibold text-primary mb-3">Innovation</h3>
					<p class="text-secondary text-sm">
						We're constantly improving and adding features based on your feedback. 
						Your success drives our innovation.
					</p>
				</div>
				
				<div class="text-center">
					<div class="professional-icon professional-icon--navy mx-auto mb-4">
						<Globe class="w-6 h-6" strokeWidth={2} />
					</div>
					<h3 class="text-lg font-semibold text-primary mb-3">Global Impact</h3>
					<p class="text-secondary text-sm">
						Supporting independent tour guides worldwide helps preserve local culture 
						and creates authentic travel experiences.
					</p>
				</div>
			</div>
		</div>

		<!-- Early Access Section -->
		<div class="professional-card mb-16">
			<div class="text-center mb-8">
				<div class="professional-badge-small mb-4">
					<Crown class="w-3 h-3" />
					<span>Early Access Program</span>
				</div>
				<h2 class="text-2xl font-semibold text-primary mb-4">Join Our Founding Members</h2>
				<p class="text-lg text-secondary max-w-2xl mx-auto">
					We're accepting a limited number of tour guides for our early access program. 
					Help us build the future of tour guide technology.
				</p>
			</div>
			
			<div class="grid md:grid-cols-2 gap-8">
				<div class="space-y-4">
					<h3 class="text-lg font-semibold text-primary">What You Get:</h3>
					<ul class="space-y-3 text-secondary">
						<li class="flex items-center gap-3">
							<CheckCircle class="w-5 h-5 text-pro-teal-600 flex-shrink-0" />
							<span>Founding member pricing locked in forever</span>
						</li>
						<li class="flex items-center gap-3">
							<CheckCircle class="w-5 h-5 text-pro-teal-600 flex-shrink-0" />
							<span>Priority customer support</span>
						</li>
						<li class="flex items-center gap-3">
							<CheckCircle class="w-5 h-5 text-pro-teal-600 flex-shrink-0" />
							<span>Direct access to our development team</span>
						</li>
						<li class="flex items-center gap-3">
							<CheckCircle class="w-5 h-5 text-pro-teal-600 flex-shrink-0" />
							<span>Influence future features and development</span>
						</li>
					</ul>
				</div>
				
				<div class="space-y-4">
					<h3 class="text-lg font-semibold text-primary">What We Ask:</h3>
					<ul class="space-y-3 text-secondary">
						<li class="flex items-center gap-3">
							<CheckCircle class="w-5 h-5 text-coral-600 flex-shrink-0" />
							<span>Share feedback to help us improve</span>
						</li>
						<li class="flex items-center gap-3">
							<CheckCircle class="w-5 h-5 text-coral-600 flex-shrink-0" />
							<span>Be patient as we roll out new features</span>
						</li>
						<li class="flex items-center gap-3">
							<CheckCircle class="w-5 h-5 text-coral-600 flex-shrink-0" />
							<span>Help us test and refine the platform</span>
						</li>
						<li class="flex items-center gap-3">
							<CheckCircle class="w-5 h-5 text-coral-600 flex-shrink-0" />
							<span>Participate in occasional user research</span>
						</li>
					</ul>
				</div>
			</div>
		</div>

		<!-- Team Section -->
		<div class="professional-card mb-16">
			<h2 class="text-2xl font-semibold text-primary text-center mb-8">
				Built by People Who Care
			</h2>
			<div class="text-center max-w-3xl mx-auto">
				<p class="text-lg text-secondary mb-6">
					We're a small, dedicated team passionate about helping independent entrepreneurs succeed. 
					We believe technology should empower people, not complicate their lives.
				</p>
				<p class="text-secondary">
					Every feature we build, every decision we make is guided by one simple question: 
					"Will this help tour guides succeed?" If the answer isn't a clear yes, we don't do it.
				</p>
			</div>
		</div>

		<!-- Final CTA -->
		<div class="text-center">
			<div class="professional-card max-w-2xl mx-auto">
				<h3 class="text-2xl font-semibold text-primary mb-4">Ready to Join Us?</h3>
				<p class="text-lg mb-6 text-secondary">
					Be part of building the future of tour guide technology. 
					Join our early access program today.
				</p>
				<a href="/auth/register" class="button-coral button--large button--gap">
					<Rocket class="w-5 h-5" />
					Get Early Access
				</a>
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
		border: 2px solid var(--color-coral-500);
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
		background: var(--color-coral-100);
		border: 1px solid var(--color-coral-300);
		color: var(--color-coral-800);
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
		transition: all var(--transition-base) ease;
		box-shadow: var(--shadow-sm);
		position: relative;
		overflow: hidden;
	}
	
	/* Subtle accent line on hover */
	.professional-card::before {
		content: '';
		position: absolute;
		top: 0;
		left: 0;
		right: 0;
		height: 2px;
		background: var(--color-coral-500);
		transform: scaleX(0);
		transition: transform var(--transition-base) ease;
	}
	
	.professional-card:hover::before {
		transform: scaleX(1);
	}

	.professional-card:hover {
		transform: translateY(-2px);
		box-shadow: var(--shadow-lg);
		border-color: var(--border-secondary);
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
		background: var(--color-coral-500);
	}

	.professional-icon--orange {
		background: var(--color-warm-orange-500);
	}

	.professional-icon--teal {
		background: var(--color-pro-teal-500);
	}

	.professional-icon--navy {
		background: var(--color-deep-navy-900);
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