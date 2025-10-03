<script lang="ts">
	import Calendar from 'lucide-svelte/icons/calendar';
	import Clock from 'lucide-svelte/icons/clock';
	import User from 'lucide-svelte/icons/user';
	import ArrowLeft from 'lucide-svelte/icons/arrow-left';
	import Tag from 'lucide-svelte/icons/tag';
	import Share2 from 'lucide-svelte/icons/share-2';
	import BookOpen from 'lucide-svelte/icons/book-open';
	import ArrowRight from 'lucide-svelte/icons/arrow-right';
	
	let { data } = $props();
	
	function formatDate(date: Date) {
		return date.toLocaleDateString('en-US', {
			year: 'numeric',
			month: 'long',
			day: 'numeric'
		});
	}
	
	// Simple share functionality
	async function sharePost() {
		if (navigator.share) {
			try {
				await navigator.share({
					title: data.post.title,
					text: data.post.excerpt,
					url: window.location.href
				});
			} catch (err) {
				// User cancelled or error
			}
		}
	}
</script>

<svelte:head>
	<title>{data.seo.title}</title>
	<meta name="description" content={data.seo.description} />
	<meta name="robots" content="index, follow" />
	
	<!-- Open Graph tags for social sharing -->
	<meta property="og:title" content={data.post.title} />
	<meta property="og:description" content={data.post.excerpt} />
	<meta property="og:type" content="article" />
	<meta property="og:url" content={data.seo.canonical} />
	
	<!-- Twitter Card tags -->
	<meta name="twitter:card" content="summary_large_image" />
	<meta name="twitter:title" content={data.post.title} />
	<meta name="twitter:description" content={data.post.excerpt} />
</svelte:head>

<div class="subtle-retro-section py-20">
	<div class="max-w-screen-2xl mx-auto px-6 sm:px-8 lg:px-12">
		<!-- Back to Blog -->
		<div class="mb-8">
			<a 
				href="/blog" 
				class="back-to-blog-link"
			>
				<ArrowLeft class="w-4 h-4" />
				Back to Blog
			</a>
		</div>
		
		<div class="max-w-4xl mx-auto">
			<!-- Article Header -->
			<article>
				<header class="mb-12">
					<!-- Category Badge -->
					<div class="flex items-center gap-4 mb-6">
						<div class="category-badge">
							<Tag class="w-3 h-3" />
							{data.post.category}
						</div>
					</div>
					
					<!-- Title -->
					<h1 class="article-title mb-6">
						{data.post.title}
					</h1>
					
					<!-- Meta Information -->
					<div class="flex flex-wrap items-center gap-4 text-sm" style="color: var(--text-tertiary);">
						<span class="flex items-center gap-1.5">
							<User class="w-4 h-4" />
							{data.post.author}
						</span>
						<span class="text-tertiary">•</span>
						<span class="flex items-center gap-1.5">
							<Calendar class="w-4 h-4" />
							{formatDate(data.post.publishedAt)}
						</span>
						<span class="text-tertiary">•</span>
						<span class="flex items-center gap-1.5">
							<Clock class="w-4 h-4" />
							{data.post.readTime}
						</span>
						
						{#if typeof navigator !== 'undefined' && 'share' in navigator}
							<button 
								onclick={sharePost}
								class="ml-auto flex items-center gap-1.5 transition-colors hover:text-coral-600"
								style="color: var(--text-secondary);"
							>
								<Share2 class="w-4 h-4" />
								Share
							</button>
						{/if}
					</div>
				</header>
				
				<!-- Article Content -->
				<div class="article-content">
					{@html data.post.content}
				</div>
			</article>
			
			<!-- Author Box -->
			<div class="author-box mt-16">
				<div class="flex items-center gap-4">
					<div class="author-avatar">
						<User class="w-6 h-6" />
					</div>
					<div>
						<h3 class="font-semibold text-primary">{data.post.author}</h3>
						<p class="text-sm text-secondary">
							Helping tour guides succeed with modern booking technology
						</p>
					</div>
				</div>
			</div>
			
			<!-- Related Posts -->
			{#if data.relatedPosts.length > 0}
				<div class="mt-16">
					<h2 class="text-2xl font-semibold text-primary mb-8">Related Articles</h2>
					<div class="related-posts-grid">
						{#each data.relatedPosts as post}
							<article class="related-post-card">
								<div class="related-post-content">
									<div class="flex items-center gap-2 mb-3">
										<div class="related-category-badge">
											<Tag class="w-2.5 h-2.5" />
											{post.category}
										</div>
										<span class="text-xs text-tertiary">
											{post.readTime}
										</span>
									</div>
									
									<h3 class="related-post-title">
										<a href="/blog/{post.slug}" class="related-post-title-link">
											{post.title}
										</a>
									</h3>
									
									<p class="related-post-excerpt">
										{post.excerpt}
									</p>
									
									<a 
										href="/blog/{post.slug}" 
										class="related-post-link"
									>
										Read More
										<ArrowRight class="w-3.5 h-3.5" />
									</a>
								</div>
							</article>
						{/each}
					</div>
				</div>
			{/if}
			
			<!-- CTA Section -->
			<div class="mt-16">
				<div class="cta-box">
					<div class="text-center">
						<h3 class="text-2xl font-semibold text-primary mb-4">
							Want to Stay Updated?
						</h3>
						<p class="text-lg text-secondary mb-6 max-w-2xl mx-auto">
							Join our waitlist to be among the first to know when we launch in Q1 2026.
						</p>
						<button onclick={() => window.location.href='/early-access'} class="button-primary button--large button-gap">
							<BookOpen class="w-5 h-5" />
							Join Early Access Waitlist
						</button>
					</div>
				</div>
			</div>
		</div>
	</div>
</div>

<style>
	/* Subtle retro section */
	.subtle-retro-section {
		background: linear-gradient(
			180deg,
			var(--bg-primary) 0%,
			var(--bg-secondary) 100%
		);
		position: relative;
		overflow: hidden;
		min-height: 70vh;
	}
	
	.subtle-retro-section::before {
		content: '';
		position: absolute;
		top: 0;
		left: 0;
		right: 0;
		bottom: 0;
		background-image: repeating-linear-gradient(
			0deg,
			transparent,
			transparent 40px,
			rgba(0, 0, 0, 0.02) 40px,
			rgba(0, 0, 0, 0.02) 41px
		);
		pointer-events: none;
	}

	/* Article title */
	.article-title {
		font-size: 2.5rem;
		font-weight: 700;
		line-height: 1.2;
		color: var(--text-primary);
	}
	
	@media (max-width: 768px) {
		.article-title {
			font-size: 2rem;
		}
	}

	/* Category badge */
	.category-badge {
		display: inline-flex;
		align-items: center;
		gap: 0.375rem;
		background: var(--color-coral-100);
		border: 1px solid var(--color-coral-300);
		color: var(--color-coral-800);
		padding: 0.5rem 1rem;
		border-radius: var(--radius-full);
		font-size: 0.75rem;
		font-weight: 500;
	}

	/* Article content styling */
	.article-content {
		font-size: 1.125rem;
		line-height: 1.8;
		color: var(--text-secondary);
	}
	
	.article-content :global(h2) {
		font-size: 1.875rem;
		font-weight: 600;
		color: var(--text-primary);
		margin-top: 3rem;
		margin-bottom: 1.5rem;
		line-height: 1.3;
	}
	
	.article-content :global(h3) {
		font-size: 1.5rem;
		font-weight: 600;
		color: var(--text-primary);
		margin-top: 2rem;
		margin-bottom: 1rem;
		line-height: 1.4;
	}
	
	.article-content :global(p) {
		margin-bottom: 1.5rem;
	}
	
	.article-content :global(ul),
	.article-content :global(ol) {
		margin-bottom: 1.5rem;
		padding-left: 2rem;
	}
	
	.article-content :global(li) {
		margin-bottom: 0.75rem;
		line-height: 1.7;
	}
	
	.article-content :global(strong) {
		color: var(--text-primary);
		font-weight: 600;
	}
	
	.article-content :global(blockquote) {
		border-left: 4px solid var(--color-coral-500);
		padding-left: 1.5rem;
		margin: 2rem 0;
		font-style: italic;
		color: var(--text-secondary);
	}

	/* Author box */
	.author-box {
		background: var(--bg-primary);
		border: 1px solid var(--border-primary);
		border-radius: var(--radius-lg);
		padding: 1.5rem;
	}
	
	.author-avatar {
		width: 3rem;
		height: 3rem;
		background: var(--bg-secondary);
		border-radius: var(--radius-full);
		display: flex;
		align-items: center;
		justify-content: center;
		color: var(--text-tertiary);
	}

	/* Related posts */
	.related-posts-grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
		gap: 1.5rem;
	}
	
	.related-post-card {
		background: var(--bg-primary);
		border: 1px solid var(--border-primary);
		border-radius: var(--radius-lg);
		padding: 1.5rem;
		transition: all var(--transition-base) ease;
	}
	
	.related-post-card:hover {
		transform: translateY(-2px);
		box-shadow: var(--shadow-md);
		border-color: var(--border-secondary);
	}
	
	.related-post-content {
		display: flex;
		flex-direction: column;
		height: 100%;
	}
	
	.related-category-badge {
		display: inline-flex;
		align-items: center;
		gap: 0.25rem;
		background: var(--bg-secondary);
		padding: 0.25rem 0.75rem;
		border-radius: var(--radius-full);
		font-size: 0.625rem;
		font-weight: 500;
		color: var(--text-primary);
	}
	
	.related-post-title {
		font-size: 1.125rem;
		font-weight: 600;
		color: var(--text-primary);
		margin-bottom: 0.75rem;
		line-height: 1.4;
		display: -webkit-box;
		-webkit-line-clamp: 2;
		-webkit-box-orient: vertical;
		overflow: hidden;
	}
	
	.related-post-title-link {
		color: var(--text-primary);
		text-decoration: none;
		transition: color var(--transition-base) ease;
	}
	
	.related-post-title-link:hover {
		color: var(--color-coral-600);
	}
	
	.related-post-excerpt {
		font-size: 0.875rem;
		color: var(--text-secondary);
		line-height: 1.6;
		margin-bottom: 1rem;
		display: -webkit-box;
		-webkit-line-clamp: 3;
		-webkit-box-orient: vertical;
		overflow: hidden;
		flex: 1;
	}
	
	.related-post-link {
		display: inline-flex;
		align-items: center;
		gap: 0.375rem;
		color: var(--color-coral-600);
		font-weight: 500;
		font-size: 0.875rem;
		transition: all var(--transition-base) ease;
		margin-top: auto;
	}
	
	.related-post-link:hover {
		gap: 0.625rem;
		color: var(--color-coral-700);
	}

	/* CTA Box */
	.cta-box {
		background: var(--bg-primary);
		border: 2px solid var(--color-coral-200);
		border-radius: var(--radius-lg);
		padding: 3rem 2rem;
		box-shadow: var(--shadow-sm);
		position: relative;
		overflow: hidden;
	}
	
	.cta-box::before {
		content: '';
		position: absolute;
		top: 0;
		left: 50%;
		transform: translateX(-50%);
		width: 200px;
		height: 4px;
		background: var(--color-coral-500);
		border-radius: var(--radius-full);
	}
	
	/* Utility classes for text colors */
	.text-primary {
		color: var(--text-primary);
	}
	
	.text-secondary {
		color: var(--text-secondary);
	}
	
	.text-tertiary {
		color: var(--text-tertiary);
	}
	
	/* Hover states */
	.hover\:text-coral-600:hover {
		color: var(--color-coral-600);
	}
	
	/* Button spacing */
	.button-gap {
		gap: 0.5rem;
	}
	
	/* Large button size */
	.button--large {
		padding: 1rem 2rem;
		font-size: 1.125rem;
	}
	
	/* Back to blog link */
	.back-to-blog-link {
		display: inline-flex;
		align-items: center;
		gap: 0.5rem;
		font-size: 0.875rem;
		font-weight: 500;
		color: var(--text-secondary);
		text-decoration: none;
		transition: color var(--transition-base) ease;
	}
	
	.back-to-blog-link:hover {
		color: var(--color-coral-600);
	}
	
	/* Responsive */
	@media (max-width: 768px) {
		.article-content {
			font-size: 1rem;
		}
		
		.article-content h2 {
			font-size: 1.5rem;
			margin-top: 2rem;
		}
		
		.article-content h3 {
			font-size: 1.25rem;
		}
		
		.related-posts-grid {
			grid-template-columns: 1fr;
		}
		
		.cta-box {
			padding: 2rem 1.5rem;
		}
	}
</style> 