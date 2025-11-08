<script lang="ts">
	import BookOpen from 'lucide-svelte/icons/book-open';
	import Calendar from 'lucide-svelte/icons/calendar';
	import Clock from 'lucide-svelte/icons/clock';
	import User from 'lucide-svelte/icons/user';
	import ArrowRight from 'lucide-svelte/icons/arrow-right';
	import Tag from 'lucide-svelte/icons/tag';
	import BetaBadge from '$lib/components/ui/BetaBadge.svelte';
	import NewsletterSignup from '$lib/components/NewsletterSignup.svelte';
	
	let { data } = $props();
	
	function formatDate(date: Date) {
		return date.toLocaleDateString('en-US', {
			year: 'numeric',
			month: 'long',
			day: 'numeric'
		});
	}
</script>

<svelte:head>
	<title>{data.seo.title}</title>
	<meta name="description" content={data.seo.description} />
	<meta name="robots" content="index, follow" />
</svelte:head>

<div class="subtle-retro-section py-20">
	<div class="max-w-screen-2xl mx-auto px-6 sm:px-8 lg:px-12">
		<!-- Header -->
		<div class="text-center mb-16">
			<BetaBadge text="Blog" icon={BookOpen} variant="large" class="mb-6" />
			<h1 class="marketing-heading marketing-heading-xl mb-6">
				Insights for Tour Guides
			</h1>
			<p class="text-lg max-w-2xl mx-auto text-secondary">
				Expert advice, industry trends, and practical tips to help you grow your tour business 
				and deliver exceptional experiences.
			</p>
		</div>
		
		<!-- Featured Post -->
		<div class="mb-16">
			<h2 class="text-2xl font-semibold text-primary mb-8">Featured Article</h2>
			<article class="featured-card group">
				<div class="grid lg:grid-cols-2 gap-8 lg:gap-12">
					<div class="featured-image-wrapper">
						<div class="featured-image">
							<img 
								src={data.featuredPost.image} 
								alt={data.featuredPost.title}
								class="w-full h-full object-cover"
							/>
						</div>
						<div class="featured-category">
							<Tag class="w-3 h-3" />
							{data.featuredPost.category}
						</div>
					</div>
					
					<div class="flex flex-col justify-center">
						<div class="post-meta mb-4">
							<span class="meta-item">
								<Calendar class="w-4 h-4" />
								{formatDate(data.featuredPost.publishedAt)}
							</span>
							<span class="meta-separator">•</span>
							<span class="meta-item">
								<Clock class="w-4 h-4" />
								{data.featuredPost.readTime}
							</span>
							<span class="meta-separator">•</span>
							<span class="meta-item">
								<User class="w-4 h-4" />
								{data.featuredPost.author}
							</span>
						</div>
						
						<h3 class="text-2xl lg:text-3xl font-semibold mb-4">
							<a href="/blog/{data.featuredPost.slug}" class="text-primary group-hover:text-primary-600 transition-colors">
								{data.featuredPost.title}
							</a>
						</h3>
						
						<p class="text-lg text-secondary mb-6 line-clamp-3">
							{data.featuredPost.excerpt}
						</p>
						
						<a 
							href="/blog/{data.featuredPost.slug}" 
							class="inline-flex items-center gap-2 text-primary-600 font-medium hover:gap-3 transition-all"
						>
							Read Full Article
							<ArrowRight class="w-5 h-5" />
						</a>
					</div>
				</div>
			</article>
		</div>
		
		<!-- Recent Posts -->
		<div>
			<h2 class="text-2xl font-semibold text-primary mb-8">Recent Articles</h2>
			<div class="posts-grid">
				{#each data.recentPosts as post}
					<article class="post-card group">
						<div class="post-image-wrapper">
							<div class="post-image">
								<img 
									src={post.image} 
									alt={post.title}
									class="w-full h-full object-cover"
								/>
							</div>
							<div class="post-category">
								<Tag class="w-3 h-3" />
								{post.category}
							</div>
						</div>
						
						<div class="post-content">
							<div class="post-meta mb-3">
								<span class="meta-item">
									<Calendar class="w-3 h-3" />
									{formatDate(post.publishedAt)}
								</span>
								<span class="meta-separator">•</span>
								<span class="meta-item">
									<Clock class="w-3 h-3" />
									{post.readTime}
								</span>
							</div>
							
							<h3 class="post-title">
								<a href="/blog/{post.slug}" class="post-title-link">
									{post.title}
								</a>
							</h3>
							
							<p class="post-excerpt">
								{post.excerpt}
							</p>
							
							<a 
								href="/blog/{post.slug}" 
								class="post-link"
							>
								Read More
								<ArrowRight class="w-4 h-4" />
							</a>
						</div>
					</article>
				{/each}
			</div>
		</div>
		
		<!-- Newsletter CTA -->
		<div class="mt-16">
			<NewsletterSignup 
				variant="default"
				title="Stay Updated on Zaur's Progress"
				description="Get notified about new QR features, early access opportunities, and success stories from tour guides using Zaur. No spam, just valuable updates."
				buttonText="Subscribe to Newsletter"
			/>
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



	/* Featured post card */
	.featured-card {
		background: var(--bg-primary);
		border: 1px solid var(--border-primary);
		border-radius: var(--radius-lg);
		padding: 2rem;
		transition: all var(--transition-base) ease;
		box-shadow: var(--shadow-sm);
		position: relative;
		overflow: hidden;
	}
	
	.featured-card::before {
		content: '';
		position: absolute;
		top: 0;
		left: 0;
		right: 0;
		height: 3px;
		background: var(--color-primary-500);
		transform: scaleX(0);
		transition: transform var(--transition-base) ease;
	}
	
	.featured-card:hover::before {
		transform: scaleX(1);
	}
	
	.featured-card:hover {
		transform: translateY(-2px);
		box-shadow: var(--shadow-lg);
		border-color: var(--border-secondary);
	}

	/* Featured image */
	.featured-image-wrapper {
		position: relative;
	}
	
	.featured-image {
		aspect-ratio: 16 / 9;
		border-radius: var(--radius-lg);
		overflow: hidden;
		background: var(--bg-secondary);
	}
	
	.featured-category {
		position: absolute;
		top: 1rem;
		left: 1rem;
		display: inline-flex;
		align-items: center;
		gap: 0.25rem;
		background: var(--bg-primary);
		border: 1px solid var(--border-primary);
		padding: 0.5rem 1rem;
		border-radius: var(--radius-full);
		font-size: 0.75rem;
		font-weight: 500;
		color: var(--text-primary);
		box-shadow: var(--shadow-md);
	}

	/* Posts grid */
	.posts-grid {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
		gap: 2rem;
	}

	/* Post card */
	.post-card {
		background: var(--bg-primary);
		border: 1px solid var(--border-primary);
		border-radius: var(--radius-lg);
		overflow: hidden;
		transition: all var(--transition-base) ease;
		box-shadow: var(--shadow-sm);
		display: flex;
		flex-direction: column;
	}
	
	.post-card:hover {
		transform: translateY(-2px);
		box-shadow: var(--shadow-lg);
		border-color: var(--border-secondary);
	}

	/* Post image */
	.post-image-wrapper {
		position: relative;
	}
	
	.post-image {
		aspect-ratio: 16 / 9;
		background: var(--bg-secondary);
		overflow: hidden;
	}
	
	.post-category {
		position: absolute;
		top: 0.75rem;
		left: 0.75rem;
		display: inline-flex;
		align-items: center;
		gap: 0.25rem;
		background: var(--bg-primary);
		border: 1px solid var(--border-primary);
		padding: 0.375rem 0.75rem;
		border-radius: var(--radius-full);
		font-size: 0.625rem;
		font-weight: 500;
		color: var(--text-primary);
		box-shadow: var(--shadow-sm);
	}

	/* Post content */
	.post-content {
		padding: 1.5rem;
		flex: 1;
		display: flex;
		flex-direction: column;
	}
	
	.post-title {
		font-size: 1.25rem;
		font-weight: 600;
		color: var(--text-primary);
		margin-bottom: 0.75rem;
		line-height: 1.4;
		display: -webkit-box;
		-webkit-line-clamp: 2;
		-webkit-box-orient: vertical;
		overflow: hidden;
	}
	
	.post-excerpt {
		color: var(--text-secondary);
		font-size: 0.875rem;
		line-height: 1.6;
		margin-bottom: 1rem;
		display: -webkit-box;
		-webkit-line-clamp: 3;
		-webkit-box-orient: vertical;
		overflow: hidden;
		flex: 1;
	}
	
	.post-link {
		display: inline-flex;
		align-items: center;
		gap: 0.5rem;
		color: var(--color-primary-600);
		font-weight: 500;
		font-size: 0.875rem;
		transition: all var(--transition-base) ease;
		margin-top: auto;
	}
	
	.post-link:hover {
		gap: 0.75rem;
		color: var(--color-primary-700);
	}

	/* Post meta */
	.post-meta {
		display: flex;
		align-items: center;
		flex-wrap: wrap;
		gap: 0.5rem;
		font-size: 0.875rem;
		color: var(--text-tertiary);
	}
	
	.meta-item {
		display: flex;
		align-items: center;
		gap: 0.375rem;
	}
	
	.meta-separator {
		color: var(--text-tertiary);
	}



	/* Utility classes */
	.text-primary {
		color: var(--text-primary);
	}
	
	.text-secondary {
		color: var(--text-secondary);
	}
	
	/* Post title link */
	.post-title-link {
		color: var(--text-primary);
		text-decoration: none;
		transition: color var(--transition-base) ease;
	}
	
	.post-title-link:hover {
		color: var(--color-primary-600);
	}

	/* Responsive */
	@media (max-width: 768px) {
		.featured-card {
			padding: 1.5rem;
		}
		
		.posts-grid {
			grid-template-columns: 1fr;
		}
		

	}
</style> 