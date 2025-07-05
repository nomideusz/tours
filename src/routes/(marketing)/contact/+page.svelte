<script lang="ts">
	import Mail from 'lucide-svelte/icons/mail';
	import MessageCircle from 'lucide-svelte/icons/message-circle';
	import Clock from 'lucide-svelte/icons/clock';
	import MapPin from 'lucide-svelte/icons/map-pin';
	import Rocket from 'lucide-svelte/icons/rocket';
	import Compass from 'lucide-svelte/icons/compass';
	import Radio from 'lucide-svelte/icons/radio';
	import Mountain from 'lucide-svelte/icons/mountain';
	import Flag from 'lucide-svelte/icons/flag';
	import Crown from 'lucide-svelte/icons/crown';
	import Telescope from 'lucide-svelte/icons/telescope';
	import Globe from 'lucide-svelte/icons/globe';
	import Headphones from 'lucide-svelte/icons/headphones';
</script>

<svelte:head>
	<title>Expedition Base Camp - Zaur</title>
	<meta name="description" content="Contact the Zaur expedition headquarters - Support for tour guides on their adventure platform. Reach out to our expedition team for guidance and assistance." />
	<meta name="robots" content="index, follow" />
</svelte:head>

<div class="adventure-hero relative overflow-hidden">
	<div class="marketing-container relative z-10">
		<!-- Adventure Header -->
		<div class="text-center mb-12">
			<div class="inline-flex items-center justify-center w-24 h-24 rounded-full bg-gradient-to-br from-adventure-golden to-adventure-sunset mb-8 relative">
				<div class="absolute inset-0 rounded-full bg-gradient-to-br from-adventure-golden/20 to-adventure-sunset/20 blur-lg"></div>
				<Radio class="w-12 h-12 text-adventure-navy relative z-10" />
				<div class="absolute inset-0 rounded-full border-2 border-adventure-golden/30 animate-pulse"></div>
			</div>
			<h1 class="text-5xl font-bold text-white mb-6">Get in Touch</h1>
			<p class="text-xl max-w-3xl mx-auto text-adventure-golden/90 leading-relaxed">
				Have questions about Zaur? Need help getting started? 
				We're here to help tour guides succeed.
			</p>
		</div>

		<!-- Founding Expedition Notice -->
		<div class="max-w-4xl mx-auto mb-12">
			<div class="adventure-card bg-gradient-to-br from-white to-adventure-cream/30 border-2 border-adventure-golden/20 rounded-xl p-6 relative overflow-hidden shadow-xl">
				<div class="absolute inset-0 opacity-5">
					<div class="absolute inset-0 bg-gradient-to-br from-adventure-golden/10 to-transparent"></div>
				</div>
				<div class="relative z-10 flex items-start gap-4">
					<div class="flex-shrink-0">
						<div class="w-12 h-12 rounded-full bg-gradient-to-br from-adventure-sunset to-adventure-golden flex items-center justify-center">
							<Rocket class="w-6 h-6 text-adventure-navy" />
						</div>
					</div>
					<div class="flex-1">
						<div class="vintage-badge mb-3">
							<Crown class="w-4 h-4" />
							<span>Early Access</span>
						</div>
						<p class="text-adventure-navy font-medium">
							We're accepting a limited number of tour guides for our early access program. 
							Contact us to learn more about special pricing and benefits.
						</p>
					</div>
				</div>
			</div>
		</div>

		<!-- Communication Channels -->
		<div class="marketing-grid marketing-grid-2 gap-8 mb-16">
			<!-- Expedition Communications -->
			<div class="adventure-card bg-gradient-to-br from-white to-adventure-cream/30 border-2 border-adventure-golden/20 rounded-xl p-8 relative overflow-hidden shadow-xl">
				<div class="absolute inset-0 opacity-5">
					<div class="absolute inset-0 bg-gradient-to-br from-adventure-golden/10 to-transparent"></div>
					<div class="absolute top-4 left-4 w-6 h-6 border-2 border-adventure-golden/20 rounded-full"></div>
					<div class="absolute bottom-4 right-4 w-4 h-4 border-2 border-adventure-golden/20 rounded-full"></div>
				</div>
				<div class="relative z-10">
					<div class="flex items-center gap-4 mb-6">
						<div class="w-16 h-16 rounded-full bg-gradient-to-br from-adventure-teal to-adventure-navy flex items-center justify-center">
							<Mail class="w-8 h-8 text-white" />
						</div>
						<div>
							<h3 class="text-xl font-bold text-adventure-navy">Email Support</h3>
							<p class="text-sm text-adventure-earth">Get help via email</p>
						</div>
					</div>
					<p class="mb-6 text-adventure-navy leading-relaxed">
						For general inquiries, technical support, or questions about getting started with Zaur. 
						We typically respond within 24 hours.
					</p>
					<a 
						href="mailto:support@zaur.app" 
						class="inline-flex items-center gap-3 px-4 py-3 rounded-lg bg-gradient-to-r from-adventure-teal/10 to-adventure-navy/10 border-2 border-adventure-teal/20 text-adventure-teal hover:bg-adventure-teal/20 font-semibold transition-all duration-200"
					>
						<Mail class="w-5 h-5" />
						<span>support@zaur.app</span>
					</a>
				</div>
			</div>

			<!-- Join the Expedition -->
			<div class="adventure-card bg-gradient-to-br from-white to-adventure-cream/30 border-2 border-adventure-golden/20 rounded-xl p-8 relative overflow-hidden shadow-xl">
				<div class="absolute inset-0 opacity-5">
					<div class="absolute inset-0 bg-gradient-to-br from-adventure-golden/10 to-transparent"></div>
					<div class="absolute top-4 right-4 w-6 h-6 border-2 border-adventure-golden/20 rounded-full"></div>
					<div class="absolute bottom-4 left-4 w-4 h-4 border-2 border-adventure-golden/20 rounded-full"></div>
				</div>
				<div class="relative z-10">
					<div class="flex items-center gap-4 mb-6">
						<div class="w-16 h-16 rounded-full bg-gradient-to-br from-adventure-sunset to-adventure-golden flex items-center justify-center">
							<Flag class="w-8 h-8 text-adventure-navy" />
						</div>
						<div>
							<h3 class="text-xl font-bold text-adventure-navy">Early Access</h3>
							<p class="text-sm text-adventure-earth">Join our beta program</p>
						</div>
					</div>
					<p class="mb-6 text-adventure-navy leading-relaxed">
						Interested in being among the first tour guides to use Zaur? 
						Get priority access and help shape the product.
					</p>
					<a 
						href="/auth/register" 
						class="adventure-cta inline-flex items-center gap-2 px-6 py-3 text-sm font-bold text-adventure-navy relative overflow-hidden group"
					>
						<div class="relative z-10 flex items-center gap-2">
							<MessageCircle class="w-4 h-4" />
							<span>Request Early Access</span>
						</div>
					</a>
				</div>
			</div>
		</div>

		<!-- Expedition Headquarters Info -->
		<div class="adventure-card bg-gradient-to-br from-white to-adventure-cream/30 border-2 border-adventure-golden/20 rounded-xl p-12 mb-16 relative overflow-hidden shadow-2xl">
			<div class="absolute inset-0 opacity-5">
				<div class="absolute inset-0 bg-gradient-to-br from-adventure-golden/10 to-transparent"></div>
				<div class="absolute top-6 left-6 w-8 h-8 border-2 border-adventure-golden/20 rounded-full"></div>
				<div class="absolute top-6 right-6 w-6 h-6 border-2 border-adventure-golden/20 rounded-full"></div>
				<div class="absolute bottom-6 left-6 w-6 h-6 border-2 border-adventure-golden/20 rounded-full"></div>
				<div class="absolute bottom-6 right-6 w-8 h-8 border-2 border-adventure-golden/20 rounded-full"></div>
			</div>
			<div class="relative z-10">
				<h2 class="text-3xl font-bold text-adventure-navy text-center mb-12">Contact Information</h2>
				<div class="marketing-grid marketing-grid-3 gap-8">
					<!-- Response Time -->
					<div class="text-center">
						<div class="w-16 h-16 rounded-full bg-gradient-to-br from-adventure-teal to-adventure-navy flex items-center justify-center mx-auto mb-6">
							<Clock class="w-8 h-8 text-white" />
						</div>
						<h4 class="text-lg font-bold text-adventure-navy mb-3">Response Time</h4>
						<p class="text-adventure-earth leading-relaxed">
							We typically respond to all inquiries within 24 hours 
							during business days.
						</p>
					</div>

					<!-- Expedition Hours -->
					<div class="text-center">
						<div class="w-16 h-16 rounded-full bg-gradient-to-br from-adventure-sunset to-adventure-golden flex items-center justify-center mx-auto mb-6">
							<Headphones class="w-8 h-8 text-adventure-navy" />
						</div>
						<h4 class="text-lg font-bold text-adventure-navy mb-3">Business Hours</h4>
						<p class="text-adventure-earth leading-relaxed">
							Monday - Friday<br>
							9:00 AM - 6:00 PM CET<br>
							<span class="text-adventure-teal font-medium">Central European Time</span>
						</p>
					</div>

					<!-- Base Location -->
					<div class="text-center">
						<div class="w-16 h-16 rounded-full bg-gradient-to-br from-adventure-golden to-adventure-sunset flex items-center justify-center mx-auto mb-6">
							<Globe class="w-8 h-8 text-adventure-navy" />
						</div>
						<h4 class="text-lg font-bold text-adventure-navy mb-3">Location</h4>
						<p class="text-adventure-earth leading-relaxed">
							Based in Europe<br>
							Serving tour guides<br>
							<span class="text-adventure-teal font-medium">worldwide</span>
						</p>
					</div>
				</div>
			</div>
		</div>

		<!-- Explorer Questions -->
		<div class="mb-16">
			<h2 class="text-3xl font-bold text-white text-center mb-12">Explorer Questions</h2>
			<div class="space-y-6">
				<div class="adventure-card bg-gradient-to-br from-white to-adventure-cream/30 border-2 border-adventure-golden/20 rounded-xl p-6 relative overflow-hidden">
					<div class="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-adventure-golden to-adventure-sunset"></div>
					<h3 class="text-lg font-bold text-adventure-navy mb-3">How do I begin my expedition with Zaur?</h3>
					<p class="text-adventure-earth leading-relaxed">
						Simply join our founding expedition, and we'll guide you through establishing your first 
						adventure route and QR expedition portal. The journey takes less than 5 minutes to begin.
					</p>
				</div>

				<div class="adventure-card bg-gradient-to-br from-white to-adventure-cream/30 border-2 border-adventure-golden/20 rounded-xl p-6 relative overflow-hidden">
					<div class="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-adventure-golden to-adventure-sunset"></div>
					<h3 class="text-lg font-bold text-adventure-navy mb-3">What's included in the Founding Expedition?</h3>
					<p class="text-adventure-earth leading-relaxed">
						Founding expedition members secure explorer pricing forever, priority support, direct access 
						to expedition leaders, and the power to shape our route map. New territories are being 
						charted progressively.
					</p>
				</div>

				<div class="adventure-card bg-gradient-to-br from-white to-adventure-cream/30 border-2 border-adventure-golden/20 rounded-xl p-6 relative overflow-hidden">
					<div class="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-adventure-golden to-adventure-sunset"></div>
					<h3 class="text-lg font-bold text-adventure-navy mb-3">Do I need technical expedition skills?</h3>
					<p class="text-adventure-earth leading-relaxed">
						Not at all! Zaur is crafted for expedition leaders, not tech specialists. Everything is 
						intuitive and clear. If you can navigate WhatsApp, you can master Zaur.
					</p>
				</div>

				<div class="adventure-card bg-gradient-to-br from-white to-adventure-cream/30 border-2 border-adventure-golden/20 rounded-xl p-6 relative overflow-hidden">
					<div class="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-adventure-golden to-adventure-sunset"></div>
					<h3 class="text-lg font-bold text-adventure-navy mb-3">What treasure system do you use?</h3>
					<p class="text-adventure-earth leading-relaxed">
						We use Stripe for secure treasure handling. You keep 100% of your expedition earnings - 
						we only charge a simple monthly passage fee, no treasure taxes on bookings.
					</p>
				</div>
			</div>
		</div>

		<!-- Join Expedition CTA -->
		<div class="text-center">
			<div class="adventure-card bg-gradient-to-br from-white to-adventure-cream/30 border-2 border-adventure-golden/20 rounded-xl p-12 relative overflow-hidden shadow-2xl">
				<div class="absolute inset-0 opacity-5">
					<div class="absolute inset-0 bg-gradient-to-br from-adventure-golden/10 to-transparent"></div>
					<div class="journey-divider absolute top-1/2 left-0 w-full h-px transform -translate-y-1/2"></div>
				</div>
				<div class="relative z-10">
					<div class="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-adventure-golden to-adventure-sunset mb-6">
						<Mountain class="w-8 h-8 text-adventure-navy" />
					</div>
					<h3 class="text-3xl font-bold text-adventure-navy mb-4">Ready to Transform Your Expedition?</h3>
					<p class="text-lg mb-8 max-w-2xl mx-auto text-adventure-earth leading-relaxed">
						Join the founding expedition and be among the first tour guides to chart 
						new territories with Zaur.
					</p>
					<a href="/auth/register" class="adventure-cta inline-flex items-center gap-2 px-8 py-4 text-base font-bold text-adventure-navy relative overflow-hidden group">
						<div class="relative z-10 flex items-center gap-2">
							<Compass class="w-5 h-5" />
							<span>Join the Founding Expedition</span>
						</div>
					</a>
				</div>
			</div>
		</div>
	</div>
</div> 