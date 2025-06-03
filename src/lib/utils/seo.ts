export interface SEOData {
	title: string;
	description: string;
	canonical: string;
	keywords?: string;
	openGraph?: {
		title: string;
		description: string;
		url: string;
		type: string;
		image: string;
		site_name: string;
	};
	twitter?: {
		card: string;
		title: string;
		description: string;
		image: string;
	};
	structuredData?: any;
}

/**
 * Truncate text to a specific length for meta descriptions
 */
export function truncateText(text: string, maxLength: number): string {
	if (text.length <= maxLength) return text;
	return text.substring(0, maxLength - 3) + '...';
}

/**
 * Generate keywords from tour data
 */
export function generateTourKeywords(tour: any): string {
	const keywords = [
		tour.name,
		tour.location,
		'tour booking',
		'instant booking',
		'QR booking',
		'tourism',
		tour.category
	].filter(Boolean);
	
	return keywords.join(', ');
}

/**
 * Generate SEO-friendly title
 */
export function generateSEOTitle(pageName: string, tourName?: string): string {
	if (tourName) {
		return `${pageName} ${tourName} - Zaur`;
	}
	return `${pageName} - Zaur`;
}

/**
 * Generate tour structured data for search engines
 */
export function generateTourStructuredData(tour: any, qrCode: string, origin: string) {
	return {
		'@context': 'https://schema.org',
		'@type': 'TouristAttraction',
		name: tour.name,
		description: tour.description,
		image: tour.images?.[0] 
			? `https://z.xeon.pl/api/files/${tour.collectionId}/${tour.id}/${tour.images[0]}?thumb=1200x630`
			: `${origin}/images/og-tour-default.jpg`,
		location: {
			'@type': 'Place',
			name: tour.location,
			address: {
				'@type': 'PostalAddress',
				addressLocality: tour.location
			}
		},
		offers: {
			'@type': 'Offer',
			price: tour.price,
			priceCurrency: 'EUR',
			availability: 'https://schema.org/InStock',
			url: `${origin}/book/${qrCode}`,
			validFrom: new Date().toISOString(),
			category: 'Tour'
		},
		provider: {
			'@type': 'Organization',
			name: 'Zaur',
			url: 'https://zaur.app'
		},
		duration: `PT${Math.floor(tour.duration / 60)}H${tour.duration % 60}M`,
		maximumAttendeeCapacity: tour.capacity
	};
}

/**
 * Generate booking structured data
 */
export function generateBookingStructuredData(booking: any, origin: string) {
	return {
		'@context': 'https://schema.org',
		'@type': 'EventReservation',
		reservationId: booking.bookingReference,
		reservationStatus: 'https://schema.org/ReservationConfirmed',
		underName: {
			'@type': 'Person',
			name: booking.customerName,
			email: booking.customerEmail
		},
		reservationFor: {
			'@type': 'Event',
			name: booking.expand?.tour?.name,
			description: booking.expand?.tour?.description,
			startDate: booking.expand?.timeSlot?.startTime,
			endDate: booking.expand?.timeSlot?.endTime,
			location: {
				'@type': 'Place',
				name: booking.expand?.tour?.location
			}
		},
		totalPrice: booking.totalAmount,
		priceCurrency: 'EUR',
		numSeats: booking.participants
	};
}

/**
 * Generate breadcrumb structured data
 */
export function generateBreadcrumbStructuredData(items: Array<{name: string, url: string}>) {
	return {
		'@context': 'https://schema.org',
		'@type': 'BreadcrumbList',
		itemListElement: items.map((item, index) => ({
			'@type': 'ListItem',
			position: index + 1,
			name: item.name,
			item: item.url
		}))
	};
}

/**
 * Clean and format meta description
 */
export function formatMetaDescription(text: string): string {
	// Remove HTML tags, normalize whitespace, and truncate
	return truncateText(
		text.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim(),
		160
	);
} 