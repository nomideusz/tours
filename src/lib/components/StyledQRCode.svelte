<script lang="ts">
	import { browser } from '$app/environment';
	import { generateQRImageURL } from '$lib/utils/qr-generation.js';
	import QrCode from 'lucide-svelte/icons/qr-code';
	import type { MouseEventHandler } from 'svelte/elements';

	interface Props {
		qrCode: string;
		size?: number;
		tourName?: string;
		showLabel?: boolean;
		style?: 'default' | 'modern' | 'premium' | 'minimal';
		onclick?: MouseEventHandler<HTMLButtonElement>;
		class?: string;
	}

	let { 
		qrCode, 
		size = 200,
		tourName,
		showLabel = false,
		style = 'modern',
		onclick,
		class: className = ''
	}: Props = $props();

	// Calculate sizes with proportional padding
	let padding = $derived(size <= 100 ? 6 : size <= 150 ? 8 : 10);
	let borderWidth = $derived(size <= 100 ? 1 : 2);
	let labelHeight = $derived(showLabel ? 50 : 0); // Increased to prevent text cutoff
	let containerSize = $derived(showLabel ? size + labelHeight : size);
	let qrSize = $derived(size - (padding * 2) - (borderWidth * 2)); // Account for padding and border
	
	// Only show center logo for larger QR codes
	let showCenterLogo = $derived(size >= 150);
	let logoSize = $derived(Math.min(36, Math.max(24, size * 0.15))); // 15% of size, min 24px, max 36px

	// Get QR image URL with styling
	let qrImageUrl = $derived(generateQRImageURL(qrCode, {
		size: qrSize,
		style: style === 'default' ? 'default' : 'modern',
		margin: size <= 100 ? 2 : 3, // Less margin for small QR codes
		errorCorrection: showCenterLogo ? 'H' : 'M' // High error correction only if we show logo
	}));

	// Style configurations
	let styleConfig = $derived(() => {
		switch (style) {
			case 'premium':
				return {
					borderColor: 'var(--color-primary-600)',
					shadowColor: 'var(--color-primary-200)',
					labelBg: 'var(--color-primary-50)',
					labelColor: 'var(--color-primary-700)'
				};
			case 'minimal':
				return {
					borderColor: 'var(--border-secondary)',
					shadowColor: 'transparent',
					labelBg: 'var(--bg-secondary)',
					labelColor: 'var(--text-secondary)'
				};
			case 'modern':
			default:
				return {
					borderColor: 'var(--border-primary)',
					shadowColor: 'rgba(0, 0, 0, 0.1)',
					labelBg: 'var(--bg-primary)',
					labelColor: 'var(--text-primary)'
				};
		}
	});

	let config = $derived(styleConfig());
</script>

<button
	{onclick}
	class="styled-qr-container {className}"
	style="--size: {containerSize}px; --qr-size: {qrSize}px; --padding: {padding}px; --border-width: {borderWidth}px; --border-color: {config.borderColor}; --shadow-color: {config.shadowColor}; --logo-size: {logoSize}px; --label-height: {labelHeight}px;"
	type="button"
	disabled={!onclick}
>
	<div class="qr-wrapper">
		{#if browser}
			<img 
				src={qrImageUrl} 
				alt="QR Code{tourName ? ` for ${tourName}` : ''}"
				class="qr-image"
				loading="lazy"
			/>
			<!-- Center logo/icon - only for larger QR codes -->
			{#if showCenterLogo}
				<div class="qr-center-icon">
					<div class="icon-background">
						<span class="icon-text">Z</span>
					</div>
				</div>
			{/if}
		{:else}
			<div class="qr-placeholder">
				<QrCode class="h-8 w-8" style="color: var(--text-tertiary);" />
			</div>
		{/if}
	</div>
	
	{#if showLabel && tourName}
		<div class="qr-label" style="background: {config.labelBg}; color: {config.labelColor};">
			<p class="label-text">{tourName}</p>
			<p class="label-subtext">Scan to book</p>
		</div>
	{/if}
</button>

<style>
	.styled-qr-container {
		position: relative;
		width: var(--size);
		height: calc(var(--size) + var(--label-height));
		padding: 0;
		background: white;
		border: var(--border-width) solid var(--border-color);
		border-radius: 12px;
		overflow: hidden;
		transition: all 0.2s ease;
		cursor: pointer;
		box-shadow: 0 2px 8px var(--shadow-color);
		display: flex;
		flex-direction: column;
	}

	.styled-qr-container:disabled {
		cursor: default;
	}

	.styled-qr-container:not(:disabled):hover {
		transform: translateY(-2px);
		box-shadow: 0 4px 16px var(--shadow-color);
	}

	.styled-qr-container:not(:disabled):active {
		transform: scale(0.98);
	}

	.qr-wrapper {
		position: relative;
		width: 100%;
		height: var(--size);
		display: flex;
		align-items: center;
		justify-content: center;
		padding: var(--padding);
		box-sizing: border-box;
	}

	.qr-image {
		width: 100%;
		height: 100%;
		object-fit: contain;
	}

	.qr-placeholder {
		width: 100%;
		height: 100%;
		display: flex;
		align-items: center;
		justify-content: center;
		background: var(--bg-secondary);
	}

	/* Center icon/logo */
	.qr-center-icon {
		position: absolute;
		top: 50%;
		left: 50%;
		transform: translate(-50%, -50%);
		width: var(--logo-size);
		height: var(--logo-size);
		display: flex;
		align-items: center;
		justify-content: center;
		pointer-events: none;
	}

	.icon-background {
		width: 100%;
		height: 100%;
		background: white;
		border: 2px solid var(--color-primary-600);
		border-radius: 8px;
		display: flex;
		align-items: center;
		justify-content: center;
		box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
	}

	.icon-text {
		font-size: calc(var(--logo-size) * 0.5);
		font-weight: 700;
		color: var(--color-primary-600);
		font-family: system-ui, -apple-system, sans-serif;
	}

	/* Label section */
	.qr-label {
		position: relative;
		padding: 10px 12px;
		border-top: 1px solid var(--border-color);
		text-align: center;
		margin-top: auto;
		box-sizing: border-box;
	}

	.label-text {
		font-size: 12px;
		font-weight: 600;
		margin: 0;
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
		line-height: 1.2;
	}

	.label-subtext {
		font-size: 10px;
		margin: 2px 0 0 0;
		opacity: 0.7;
		line-height: 1.2;
	}

	/* Dark mode adjustments */
	:global(.dark) .styled-qr-container {
		background: var(--bg-primary);
	}

	:global(.dark) .icon-background {
		background: var(--bg-primary);
	}
</style> 