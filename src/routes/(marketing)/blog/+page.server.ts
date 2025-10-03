import type { PageServerLoad } from './$types.js';

// In a real app, these would come from a database or CMS
const blogPosts = [
	{
		slug: 'beta-program-update-october-2025',
		title: 'Beta Program Update: Working with 50 Tour Guides to Build Something Great',
		excerpt: 'We\'ve closed beta applications and are now actively working with 50 selected tour guides from around the world. Here\'s what\'s happening and what\'s next.',
		author: 'Zaur Team',
		publishedAt: new Date('2025-10-03'),
		readTime: '4 min read',
		category: 'Announcement',
		featured: true,
		image: '/blog/beta-launch-hero.svg'
	},
	{
		slug: 'zaur-beta-program-launch',
		title: 'Zaur Beta Program is Now Open: Join 50 Tour Guides Shaping the Future',
		excerpt: 'We\'re excited to announce the official launch of our beta program! Be among the first 50 tour guides to experience the simplest QR-based booking system and help shape its development.',
		author: 'Zaur Team',
		publishedAt: new Date('2025-08-07'),
		readTime: '5 min read',
		category: 'Announcement',
		featured: false,
		image: '/blog/beta-launch-hero.svg'
	},
	{
		slug: 'sustainable-tourism-practices-2025',
		title: 'Sustainable Tourism Practices That Boost Your Business in 2025',
		excerpt: 'Learn how implementing eco-friendly practices can attract conscious travelers and increase your tour bookings while protecting local environments.',
		author: 'Zaur Team',
		publishedAt: new Date('2025-07-30'),
		readTime: '8 min read',
		category: 'Sustainability',
		featured: false,
		image: 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=800&h=600&fit=crop'
	},
	{
		slug: 'qr-codes-revolutionizing-tourism',
		title: 'How QR Codes Are Revolutionizing Tourism in 2025',
		excerpt: 'Discover how tour guides are using QR codes to streamline bookings, reduce no-shows, and provide better customer experiences.',
		author: 'Zaur Team',
		publishedAt: new Date('2025-07-10'),
		readTime: '5 min read',
		category: 'Technology',
		featured: false,
		image: 'https://images.unsplash.com/photo-1556742111-a301076d9d18?w=800&h=600&fit=crop'
	},
	{
		slug: 'commission-free-tour-business',
		title: 'Why Commission-Free Booking Systems Are the Future',
		excerpt: 'Learn how tour guides can keep 100% of their earnings and why commission-based platforms are becoming obsolete.',
		author: 'Zaur Team',
		publishedAt: new Date('2025-07-05'),
		readTime: '7 min read',
		category: 'Business',
		featured: false,
		image: 'https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=800&h=600&fit=crop'
	},
	{
		slug: 'digital-marketing-tour-guides',
		title: 'Digital Marketing Strategies for Independent Tour Guides',
		excerpt: 'Practical tips and strategies to grow your tour business online, from social media to SEO optimization.',
		author: 'Zaur Team',
		publishedAt: new Date('2025-06-28'),
		readTime: '10 min read',
		category: 'Marketing',
		featured: false,
		image: 'https://images.unsplash.com/photo-1611224923853-80b023f02d71?w=800&h=600&fit=crop'
	},
	{
		slug: 'seasonal-tour-planning',
		title: 'Mastering Seasonal Tour Planning and Pricing',
		excerpt: 'How to optimize your tour offerings and pricing strategies for different seasons to maximize revenue year-round.',
		author: 'Zaur Team',
		publishedAt: new Date('2025-06-20'),
		readTime: '8 min read',
		category: 'Business',
		featured: false,
		image: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&h=600&fit=crop'
	},
	{
		slug: 'customer-experience-excellence',
		title: 'Creating Memorable Customer Experiences That Drive Reviews',
		excerpt: 'The secret to getting 5-star reviews and repeat customers lies in the details. Here\'s what top tour guides do differently.',
		author: 'Zaur Team',
		publishedAt: new Date('2025-06-15'),
		readTime: '6 min read',
		category: 'Customer Service',
		featured: false,
		image: 'https://images.unsplash.com/photo-1556742502-ec7c0e9f34b1?w=800&h=600&fit=crop'
	}
];

export const load: PageServerLoad = async ({ url }) => {
	// Sort posts by date (newest first)
	const sortedPosts = [...blogPosts].sort((a, b) => b.publishedAt.getTime() - a.publishedAt.getTime());
	
	// Get featured post
	const featuredPost = sortedPosts.find(post => post.featured) || sortedPosts[0];
	
	// Get recent posts (excluding featured)
	const recentPosts = sortedPosts.filter(post => post.slug !== featuredPost.slug);
	
	return {
		featuredPost,
		recentPosts,
		seo: {
			title: 'Blog - Zaur | Tips and Insights for Tour Guides',
			description: 'Expert advice, industry insights, and practical tips to help tour guides grow their business with modern booking technology.',
			canonical: url.href,
			keywords: 'tour guide blog, tourism tips, booking system insights, tour business advice'
		}
	};
}; 