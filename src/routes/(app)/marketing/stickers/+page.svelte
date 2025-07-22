<script lang="ts">
	import { browser } from '$app/environment';
	import { currentUser } from '$lib/stores/auth.js';
	import { createQuery } from '@tanstack/svelte-query';
	import PageHeader from '$lib/components/PageHeader.svelte';
	import Download from 'lucide-svelte/icons/download';
	import Copy from 'lucide-svelte/icons/copy';
	import Check from 'lucide-svelte/icons/check';
	import QrCode from 'lucide-svelte/icons/qr-code';
	import Printer from 'lucide-svelte/icons/printer';
	import Palette from 'lucide-svelte/icons/palette';
	import User from 'lucide-svelte/icons/user';
	
	// Components
	import MarketingNav from '$lib/components/MarketingNav.svelte';
	
	// Profile data query
	const profileQuery = createQuery({
		queryKey: ['profile'],
		queryFn: async () => {
			const response = await fetch('/api/profile');
			if (!response.ok) throw new Error('Failed to fetch profile');
			return response.json();
		},
		staleTime: 30000
	});
	
	let profile = $derived($profileQuery.data);
	
	let showCopied = $state(false);
	let generating = $state(false);
	let selectedDesign = $state<'professional' | 'colorful' | 'minimal'>('professional');
	let customTagline = $state('');
	
	// Build the personalized URL
	let personalizedURL = $derived(profile?.username 
		? `https://zaur.app/${profile.username}?ref=sticker`
		: '');
	
	// Default taglines based on design
	let defaultTagline = $derived(selectedDesign === 'professional' 
		? 'Professional Tours'
		: selectedDesign === 'colorful'
		? 'Book Your Adventure'
		: 'Scan & Book');
	
	let tagline = $derived(customTagline || defaultTagline);
	
	function copyURL() {
		if (personalizedURL) {
			navigator.clipboard.writeText(personalizedURL);
			showCopied = true;
			setTimeout(() => showCopied = false, 2000);
		}
	}
	
	async function generatePDF() {
		if (!profile?.username) {
			alert('Please complete your profile first');
			return;
		}
		
		generating = true;
		try {
			const response = await fetch('/api/marketing/generate-stickers', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({
					design: selectedDesign,
					tagline,
					businessName: profile.businessName || profile.name,
					username: profile.username
				})
			});
			
			if (response.ok) {
				const blob = await response.blob();
				const url = window.URL.createObjectURL(blob);
				const a = document.createElement('a');
				a.href = url;
				a.download = `${profile.username}-promotional-stickers-${new Date().toISOString().split('T')[0]}.pdf`;
				a.click();
				window.URL.revokeObjectURL(url);
			} else {
				console.error('Failed to generate stickers PDF');
				alert('Failed to generate PDF. Please try again.');
			}
		} catch (error) {
			console.error('Error generating stickers:', error);
			alert('Error generating PDF. Please try again.');
		} finally {
			generating = false;
		}
	}
</script>

<svelte:head>
	<title>Promotional Stickers - Marketing - Zaur</title>
</svelte:head>

<div class="max-w-screen-2xl mx-auto px-6 sm:px-8 lg:px-12 py-8">
	<PageHeader title="Promotional Stickers" />
	
	<MarketingNav />
	
	{#if $profileQuery.isLoading}
		<div class="flex justify-center items-center py-12">
			<div class="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
		</div>
	{:else if !profile?.username}
		<div class="professional-card max-w-2xl mx-auto text-center py-12">
			<User class="w-12 h-12 mx-auto mb-4 text-secondary" />
			<h2 class="text-xl font-semibold text-primary mb-2">Complete Your Profile</h2>
			<p class="text-secondary mb-6">You need to set up your username to generate personalized stickers</p>
			<a href="/profile" class="button button--primary">
				Go to Profile
			</a>
		</div>
	{:else}
		<!-- Design Selection -->
		<div class="professional-card mb-8">
			<h2 class="text-lg font-semibold text-primary mb-4 flex items-center gap-2">
				<Palette class="w-5 h-5" />
				Choose Your Design
			</h2>
			<div class="grid grid-cols-1 md:grid-cols-3 gap-4">
				<button
					class="p-4 rounded-lg border-2 transition-all cursor-pointer {selectedDesign === 'professional' ? 'border-coral-200 bg-coral-50' : 'border-border'}"
					onclick={() => selectedDesign = 'professional'}
				>
					<h3 class="font-semibold text-primary mb-2">Professional</h3>
					<p class="text-sm text-secondary">Clean design with your business branding</p>
				</button>
				
				<button
					class="p-4 rounded-lg border-2 transition-all cursor-pointer {selectedDesign === 'colorful' ? 'border-coral-200 bg-coral-50' : 'border-border'}"
					onclick={() => selectedDesign = 'colorful'}
				>
					<h3 class="font-semibold text-primary mb-2">Colorful</h3>
					<p class="text-sm text-secondary">Eye-catching design with vibrant colors</p>
				</button>
				
				<button
					class="p-4 rounded-lg border-2 transition-all cursor-pointer {selectedDesign === 'minimal' ? 'border-coral-200 bg-coral-50' : 'border-border'}"
					onclick={() => selectedDesign = 'minimal'}
				>
					<h3 class="font-semibold text-primary mb-2">Minimal</h3>
					<p class="text-sm text-secondary">Simple and elegant design</p>
				</button>
			</div>
		</div>
		
		<!-- Customization Options -->
		<div class="professional-card mb-8">
			<h2 class="text-lg font-semibold text-primary mb-4">Customize Your Stickers</h2>
			<div class="space-y-4">
				<div>
					<label for="tagline" class="block text-sm font-medium text-secondary mb-2">
						Custom Tagline (optional)
					</label>
					<input
						id="tagline"
						type="text"
						bind:value={customTagline}
						placeholder={defaultTagline}
						maxlength="30"
						class="w-full max-w-md"
					/>
					<p class="text-xs text-secondary mt-1">Leave empty to use default: "{defaultTagline}"</p>
				</div>
			</div>
		</div>
		
		<!-- Quick Actions -->
		<div class="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
			<button
				class="professional-card hover:border-coral-200 transition-colors cursor-pointer text-left"
				onclick={generatePDF}
				disabled={generating}
			>
				<div class="flex items-center gap-3 mb-3">
					<div class="professional-icon professional-icon--coral">
						{#if generating}
							<div class="w-5 h-5 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
						{:else}
							<Download class="w-5 h-5" strokeWidth={2} />
						{/if}
					</div>
					<h3 class="text-lg font-semibold text-primary">
						{generating ? 'Generating...' : 'Generate PDF'}
					</h3>
				</div>
				<p class="text-secondary text-sm">Download your personalized stickers (6 per A4 page)</p>
			</button>
			
			<button
				class="professional-card hover:border-coral-200 transition-colors cursor-pointer text-left"
				onclick={copyURL}
				disabled={!personalizedURL}
			>
				<div class="flex items-center gap-3 mb-3">
					<div class="professional-icon professional-icon--orange">
						{#if showCopied}
							<Check class="w-5 h-5" strokeWidth={2} />
						{:else}
							<Copy class="w-5 h-5" strokeWidth={2} />
						{/if}
					</div>
					<h3 class="text-lg font-semibold text-primary">
						{showCopied ? 'Copied!' : 'Copy Your URL'}
					</h3>
				</div>
				<p class="text-secondary text-sm">Copy your personalized booking URL</p>
			</button>
		</div>
		
		<!-- Preview Section -->
		<div class="professional-card mb-8">
			<h2 class="text-lg font-semibold text-primary mb-4">Preview</h2>
			<div class="flex justify-center">
				<div class="sticker-preview sticker-preview--{selectedDesign}">
					<div class="sticker-content">
						<div class="business-name">{profile.businessName || profile.name}</div>
						<div class="tagline">{tagline}</div>
						<div class="qr-placeholder">
							<QrCode class="w-10 h-10" />
						</div>
						<div class="website-url">zaur.app/{profile.username}</div>
					</div>
				</div>
			</div>
		</div>
		
		<!-- Technical Specifications -->
		<div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
			<div class="professional-card">
				<h3 class="text-lg font-semibold text-primary mb-4 flex items-center gap-2">
					<Printer class="w-5 h-5" />
					Print Specifications
				</h3>
				<div class="space-y-3 text-sm">
					<div class="flex justify-between">
						<span class="text-secondary">Size per sticker:</span>
						<span class="font-medium text-primary">85mm × 85mm (3.3" × 3.3")</span>
					</div>
					<div class="flex justify-between">
						<span class="text-secondary">Format:</span>
						<span class="font-medium text-primary">A4 page, 6 stickers</span>
					</div>
					<div class="flex justify-between">
						<span class="text-secondary">Paper type:</span>
						<span class="font-medium text-primary">Adhesive sticker paper</span>
					</div>
				</div>
			</div>
			
			<div class="professional-card">
				<h3 class="text-lg font-semibold text-primary mb-4 flex items-center gap-2">
					<QrCode class="w-5 h-5" />
					Your QR Code
				</h3>
				<div class="space-y-3 text-sm">
					<div class="flex justify-between">
						<span class="text-secondary">Links to:</span>
						<span class="font-medium text-primary break-all">zaur.app/{profile.username}</span>
					</div>
					<div class="flex justify-between">
						<span class="text-secondary">Tracking:</span>
						<span class="font-medium text-primary">?ref=sticker</span>
					</div>
					<div class="flex justify-between">
						<span class="text-secondary">Shows:</span>
						<span class="font-medium text-primary">Your profile & tours</span>
					</div>
				</div>
			</div>
		</div>
	{/if}
</div>

<style>
	.sticker-preview {
		width: 200px;
		height: 200px;
		border-radius: 12px;
		padding: 20px;
		display: flex;
		align-items: center;
		justify-content: center;
		box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
	}
	
	.sticker-preview--professional {
		background: linear-gradient(135deg, #ffffff 0%, #fafafa 100%);
		border: 2px solid #e5e7eb;
	}
	
	.sticker-preview--colorful {
		background: linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%);
		color: white;
	}
	
	.sticker-preview--minimal {
		background: white;
		border: 2px solid #000;
	}
	
	.sticker-content {
		text-align: center;
	}
	
	.business-name {
		font-size: 18px;
		font-weight: 700;
		margin-bottom: 8px;
	}
	
	.sticker-preview--professional .business-name {
		color: #1f2937;
	}
	
	.sticker-preview--minimal .business-name {
		color: #000;
	}
	
	.tagline {
		font-size: 12px;
		margin-bottom: 16px;
		opacity: 0.8;
	}
	
	.qr-placeholder {
		width: 80px;
		height: 80px;
		background: rgba(0, 0, 0, 0.05);
		border-radius: 8px;
		display: flex;
		align-items: center;
		justify-content: center;
		margin: 0 auto 16px;
	}
	
	.sticker-preview--colorful .qr-placeholder {
		background: rgba(255, 255, 255, 0.2);
		color: white;
	}
	
	.sticker-preview--minimal .qr-placeholder {
		background: #f5f5f5;
		color: #666;
	}
	
	.website-url {
		font-size: 14px;
		font-weight: 600;
	}
	
	.sticker-preview--professional .website-url {
		color: #f97316;
	}
	
	.sticker-preview--minimal .website-url {
		color: #000;
	}
</style> 