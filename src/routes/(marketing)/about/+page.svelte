<script lang="ts">
	import Users from 'lucide-svelte/icons/users';
	import Heart from 'lucide-svelte/icons/heart';
	import Zap from 'lucide-svelte/icons/zap';
	import Globe from 'lucide-svelte/icons/globe';
	import Rocket from 'lucide-svelte/icons/rocket';
	import Shield from 'lucide-svelte/icons/shield';
	import AlertCircle from 'lucide-svelte/icons/alert-circle';
	import MapPin from 'lucide-svelte/icons/map-pin';
	import Compass from 'lucide-svelte/icons/compass';
	import Mountain from 'lucide-svelte/icons/mountain';
	import Route from 'lucide-svelte/icons/route';
	import Backpack from 'lucide-svelte/icons/backpack';
	import Flag from 'lucide-svelte/icons/flag';
	import Crown from 'lucide-svelte/icons/crown';
	import Telescope from 'lucide-svelte/icons/telescope';
</script>

<svelte:head>
	<title>About the Expedition - Zaur</title>
	<meta name="description" content="Join the Zaur expedition - The adventure platform built for tour guides. Our mission to empower explorers worldwide and create unforgettable journeys." />
	<meta name="robots" content="index, follow" />
</svelte:head>

<div class="adventure-hero relative overflow-hidden">
	<div class="marketing-container relative z-10">
		<!-- Adventure Header -->
		<div class="text-center mb-16">
			<div class="inline-flex items-center justify-center w-24 h-24 rounded-full bg-gradient-to-br from-adventure-golden to-adventure-sunset mb-8 relative">
				<div class="absolute inset-0 rounded-full bg-gradient-to-br from-adventure-golden/20 to-adventure-sunset/20 blur-lg"></div>
				<Mountain class="w-12 h-12 text-adventure-navy relative z-10" />
				<div class="absolute inset-0 rounded-full border-2 border-adventure-golden/30 animate-pulse"></div>
			</div>
			<h1 class="text-5xl font-bold text-white mb-6">About Zaur</h1>
			<p class="text-xl max-w-3xl mx-auto text-adventure-golden/90 leading-relaxed">
				The simplest booking system for independent tour guides. 
				More bookings, less hassle, built by guides for guides.
			</p>
		</div>

		<!-- Founding Expedition Badge -->
		<div class="max-w-4xl mx-auto mb-16">
			<div class="adventure-card bg-gradient-to-br from-white to-adventure-cream/30 border-2 border-adventure-golden/20 rounded-xl p-8 relative overflow-hidden shadow-2xl">
				<div class="absolute inset-0 opacity-5">
					<div class="absolute inset-0 bg-gradient-to-br from-adventure-golden/10 to-transparent"></div>
					<div class="absolute top-4 left-4 w-2 h-2 bg-adventure-golden/20 rounded-full"></div>
					<div class="absolute top-8 right-8 w-3 h-3 bg-adventure-golden/20 rounded-full"></div>
					<div class="absolute bottom-8 left-8 w-2 h-2 bg-adventure-golden/20 rounded-full"></div>
					<div class="absolute bottom-4 right-4 w-4 h-4 bg-adventure-golden/20 rounded-full"></div>
				</div>
				<div class="relative z-10 flex items-start gap-4">
					<div class="flex-shrink-0">
						<div class="w-16 h-16 rounded-full bg-gradient-to-br from-adventure-sunset to-adventure-golden flex items-center justify-center">
							<Rocket class="w-8 h-8 text-adventure-navy" />
						</div>
					</div>
					<div class="flex-1">
						<div class="vintage-badge mb-4">
							<Crown class="w-4 h-4" />
							<span>Early Access</span>
						</div>
						<h3 class="text-2xl font-bold text-adventure-navy mb-3">Join Early Access</h3>
						<p class="text-adventure-earth mb-6 leading-relaxed">
							Zaur is currently in development with a select group of tour guides helping shape the platform. 
							Join now to lock in special early access pricing and be part of our founding community.
						</p>
						<a href="/auth/register" class="adventure-cta inline-flex items-center gap-2 px-6 py-3 text-sm font-bold text-adventure-navy relative overflow-hidden group">
							<div class="relative z-10 flex items-center gap-2">
								<Flag class="w-4 h-4" />
								<span>Get Early Access</span>
							</div>
						</a>
					</div>
				</div>
			</div>
		</div>

		<!-- Expedition Mission -->
		<div class="adventure-card bg-gradient-to-br from-white to-adventure-cream/30 border-2 border-adventure-golden/20 rounded-xl p-12 mb-16 relative overflow-hidden shadow-2xl">
			<div class="absolute inset-0 opacity-5">
				<div class="absolute inset-0 bg-gradient-to-br from-adventure-golden/10 to-transparent"></div>
				<div class="absolute top-6 left-6 w-8 h-8 border-2 border-adventure-golden/20 rounded-full"></div>
				<div class="absolute top-6 right-6 w-6 h-6 border-2 border-adventure-golden/20 rounded-full"></div>
				<div class="absolute bottom-6 left-6 w-6 h-6 border-2 border-adventure-golden/20 rounded-full"></div>
				<div class="absolute bottom-6 right-6 w-8 h-8 border-2 border-adventure-golden/20 rounded-full"></div>
			</div>
			<div class="relative z-10 text-center">
				<div class="w-20 h-20 rounded-full bg-gradient-to-br from-adventure-sunset to-adventure-golden flex items-center justify-center mx-auto mb-8">
					<Heart class="w-10 h-10 text-adventure-navy" />
				</div>
				<h2 class="text-3xl font-bold text-adventure-navy mb-6">Our Mission</h2>
				<p class="text-xl max-w-4xl mx-auto text-adventure-earth leading-relaxed">
					Every tour guide deserves to focus on what they love most: sharing amazing experiences with travelers. 
					We handle the technical complexity so you can focus on creating unforgettable journeys.
				</p>
			</div>
		</div>

		<!-- The Challenge We're Conquering -->
		<div class="mb-16">
			<h2 class="text-3xl font-bold text-white text-center mb-12">The Problem We're Solving</h2>
			<div class="marketing-grid marketing-grid-2 gap-8">
				<div class="adventure-card bg-gradient-to-br from-white to-adventure-cream/30 border-2 border-red-300 rounded-xl p-8 relative overflow-hidden">
					<div class="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-red-400 to-red-500"></div>
					<div class="flex items-center gap-3 mb-6">
						<div class="w-12 h-12 rounded-full bg-gradient-to-br from-red-400 to-red-500 flex items-center justify-center">
							<AlertCircle class="w-6 h-6 text-white" />
						</div>
						<h3 class="text-xl font-bold text-adventure-navy">Before Zaur</h3>
					</div>
					<ul class="space-y-3 text-adventure-navy">
						<li class="flex items-center gap-3">
							<div class="w-2 h-2 bg-red-400 rounded-full"></div>
							<span>WhatsApp chaos for bookings</span>
						</li>
						<li class="flex items-center gap-3">
							<div class="w-2 h-2 bg-red-400 rounded-full"></div>
							<span>Paper forms and cash payments</span>
						</li>
						<li class="flex items-center gap-3">
							<div class="w-2 h-2 bg-red-400 rounded-full"></div>
							<span>Lost bookings and double bookings</span>
						</li>
						<li class="flex items-center gap-3">
							<div class="w-2 h-2 bg-red-400 rounded-full"></div>
							<span>Hours spent on administrative tasks</span>
						</li>
						<li class="flex items-center gap-3">
							<div class="w-2 h-2 bg-red-400 rounded-full"></div>
							<span>No professional online presence</span>
						</li>
					</ul>
				</div>

				<div class="adventure-card bg-gradient-to-br from-white to-adventure-cream/30 border-2 border-adventure-golden/20 rounded-xl p-8 relative overflow-hidden">
					<div class="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-adventure-golden to-adventure-sunset"></div>
					<div class="flex items-center gap-3 mb-6">
						<div class="w-12 h-12 rounded-full bg-gradient-to-br from-adventure-golden to-adventure-sunset flex items-center justify-center">
							<Flag class="w-6 h-6 text-adventure-navy" />
						</div>
						<h3 class="text-xl font-bold text-adventure-navy">With Zaur</h3>
					</div>
					<ul class="space-y-3 text-adventure-navy">
						<li class="flex items-center gap-3">
							<div class="w-2 h-2 bg-adventure-golden rounded-full"></div>
							<span>Professional QR code booking system</span>
						</li>
						<li class="flex items-center gap-3">
							<div class="w-2 h-2 bg-adventure-golden rounded-full"></div>
							<span>Instant online payments via Stripe</span>
						</li>
						<li class="flex items-center gap-3">
							<div class="w-2 h-2 bg-adventure-golden rounded-full"></div>
							<span>Automated booking management</span>
						</li>
						<li class="flex items-center gap-3">
							<div class="w-2 h-2 bg-adventure-golden rounded-full"></div>
							<span>Real-time notifications and updates</span>
						</li>
						<li class="flex items-center gap-3">
							<div class="w-2 h-2 bg-adventure-golden rounded-full"></div>
							<span>Focus on guiding, not admin work</span>
						</li>
					</ul>
				</div>
			</div>
		</div>

		<!-- Explorer Values -->
		<div class="mb-16">
			<h2 class="text-3xl font-bold text-white text-center mb-12">Our Explorer's Code</h2>
			<div class="marketing-grid marketing-grid-3 gap-8">
				<div class="text-center">
					<div class="w-16 h-16 rounded-full bg-gradient-to-br from-adventure-teal to-adventure-navy flex items-center justify-center mx-auto mb-6">
						<Zap class="w-8 h-8 text-white" />
					</div>
					<h3 class="text-xl font-bold text-white mb-4">Simplicity by Design</h3>
					<p class="text-adventure-golden/80 leading-relaxed">
						Every trail should lead to clarity, not confusion. Our expedition tools 
						are crafted with the elegance of a perfectly planned route.
					</p>
				</div>

				<div class="text-center">
					<div class="w-16 h-16 rounded-full bg-gradient-to-br from-adventure-sunset to-adventure-golden flex items-center justify-center mx-auto mb-6">
						<Users class="w-8 h-8 text-adventure-navy" />
					</div>
					<h3 class="text-xl font-bold text-white mb-4">Guides Lead the Way</h3>
					<p class="text-adventure-golden/80 leading-relaxed">
						Built by explorers, for explorers. Every compass direction we take 
						is guided by the wisdom of independent tour guides worldwide.
					</p>
				</div>

				<div class="text-center">
					<div class="w-16 h-16 rounded-full bg-gradient-to-br from-adventure-golden to-adventure-sunset flex items-center justify-center mx-auto mb-6">
						<Shield class="w-8 h-8 text-adventure-navy" />
					</div>
					<h3 class="text-xl font-bold text-white mb-4">Fair Trade Expeditions</h3>
					<p class="text-adventure-golden/80 leading-relaxed">
						Transparent monthly passage, no treasure taxes. Keep 100% of your 
						expedition earnings. Clear pricing, no hidden crevasses.
					</p>
				</div>
			</div>
		</div>

		<!-- Founding Expedition Details -->
		<div class="adventure-card bg-gradient-to-br from-white to-adventure-cream/30 border-2 border-adventure-golden/20 rounded-xl p-12 mb-16 relative overflow-hidden shadow-2xl">
			<div class="absolute inset-0 opacity-5">
				<div class="absolute inset-0 bg-gradient-to-br from-adventure-golden/10 to-transparent"></div>
				<div class="journey-divider absolute top-1/2 left-0 w-full h-px transform -translate-y-1/2"></div>
			</div>
			<div class="relative z-10 text-center">
				<div class="vintage-badge mb-6">
					<Crown class="w-5 h-5" />
					<span>Founding Expedition Program</span>
				</div>
				<h2 class="text-3xl font-bold text-adventure-navy mb-6">Chart the Course with Us</h2>
				<p class="text-lg mb-8 max-w-3xl mx-auto text-adventure-earth leading-relaxed">
					We're currently in the founding expedition phase, working alongside a select crew of 
					pioneering tour guides to chart the perfect course before our grand departure.
				</p>
				<div class="marketing-grid marketing-grid-2 gap-8 max-w-4xl mx-auto">
					<div class="adventure-card bg-gradient-to-br from-white to-adventure-cream/50 border-2 border-adventure-golden/20 rounded-xl p-6 relative overflow-hidden">
						<div class="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-adventure-golden to-adventure-sunset"></div>
						<div class="flex items-center gap-3 mb-4">
							<div class="w-10 h-10 rounded-full bg-gradient-to-br from-adventure-golden to-adventure-sunset flex items-center justify-center">
								<Telescope class="w-5 h-5 text-adventure-navy" />
							</div>
							<h4 class="text-lg font-bold text-adventure-navy">Explorer Benefits</h4>
						</div>
						<ul class="space-y-2 text-sm text-adventure-navy">
							<li class="flex items-center gap-2">
								<div class="w-1.5 h-1.5 bg-adventure-golden rounded-full"></div>
								<span>Founding expedition pricing forever</span>
							</li>
							<li class="flex items-center gap-2">
								<div class="w-1.5 h-1.5 bg-adventure-golden rounded-full"></div>
								<span>Priority route requests</span>
							</li>
							<li class="flex items-center gap-2">
								<div class="w-1.5 h-1.5 bg-adventure-golden rounded-full"></div>
								<span>Direct line to expedition leaders</span>
							</li>
							<li class="flex items-center gap-2">
								<div class="w-1.5 h-1.5 bg-adventure-golden rounded-full"></div>
								<span>Shape the expedition map</span>
							</li>
							<li class="flex items-center gap-2">
								<div class="w-1.5 h-1.5 bg-adventure-golden rounded-full"></div>
								<span>Exclusive explorer community</span>
							</li>
						</ul>
					</div>
					<div class="adventure-card bg-gradient-to-br from-white to-adventure-cream/50 border-2 border-adventure-teal/20 rounded-xl p-6 relative overflow-hidden">
						<div class="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-adventure-teal to-adventure-navy"></div>
						<div class="flex items-center gap-3 mb-4">
							<div class="w-10 h-10 rounded-full bg-gradient-to-br from-adventure-teal to-adventure-navy flex items-center justify-center">
								<Compass class="w-5 h-5 text-white" />
							</div>
							<h4 class="text-lg font-bold text-adventure-navy">Your Contribution</h4>
						</div>
						<ul class="space-y-2 text-sm text-adventure-navy">
							<li class="flex items-center gap-2">
								<div class="w-1.5 h-1.5 bg-adventure-teal rounded-full"></div>
								<span>Share your explorer wisdom</span>
							</li>
							<li class="flex items-center gap-2">
								<div class="w-1.5 h-1.5 bg-adventure-teal rounded-full"></div>
								<span>Test uncharted features</span>
							</li>
							<li class="flex items-center gap-2">
								<div class="w-1.5 h-1.5 bg-adventure-teal rounded-full"></div>
								<span>Map your workflow</span>
							</li>
							<li class="flex items-center gap-2">
								<div class="w-1.5 h-1.5 bg-adventure-teal rounded-full"></div>
								<span>Patience with new territories</span>
							</li>
							<li class="flex items-center gap-2">
								<div class="w-1.5 h-1.5 bg-adventure-teal rounded-full"></div>
								<span>Spread word of the expedition</span>
							</li>
						</ul>
					</div>
				</div>
			</div>
		</div>

		<!-- Join the Expedition -->
		<div class="text-center">
			<h2 class="text-3xl font-bold text-white mb-6">Ready to Join the Expedition?</h2>
			<p class="text-lg mb-8 max-w-3xl mx-auto text-adventure-golden/90 leading-relaxed">
				Become one of the founding explorers to chart new territories in tour guide technology. 
				Join our expedition and help us map the future of adventure travel.
			</p>
			<div class="flex flex-col sm:flex-row gap-4 justify-center">
				<a href="/auth/register" class="adventure-cta inline-flex items-center gap-2 px-8 py-4 text-base font-bold text-adventure-navy relative overflow-hidden group">
					<div class="relative z-10 flex items-center gap-2">
						<Backpack class="w-5 h-5" />
						<span>Join the Founding Expedition</span>
					</div>
				</a>
				<a href="/contact" class="px-8 py-4 rounded-lg border-2 border-adventure-golden/40 bg-adventure-golden/10 text-adventure-golden hover:bg-adventure-golden/20 font-bold text-base transition-all duration-200 inline-flex items-center gap-2">
					<MapPin class="w-5 h-5" />
					<span>Contact Expedition Leaders</span>
				</a>
			</div>
		</div>
	</div>
</div> 