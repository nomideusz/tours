<script lang="ts">
	import { fade } from 'svelte/transition';
	import { goto } from '$app/navigation';
	
	// Icons
	import ArrowRight from 'lucide-svelte/icons/arrow-right';
	import Copy from 'lucide-svelte/icons/copy';
	import Camera from 'lucide-svelte/icons/camera';
	import Sun from 'lucide-svelte/icons/sun';
	
	let showCopied = $state(false);
	
	function copyPromoCode() {
		navigator.clipboard.writeText('EARLY2025');
		showCopied = true;
		setTimeout(() => showCopied = false, 2000);
	}
	
	function handleGetStarted() {
		goto('/auth/register');
	}
</script>

<section class="film-brand-hero">
	<!-- Sky Section -->
	<div class="sky-section">
		<div class="max-w-screen-2xl mx-auto px-6 sm:px-8 lg:px-12">
			<div class="sky-content">
				<div class="film-badge">
					<Sun class="w-4 h-4" />
					<span>PROFESSIONAL SERIES</span>
				</div>
			</div>
		</div>
	</div>
	
	<!-- Horizon Section - Main Content -->
	<div class="horizon-section">
		<div class="max-w-screen-2xl mx-auto px-6 sm:px-8 lg:px-12">
			<div class="horizon-content" in:fade={{ delay: 200 }}>
				<h1 class="film-title">
					<span class="brand-name">ZAUR</span>
					<span class="product-line">QR BOOKING SYSTEM</span>
					<span class="tagline">Professional • Instant • Worldwide</span>
				</h1>
				
				<div class="film-strip">
					<div class="strip-hole"></div>
					<div class="strip-hole"></div>
					<div class="strip-hole"></div>
					<div class="strip-hole"></div>
					<div class="strip-hole"></div>
				</div>
				
				<p class="film-description">
					Transform your tours with professional QR code bookings.<br>
					<strong>Zero commission. Maximum impact.</strong>
				</p>
			</div>
		</div>
	</div>
	
	<!-- Sunset Section -->
	<div class="sunset-section">
		<div class="max-w-screen-2xl mx-auto px-6 sm:px-8 lg:px-12">
			<div class="sunset-content">
				<!-- Film Cartridge Style Promo -->
				<div class="film-cartridge">
					<div class="cartridge-top">
						<span class="film-type">EARLY ACCESS</span>
						<span class="film-speed">80% OFF</span>
					</div>
					<div class="cartridge-body">
						<button 
							class="film-code-button"
							onclick={copyPromoCode}
							aria-label="Copy promo code EARLY2025"
						>
							<span class="film-code">EARLY2025</span>
							<Copy class="w-4 h-4" />
						</button>
						{#if showCopied}
							<p class="exposed-text" in:fade={{ duration: 200 }}>
								✓ EXPOSED TO CLIPBOARD
							</p>
						{/if}
					</div>
				</div>
				
				<button onclick={handleGetStarted} class="film-cta-button">
					<Camera class="w-5 h-5" />
					<span>START SHOOTING</span>
					<ArrowRight class="w-4 h-4" />
				</button>
			</div>
		</div>
	</div>
	
	<!-- Ground Section -->
	<div class="ground-section">
		<div class="max-w-screen-2xl mx-auto px-6 sm:px-8 lg:px-12">
			<div class="ground-content">
				<!-- Film Format Stats -->
				<div class="film-specs">
					<div class="spec-box">
						<div class="spec-format">35mm</div>
						<div class="spec-label">SETUP TIME<br>5 MINUTES</div>
					</div>
					<div class="spec-box">
						<div class="spec-format">120</div>
						<div class="spec-label">COMMISSION<br>0% FEES</div>
					</div>
					<div class="spec-box">
						<div class="spec-format">220</div>
						<div class="spec-label">PAYMENT<br>STRIPE SECURE</div>
					</div>
					<div class="spec-box">
						<div class="spec-format">4×5</div>
						<div class="spec-label">COVERAGE<br>40+ COUNTRIES</div>
					</div>
				</div>
				
				<div class="film-footer">
					<span>Professional booking system for modern tour guides</span>
				</div>
			</div>
		</div>
	</div>
</section>

<style>
	/* Film Brand Hero - Kodak/Agfa Inspired */
	.film-brand-hero {
		min-height: 100vh;
		display: flex;
		flex-direction: column;
		font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
	}
	
	/* Sky Section - Light Warm */
	.sky-section {
		background: #FFF4E6;
		flex: 1;
		display: flex;
		align-items: center;
		border-bottom: 3px solid #FF5959;
	}
	
	.sky-content {
		text-align: center;
		padding: 2rem 0;
	}
	
	.film-badge {
		display: inline-flex;
		align-items: center;
		gap: 0.5rem;
		background: #FF5959;
		color: white;
		padding: 0.5rem 1.5rem;
		border-radius: 0;
		font-weight: 700;
		font-size: 0.75rem;
		letter-spacing: 1px;
		text-transform: uppercase;
		box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
	}
	
	/* Horizon Section - Main Content */
	.horizon-section {
		background: white;
		flex: 3;
		display: flex;
		align-items: center;
		border-bottom: 3px solid #FFAD5A;
		position: relative;
	}
	
	.horizon-content {
		text-align: center;
		padding: 3rem 0;
		max-width: 800px;
		margin: 0 auto;
	}
	
	.film-title {
		margin-bottom: 2rem;
	}
	
	.brand-name {
		display: block;
		font-size: 4rem;
		font-weight: 900;
		color: #1A0841;
		letter-spacing: 0.1em;
		text-transform: uppercase;
		margin-bottom: 0.5rem;
		text-shadow: 2px 2px 0 rgba(0, 0, 0, 0.1);
	}
	
	.product-line {
		display: block;
		font-size: 1.5rem;
		font-weight: 600;
		color: #FF5959;
		letter-spacing: 0.2em;
		text-transform: uppercase;
		margin-bottom: 1rem;
	}
	
	.tagline {
		display: block;
		font-size: 1rem;
		color: #4F9DA6;
		font-weight: 500;
		letter-spacing: 0.1em;
		text-transform: uppercase;
	}
	
	/* Film Strip Element */
	.film-strip {
		display: flex;
		justify-content: center;
		gap: 1rem;
		margin: 2rem 0;
		padding: 0.5rem;
		background: #1A0841;
		border-radius: 0;
		width: fit-content;
		margin-left: auto;
		margin-right: auto;
	}
	
	.strip-hole {
		width: 12px;
		height: 12px;
		background: white;
		border-radius: 50%;
	}
	
	.film-description {
		font-size: 1.125rem;
		color: #666;
		line-height: 1.6;
		margin-bottom: 0;
	}
	
	/* Sunset Section - Warm Orange */
	.sunset-section {
		background: #FFAD5A;
		flex: 2;
		display: flex;
		align-items: center;
		border-bottom: 3px solid #4F9DA6;
	}
	
	.sunset-content {
		text-align: center;
		padding: 3rem 0;
		max-width: 500px;
		margin: 0 auto;
	}
	
	/* Film Cartridge Style */
	.film-cartridge {
		background: #1A0841;
		border-radius: 0;
		padding: 0;
		margin-bottom: 2rem;
		box-shadow: 0 4px 16px rgba(0, 0, 0, 0.2);
		overflow: hidden;
	}
	
	.cartridge-top {
		background: #FF5959;
		color: white;
		padding: 0.75rem 1.5rem;
		display: flex;
		justify-content: space-between;
		align-items: center;
		font-weight: 700;
		font-size: 0.75rem;
		letter-spacing: 1px;
		text-transform: uppercase;
	}
	
	.cartridge-body {
		padding: 2rem;
	}
	
	.film-code-button {
		width: 100%;
		background: white;
		border: 2px solid #4F9DA6;
		border-radius: 0;
		padding: 1rem;
		cursor: pointer;
		transition: all 0.2s ease;
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 0.75rem;
		margin-bottom: 1rem;
		font-weight: 700;
		text-transform: uppercase;
		letter-spacing: 0.1em;
	}
	
	.film-code-button:hover {
		background: #4F9DA6;
		color: white;
	}
	
	.film-code {
		font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
		font-size: 1.125rem;
		font-weight: 700;
		letter-spacing: 0.2em;
	}
	
	.exposed-text {
		color: #4F9DA6;
		font-size: 0.75rem;
		font-weight: 700;
		text-transform: uppercase;
		letter-spacing: 1px;
		margin: 0;
		text-align: center;
	}
	
	/* Film CTA Button */
	.film-cta-button {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 0.75rem;
		width: 100%;
		padding: 1.25rem 2rem;
		background: #1A0841;
		color: white;
		border: none;
		border-radius: 0;
		font-size: 1rem;
		font-weight: 700;
		cursor: pointer;
		transition: all 0.2s ease;
		text-transform: uppercase;
		letter-spacing: 0.1em;
		box-shadow: 0 4px 16px rgba(0, 0, 0, 0.2);
	}
	
	.film-cta-button:hover {
		background: #FF5959;
		transform: translateY(-2px);
		box-shadow: 0 6px 20px rgba(0, 0, 0, 0.25);
	}
	
	/* Ground Section - Teal */
	.ground-section {
		background: #4F9DA6;
		flex: 2;
		display: flex;
		align-items: center;
		border-bottom: 3px solid #1A0841;
	}
	
	.ground-content {
		text-align: center;
		padding: 3rem 0;
		width: 100%;
	}
	
	/* Film Format Specs */
	.film-specs {
		display: flex;
		justify-content: center;
		gap: 2rem;
		margin-bottom: 2rem;
		flex-wrap: wrap;
	}
	
	.spec-box {
		background: white;
		border: 2px solid #1A0841;
		border-radius: 0;
		padding: 1.5rem 1rem;
		text-align: center;
		min-width: 120px;
		box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
	}
	
	.spec-format {
		font-size: 1.5rem;
		font-weight: 900;
		color: #1A0841;
		margin-bottom: 0.5rem;
		text-transform: uppercase;
		letter-spacing: 0.05em;
	}
	
	.spec-label {
		font-size: 0.625rem;
		color: #666;
		text-transform: uppercase;
		letter-spacing: 0.5px;
		font-weight: 600;
		line-height: 1.2;
	}
	
	.film-footer {
		color: white;
		font-size: 0.875rem;
		font-weight: 500;
		text-transform: uppercase;
		letter-spacing: 0.5px;
		opacity: 0.9;
	}
	
	/* Responsive Design */
	@media (max-width: 768px) {
		.brand-name {
			font-size: 2.5rem;
		}
		
		.product-line {
			font-size: 1.125rem;
		}
		
		.tagline {
			font-size: 0.875rem;
		}
		
		.film-specs {
			gap: 1rem;
		}
		
		.spec-box {
			min-width: 100px;
			padding: 1rem 0.75rem;
		}
		
		.spec-format {
			font-size: 1.25rem;
		}
		
		.horizon-section,
		.sunset-section,
		.ground-section {
			flex: 1;
		}
	}
	
	@media (max-width: 480px) {
		.film-specs {
			grid-template-columns: repeat(2, 1fr);
			display: grid;
			gap: 1rem;
		}
		
		.brand-name {
			font-size: 2rem;
		}
		
		.film-strip {
			gap: 0.5rem;
		}
		
		.strip-hole {
			width: 8px;
			height: 8px;
		}
	}
</style> 