<script lang="ts">
	import type { QRCode } from '$lib/types.js';
	import Download from 'lucide-svelte/icons/download';
	import Copy from 'lucide-svelte/icons/copy';
	import Share2 from 'lucide-svelte/icons/share-2';
	
	interface Props {
		qrCode: QRCode;
		size?: 'small' | 'medium' | 'large';
		showActions?: boolean;
	}
	
	let { qrCode, size = 'medium', showActions = true }: Props = $props();
	
	// Size mappings
	const sizeClasses = {
		small: 'w-48 h-48',
		medium: 'w-64 h-64',
		large: 'w-80 h-80'
	};
	
	// Category configuration
	const categories = {
		digital: { label: 'Digital/Social', icon: '📱', color: '#3B82F6' },
		print: { label: 'Print Materials', icon: '🖨️', color: '#10B981' },
		partner: { label: 'Partner/Referral', icon: '🤝', color: '#F59E0B' },
		event: { label: 'Special Events', icon: '🎉', color: '#8B5CF6' },
		promo: { label: 'Limited Offers', icon: '🔥', color: '#EF4444' }
	};
	
	// Generate QR code URL using API
	function getQRImageUrl() {
		const bookingUrl = encodeURIComponent(`${window.location.origin}/book/${qrCode.code}`);
		// Using qr-server.com as QR code generator API
		const color = qrCode.customization?.color?.replace('#', '') || '000000';
		const bgcolor = qrCode.customization?.backgroundColor?.replace('#', '') || 'FFFFFF';
		return `https://api.qrserver.com/v1/create-qr-code/?size=500x500&data=${bookingUrl}&color=${color}&bgcolor=${bgcolor}`;
	}
	
	function copyBookingUrl() {
		const url = `${window.location.origin}/book/${qrCode.code}`;
		navigator.clipboard.writeText(url);
		alert('Booking URL copied to clipboard!');
	}
	
	function downloadQR() {
		const link = document.createElement('a');
		link.href = getQRImageUrl();
		link.download = `qr-${qrCode.code}.png`;
		link.click();
	}
	
	async function shareQR() {
		const url = `${window.location.origin}/book/${qrCode.code}`;
		
		if (navigator.share) {
			try {
				await navigator.share({
					title: 'Book a tour',
					text: 'Scan this QR code to book your tour',
					url: url
				});
			} catch (err) {
				console.log('Error sharing:', err);
			}
		} else {
			copyBookingUrl();
		}
	}
</script>

<div class="bg-white rounded-lg shadow-md border border-gray-200 p-6 text-center">
	<div class="relative mx-auto mb-4 bg-gray-50 rounded-lg p-4 {sizeClasses[size]}">
		<img 
			src={getQRImageUrl()} 
			alt="QR Code for {qrCode.name}"
			class="w-full h-full rounded-lg"
		/>
		{#if qrCode.customization?.logo}
			<div class="absolute inset-0 flex items-center justify-center">
				<img 
					src={qrCode.customization.logo} 
					alt="Logo"
					class="w-12 h-12 rounded bg-white p-1"
				/>
			</div>
		{/if}
	</div>
	
	{#if showActions}
		<div class="flex justify-center gap-2 mb-4">
			<button
				onclick={copyBookingUrl}
				class="flex items-center gap-1 px-3 py-2 text-sm text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
				title="Copy booking URL"
			>
				<Copy class="w-4 h-4" />
				<span>Copy URL</span>
			</button>
			<button
				onclick={downloadQR}
				class="flex items-center gap-1 px-3 py-2 text-sm text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
				title="Download QR code"
			>
				<Download class="w-4 h-4" />
				<span>Download</span>
			</button>
			<button
				onclick={shareQR}
				class="flex items-center gap-1 px-3 py-2 text-sm text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
				title="Share QR code"
			>
				<Share2 class="w-4 h-4" />
				<span>Share</span>
			</button>
		</div>
	{/if}
	
	<div class="space-y-1">
		<div class="flex items-center gap-2 justify-center">
			<h4 class="font-medium text-gray-900">{qrCode.name}</h4>
			{#if qrCode.category && categories[qrCode.category]}
				<span 
					class="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium text-white"
					style="background-color: {categories[qrCode.category].color}"
				>
					<span>{categories[qrCode.category].icon}</span>
				</span>
			{/if}
		</div>
		<p class="text-sm text-gray-500">Code: {qrCode.code}</p>
	</div>
</div> 