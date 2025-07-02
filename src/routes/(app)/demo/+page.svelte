<script lang="ts">
	import { onMount } from 'svelte';
	import { fade, fly } from 'svelte/transition';
	import { browser } from '$app/environment';
	import { globalCurrencyFormatter } from '$lib/utils/currency.js';
	import { formatDate, getStatusColor, getPaymentStatusColor, formatDateTime } from '$lib/utils/date-helpers.js';
	import { formatSlotTimeRange } from '$lib/utils/time-slot-client.js';
	
	// Components
	import PageHeader from '$lib/components/PageHeader.svelte';
	import StatsCard from '$lib/components/StatsCard.svelte';
	import TourTimeline from '$lib/components/TourTimeline.svelte';
	import StyledQRCode from '$lib/components/StyledQRCode.svelte';
	import Tooltip from '$lib/components/Tooltip.svelte';
	
	// Icons
	import MapPin from 'lucide-svelte/icons/map-pin';
	import Calendar from 'lucide-svelte/icons/calendar';
	import Users from 'lucide-svelte/icons/users';
	import DollarSign from 'lucide-svelte/icons/dollar-sign';
	import Euro from 'lucide-svelte/icons/euro';
	import TrendingUp from 'lucide-svelte/icons/trending-up';
	import Clock from 'lucide-svelte/icons/clock';
	import Eye from 'lucide-svelte/icons/eye';
	import QrCode from 'lucide-svelte/icons/qr-code';
	import CheckCircle from 'lucide-svelte/icons/check-circle';
	import Star from 'lucide-svelte/icons/star';
	import Award from 'lucide-svelte/icons/award';
	import Globe from 'lucide-svelte/icons/globe';
	import Sparkles from 'lucide-svelte/icons/sparkles';
	import Baby from 'lucide-svelte/icons/baby';
	import Camera from 'lucide-svelte/icons/camera';
	import Shield from 'lucide-svelte/icons/shield';
	import Zap from 'lucide-svelte/icons/zap';
	import BarChart3 from 'lucide-svelte/icons/bar-chart-3';
	import CreditCard from 'lucide-svelte/icons/credit-card';
	import Wine from 'lucide-svelte/icons/wine';
	import Building from 'lucide-svelte/icons/building';
	
	// Demo data state
	let showContent = $state(false);
	let statsAnimated = $state(false);
	let currentDate = $state(new Date());
	
	// Timeline state
	let timelineView = $state<'day' | 'week' | 'month'>('week');
	
	// Impressive demo statistics
	const stats = [
		{
			title: 'Monthly Revenue',
			value: $globalCurrencyFormatter(24850),
			icon: DollarSign,
			trend: { value: '+32%', positive: true },
			subtitle: '+32% from last month',
			color: 'green'
		},
		{
			title: 'Total Bookings',
			value: '847',
			icon: Users,
			trend: { value: '+18%', positive: true },
			subtitle: '126 this week',
			color: 'blue'
		},
		{
			title: 'Average Rating',
			value: '4.9',
			icon: Star,
			trend: { value: '+0.2', positive: true },
			subtitle: 'From 234 reviews',
			color: 'yellow'
		},
		{
			title: 'QR Conversion',
			value: '26.1%',
			icon: TrendingUp,
			trend: { value: '+4.3%', positive: true },
			subtitle: '3,245 scans',
			color: 'purple'
		}
	];
	
	// Sample tours with different types
	const sampleTours = [
		{
			id: '1',
			name: 'Sunset Photography Workshop',
			description: 'Capture stunning sunset views from the best vantage points in the city',
			price: 89,
			currency: 'EUR',
			duration: '3 hours',
			maxCapacity: 12,
			status: 'active',
			qrCode: 'TUR-SUN-DEMO1',
			qrScans: 412,
			qrConversions: 108,
			rating: 4.9,
			reviews: 67,
			icon: Camera,
			tags: ['Photography', 'Outdoor', 'Workshop'],
			pricingTiers: [
				{ name: 'Standard', price: 89 },
				{ name: 'Premium (incl. equipment)', price: 129 },
				{ name: 'Private Group', price: 350 }
			]
		},
		{
			id: '2',
			name: 'Historic City Walking Tour',
			description: 'Discover hidden gems and fascinating stories from centuries past',
			price: 35,
			currency: 'EUR',
			duration: '2 hours',
			maxCapacity: 25,
			status: 'active',
			qrCode: 'TUR-HIS-DEMO2',
			qrScans: 892,
			qrConversions: 234,
			rating: 4.8,
			reviews: 143,
			icon: Building,
			tags: ['History', 'Walking', 'Culture'],
			pricingTiers: [
				{ name: 'Adult', price: 35 },
				{ name: 'Student/Senior', price: 28 },
				{ name: 'Family (2+2)', price: 95 }
			]
		},
		{
			id: '3',
			name: 'Wine Tasting Experience',
			description: 'Sample premium local wines with expert sommelier guidance',
			price: 125,
			currency: 'EUR',
			duration: '4 hours',
			maxCapacity: 16,
			status: 'active',
			qrCode: 'TUR-WIN-DEMO3',
			qrScans: 623,
			qrConversions: 187,
			rating: 5.0,
			reviews: 89,
			icon: Wine,
			tags: ['Wine', 'Gastronomy', 'Experience'],
			pricingTiers: [
				{ name: 'Standard (5 wines)', price: 125 },
				{ name: 'Premium (8 wines)', price: 175 },
				{ name: 'VIP (with dinner)', price: 295 }
			]
		}
	];
	
	// Recent bookings for activity feed
	const recentBookings = [
		{
			customerName: 'Sarah Johnson',
			tourName: 'Sunset Photography Workshop',
			time: new Date(Date.now() - 15 * 60 * 1000), // 15 minutes ago
			tourDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000), // 2 days from now
			totalAmount: 129,
			participants: 1,
			status: 'confirmed',
			paymentStatus: 'paid',
			nationality: '🇺🇸'
		},
		{
			customerName: 'Marco Rossi',
			tourName: 'Wine Tasting Experience',
			time: new Date(Date.now() - 45 * 60 * 1000), // 45 minutes ago
			tourDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), // 3 days from now
			totalAmount: 175,
			participants: 2,
			status: 'confirmed',
			paymentStatus: 'paid',
			nationality: '🇮🇹'
		},
		{
			customerName: 'Emma Chen',
			tourName: 'Historic City Walking Tour',
			time: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
			tourDate: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000), // tomorrow
			totalAmount: 70,
			participants: 2,
			status: 'confirmed',
			paymentStatus: 'paid',
			nationality: '🇨🇳'
		},
		{
			customerName: 'David Smith',
			tourName: 'Sunset Photography Workshop',
			time: new Date(Date.now() - 3 * 60 * 60 * 1000), // 3 hours ago
			tourDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000), // 2 days from now
			totalAmount: 89,
			participants: 1,
			status: 'confirmed',
			paymentStatus: 'paid',
			nationality: '🇬🇧'
		},
		{
			customerName: 'Lisa Wang',
			tourName: 'Wine Tasting Experience',
			time: new Date(Date.now() - 5 * 60 * 60 * 1000), // 5 hours ago
			tourDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000), // 5 days from now
			totalAmount: 295,
			participants: 2,
			status: 'confirmed',
			paymentStatus: 'paid',
			nationality: '🇯🇵'
		}
	];
	
	// Weekly revenue data for chart
	const weeklyRevenue = [
		{ day: 'Mon', revenue: 2840 },
		{ day: 'Tue', revenue: 3120 },
		{ day: 'Wed', revenue: 2950 },
		{ day: 'Thu', revenue: 4180 },
		{ day: 'Fri', revenue: 5230 },
		{ day: 'Sat', revenue: 4890 },
		{ day: 'Sun', revenue: 3640 }
	];
	
	const maxRevenue = Math.max(...weeklyRevenue.map(d => d.revenue));
	
	// Mount animations
	onMount(() => {
		// Stagger content appearance
		setTimeout(() => {
			showContent = true;
		}, 100);
		
		// Animate stats after content shows
		setTimeout(() => {
			statsAnimated = true;
		}, 500);
	});
	
	// Format duration helper
	function formatDuration(minutes: number): string {
		const hours = Math.floor(minutes / 60);
		const mins = minutes % 60;
		if (hours > 0 && mins > 0) {
			return `${hours}h ${mins}m`;
		} else if (hours > 0) {
			return `${hours} hours`;
		} else {
			return `${mins} minutes`;
		}
	}
	
	// Generate professional-looking QR preview URL
	function getQRPreviewUrl(qrCode: string): string {
		return `${browser ? window.location.origin : 'https://zaur.app'}/book/${qrCode}`;
	}
</script>

<svelte:head>
	<title>Zaur Demo - Tour Management Platform</title>
	<meta name="description" content="Experience the power of Zaur - Professional tour management made simple" />
</svelte:head>

<div class="demo-container">
	<!-- Hero Section with Key Metrics -->
	<div class="hero-section">
		<div class="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
			<div class="text-center mb-8">
				<div class="inline-flex items-center gap-2 px-4 py-2 rounded-full mb-4" 
					style="background: var(--color-primary-100); color: var(--color-primary-700);">
					<Sparkles class="w-4 h-4" />
					<span class="text-sm font-medium">Live Demo Dashboard</span>
				</div>
				<h1 class="text-3xl sm:text-4xl lg:text-5xl font-bold mb-4" style="color: var(--text-primary);">
					Welcome to Your Tour Empire
				</h1>
				<p class="text-lg sm:text-xl max-w-3xl mx-auto" style="color: var(--text-secondary);">
					See how Zaur helps tour operators manage bookings, track performance, and grow their business
				</p>
			</div>
			
			<!-- Impressive Stats Grid -->
			{#if showContent}
				<div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8" in:fade={{ duration: 600, delay: 200 }}>
					{#each stats as stat, index}
						<div class="transform transition-all duration-500 hover:scale-105" 
							 style="animation-delay: {index * 100}ms"
							 class:animate-fade-in-up={statsAnimated}>
							<StatsCard
								title={stat.title}
								value={stat.value}
								icon={stat.icon}
								trend={stat.trend}
								subtitle={stat.subtitle}
							/>
						</div>
					{/each}
				</div>
			{/if}
		</div>
	</div>
	
	<div class="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8 pb-12">
		<!-- Tour Showcase Section -->
		{#if showContent}
			<div class="mb-12 mt-16" in:fly={{ y: 20, duration: 600, delay: 400 }}>
				<div class="text-center mb-12">
					<div class="inline-flex items-center gap-2 px-4 py-2 rounded-full mb-4" 
						style="background: var(--color-success-100); color: var(--color-success-700);">
						<CheckCircle class="w-4 h-4" />
						<span class="text-sm font-medium">3 Active Tours</span>
					</div>
					<h2 class="text-3xl font-bold mb-4" style="color: var(--text-primary);">
						Your Active Tours
					</h2>
					<p class="text-lg max-w-2xl mx-auto" style="color: var(--text-secondary);">
						Professional tour management with real-time bookings, automated payments, and detailed analytics
					</p>
				</div>
				
				<div class="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
										{#each sampleTours as tour, index}
						<div class="tour-card-premium" in:fade={{ duration: 500, delay: 500 + index * 100 }}>
							<!-- Tour Image -->
							<div class="tour-image">
								<div class="tour-image-photo tour-image-{index + 1}">
									<div class="tour-image-overlay">
										<div class="tour-image-content">
											<tour.icon class="w-8 h-8 text-white mb-2" />
											<p class="text-sm font-medium text-white">{tour.tags[0]}</p>
										</div>
									</div>
								</div>
								
								<!-- Status & Rating Badges -->
								<div class="absolute top-3 left-3 flex gap-2">
									<span class="status-badge active">
										<Zap class="w-3 h-3" />
										Active
									</span>
									<span class="rating-badge">
										<Star class="w-3 h-3 fill-current" />
										{tour.rating}
									</span>
								</div>
								
								<!-- QR Code Preview -->
								<div class="absolute bottom-3 right-3">
									<Tooltip text="Click to view booking page" position="top">
										<div class="qr-preview">
											<StyledQRCode
												qrCode={tour.qrCode}
												tourName={tour.name}
												size={80}
												style="modern"
											/>
											<div class="qr-stats">
												<p class="text-xs font-medium">{tour.qrScans}</p>
												<p class="text-xs opacity-75">scans</p>
											</div>
										</div>
									</Tooltip>
								</div>
							</div>
							
							<!-- Tour Details - Using flex layout to push buttons to bottom -->
							<div class="tour-card-content">
								<div class="tour-card-info">
									<h3 class="text-lg font-semibold mb-2" style="color: var(--text-primary);">
										{tour.name}
									</h3>
									<p class="text-sm mb-4" style="color: var(--text-secondary);">
										{tour.description}
									</p>
									
									<!-- Key Info -->
									<div class="grid grid-cols-2 gap-3 mb-4">
										<div class="info-item">
											<MapPin class="w-3 h-3" />
											<span>Barcelona</span>
										</div>
										<div class="info-item">
											<Clock class="w-3 h-3" />
											<span>{tour.duration}</span>
										</div>
										<div class="info-item">
											<Users class="w-3 h-3" />
											<span>{tour.maxCapacity} max</span>
										</div>
										<div class="info-item">
											<Globe class="w-3 h-3" />
											<span>{tour.reviews} reviews</span>
										</div>
									</div>
									
									<!-- Pricing -->
									<div class="pricing-section">
										<div class="flex items-baseline gap-2">
											<span class="text-2xl font-bold" style="color: var(--color-primary-600);">
												{$globalCurrencyFormatter(tour.price)}
											</span>
											<span class="text-sm" style="color: var(--text-secondary);">
												per person
											</span>
										</div>
										{#if tour.pricingTiers.length > 1}
											<div class="mt-2">
												<span class="text-xs" style="color: var(--text-tertiary);">Multiple pricing options available</span>
											</div>
										{/if}
									</div>
								</div>
								
								<!-- Action Buttons - Always at bottom -->
								<div class="tour-card-actions">
									<button class="button-secondary button--small button--gap flex-1">
										<Eye class="w-4 h-4" />
										Preview
									</button>
									<button class="button-primary button--small button--gap flex-1">
										<Calendar class="w-4 h-4" />
										Schedule
									</button>
								</div>
							</div>
						</div>
					{/each}
				</div>
			</div>
		{/if}
		
		<!-- Booking Timeline -->
		{#if showContent}
			<div class="mb-12" in:fly={{ y: 20, duration: 600, delay: 800 }}>
				<div class="mb-6">
					<h2 class="text-2xl font-bold mb-2" style="color: var(--text-primary);">
						Tour Schedule
					</h2>
					<p class="text-sm" style="color: var(--text-secondary);">
						Real-time availability and booking management
					</p>
				</div>
				
				<div class="rounded-xl shadow-sm" style="background: var(--bg-primary); border: 1px solid var(--border-primary);">
					<TourTimeline 
						bind:view={timelineView}
						bind:currentDate
						hideHeader={false}
						hideHeaderText={false}
						compact={false}
					/>
				</div>
			</div>
		{/if}
		
		<!-- Recent Bookings & Analytics -->
		<div class="grid gap-6 lg:grid-cols-2 mb-12">
			<!-- Recent Bookings -->
			{#if showContent}
				<div in:fly={{ y: 20, duration: 600, delay: 1000 }}>
					<div class="rounded-xl" style="background: var(--bg-primary); border: 1px solid var(--border-primary);">
						<div class="p-6 border-b" style="border-color: var(--border-primary);">
							<div class="flex items-center justify-between">
								<h3 class="text-lg font-semibold" style="color: var(--text-primary);">
									Recent Bookings
								</h3>
								<span class="text-sm px-2 py-1 rounded-full" 
									style="background: var(--color-success-100); color: var(--color-success-700);">
									4 new today
								</span>
							</div>
						</div>
						
						<div class="divide-y" style="border-color: var(--border-primary);">
							{#each recentBookings as booking}
								<div class="p-4 hover:bg-[var(--bg-secondary)] transition-colors">
									<div class="flex items-start justify-between mb-2">
										<div>
											<div class="flex items-center gap-2">
												<span class="text-sm font-medium" style="color: var(--text-primary);">
													{booking.customerName}
												</span>
												<span class="text-sm">{booking.nationality}</span>
											</div>
											<p class="text-xs mt-0.5" style="color: var(--text-secondary);">
												{booking.tourName}
											</p>
										</div>
										<span class="text-sm font-semibold" style="color: var(--text-primary);">
											{$globalCurrencyFormatter(booking.totalAmount)}
										</span>
									</div>
									
									<div class="flex items-center justify-between">
										<div class="flex items-center gap-4 text-xs" style="color: var(--text-tertiary);">
											<span class="flex items-center gap-1">
												<Calendar class="w-3 h-3" />
												{formatDate(booking.tourDate.toISOString())}
											</span>
											<span class="flex items-center gap-1">
												<Users class="w-3 h-3" />
												{booking.participants} {booking.participants === 1 ? 'guest' : 'guests'}
											</span>
										</div>
										<div class="flex items-center gap-2">
											<span class="status-badge {booking.status}">
												{booking.status}
											</span>
											<span class="payment-badge {booking.paymentStatus}">
												{booking.paymentStatus}
											</span>
										</div>
									</div>
								</div>
							{/each}
						</div>
						
						<div class="p-4 border-t" style="border-color: var(--border-primary);">
							<button class="button-secondary button--small w-full">
								View All Bookings
							</button>
						</div>
					</div>
				</div>
			{/if}
			
			<!-- Revenue Analytics -->
			{#if showContent}
				<div in:fly={{ y: 20, duration: 600, delay: 1200 }}>
					<div class="rounded-xl" style="background: var(--bg-primary); border: 1px solid var(--border-primary);">
						<div class="p-6 border-b" style="border-color: var(--border-primary);">
							<div class="flex items-center justify-between">
								<h3 class="text-lg font-semibold" style="color: var(--text-primary);">
									Weekly Revenue
								</h3>
								<button class="button-secondary button--small button--gap">
									<BarChart3 class="w-4 h-4" />
									Full Analytics
								</button>
							</div>
						</div>
						
						<div class="p-6">
							<!-- Revenue Chart -->
							<div class="mb-6">
								<div class="chart-container">
									{#each weeklyRevenue as data, i}
										<div class="chart-bar-container">
											<div class="chart-value">
												{$globalCurrencyFormatter(data.revenue)}
											</div>
											<div 
												class="chart-bar"
												style="height: {statsAnimated ? (data.revenue / maxRevenue * 100) : 0}%; animation-delay: {i * 150 + 500}ms;"
											></div>
											<span class="chart-label">{data.day}</span>
										</div>
									{/each}
								</div>
							</div>
							
							<!-- Revenue Stats -->
							<div class="grid grid-cols-3 gap-4 text-center">
								<div>
									<p class="text-2xl font-bold" style="color: var(--text-primary);">
										€4,121
									</p>
									<p class="text-xs" style="color: var(--text-secondary);">Daily Average</p>
								</div>
								<div>
									<p class="text-2xl font-bold" style="color: var(--color-success-600);">
										+23.5%
									</p>
									<p class="text-xs" style="color: var(--text-secondary);">Growth Rate</p>
								</div>
								<div>
									<p class="text-2xl font-bold" style="color: var(--text-primary);">
										€105
									</p>
									<p class="text-xs" style="color: var(--text-secondary);">Avg Booking</p>
								</div>
							</div>
						</div>
					</div>
				</div>
			{/if}
		</div>
		
		<!-- Customer Testimonials -->
		{#if showContent}
			<div class="mb-16" in:fly={{ y: 20, duration: 600, delay: 1400 }}>
				<div class="text-center mb-12">
					<div class="inline-flex items-center gap-2 px-4 py-2 rounded-full mb-4" 
						style="background: var(--color-warning-100); color: var(--color-warning-700);">
						<Star class="w-4 h-4 fill-current" />
						<span class="text-sm font-medium">4.9 Average Rating</span>
					</div>
					<h2 class="text-3xl font-bold mb-4" style="color: var(--text-primary);">
						Loved by Tour Operators Worldwide
					</h2>
					<p class="text-lg max-w-2xl mx-auto" style="color: var(--text-secondary);">
						Join thousands of successful tour operators who've transformed their business with Zaur
					</p>
				</div>
				
				<div class="grid gap-6 md:grid-cols-3">
					<div class="testimonial-card">
						<div class="flex items-center gap-3 mb-4">
							<div class="w-12 h-12 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white font-semibold">
								SM
							</div>
							<div>
								<h4 class="font-semibold" style="color: var(--text-primary);">Sarah Mitchell</h4>
								<p class="text-sm" style="color: var(--text-secondary);">Barcelona Walking Tours</p>
							</div>
						</div>
						<div class="flex items-center gap-1 mb-3">
							{#each Array(5) as _}
								<Star class="w-4 h-4 fill-current" style="color: var(--color-warning-500)" />
							{/each}
						</div>
						<p class="text-sm" style="color: var(--text-secondary);">
							"Zaur increased our bookings by 300% in just 3 months. The QR code system is genius - customers love how easy it is to book!"
						</p>
					</div>
					
					<div class="testimonial-card">
						<div class="flex items-center gap-3 mb-4">
							<div class="w-12 h-12 rounded-full bg-gradient-to-br from-green-400 to-green-600 flex items-center justify-center text-white font-semibold">
								MR
							</div>
							<div>
								<h4 class="font-semibold" style="color: var(--text-primary);">Marco Rodriguez</h4>
								<p class="text-sm" style="color: var(--text-secondary);">Madrid Food Tours</p>
							</div>
						</div>
						<div class="flex items-center gap-1 mb-3">
							{#each Array(5) as _}
								<Star class="w-4 h-4 fill-current" style="color: var(--color-warning-500)" />
							{/each}
						</div>
						<p class="text-sm" style="color: var(--text-secondary);">
							"The analytics are incredible. I can see exactly which tours perform best and optimize my pricing accordingly. Revenue up 250%!"
						</p>
					</div>
					
					<div class="testimonial-card">
						<div class="flex items-center gap-3 mb-4">
							<div class="w-12 h-12 rounded-full bg-gradient-to-br from-purple-400 to-purple-600 flex items-center justify-center text-white font-semibold">
								LK
							</div>
							<div>
								<h4 class="font-semibold" style="color: var(--text-primary);">Lisa Kim</h4>
								<p class="text-sm" style="color: var(--text-secondary);">Seoul Heritage Tours</p>
							</div>
						</div>
						<div class="flex items-center gap-1 mb-3">
							{#each Array(5) as _}
								<Star class="w-4 h-4 fill-current" style="color: var(--color-warning-500)" />
							{/each}
						</div>
						<p class="text-sm" style="color: var(--text-secondary);">
							"From chaos to organized in one week! Zaur handles everything - payments, scheduling, customer communication. I finally have my life back."
						</p>
					</div>
				</div>
			</div>
		{/if}

		<!-- Performance Analytics -->
		{#if showContent}
			<div class="mb-16" in:fly={{ y: 20, duration: 600, delay: 1500 }}>
				<div class="text-center mb-12">
					<div class="inline-flex items-center gap-2 px-4 py-2 rounded-full mb-4" 
						style="background: var(--color-info-100); color: var(--color-info-700);">
						<BarChart3 class="w-4 h-4" />
						<span class="text-sm font-medium">Real-time Analytics</span>
					</div>
					<h2 class="text-3xl font-bold mb-4" style="color: var(--text-primary);">
						Data-Driven Growth
					</h2>
					<p class="text-lg max-w-2xl mx-auto" style="color: var(--text-secondary);">
						Make informed decisions with comprehensive analytics and performance insights
					</p>
				</div>
				
				<div class="grid gap-6 lg:grid-cols-2">
					<!-- Performance Metrics -->
					<div class="analytics-card">
						<h3 class="text-lg font-semibold mb-6" style="color: var(--text-primary);">Performance Overview</h3>
						<div class="grid grid-cols-2 gap-4">
							<div class="metric-card">
								<div class="metric-value">94%</div>
								<div class="metric-label">Customer Satisfaction</div>
								<div class="metric-trend positive">+12% this month</div>
							</div>
							<div class="metric-card">
								<div class="metric-value">2.3x</div>
								<div class="metric-label">Revenue Multiplier</div>
								<div class="metric-trend positive">vs traditional booking</div>
							</div>
							<div class="metric-card">
								<div class="metric-value">15min</div>
								<div class="metric-label">Avg Response Time</div>
								<div class="metric-trend positive">-5min improvement</div>
							</div>
							<div class="metric-card">
								<div class="metric-value">€47</div>
								<div class="metric-label">Avg Booking Value</div>
								<div class="metric-trend positive">+€8 from last quarter</div>
							</div>
						</div>
					</div>
					
					<!-- Conversion Funnel -->
					<div class="analytics-card">
						<h3 class="text-lg font-semibold mb-6" style="color: var(--text-primary);">Booking Conversion</h3>
						<div class="funnel-chart">
							<div class="funnel-step">
								<div class="funnel-bar" style="width: 100%; background: var(--color-blue-500);">
									<span class="funnel-label">QR Scans: 3,245</span>
								</div>
							</div>
							<div class="funnel-step">
								<div class="funnel-bar" style="width: 65%; background: var(--color-green-500);">
									<span class="funnel-label">Page Views: 2,109</span>
								</div>
							</div>
							<div class="funnel-step">
								<div class="funnel-bar" style="width: 45%; background: var(--color-yellow-500);">
									<span class="funnel-label">Started Booking: 1,460</span>
								</div>
							</div>
							<div class="funnel-step">
								<div class="funnel-bar" style="width: 26%; background: var(--color-purple-500);">
									<span class="funnel-label">Completed: 847</span>
								</div>
							</div>
						</div>
						<div class="mt-4 p-3 rounded-lg" style="background: var(--bg-secondary);">
							<p class="text-sm font-medium" style="color: var(--text-primary);">26.1% Overall Conversion Rate</p>
							<p class="text-xs" style="color: var(--text-secondary);">Industry average: 12-18%</p>
						</div>
					</div>
				</div>
			</div>
		{/if}

		<!-- Feature Highlights -->
		{#if showContent}
			<div class="mb-12" in:fly={{ y: 20, duration: 600, delay: 1600 }}>
				<div class="text-center mb-8">
					<h2 class="text-2xl font-bold mb-2" style="color: var(--text-primary);">
						Everything You Need to Succeed
					</h2>
					<p class="text-sm" style="color: var(--text-secondary);">
						Professional tools that grow with your business
					</p>
				</div>
				
				<div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
					<div class="feature-card">
						<div class="feature-icon" style="background: var(--color-primary-100);">
							<QrCode class="w-6 h-6" style="color: var(--color-primary-600);" />
						</div>
						<h4 class="feature-title">Smart QR Codes</h4>
						<p class="feature-description">
							Trackable QR codes with real-time analytics and conversion tracking
						</p>
					</div>
					
					<div class="feature-card">
						<div class="feature-icon" style="background: var(--color-success-100);">
							<CreditCard class="w-6 h-6" style="color: var(--color-success-600);" />
						</div>
						<h4 class="feature-title">Secure Payments</h4>
						<p class="feature-description">
							Integrated Stripe payments with instant confirmations
						</p>
					</div>
					
					<div class="feature-card">
						<div class="feature-icon" style="background: var(--color-warning-100);">
							<Calendar class="w-6 h-6" style="color: var(--color-warning-600);" />
						</div>
						<h4 class="feature-title">Smart Scheduling</h4>
						<p class="feature-description">
							Automated availability management and booking conflicts prevention
						</p>
					</div>
					
					<div class="feature-card">
						<div class="feature-icon" style="background: var(--color-info-100);">
							<Shield class="w-6 h-6" style="color: var(--color-info-600);" />
						</div>
						<h4 class="feature-title">Business Insights</h4>
						<p class="feature-description">
							Detailed analytics to optimize pricing and grow revenue
						</p>
					</div>
				</div>
			</div>
		{/if}
		
		<!-- Call to Action -->
		{#if showContent}
			<div class="text-center py-12" in:fade={{ duration: 600, delay: 1600 }}>
				<div class="inline-flex items-center gap-2 px-4 py-2 rounded-full mb-6" 
					style="background: var(--color-success-100); color: var(--color-success-700);">
					<Award class="w-4 h-4" />
					<span class="text-sm font-medium">Trusted by 500+ Tour Operators Worldwide</span>
				</div>
				<h2 class="text-3xl font-bold mb-4" style="color: var(--text-primary);">
					Ready to Transform Your Tour Business?
				</h2>
				<p class="text-lg mb-8 max-w-2xl mx-auto" style="color: var(--text-secondary);">
					Join thousands of tour operators who are growing their business with Zaur
				</p>
				<div class="flex gap-4 justify-center">
					<button class="button-primary button--large button--gap">
						<Zap class="w-5 h-5" />
						Start Free Trial
					</button>
					<button class="button-secondary button--large button--gap">
						<Calendar class="w-5 h-5" />
						Book a Demo
					</button>
				</div>
			</div>
		{/if}
	</div>
</div>

<style>
	/* Demo-specific styling for marketing appeal */
	.demo-container {
		min-height: 100vh;
		background: var(--bg-secondary);
	}
	
	.hero-section {
		background: linear-gradient(135deg, var(--bg-primary) 0%, var(--bg-secondary) 100%);
		border-bottom: 1px solid var(--border-primary);
	}
	
	/* Premium stat cards */
	.stat-card-premium {
		background: var(--bg-primary);
		border: 1px solid var(--border-primary);
		border-radius: 1rem;
		padding: 1.5rem;
		display: flex;
		align-items: center;
		gap: 1rem;
		transition: all 0.3s ease;
		position: relative;
		overflow: hidden;
	}
	
	.stat-card-premium::before {
		content: '';
		position: absolute;
		top: 0;
		left: 0;
		right: 0;
		height: 3px;
		background: linear-gradient(90deg, 
			var(--color-primary-400) 0%, 
			var(--color-primary-500) 50%, 
			var(--color-primary-400) 100%);
		transform: translateX(-100%);
		animation: shimmer 3s infinite;
	}
	
	@keyframes shimmer {
		to {
			transform: translateX(100%);
		}
	}
	
	.stat-icon-wrapper {
		width: 3rem;
		height: 3rem;
		border-radius: 0.75rem;
		display: flex;
		align-items: center;
		justify-content: center;
		flex-shrink: 0;
	}
	
	.stat-content {
		flex: 1;
		min-width: 0;
	}
	
	.stat-value {
		font-size: 1.5rem;
		font-weight: 700;
		color: var(--text-primary);
		line-height: 1.2;
		transition: all 0.6s ease;
	}
	
	.stat-label {
		font-size: 0.75rem;
		color: var(--text-secondary);
		margin-top: 0.25rem;
	}
	
	.stat-trend {
		display: flex;
		align-items: center;
		gap: 0.25rem;
		font-size: 0.75rem;
		font-weight: 500;
		margin-top: 0.5rem;
	}
	
	.stat-trend.positive {
		color: var(--color-success-600);
	}
	
	.star-rating {
		display: flex;
		gap: 0.125rem;
		margin-top: 0.5rem;
	}
	
	/* Tour cards */
	.tour-card-premium {
		background: var(--bg-primary);
		border: 1px solid var(--border-primary);
		border-radius: 1rem;
		overflow: hidden;
		transition: all 0.3s ease;
		box-shadow: var(--shadow-sm);
		display: flex;
		flex-direction: column;
		height: 100%;
	}
	
	.tour-card-premium:hover {
		transform: translateY(-4px);
		box-shadow: var(--shadow-lg);
		border-color: var(--border-secondary);
	}
	
	.tour-image {
		height: 240px;
		position: relative;
		background: var(--bg-secondary);
		overflow: hidden;
		flex-shrink: 0;
	}
	
	.tour-image-photo {
		width: 100%;
		height: 100%;
		position: absolute;
		top: 0;
		left: 0;
		right: 0;
		bottom: 0;
	}
	
	.tour-image-1 {
		background: linear-gradient(135deg, #ff6b6b 0%, #ff8e53 50%, #ff6b9d 100%);
	}
	
	.tour-image-2 {
		background: linear-gradient(135deg, #4ecdc4 0%, #44a08d 50%, #093637 100%);
	}
	
	.tour-image-3 {
		background: linear-gradient(135deg, #a8edea 0%, #fed6e3 50%, #d299c2 100%);
	}
	
	.tour-image-overlay {
		position: absolute;
		top: 0;
		left: 0;
		right: 0;
		bottom: 0;
		background: linear-gradient(135deg, rgba(0,0,0,0.3) 0%, rgba(0,0,0,0.1) 100%);
		display: flex;
		align-items: center;
		justify-content: center;
		transition: all 0.3s ease;
	}
	
	.tour-image-content {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		text-align: center;
		transform: translateY(10px);
		transition: transform 0.3s ease;
	}
	
	.tour-card-premium:hover .tour-image-overlay {
		background: linear-gradient(135deg, rgba(0,0,0,0.4) 0%, rgba(0,0,0,0.2) 100%);
	}
	
	.tour-card-premium:hover .tour-image-content {
		transform: translateY(0);
	}
	
	.tour-card-content {
		display: flex;
		flex-direction: column;
		flex: 1;
		padding: 1.5rem;
	}
	
	.tour-card-info {
		flex: 1;
	}
	
	.tour-card-actions {
		display: flex;
		gap: 0.5rem;
		margin-top: 1rem;
		padding-top: 1rem;
		border-top: 1px solid var(--border-primary);
	}
	
	.status-badge {
		display: inline-flex;
		align-items: center;
		gap: 0.25rem;
		padding: 0.25rem 0.75rem;
		border-radius: 9999px;
		font-size: 0.75rem;
		font-weight: 500;
		backdrop-filter: blur(8px);
		background: rgba(255, 255, 255, 0.9);
		color: var(--text-primary);
		box-shadow: var(--shadow-sm);
	}
	
	.status-badge.active {
		background: rgba(16, 185, 129, 0.1);
		color: rgb(16, 185, 129);
		border: 1px solid rgba(16, 185, 129, 0.2);
	}
	
	.status-badge.confirmed {
		background: var(--color-success-100);
		color: var(--color-success-700);
		border: 1px solid var(--color-success-200);
	}
	
	.status-badge.pending {
		background: var(--color-warning-100);
		color: var(--color-warning-700);
		border: 1px solid var(--color-warning-200);
	}
	
	.rating-badge {
		display: inline-flex;
		align-items: center;
		gap: 0.25rem;
		padding: 0.25rem 0.75rem;
		border-radius: 9999px;
		font-size: 0.75rem;
		font-weight: 500;
		background: rgba(251, 191, 36, 0.1);
		color: rgb(217, 119, 6);
		border: 1px solid rgba(251, 191, 36, 0.2);
		backdrop-filter: blur(8px);
	}
	
	.payment-badge {
		display: inline-flex;
		align-items: center;
		gap: 0.25rem;
		padding: 0.125rem 0.5rem;
		border-radius: 9999px;
		font-size: 0.625rem;
		font-weight: 500;
		text-transform: capitalize;
	}
	
	.payment-badge.paid {
		background: var(--color-success-100);
		color: var(--color-success-700);
		border: 1px solid var(--color-success-200);
	}
	
	.payment-badge.pending {
		background: var(--color-warning-100);
		color: var(--color-warning-700);
		border: 1px solid var(--color-warning-200);
	}
	
	.qr-preview {
		position: relative;
		background: rgba(255, 255, 255, 0.95);
		padding: 0.5rem;
		border-radius: 0.75rem;
		box-shadow: var(--shadow-lg);
		cursor: pointer;
		transition: transform 0.2s ease;
	}
	
	.qr-preview:hover {
		transform: scale(1.05);
	}
	
	.qr-stats {
		position: absolute;
		bottom: -0.5rem;
		right: -0.5rem;
		background: var(--bg-primary);
		border: 2px solid var(--border-primary);
		border-radius: 0.5rem;
		padding: 0.25rem 0.5rem;
		text-align: center;
	}
	
	.info-item {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		font-size: 0.75rem;
		color: var(--text-secondary);
	}
	
	.info-item svg {
		flex-shrink: 0;
		color: var(--text-tertiary);
	}
	
	.pricing-section {
		padding-top: 1rem;
		border-top: 1px solid var(--border-primary);
		margin-top: 1rem;
	}
	
	.highlight-tag {
		display: inline-flex;
		align-items: center;
		gap: 0.25rem;
		padding: 0.25rem 0.75rem;
		background: var(--bg-secondary);
		border: 1px solid var(--border-primary);
		border-radius: 9999px;
		font-size: 0.625rem;
		color: var(--text-secondary);
	}
	
	.highlight-tag svg {
		color: var(--color-success-500);
	}
	
	/* Feature cards */
	.feature-card {
		background: var(--bg-primary);
		border: 1px solid var(--border-primary);
		border-radius: 0.75rem;
		padding: 1.5rem;
		text-align: center;
		transition: all 0.3s ease;
	}
	
	.feature-card:hover {
		transform: translateY(-2px);
		box-shadow: var(--shadow-md);
		border-color: var(--border-secondary);
	}
	
	.feature-icon {
		width: 3.5rem;
		height: 3.5rem;
		border-radius: 0.75rem;
		display: flex;
		align-items: center;
		justify-content: center;
		margin: 0 auto 1rem;
	}
	
	.feature-title {
		font-size: 1rem;
		font-weight: 600;
		color: var(--text-primary);
		margin-bottom: 0.5rem;
	}
	
	.feature-description {
		font-size: 0.875rem;
		color: var(--text-secondary);
		line-height: 1.5;
	}
	
	/* Testimonial cards */
	.testimonial-card {
		background: var(--bg-primary);
		border: 1px solid var(--border-primary);
		border-radius: 0.75rem;
		padding: 1.5rem;
		transition: all 0.3s ease;
		position: relative;
		overflow: hidden;
	}
	
	.testimonial-card:hover {
		transform: translateY(-2px);
		box-shadow: var(--shadow-lg);
		border-color: var(--border-secondary);
	}
	
	.testimonial-card::before {
		content: '';
		position: absolute;
		top: 0;
		left: 0;
		right: 0;
		height: 2px;
		background: linear-gradient(90deg, var(--color-primary-400), var(--color-success-400), var(--color-warning-400));
	}
	
	/* Analytics cards */
	.analytics-card {
		background: var(--bg-primary);
		border: 1px solid var(--border-primary);
		border-radius: 0.75rem;
		padding: 1.5rem;
		box-shadow: var(--shadow-sm);
	}
	
	.metric-card {
		background: var(--bg-secondary);
		border: 1px solid var(--border-primary);
		border-radius: 0.5rem;
		padding: 1rem;
		text-align: center;
		transition: all 0.3s ease;
	}
	
	.metric-card:hover {
		transform: translateY(-1px);
		box-shadow: var(--shadow-sm);
	}
	
	.metric-value {
		font-size: 1.5rem;
		font-weight: 700;
		color: var(--text-primary);
		margin-bottom: 0.25rem;
	}
	
	.metric-label {
		font-size: 0.75rem;
		color: var(--text-secondary);
		margin-bottom: 0.25rem;
	}
	
	.metric-trend {
		font-size: 0.625rem;
		font-weight: 500;
	}
	
	.metric-trend.positive {
		color: var(--color-success-600);
	}
	
	/* Funnel chart */
	.funnel-chart {
		space-y: 0.75rem;
	}
	
	.funnel-step {
		margin-bottom: 0.75rem;
	}
	
	.funnel-bar {
		height: 2.5rem;
		border-radius: 0.375rem;
		display: flex;
		align-items: center;
		padding: 0 1rem;
		transition: all 0.5s ease;
		position: relative;
		overflow: hidden;
	}
	
	.funnel-bar::after {
		content: '';
		position: absolute;
		top: 0;
		left: 0;
		right: 0;
		bottom: 0;
		background: linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.1) 50%, transparent 100%);
		transform: translateX(-100%);
		animation: shimmer-funnel 2s infinite;
	}
	
	@keyframes shimmer-funnel {
		to {
			transform: translateX(100%);
		}
	}
	
	.funnel-label {
		font-size: 0.875rem;
		font-weight: 500;
		color: white;
		text-shadow: 0 1px 2px rgba(0,0,0,0.3);
	}
	
	/* Enhanced gradients for better visual appeal */
	.bg-gradient-to-br {
		background-image: linear-gradient(to bottom right, var(--tw-gradient-stops));
	}
	
	/* Revenue chart */
	.chart-container {
		display: flex;
		align-items: end;
		justify-content: space-between;
		gap: 1rem;
		height: 12rem;
		padding: 2rem 1rem 2rem 1rem;
		background: var(--bg-secondary);
		border-radius: 0.75rem;
		border: 1px solid var(--border-primary);
		position: relative;
	}
	
	.chart-bar-container {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: flex-end;
		flex: 1;
		height: 100%;
		position: relative;
	}
	
	.chart-value {
		font-size: 0.75rem;
		font-weight: 500;
		color: var(--text-primary);
		opacity: 0;
		animation: fade-in-value 0.5s ease-out 1.5s forwards;
		text-align: center;
		width: 100%;
		margin-bottom: 0.25rem;
		white-space: nowrap;
	}
	
	.chart-bar {
		width: 100%;
		max-width: 2rem;
		background: linear-gradient(135deg, var(--color-primary-400), var(--color-primary-600));
		border-radius: 0.25rem 0.25rem 0 0;
		transition: all 1s ease-out;
		position: relative;
		overflow: hidden;
		box-shadow: 0 2px 4px rgba(0,0,0,0.1);
		min-height: 0.25rem;
	}
	
	.chart-bar::after {
		content: '';
		position: absolute;
		top: 0;
		left: -100%;
		width: 100%;
		height: 100%;
		background: linear-gradient(90deg, transparent, rgba(255,255,255,0.4), transparent);
		animation: slide-shimmer 2s infinite 1s;
	}
	
	.chart-label {
		font-size: 0.75rem;
		font-weight: 500;
		color: var(--text-secondary);
		margin-top: 0.5rem;
		position: absolute;
		bottom: -1.5rem;
		left: 50%;
		transform: translateX(-50%);
		white-space: nowrap;
	}
	
	@keyframes slide-shimmer {
		0% { left: -100%; }
		100% { left: 100%; }
	}
	
	@keyframes fade-in-value {
		from { opacity: 0; transform: translateY(-10px); }
		to { opacity: 1; transform: translateY(0); }
	}
	
	/* Responsive adjustments */
	@media (max-width: 640px) {
		.stat-card-premium {
			padding: 1rem;
		}
		
		.stat-value {
			font-size: 1.25rem;
		}
		
		.tour-image {
			height: 180px;
		}
		
		.tour-card-content {
			padding: 1rem;
		}
		
		.tour-card-actions {
			margin-top: 0.75rem;
			padding-top: 0.75rem;
		}
		
		.testimonial-card,
		.analytics-card {
			padding: 1rem;
		}
		
		.metric-value {
			font-size: 1.25rem;
		}
		
		.funnel-bar {
			height: 2rem;
			padding: 0 0.75rem;
		}
		
		.funnel-label {
			font-size: 0.75rem;
		}
		
		.chart-container {
			height: 8rem;
			gap: 0.5rem;
			padding: 1.5rem 0.75rem 1.5rem 0.75rem;
		}
		
		.chart-bar {
			max-width: 1.5rem;
		}
		
		.chart-value {
			font-size: 0.625rem;
		}
		
		.chart-label {
			font-size: 0.625rem;
		}
	}
</style> 