/**
 * Client-side cache for Place Photos
 * Reduces API calls and costs by caching photo URLs
 */

interface CacheEntry {
	photoUrls: string[];
	timestamp: number;
}

const CACHE_DURATION = 7 * 24 * 60 * 60 * 1000; // 7 days in milliseconds
const CACHE_KEY_PREFIX = 'place_photos_';

/**
 * In-memory cache (cleared on page refresh)
 */
const memoryCache = new Map<string, CacheEntry>();

/**
 * Get cached photo URLs for a place
 */
export function getCachedPhotos(placeId: string): string[] | null {
	// Check memory cache first (fastest)
	const memCached = memoryCache.get(placeId);
	if (memCached && Date.now() - memCached.timestamp < CACHE_DURATION) {
		console.log('📸 Cache HIT (memory):', placeId);
		return memCached.photoUrls;
	}
	
	// Check localStorage (persists across page loads)
	if (typeof window !== 'undefined' && window.localStorage) {
		try {
			const cached = localStorage.getItem(CACHE_KEY_PREFIX + placeId);
			if (cached) {
				const entry: CacheEntry = JSON.parse(cached);
				if (Date.now() - entry.timestamp < CACHE_DURATION) {
					console.log('📸 Cache HIT (localStorage):', placeId);
					// Also store in memory for faster subsequent access
					memoryCache.set(placeId, entry);
					return entry.photoUrls;
				} else {
					// Expired - remove it
					localStorage.removeItem(CACHE_KEY_PREFIX + placeId);
				}
			}
		} catch (error) {
			console.warn('Failed to read photo cache:', error);
		}
	}
	
	console.log('📸 Cache MISS:', placeId);
	return null;
}

/**
 * Cache photo URLs for a place
 */
export function cachePhotos(placeId: string, photoUrls: string[]): void {
	const entry: CacheEntry = {
		photoUrls,
		timestamp: Date.now()
	};
	
	// Store in memory cache
	memoryCache.set(placeId, entry);
	
	// Store in localStorage for persistence
	if (typeof window !== 'undefined' && window.localStorage) {
		try {
			localStorage.setItem(CACHE_KEY_PREFIX + placeId, JSON.stringify(entry));
			console.log('📸 Cached photos for:', placeId, '(7 days)');
		} catch (error) {
			console.warn('Failed to cache photos:', error);
			// localStorage might be full or disabled - continue without caching
		}
	}
}

/**
 * Clear expired cache entries
 */
export function cleanPhotoCache(): void {
	if (typeof window === 'undefined' || !window.localStorage) return;
	
	try {
		const keys = Object.keys(localStorage);
		let cleaned = 0;
		
		for (const key of keys) {
			if (key.startsWith(CACHE_KEY_PREFIX)) {
				const cached = localStorage.getItem(key);
				if (cached) {
					const entry: CacheEntry = JSON.parse(cached);
					if (Date.now() - entry.timestamp >= CACHE_DURATION) {
						localStorage.removeItem(key);
						cleaned++;
					}
				}
			}
		}
		
		if (cleaned > 0) {
			console.log(`🧹 Cleaned ${cleaned} expired photo cache entries`);
		}
	} catch (error) {
		console.warn('Failed to clean photo cache:', error);
	}
}

/**
 * Clear all photo cache (for debugging)
 */
export function clearAllPhotoCache(): void {
	// Clear memory cache
	memoryCache.clear();
	
	// Clear localStorage
	if (typeof window !== 'undefined' && window.localStorage) {
		try {
			const keys = Object.keys(localStorage);
			for (const key of keys) {
				if (key.startsWith(CACHE_KEY_PREFIX)) {
					localStorage.removeItem(key);
				}
			}
			console.log('🧹 Cleared all photo cache');
		} catch (error) {
			console.warn('Failed to clear photo cache:', error);
		}
	}
}

/**
 * Get cache statistics
 */
export function getPhotoCacheStats(): {
	memoryCached: number;
	localStorageCached: number;
	totalSize: number;
} {
	const stats = {
		memoryCached: memoryCache.size,
		localStorageCached: 0,
		totalSize: 0
	};
	
	if (typeof window !== 'undefined' && window.localStorage) {
		try {
			const keys = Object.keys(localStorage);
			for (const key of keys) {
				if (key.startsWith(CACHE_KEY_PREFIX)) {
					stats.localStorageCached++;
					const value = localStorage.getItem(key);
					if (value) {
						stats.totalSize += value.length;
					}
				}
			}
		} catch (error) {
			console.warn('Failed to get cache stats:', error);
		}
	}
	
	return stats;
}

