import { build, files, version } from '$service-worker';

// Create a unique cache name for this deployment
const CACHE = `cache-${version}`;

// Assets to cache on install
const ASSETS = [
	...build, // the app itself
	...files  // everything in `static`
];

self.addEventListener('install', (event) => {
	console.log('SW: Installing service worker version', version);
	
	// Create a new cache and add all files to it
	async function addFilesToCache() {
		const cache = await caches.open(CACHE);
		try {
			await cache.addAll(ASSETS);
			console.log('SW: Successfully cached', ASSETS.length, 'assets');
		} catch (error) {
			console.error('SW: Failed to cache assets:', error);
		}
	}

	event.waitUntil(addFilesToCache());
});

self.addEventListener('activate', (event) => {
	console.log('SW: Activating service worker version', version);
	
	// Remove previous cached data from disk
	async function deleteOldCaches() {
		const cacheNames = await caches.keys();
		const oldCaches = cacheNames.filter(name => name !== CACHE);
		
		if (oldCaches.length > 0) {
			console.log('SW: Deleting old caches:', oldCaches);
			await Promise.all(oldCaches.map(name => caches.delete(name)));
		}
	}

	event.waitUntil(deleteOldCaches());
});

self.addEventListener('fetch', (event) => {
	// ignore POST requests etc
	if (event.request.method !== 'GET') return;

	async function respond() {
		const url = new URL(event.request.url);
		const cache = await caches.open(CACHE);

		// More robust asset matching - check both pathname and full path
		const isAsset = ASSETS.some(asset => {
			// Handle both absolute paths and relative paths
			return url.pathname === asset || url.pathname.endsWith(asset) || asset.endsWith(url.pathname);
		});

		// For build assets, serve from cache first (they're immutable)
		if (isAsset) {
			const cachedResponse = await cache.match(event.request);
			if (cachedResponse) {
				return cachedResponse;
			}
			
			// If not in cache, try to fetch and cache it
			try {
				const response = await fetch(event.request);
				if (response.status === 200) {
					cache.put(event.request, response.clone());
				}
				return response;
			} catch (error) {
				console.error('SW: Failed to fetch asset:', url.pathname, error);
				throw error;
			}
		}

		// For API requests and pages, use network-first strategy
		try {
			const response = await fetch(event.request);

			// if we're offline, fetch can return a value that is not a Response
			// instead of throwing - and we can't pass this non-Response to respondWith
			if (!(response instanceof Response)) {
				throw new Error('invalid response from fetch');
			}

			// Only cache successful responses for non-API requests
			if (response.status === 200 && !url.pathname.startsWith('/api/')) {
				try {
					cache.put(event.request, response.clone());
				} catch (error) {
					console.warn('SW: Failed to cache response:', url.pathname, error);
				}
			}

			return response;
		} catch (err) {
			// Try to serve from cache as fallback
			const cachedResponse = await cache.match(event.request);
			if (cachedResponse) {
				console.log('SW: Serving from cache (offline):', url.pathname);
				return cachedResponse;
			}

			// Special handling for navigation requests - serve the app shell
			if (event.request.mode === 'navigate') {
				const appShell = await cache.match('/');
				if (appShell) {
					console.log('SW: Serving app shell for navigation:', url.pathname);
					return appShell;
				}
			}

			console.error('SW: No cache available for:', url.pathname, err);
			throw err;
		}
	}

	event.respondWith(respond());
}); 