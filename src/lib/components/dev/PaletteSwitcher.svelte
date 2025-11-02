<script lang="ts">
	import { onMount } from 'svelte';
	
	let isOpen = $state(false);
	let currentPalette = $state('current');
	
	const palettes = {
		current: {
			name: 'Current (Coral)',
			primary: '#e8523e',
			primaryRgb: '232, 82, 62',
			secondary: '#FFAD5A',
			accent: '#0ea5e9'
		},
		oceanAdventure: {
			name: 'Ocean Adventure',
			primary: '#0891b2',
			primaryRgb: '8, 145, 178',
			secondary: '#f59e0b',
			accent: '#0ea5e9'
		},
		tropicalTeal: {
			name: 'Tropical Teal',
			primary: '#14b8a6',
			primaryRgb: '20, 184, 166',
			secondary: '#f97316',
			accent: '#06b6d4'
		},
		deepBlue: {
			name: 'Deep Blue Trust',
			primary: '#0284c7',
			primaryRgb: '2, 132, 199',
			secondary: '#f59e0b',
			accent: '#8b5cf6'
		},
		adventureGreen: {
			name: 'Adventure Green',
			primary: '#059669',
			primaryRgb: '5, 150, 105',
			secondary: '#f59e0b',
			accent: '#0891b2'
		}
	};
	
	let feedbackSubmitted = $state(false);
	
	function applyPalette(paletteKey: string) {
		const palette = palettes[paletteKey as keyof typeof palettes];
		if (!palette) return;
		
		const root = document.documentElement;
		root.style.setProperty('--primary', palette.primary);
		root.style.setProperty('--primary-rgb', palette.primaryRgb);
		root.style.setProperty('--color-primary-600', palette.primary);
		
		currentPalette = paletteKey;
		localStorage.setItem('demo-palette', paletteKey);
	}
	
	async function submitPaletteFeedback(paletteKey: string) {
		try {
			await fetch('/api/palette-feedback', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					palette: paletteKey,
					timestamp: new Date().toISOString(),
					userAgent: navigator.userAgent
				})
			});
			feedbackSubmitted = true;
			setTimeout(() => feedbackSubmitted = false, 3000);
		} catch (error) {
			console.error('Failed to submit palette feedback:', error);
		}
	}
	
	onMount(() => {
		// Check for saved palette
		const saved = localStorage.getItem('demo-palette');
		if (saved && palettes[saved as keyof typeof palettes]) {
			applyPalette(saved);
		}
		
		// Keyboard shortcut: Ctrl+Shift+P to toggle
		function handleKeydown(e: KeyboardEvent) {
			if (e.ctrlKey && e.shiftKey && e.key === 'P') {
				e.preventDefault();
				isOpen = !isOpen;
			}
		}
		
		window.addEventListener('keydown', handleKeydown);
		
		return () => {
			window.removeEventListener('keydown', handleKeydown);
		};
	});
</script>

<!-- Floating Button -->
<button 
	class="palette-toggle"
	onclick={() => isOpen = !isOpen}
	title="Toggle palette switcher (Ctrl+Shift+P)"
>
	🎨
</button>

<!-- Palette Switcher Panel -->
{#if isOpen}
	<div class="palette-panel">
		<div class="panel-header">
			<h3>Color Palette Switcher</h3>
			<button class="close-btn" onclick={() => isOpen = false}>×</button>
		</div>
		
		<div class="palette-list">
			{#each Object.entries(palettes) as [key, palette]}
				<button
					class="palette-option"
					class:active={currentPalette === key}
					onclick={() => applyPalette(key)}
				>
					<div class="palette-preview">
						<span class="color-dot" style="background: {palette.primary}"></span>
						<span class="color-dot" style="background: {palette.secondary}"></span>
						<span class="color-dot" style="background: {palette.accent}"></span>
					</div>
					<span class="palette-name">{palette.name}</span>
					{#if currentPalette === key}
						<span class="active-badge">✓</span>
					{/if}
				</button>
			{/each}
		</div>
		
		<div class="panel-footer">
			<p class="footer-text">Try different palettes, then vote for your favorite:</p>
			{#if feedbackSubmitted}
				<div class="success-message">✓ Vote submitted! Thank you!</div>
			{:else}
				<button 
					class="vote-btn" 
					onclick={() => submitPaletteFeedback(currentPalette)}
					disabled={currentPalette === 'current'}
				>
					Vote for {palettes[currentPalette as keyof typeof palettes].name}
				</button>
			{/if}
			<p class="shortcut-hint">Press <kbd>Ctrl+Shift+P</kbd> to toggle</p>
		</div>
	</div>
{/if}

<style>
	.palette-toggle {
		position: fixed;
		bottom: 2rem;
		left: 2rem;
		width: 3.5rem;
		height: 3.5rem;
		border-radius: 50%;
		background: var(--primary);
		color: white;
		border: 3px solid white;
		box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
		font-size: 1.5rem;
		cursor: pointer;
		z-index: 9999;
		transition: all 0.3s ease;
		display: flex;
		align-items: center;
		justify-content: center;
	}
	
	.palette-toggle:hover {
		transform: scale(1.1);
		box-shadow: 0 6px 16px rgba(0, 0, 0, 0.3);
	}
	
	.palette-panel {
		position: fixed;
		bottom: 6rem;
		left: 2rem;
		width: 320px;
		background: white;
		border-radius: 12px;
		box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
		z-index: 9999;
		overflow: hidden;
		animation: slideUp 0.3s ease;
	}
	
	@keyframes slideUp {
		from {
			opacity: 0;
			transform: translateY(20px);
		}
		to {
			opacity: 1;
			transform: translateY(0);
		}
	}
	
	.panel-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 1rem 1.25rem;
		border-bottom: 1px solid #e5e7eb;
		background: #f9fafb;
	}
	
	.panel-header h3 {
		font-size: 1rem;
		font-weight: 700;
		color: #1a1a1a;
	}
	
	.close-btn {
		width: 2rem;
		height: 2rem;
		border-radius: 6px;
		border: none;
		background: transparent;
		color: #666;
		font-size: 1.5rem;
		cursor: pointer;
		display: flex;
		align-items: center;
		justify-content: center;
		transition: all 0.2s;
	}
	
	.close-btn:hover {
		background: #e5e7eb;
		color: #1a1a1a;
	}
	
	.palette-list {
		padding: 0.75rem;
		max-height: 400px;
		overflow-y: auto;
	}
	
	.palette-option {
		width: 100%;
		display: flex;
		align-items: center;
		gap: 0.75rem;
		padding: 0.875rem 1rem;
		border: 2px solid transparent;
		border-radius: 8px;
		background: white;
		cursor: pointer;
		transition: all 0.2s;
		margin-bottom: 0.5rem;
	}
	
	.palette-option:hover {
		background: #f9fafb;
		border-color: #e5e7eb;
	}
	
	.palette-option.active {
		background: #f0f9ff;
		border-color: var(--primary);
	}
	
	.palette-preview {
		display: flex;
		gap: 0.25rem;
	}
	
	.color-dot {
		width: 1.25rem;
		height: 1.25rem;
		border-radius: 50%;
		border: 2px solid white;
		box-shadow: 0 0 0 1px rgba(0, 0, 0, 0.1);
	}
	
	.palette-name {
		flex: 1;
		font-size: 0.875rem;
		font-weight: 600;
		color: #1a1a1a;
		text-align: left;
	}
	
	.active-badge {
		color: var(--primary);
		font-weight: 700;
		font-size: 1rem;
	}
	
	.panel-footer {
		padding: 1rem 1.25rem;
		border-top: 1px solid #e5e7eb;
		background: #f9fafb;
	}
	
	.footer-text {
		font-size: 0.8125rem;
		color: #666;
		margin-bottom: 0.75rem;
		text-align: center;
		font-weight: 600;
	}
	
	.shortcut-hint {
		font-size: 0.6875rem;
		color: #888;
		margin-top: 0.75rem;
		margin-bottom: 0;
		text-align: center;
	}
	
	.shortcut-hint kbd {
		background: #e5e7eb;
		padding: 0.125rem 0.375rem;
		border-radius: 4px;
		font-family: monospace;
		font-size: 0.6875rem;
	}
	
	.vote-btn {
		width: 100%;
		padding: 0.75rem;
		background: var(--primary);
		color: white;
		border: none;
		border-radius: 6px;
		font-size: 0.875rem;
		font-weight: 600;
		cursor: pointer;
		transition: all 0.2s;
	}
	
	.vote-btn:hover:not(:disabled) {
		transform: translateY(-1px);
		box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
	}
	
	.vote-btn:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}
	
	.success-message {
		width: 100%;
		padding: 0.75rem;
		background: #dcfce7;
		color: #15803d;
		border-radius: 6px;
		font-size: 0.875rem;
		font-weight: 600;
		text-align: center;
		border: 1px solid #86efac;
	}
	
	/* Dark mode support */
	@media (prefers-color-scheme: dark) {
		.palette-panel {
			background: #1a1a1a;
		}
		
		.panel-header {
			background: #2a2a2a;
			border-bottom-color: #404040;
		}
		
		.panel-header h3 {
			color: #f0f0f0;
		}
		
		.close-btn {
			color: #aaa;
		}
		
		.close-btn:hover {
			background: #404040;
			color: #f0f0f0;
		}
		
		.palette-option {
			background: #1a1a1a;
		}
		
		.palette-option:hover {
			background: #2a2a2a;
			border-color: #404040;
		}
		
		.palette-option.active {
			background: #1e3a4a;
		}
		
		.palette-name {
			color: #f0f0f0;
		}
		
		.panel-footer {
			background: #2a2a2a;
			border-top-color: #404040;
		}
		
		.panel-footer p {
			color: #aaa;
		}
		
		.panel-footer kbd {
			background: #404040;
			color: #f0f0f0;
		}
		
		.footer-text {
			color: #aaa;
		}
		
		.shortcut-hint {
			color: #666;
		}
		
		.shortcut-hint kbd {
			background: #404040;
			color: #f0f0f0;
		}
		
		.success-message {
			background: #064e3b;
			color: #86efac;
			border-color: #166534;
		}
	}
</style>

