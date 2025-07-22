<script lang="ts">
	import { browser } from '$app/environment';
	import { goto } from '$app/navigation';
	import { isAdmin, isLoading as authLoading } from '$lib/stores/auth.js';
	import PageHeader from '$lib/components/PageHeader.svelte';
	import Download from 'lucide-svelte/icons/download';
	import FileText from 'lucide-svelte/icons/file-text';
	import Palette from 'lucide-svelte/icons/palette';
	import Layout from 'lucide-svelte/icons/layout';
	import Image from 'lucide-svelte/icons/image';
	import ArrowLeft from 'lucide-svelte/icons/arrow-left';
	import { generateQRImageURL } from '$lib/utils/qr-generation.js';
	// @ts-ignore
	import jsPDF from 'jspdf';
	
	// Check admin access
	$effect(() => {
		if (browser && !$authLoading && !$isAdmin) {
			goto('/dashboard');
		}
	});
	
	let generating = $state(false);
	let selectedLayout = $state<'event' | 'partner' | 'info'>('event');
	let selectedStyle = $state<'modern' | 'vibrant' | 'professional'>('modern');
	let includeQR = $state(true);
	let includeFeatures = $state(true);
	
	// Generate QR code for registration
	let qrCodeURL = $derived.by(() => {
		if (!includeQR) return '';
		const url = 'https://zaur.app/auth/register?ref=flyer';
		return generateQRImageURL(url, { 
			size: 300, 
			color: '1f2937',
			style: 'modern'
		});
	});
	
	// Layout configurations
	const layouts = {
		event: {
			name: 'Event Flyer',
			description: 'Perfect for conferences and tourism fairs'
		},
		partner: {
			name: 'Partner Flyer',
			description: 'For hotels and tourism businesses'
		},
		info: {
			name: 'Info Sheet',
			description: 'Detailed platform information'
		}
	};
	
	// Style configurations
	const styles = {
		modern: {
			name: 'Modern',
			description: 'Clean and minimalist design'
		},
		vibrant: {
			name: 'Vibrant',
			description: 'Colorful and eye-catching'
		},
		professional: {
			name: 'Professional',
			description: 'Corporate and trustworthy'
		}
	};
	
	async function generateFlyer() {
		generating = true;
		try {
			// Get the container
			const container = document.querySelector('.flyer-container');
			if (!container) {
				throw new Error('Flyer container not found');
			}
			
			// Show the container
			container.classList.remove('hidden');
			
			// Wait for rendering
			await new Promise(resolve => setTimeout(resolve, 500));
			
			// Generate canvas
			const html2canvas = (await import('html2canvas')).default as any;
			const canvas = await html2canvas(container as HTMLElement, {
				backgroundColor: '#ffffff',
				scale: 3,
				useCORS: true,
				allowTaint: true,
				logging: false
			});
			
			// Hide the container
			container.classList.add('hidden');
			
			// Create PDF (A4 size)
			const pdf = new jsPDF({
				orientation: 'portrait',
				unit: 'mm',
				format: 'a4'
			});
			
			// Add the canvas to PDF
			const imgData = canvas.toDataURL('image/png');
			pdf.addImage(imgData, 'PNG', 0, 0, 210, 297);
			
			// Download
			pdf.save(`zaur-flyer-${selectedLayout}-${selectedStyle}-${new Date().toISOString().split('T')[0]}.pdf`);
			
		} catch (error) {
			console.error('Error generating flyer:', error);
			alert('Failed to generate flyer. Please try again.');
		} finally {
			generating = false;
		}
	}
</script>

<svelte:head>
	<title>Flyers Generator - Admin - Zaur</title>
	<meta name="robots" content="noindex, nofollow" />
</svelte:head>

{#if !$authLoading && $isAdmin}
	<div class="max-w-screen-xl mx-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-8">
		<PageHeader 
			title="Flyers Generator"
			subtitle="Create promotional flyers for events and partner locations"
		>
			<a href="/admin" class="button-secondary button--gap">
				<ArrowLeft class="h-4 w-4" />
				Back to Admin
			</a>
		</PageHeader>
		
		<div class="grid grid-cols-1 lg:grid-cols-3 gap-8 mt-8">
			<!-- Configuration Panel -->
			<div class="space-y-6">
				<!-- Layout Selection -->
				<div class="professional-card">
					<h3 class="text-lg font-semibold mb-4 flex items-center gap-2">
						<Layout class="w-5 h-5" />
						Flyer Layout
					</h3>
					<div class="space-y-3">
						{#each Object.entries(layouts) as [key, layout]}
							<label class="flex items-start gap-3 cursor-pointer p-3 rounded-lg border transition-all hover:bg-secondary {selectedLayout === key ? 'border-primary bg-secondary' : 'border-border'}">
								<input
									type="radio"
									name="layout"
									value={key}
									checked={selectedLayout === key}
									onchange={() => selectedLayout = key as typeof selectedLayout}
									class="mt-0.5"
								/>
								<div>
									<h4 class="font-medium">{layout.name}</h4>
									<p class="text-sm text-secondary">{layout.description}</p>
								</div>
							</label>
						{/each}
					</div>
				</div>
				
				<!-- Style Selection -->
				<div class="professional-card">
					<h3 class="text-lg font-semibold mb-4 flex items-center gap-2">
						<Palette class="w-5 h-5" />
						Visual Style
					</h3>
					<div class="space-y-3">
						{#each Object.entries(styles) as [key, style]}
							<label class="flex items-start gap-3 cursor-pointer p-3 rounded-lg border transition-all hover:bg-secondary {selectedStyle === key ? 'border-primary bg-secondary' : 'border-border'}">
								<input
									type="radio"
									name="style"
									value={key}
									checked={selectedStyle === key}
									onchange={() => selectedStyle = key as typeof selectedStyle}
									class="mt-0.5"
								/>
								<div>
									<h4 class="font-medium">{style.name}</h4>
									<p class="text-sm text-secondary">{style.description}</p>
								</div>
							</label>
						{/each}
					</div>
				</div>
				
				<!-- Options -->
				<div class="professional-card">
					<h3 class="text-lg font-semibold mb-4">Options</h3>
					<div class="space-y-3">
						<label class="flex items-center gap-3 cursor-pointer">
							<input
								type="checkbox"
								bind:checked={includeQR}
								class="rounded"
							/>
							<span>Include QR code</span>
						</label>
						<label class="flex items-center gap-3 cursor-pointer">
							<input
								type="checkbox"
								bind:checked={includeFeatures}
								class="rounded"
							/>
							<span>Include feature list</span>
						</label>
					</div>
				</div>
				
				<!-- Generate Button -->
				<button
					onclick={generateFlyer}
					disabled={generating}
					class="button button--primary button--large w-full flex items-center justify-center gap-2"
				>
					{#if generating}
						<div class="w-5 h-5 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
						Generating...
					{:else}
						<Download class="w-5 h-5" />
						Generate Flyer
					{/if}
				</button>
			</div>
			
			<!-- Preview -->
			<div class="lg:col-span-2">
				<div class="professional-card">
					<h3 class="text-lg font-semibold mb-4 flex items-center gap-2">
						<Image class="w-5 h-5" />
						Preview
					</h3>
					<div class="bg-secondary rounded-lg p-8">
						<!-- Flyer preview -->
						<div class="max-w-xs mx-auto">
							<div class="aspect-[210/297] rounded-lg shadow-xl p-4 text-xs overflow-hidden" style="background: {selectedStyle === 'vibrant' ? 'linear-gradient(135deg, #8B5CF6 0%, #EC4899 100%)' : selectedStyle === 'professional' ? 'linear-gradient(135deg, #1E40AF 0%, #1E3A8A 100%)' : '#ffffff'}; color: {selectedStyle === 'modern' ? '#000000' : '#ffffff'}">
								{#if selectedLayout === 'event'}
									<div class="text-center mb-3">
										<h1 class="text-base font-bold" style="color: {selectedStyle === 'modern' ? '#EF4444' : selectedStyle === 'vibrant' ? '#FBBF24' : '#60A5FA'}">Zaur</h1>
										<p class="text-xs" style="color: {selectedStyle === 'modern' ? '#6B7280' : 'rgba(255,255,255,0.8)'}">Tour QR Ticket Platform</p>
									</div>
									<h2 class="text-sm font-bold text-center mb-2" style="color: {selectedStyle === 'modern' ? '#1F2937' : '#FFFFFF'}">
										Revolutionize Your Tour Business
									</h2>
									{#if includeFeatures}
										<div class="grid grid-cols-2 gap-1 mb-3 text-xs">
											<div class="p-1">
												<p class="font-semibold" style="color: {selectedStyle === 'modern' ? '#EF4444' : selectedStyle === 'vibrant' ? '#FBBF24' : '#60A5FA'}">✓ No Booking Fees</p>
												<p style="color: {selectedStyle === 'modern' ? '#6B7280' : 'rgba(255,255,255,0.8)'}">Keep 100% revenue</p>
											</div>
											<div class="p-1">
												<p class="font-semibold" style="color: {selectedStyle === 'modern' ? '#EF4444' : selectedStyle === 'vibrant' ? '#FBBF24' : '#60A5FA'}">✓ QR Tickets</p>
												<p style="color: {selectedStyle === 'modern' ? '#6B7280' : 'rgba(255,255,255,0.8)'}">Digital ticketing</p>
											</div>
											<div class="p-1">
												<p class="font-semibold" style="color: {selectedStyle === 'modern' ? '#EF4444' : selectedStyle === 'vibrant' ? '#FBBF24' : '#60A5FA'}">✓ Real-time</p>
												<p style="color: {selectedStyle === 'modern' ? '#6B7280' : 'rgba(255,255,255,0.8)'}">Instant notifications</p>
											</div>
											<div class="p-1">
												<p class="font-semibold" style="color: {selectedStyle === 'modern' ? '#EF4444' : selectedStyle === 'vibrant' ? '#FBBF24' : '#60A5FA'}">✓ Marketing</p>
												<p style="color: {selectedStyle === 'modern' ? '#6B7280' : 'rgba(255,255,255,0.8)'}">Built-in tools</p>
											</div>
										</div>
									{/if}
									{#if includeQR && qrCodeURL}
										<div class="text-center my-2">
											<img src={qrCodeURL} alt="QR Code" class="w-8 h-8 mx-auto" />
											<p class="text-xs" style="color: {selectedStyle === 'modern' ? '#6B7280' : 'rgba(255,255,255,0.8)'}">Scan to join</p>
										</div>
									{/if}
									<div class="text-center pt-1 mt-2" style="border-top: 1px solid {selectedStyle === 'modern' ? '#E5E7EB' : 'rgba(255,255,255,0.3)'}">
										<p class="font-semibold" style="color: {selectedStyle === 'modern' ? '#1F2937' : '#FFFFFF'}">zaur.app</p>
									</div>
								{:else if selectedLayout === 'partner'}
									<div class="mb-2">
										<h1 class="text-sm font-bold" style="color: {selectedStyle === 'modern' ? '#EF4444' : selectedStyle === 'vibrant' ? '#FBBF24' : '#60A5FA'}">Partner with Zaur</h1>
										<p class="text-xs" style="color: {selectedStyle === 'modern' ? '#6B7280' : 'rgba(255,255,255,0.8)'}">Empower Your Tour Guides</p>
									</div>
									<h2 class="text-xs font-bold mb-1" style="color: {selectedStyle === 'modern' ? '#1F2937' : '#FFFFFF'}">
										Why Hotels Choose Zaur
									</h2>
									<ul class="text-xs space-y-1 mb-2" style="color: {selectedStyle === 'modern' ? '#6B7280' : 'rgba(255,255,255,0.8)'}">
										<li>• Help guides accept bookings 24/7</li>
										<li>• Professional QR ticketing</li>
										<li>• Real-time availability</li>
										<li>• No commission fees</li>
									</ul>
									<div class="bg-yellow-100 p-1 rounded mb-2">
										<p class="text-xs font-semibold text-yellow-800">Special Partner Benefits</p>
									</div>
									<div class="text-center">
										<p class="text-xs font-semibold text-red-500">zaur.app/partners</p>
									</div>
								{:else}
									<div class="mb-2">
										<h1 class="text-sm font-bold" style="color: {selectedStyle === 'modern' ? '#EF4444' : selectedStyle === 'vibrant' ? '#FBBF24' : '#60A5FA'}">Zaur Platform Overview</h1>
									</div>
									<div class="grid grid-cols-2 gap-2 mb-2 text-xs">
										<div>
											<h3 class="font-semibold" style="color: {selectedStyle === 'modern' ? '#1F2937' : '#FFFFFF'}">For Tour Guides</h3>
											<ul class="space-y-0.5" style="color: {selectedStyle === 'modern' ? '#6B7280' : 'rgba(255,255,255,0.8)'}">
												<li>• Booking management</li>
												<li>• Digital QR tickets</li>
												<li>• Real-time notifications</li>
											</ul>
										</div>
										<div>
											<h3 class="font-semibold" style="color: {selectedStyle === 'modern' ? '#1F2937' : '#FFFFFF'}">For Customers</h3>
											<ul class="space-y-0.5" style="color: {selectedStyle === 'modern' ? '#6B7280' : 'rgba(255,255,255,0.8)'}">
												<li>• Easy online booking</li>
												<li>• Secure payments</li>
												<li>• Instant QR tickets</li>
											</ul>
										</div>
									</div>
									<div class="bg-gray-100 p-1 rounded mb-1">
										<div class="grid grid-cols-4 gap-1 text-center text-xs">
											<div><p class="font-semibold">Free</p></div>
											<div><p class="font-semibold">€12/mo</p></div>
											<div><p class="font-semibold">€29/mo</p></div>
											<div><p class="font-semibold">€79/mo</p></div>
										</div>
									</div>
									<div class="text-center">
										<p class="text-xs font-bold" style="color: {selectedStyle === 'modern' ? '#EF4444' : selectedStyle === 'vibrant' ? '#FBBF24' : '#60A5FA'}">No Booking Fees, Ever!</p>
									</div>
								{/if}
							</div>
						</div>
					</div>
				</div>
			</div>
		</div>
	</div>
	
	<!-- Hidden container for PDF generation -->
	<div class="flyer-container hidden" style="position: absolute; left: -9999px; width: 210mm; height: 297mm; background: white;">
		<!-- A4 flyer content -->
		<div style="padding: 20mm; height: 100%; display: flex; flex-direction: column;">
			{#if selectedLayout === 'event'}
				<!-- Event Flyer Layout -->
				<div style="text-align: center; margin-bottom: 30px;">
					<h1 style="font-size: 48px; font-weight: 800; color: #FA6B5D; margin: 0;">Zaur</h1>
					<p style="font-size: 20px; color: #6b7280; margin: 10px 0;">Tour QR Ticket Platform</p>
				</div>
				
				<div style="flex: 1; display: flex; flex-direction: column; justify-content: center;">
					<h2 style="font-size: 32px; text-align: center; margin-bottom: 30px; color: #1f2937;">
						Revolutionize Your Tour Business
					</h2>
					
					{#if includeFeatures}
						<div style="margin-bottom: 40px;">
							<div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px;">
								<div style="padding: 20px;">
									<h3 style="font-size: 18px; color: #FA6B5D; margin-bottom: 10px;">✓ No Booking Fees</h3>
									<p style="color: #6b7280;">Keep 100% of your revenue</p>
								</div>
								<div style="padding: 20px;">
									<h3 style="font-size: 18px; color: #FA6B5D; margin-bottom: 10px;">✓ QR Tickets</h3>
									<p style="color: #6b7280;">Modern digital ticketing system</p>
								</div>
								<div style="padding: 20px;">
									<h3 style="font-size: 18px; color: #FA6B5D; margin-bottom: 10px;">✓ Real-time Bookings</h3>
									<p style="color: #6b7280;">Instant notifications and updates</p>
								</div>
								<div style="padding: 20px;">
									<h3 style="font-size: 18px; color: #FA6B5D; margin-bottom: 10px;">✓ Marketing Tools</h3>
									<p style="color: #6b7280;">Built-in promotional materials</p>
								</div>
							</div>
						</div>
					{/if}
					
					{#if includeQR && qrCodeURL}
						<div style="text-align: center; margin: 40px 0;">
							<img src={qrCodeURL} alt="QR Code" style="width: 150px; height: 150px; margin: 0 auto 20px;" />
							<p style="font-size: 16px; color: #6b7280;">Scan to join Zaur</p>
						</div>
					{/if}
				</div>
				
				<div style="text-align: center; padding-top: 20px; border-top: 2px solid #e5e7eb;">
					<p style="font-size: 18px; font-weight: 600; color: #1f2937; margin: 0;">zaur.app</p>
					<p style="font-size: 14px; color: #6b7280; margin: 5px 0;">hello@zaur.app</p>
				</div>
			{:else if selectedLayout === 'partner'}
				<!-- Partner Flyer Layout -->
				<div style="margin-bottom: 40px;">
					<h1 style="font-size: 36px; font-weight: 800; color: #FA6B5D; margin: 0;">Partner with Zaur</h1>
					<p style="font-size: 18px; color: #6b7280; margin: 10px 0;">Empower Your Tour Guides</p>
				</div>
				
				<div style="flex: 1;">
					<h2 style="font-size: 24px; margin-bottom: 20px; color: #1f2937;">
						Why Hotels & Tourism Businesses Choose Zaur
					</h2>
					
					<div style="margin-bottom: 30px; line-height: 1.8;">
						<p style="font-size: 16px; color: #4b5563; margin-bottom: 15px;">
							Zaur helps your partner tour guides streamline their operations with modern digital tools.
						</p>
						<ul style="font-size: 16px; color: #4b5563; padding-left: 20px;">
							<li style="margin-bottom: 10px;">Help guides accept online bookings 24/7</li>
							<li style="margin-bottom: 10px;">Professional QR ticketing system</li>
							<li style="margin-bottom: 10px;">Real-time availability management</li>
							<li style="margin-bottom: 10px;">Integrated payment processing</li>
							<li style="margin-bottom: 10px;">No commission fees - guides keep 100%</li>
						</ul>
					</div>
					
					<div style="background: #fef3c7; padding: 20px; border-radius: 10px; margin-bottom: 30px;">
						<h3 style="font-size: 18px; color: #92400e; margin-bottom: 10px;">Special Partner Benefits</h3>
						<p style="color: #92400e;">Exclusive onboarding support for your tour guide partners</p>
					</div>
				</div>
				
				<div style="text-align: center;">
					<p style="font-size: 20px; font-weight: 600; color: #1f2937; margin-bottom: 10px;">
						Get Started Today
					</p>
					<p style="font-size: 24px; color: #FA6B5D; font-weight: 700;">zaur.app/partners</p>
				</div>
			{:else}
				<!-- Info Sheet Layout -->
				<div style="margin-bottom: 30px;">
					<h1 style="font-size: 36px; font-weight: 800; color: #FA6B5D; margin: 0;">Zaur Platform Overview</h1>
				</div>
				
				<div style="display: grid; grid-template-columns: 1fr 1fr; gap: 30px; margin-bottom: 30px;">
					<div>
						<h2 style="font-size: 20px; color: #1f2937; margin-bottom: 15px;">For Tour Guides</h2>
						<ul style="color: #4b5563; line-height: 1.6;">
							<li>Professional booking management</li>
							<li>Digital QR tickets</li>
							<li>Real-time notifications</li>
							<li>Marketing materials generator</li>
							<li>Customer management</li>
							<li>Analytics dashboard</li>
						</ul>
					</div>
					<div>
						<h2 style="font-size: 20px; color: #1f2937; margin-bottom: 15px;">For Customers</h2>
						<ul style="color: #4b5563; line-height: 1.6;">
							<li>Easy online booking</li>
							<li>Secure payment processing</li>
							<li>Instant QR tickets</li>
							<li>Tour reminders</li>
							<li>Direct guide contact</li>
							<li>Mobile-friendly experience</li>
						</ul>
					</div>
				</div>
				
				<div style="background: #f3f4f6; padding: 20px; border-radius: 10px; margin-bottom: 30px;">
					<h3 style="font-size: 18px; color: #1f2937; margin-bottom: 10px;">Pricing</h3>
					<div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 15px; text-align: center;">
						<div>
							<p style="font-weight: 600; color: #1f2937;">Free</p>
							<p style="color: #6b7280; font-size: 14px;">Get started</p>
						</div>
						<div>
							<p style="font-weight: 600; color: #1f2937;">Starter Pro</p>
							<p style="color: #6b7280; font-size: 14px;">€12/month</p>
						</div>
						<div>
							<p style="font-weight: 600; color: #1f2937;">Professional</p>
							<p style="color: #6b7280; font-size: 14px;">€29/month</p>
						</div>
						<div>
							<p style="font-weight: 600; color: #1f2937;">Agency</p>
							<p style="color: #6b7280; font-size: 14px;">€79/month</p>
						</div>
					</div>
				</div>
				
				<div style="text-align: center;">
					<p style="font-size: 18px; font-weight: 700; color: #FA6B5D;">No Booking Fees, Ever!</p>
				</div>
			{/if}
		</div>
	</div>
{/if}

<style>
	.professional-card {
		background: var(--bg-primary);
		border: 1px solid var(--border-primary);
		border-radius: var(--radius-lg);
		padding: var(--space-6);
	}
	
	.bg-secondary {
		background: var(--bg-secondary);
	}
	
	.border-primary {
		border-color: var(--color-primary-500) !important;
	}
	
	.border-border {
		border-color: var(--border-primary);
	}
	
	.text-secondary {
		color: var(--text-secondary);
	}
	
	.hidden {
		display: none !important;
	}
</style> 