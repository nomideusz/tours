<script lang="ts">
	import { onMount } from 'svelte';
	import { enhance } from '$app/forms';
	import type { Tour, QRCode } from '$lib/types.js';
	import Copy from 'lucide-svelte/icons/copy';
	import Check from 'lucide-svelte/icons/check';
	
	interface Props {
		tour: Tour;
		onSuccess?: () => void;
	}
	
	let { tour, onSuccess }: Props = $props();
	
	// Form data - simplified
	let name = $state('');
	let category = $state<'digital' | 'print' | 'partner' | 'event' | 'promo'>('print');
	let selectedStyle = $state('classic');
	
	// Generate suggested name based on category
	function generateSuggestedName(cat: typeof category): string {
		const now = new Date();
		const month = now.toLocaleString('en', { month: 'short' });
		
		const suggestions = {
			digital: `Social Media QR`,
			print: `Print Flyer ${month}`,
			partner: `Partner Link`,
			event: `Event ${month}`,
			promo: `Special Offer`
		};
		
		return suggestions[cat];
	}
	
	// Get color from CSS variables
	function getCSSColor(variable: string): string {
		if (typeof window !== 'undefined') {
			return getComputedStyle(document.documentElement).getPropertyValue(variable).trim() || '#3B82F6';
		}
		return '#3B82F6'; // fallback
	}

	// Category configuration
	const categories = [
		{ value: 'digital', label: 'Digital/Social', icon: '📱', color: '#3B82F6' },
		{ value: 'print', label: 'Print Materials', icon: '🖨️', color: '#10B981' },
		{ value: 'partner', label: 'Partner/Referral', icon: '🤝', color: '#F59E0B' },
		{ value: 'event', label: 'Special Events', icon: '🎉', color: '#8B5CF6' },
		{ value: 'promo', label: 'Limited Offers', icon: '🔥', color: '#EF4444' }
	] as const;
	
	// Color themes - practical options that scan well
	let qrStyles = $state([
		{ 
			id: 'classic', 
			name: 'Classic', 
			preview: '⬛', 
			get color() { return getCSSColor('--text-primary') || '#000000'; },
			get backgroundColor() { return getCSSColor('--bg-primary') || '#FFFFFF'; }
		},
		{ 
			id: 'blue', 
			name: 'Blue', 
			preview: '🟦', 
			get color() { return getCSSColor('--color-primary-600') || '#3B82F6'; },
			get backgroundColor() { return getCSSColor('--color-primary-50') || '#F8FAFC'; }
		},
		{ 
			id: 'green', 
			name: 'Green', 
			preview: '🟩', 
			color: '#10B981', 
			backgroundColor: '#F0FDF4'
		},
		{ 
			id: 'purple', 
			name: 'Purple', 
			preview: '🟪', 
			color: '#8B5CF6', 
			backgroundColor: '#FAF5FF'
		},
		{ 
			id: 'theme', 
			name: 'Theme', 
			preview: '🎨', 
			get color() { return getCSSColor('--color-primary-600') || '#3B82F6'; },
			get backgroundColor() { return getCSSColor('--bg-primary') || '#FFFFFF'; }
		}
	]);
	
	// UI state
	let isGenerating = $state(false);
	let error = $state<string | null>(null);
	let previewUrl = $state<string | null>(null);
	let generatedCode = $state<string | null>(null);
	let copiedUrl = $state(false);
	
	// Generate unique code
	function generateUniqueCode(): string {
		const tourPrefix = tour.name.substring(0, 3).toUpperCase().replace(/[^A-Z]/g, '');
		const randomSuffix = Math.random().toString(36).substring(2, 8).toUpperCase();
		return `${tourPrefix}-${randomSuffix}`;
	}
	
	// Generate QR code preview
	async function generatePreview() {
		try {
			error = null;
			
			// Only generate code once, don't regenerate when changing colors
			if (!generatedCode) {
				generatedCode = generateUniqueCode();
			}
			
			const selectedStyleConfig = qrStyles.find(s => s.id === selectedStyle)!;
			const bookingUrl = `${window.location.origin}/book/${generatedCode}`;
			
			// Use simple QR code API for preview - no complex libraries needed
			const qrApiUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(bookingUrl)}&color=${selectedStyleConfig.color.replace('#', '')}&bgcolor=${selectedStyleConfig.backgroundColor.replace('#', '')}`;
			previewUrl = qrApiUrl;
		} catch (err) {
			error = 'Failed to generate preview';
			console.error('Preview generation error:', err);
		}
	}
	
	// Copy booking URL
	async function copyBookingUrl() {
		if (!generatedCode) return;
		
		const url = `${window.location.origin}/book/${generatedCode}`;
		try {
			await navigator.clipboard.writeText(url);
			copiedUrl = true;
			setTimeout(() => { copiedUrl = false; }, 2000);
		} catch (err) {
			console.error('Failed to copy URL:', err);
		}
	}
	
	// Form validation
	function validateForm() {
		if (!name.trim()) {
			error = 'Please enter a name for this QR code';
			return false;
		}
		
		if (!generatedCode) {
			error = 'Please generate a QR code first';
			return false;
		}
		
		error = null;
		return true;
	}
	
	// Update name when category changes
	$effect(() => {
		name = generateSuggestedName(category);
	});
	
	// Generate preview when style changes
	$effect(() => {
		generatePreview();
	});
	
	// Initialize
	onMount(() => {
		name = generateSuggestedName(category);
		generatePreview();
	});
</script>

<div class="space-y-6">
			{#if error}
			<div class="bg-red-50 border border-red-200 rounded-xl p-4">
				<p class="text-sm text-red-600">{error}</p>
			</div>
		{/if}
	
	<!-- Preview Section -->
	<div class="rounded-xl p-6 text-center" style="background: var(--bg-secondary); border: 1px solid var(--color-primary-200);">
		<h3 class="text-lg font-semibold mb-4" style="color: var(--text-primary);">Preview</h3>
		
		<div class="inline-block p-4 rounded-xl shadow-sm" style="background: var(--bg-primary);">
			{#if previewUrl}
				<img src={previewUrl} alt="QR Code Preview" class="w-32 h-32 mx-auto" />
			{:else}
				<div class="w-32 h-32 rounded-lg flex items-center justify-center" style="background: var(--bg-tertiary);">
					<div class="form-spinner"></div>
				</div>
			{/if}
		</div>
		
		{#if generatedCode}
			<div class="mt-4 flex items-center justify-center gap-2">
				<code class="text-xs font-mono px-3 py-1.5 rounded-lg" style="background: var(--bg-primary); border: 1px solid var(--color-primary-200); color: var(--text-secondary);">
					{window.location.origin}/book/{generatedCode}
				</code>
				<button
					onclick={copyBookingUrl}
					class="p-1.5 transition-colors rounded-md"
					style="color: var(--text-secondary);"
					onmouseenter={(e) => {
						e.currentTarget.style.color = 'var(--text-primary)';
						e.currentTarget.style.background = 'var(--bg-secondary)';
					}}
					onmouseleave={(e) => {
						e.currentTarget.style.color = 'var(--text-secondary)';
						e.currentTarget.style.background = 'transparent';
					}}
					title="Copy booking URL"
				>
					{#if copiedUrl}
						<Check class="h-4 w-4" style="color: var(--text-primary);" />
					{:else}
						<Copy class="h-4 w-4" />
					{/if}
				</button>
			</div>
		{/if}
	</div>
	
	<!-- Form -->
	<form method="POST" action="?/createQR" use:enhance={() => {
		if (!validateForm()) {
			return; // Prevent submission if validation fails
		}
		isGenerating = true;
		return async ({ result }) => {
			isGenerating = false;
			if (result.type === 'success') {
				if (onSuccess) {
					onSuccess();
				}
			} else if (result.type === 'failure') {
				error = (result.data?.error as string) || 'Failed to create QR code';
			}
		};
	}} class="space-y-6">
		<!-- Hidden fields for server action -->
		<input type="hidden" name="tourId" value={tour.id} />
		<input type="hidden" name="code" value={generatedCode || ''} />
		<input type="hidden" name="color" value={qrStyles.find(s => s.id === selectedStyle)?.color || '#000000'} />
		<input type="hidden" name="backgroundColor" value={qrStyles.find(s => s.id === selectedStyle)?.backgroundColor || '#FFFFFF'} />

		<!-- Name -->
		<div>
			<label for="qr-name" class="form-label">QR Code Name</label>
			<input
				id="qr-name"
				name="name"
				type="text"
				bind:value={name}
				placeholder="e.g., Flyer Campaign, Business Card"
				class="form-input"
				required
			/>
			<p class="form-help">Give your QR code a descriptive name for easy identification</p>
		</div>
		
		<!-- Category -->
		<div>
			<label class="form-label">Category</label>
			<div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
				{#each categories as cat}
					<label class="flex items-center gap-3 p-4 border-2 rounded-xl cursor-pointer transition-all hover:shadow-sm" style="{
						category === cat.value 
							? 'border-color: var(--color-primary-500); background: var(--bg-secondary);' 
							: 'border-color: var(--border-primary); background: var(--bg-primary);'
					}" onmouseenter="{category !== cat.value ? (e) => {
						e.currentTarget.style.borderColor = 'var(--border-secondary)';
						e.currentTarget.style.background = 'var(--bg-secondary)';
					} : null}" onmouseleave="{category !== cat.value ? (e) => {
						e.currentTarget.style.borderColor = 'var(--border-primary)';
						e.currentTarget.style.background = 'var(--bg-primary)';
					} : null}">
						<input
							type="radio"
							name="category"
							value={cat.value}
							bind:group={category}
							class="sr-only"
						/>
						<span class="text-xl">{cat.icon}</span>
						<span class="font-medium flex-1" style="color: var(--text-primary);">{cat.label}</span>
						{#if category === cat.value}
							<div class="w-2 h-2 rounded-full" style="background: var(--color-primary-600);"></div>
						{/if}
					</label>
				{/each}
			</div>
		</div>
		
		<!-- Color Theme -->
		<div>
			<label class="form-label">Color Theme</label>
			<div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
				{#each qrStyles as style}
					<label class="flex flex-col items-center gap-2 p-3 border-2 rounded-lg cursor-pointer transition-all hover:shadow-sm" style="{
						selectedStyle === style.id 
							? 'border-color: var(--color-primary-500); background: var(--bg-secondary);' 
							: 'border-color: var(--border-primary); background: var(--bg-primary);'
					}" onmouseenter="{selectedStyle !== style.id ? (e) => {
						e.currentTarget.style.borderColor = 'var(--border-secondary)';
						e.currentTarget.style.background = 'var(--bg-secondary)';
					} : null}" onmouseleave="{selectedStyle !== style.id ? (e) => {
						e.currentTarget.style.borderColor = 'var(--border-primary)';
						e.currentTarget.style.background = 'var(--bg-primary)';
					} : null}">
						<input
							type="radio"
							name="style"
							value={style.id}
							bind:group={selectedStyle}
							class="sr-only"
						/>
						<span class="text-xl">{style.preview}</span>
						<span class="text-xs font-medium" style="color: var(--text-primary);">{style.name}</span>
						{#if selectedStyle === style.id}
							<div class="w-1.5 h-1.5 rounded-full" style="background: var(--color-primary-600);"></div>
						{/if}
					</label>
				{/each}
			</div>
		</div>
		
		<!-- Actions -->
		<div class="flex gap-3 pt-4">
			<button
				type="submit"
				disabled={isGenerating}
				class="button-primary button--gap flex-1"
			>
				{#if isGenerating}
					<div class="form-spinner"></div>
					Creating...
				{:else}
					Create QR Code
				{/if}
			</button>
		</div>
	</form>
</div>

 