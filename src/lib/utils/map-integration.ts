// Map integration utilities for Zaur
// This file provides a foundation for integrating various map services

export interface LocationCoordinates {
	lat: number;
	lng: number;
}

export interface LocationSearchResult {
	name: string;
	fullAddress: string;
	coordinates: LocationCoordinates;
	type: 'address' | 'poi' | 'establishment' | 'locality';
}

export interface MapServiceConfig {
	apiKey: string;
	region?: string;
	language?: string;
}

// Abstract base class for map services
export abstract class MapService {
	protected config: MapServiceConfig;
	
	constructor(config: MapServiceConfig) {
		this.config = config;
	}
	
	abstract searchLocations(query: string): Promise<LocationSearchResult[]>;
	abstract reverseGeocode(coordinates: LocationCoordinates): Promise<LocationSearchResult>;
	abstract getStaticMapUrl(coordinates: LocationCoordinates, zoom?: number, size?: string): string;
	abstract getDirectionsUrl(from: LocationCoordinates, to: LocationCoordinates): string;
}

// Google Maps implementation
export class GoogleMapsService extends MapService {
	async searchLocations(query: string): Promise<LocationSearchResult[]> {
		if (!this.config.apiKey) {
			throw new Error('Google Maps API key is required');
		}
		
		const url = `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${encodeURIComponent(query)}&key=${this.config.apiKey}`;
		
		try {
			const response = await fetch(url);
			const data = await response.json();
			
			if (data.status !== 'OK') {
				console.error('Google Maps API error:', data.status);
				return [];
			}
			
			return data.results.map((result: any) => ({
				name: result.name || result.formatted_address,
				fullAddress: result.formatted_address,
				coordinates: {
					lat: result.geometry.location.lat,
					lng: result.geometry.location.lng
				},
				type: this.getLocationType(result.types)
			}));
		} catch (error) {
			console.error('Google Maps search error:', error);
			return [];
		}
	}
	
	async reverseGeocode(coordinates: LocationCoordinates): Promise<LocationSearchResult> {
		const url = `https://maps.googleapis.com/maps/api/geocode/json?latlng=${coordinates.lat},${coordinates.lng}&key=${this.config.apiKey}`;
		
		const response = await fetch(url);
		const data = await response.json();
		
		if (data.status !== 'OK' || !data.results.length) {
			throw new Error('Unable to reverse geocode location');
		}
		
		const result = data.results[0];
		return {
			name: result.address_components[0]?.long_name || result.formatted_address,
			fullAddress: result.formatted_address,
			coordinates,
			type: this.getLocationType(result.types)
		};
	}
	
	getStaticMapUrl(coordinates: LocationCoordinates, zoom: number = 15, size: string = '600x400'): string {
		return `https://maps.googleapis.com/maps/api/staticmap?center=${coordinates.lat},${coordinates.lng}&zoom=${zoom}&size=${size}&markers=color:red%7C${coordinates.lat},${coordinates.lng}&key=${this.config.apiKey}`;
	}
	
	getDirectionsUrl(from: LocationCoordinates, to: LocationCoordinates): string {
		return `https://www.google.com/maps/dir/${from.lat},${from.lng}/${to.lat},${to.lng}`;
	}
	
	private getLocationType(types: string[]): 'address' | 'poi' | 'establishment' | 'locality' {
		if (types.includes('establishment') || types.includes('point_of_interest')) return 'poi';
		if (types.includes('locality') || types.includes('sublocality')) return 'locality';
		if (types.includes('street_address') || types.includes('premise')) return 'address';
		return 'establishment';
	}
}

// OpenStreetMap/Nominatim implementation (free alternative)
export class OpenStreetMapService extends MapService {
	async searchLocations(query: string): Promise<LocationSearchResult[]> {
		const url = `https://nominatim.openstreetmap.org/search?format=json&limit=10&q=${encodeURIComponent(query)}`;
		
		try {
			const response = await fetch(url, {
				headers: {
					'User-Agent': 'Zaur-Tours-App'
				}
			});
			const data = await response.json();
			
			return data.map((result: any) => ({
				name: result.display_name.split(',')[0],
				fullAddress: result.display_name,
				coordinates: {
					lat: parseFloat(result.lat),
					lng: parseFloat(result.lon)
				},
				type: this.getLocationType(result.type)
			}));
		} catch (error) {
			console.error('OpenStreetMap search error:', error);
			return [];
		}
	}
	
	async reverseGeocode(coordinates: LocationCoordinates): Promise<LocationSearchResult> {
		const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${coordinates.lat}&lon=${coordinates.lng}`;
		
		try {
			const response = await fetch(url, {
				headers: {
					'User-Agent': 'Zaur-Tours-App'
				}
			});
			const data = await response.json();
			
			return {
				name: data.display_name.split(',')[0],
				fullAddress: data.display_name,
				coordinates,
				type: this.getLocationType(data.type)
			};
		} catch (error) {
			console.error('OpenStreetMap reverse geocode error:', error);
			throw error;
		}
	}
	
	getStaticMapUrl(coordinates: LocationCoordinates, zoom: number = 15, size: string = '600x400'): string {
		// OpenStreetMap doesn't have a built-in static map API, but we can use third-party services
		// or implement our own using Leaflet for dynamic maps
		return `https://www.openstreetmap.org/?mlat=${coordinates.lat}&mlon=${coordinates.lng}&zoom=${zoom}`;
	}
	
	getDirectionsUrl(from: LocationCoordinates, to: LocationCoordinates): string {
		return `https://www.openstreetmap.org/directions?from=${from.lat}%2C${from.lng}&to=${to.lat}%2C${to.lng}&route=foot`;
	}
	
	private getLocationType(type: string): 'address' | 'poi' | 'establishment' | 'locality' {
		if (['amenity', 'tourism', 'historic', 'leisure'].includes(type)) return 'poi';
		if (['city', 'town', 'village', 'hamlet'].includes(type)) return 'locality';
		if (['house', 'building'].includes(type)) return 'address';
		return 'establishment';
	}
}

// Mapbox implementation
export class MapboxService extends MapService {
	async searchLocations(query: string): Promise<LocationSearchResult[]> {
		if (!this.config.apiKey) {
			throw new Error('Mapbox API key is required');
		}
		
		const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(query)}.json?access_token=${this.config.apiKey}&limit=10`;
		
		try {
			const response = await fetch(url);
			const data = await response.json();
			
			return data.features.map((feature: any) => ({
				name: feature.text,
				fullAddress: feature.place_name,
				coordinates: {
					lat: feature.center[1],
					lng: feature.center[0]
				},
				type: this.getLocationType(feature.place_type)
			}));
		} catch (error) {
			console.error('Mapbox search error:', error);
			return [];
		}
	}
	
	async reverseGeocode(coordinates: LocationCoordinates): Promise<LocationSearchResult> {
		const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${coordinates.lng},${coordinates.lat}.json?access_token=${this.config.apiKey}`;
		
		const response = await fetch(url);
		const data = await response.json();
		
		if (!data.features.length) {
			throw new Error('Unable to reverse geocode location');
		}
		
		const feature = data.features[0];
		return {
			name: feature.text,
			fullAddress: feature.place_name,
			coordinates,
			type: this.getLocationType(feature.place_type)
		};
	}
	
	getStaticMapUrl(coordinates: LocationCoordinates, zoom: number = 15, size: string = '600x400'): string {
		return `https://api.mapbox.com/styles/v1/mapbox/streets-v11/static/pin-s-marker+ff0000(${coordinates.lng},${coordinates.lat})/${coordinates.lng},${coordinates.lat},${zoom}/${size}?access_token=${this.config.apiKey}`;
	}
	
	getDirectionsUrl(from: LocationCoordinates, to: LocationCoordinates): string {
		return `https://api.mapbox.com/directions/v5/mapbox/walking/${from.lng},${from.lat};${to.lng},${to.lat}?access_token=${this.config.apiKey}`;
	}
	
	private getLocationType(placeTypes: string[]): 'address' | 'poi' | 'establishment' | 'locality' {
		if (placeTypes.includes('poi')) return 'poi';
		if (placeTypes.includes('place') || placeTypes.includes('locality')) return 'locality';
		if (placeTypes.includes('address')) return 'address';
		return 'establishment';
	}
}

// Factory function to create map service based on configuration
export function createMapService(provider: 'google' | 'openstreetmap' | 'mapbox', config: MapServiceConfig): MapService {
	switch (provider) {
		case 'google':
			return new GoogleMapsService(config);
		case 'openstreetmap':
			return new OpenStreetMapService(config);
		case 'mapbox':
			return new MapboxService(config);
		default:
			throw new Error(`Unsupported map provider: ${provider}`);
	}
}

// Utility functions for working with coordinates
export function calculateDistance(from: LocationCoordinates, to: LocationCoordinates): number {
	const R = 6371; // Earth's radius in kilometers
	const dLat = (to.lat - from.lat) * Math.PI / 180;
	const dLng = (to.lng - from.lng) * Math.PI / 180;
	const a = 
		Math.sin(dLat/2) * Math.sin(dLat/2) +
		Math.cos(from.lat * Math.PI / 180) * Math.cos(to.lat * Math.PI / 180) *
		Math.sin(dLng/2) * Math.sin(dLng/2);
	const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
	return R * c;
}

export function formatCoordinates(coordinates: LocationCoordinates): string {
	return `${coordinates.lat.toFixed(6)}, ${coordinates.lng.toFixed(6)}`;
}

export function parseCoordinates(coordinateString: string): LocationCoordinates | null {
	const match = coordinateString.match(/^(-?\d+\.?\d*),\s*(-?\d+\.?\d*)$/);
	if (!match) return null;
	
	return {
		lat: parseFloat(match[1]),
		lng: parseFloat(match[2])
	};
}

// Environment configuration - browser-safe defaults
export const MAP_CONFIG = {
	// These would be set via SvelteKit public environment variables if needed
	// For now using safe defaults that work without API keys
	GOOGLE_MAPS_API_KEY: '',
	MAPBOX_ACCESS_TOKEN: '',
	
	// OpenStreetMap doesn't require an API key
	DEFAULT_PROVIDER: 'openstreetmap' as const,
	
	// Default map settings
	DEFAULT_ZOOM: 15,
	DEFAULT_MAP_SIZE: '600x400',
	
	// Rate limiting (requests per second)
	RATE_LIMIT_DELAY: 100 // milliseconds between requests
};

// Default map service instance (uses OpenStreetMap as it's free)
export const defaultMapService = createMapService('openstreetmap', {
	apiKey: '' // OpenStreetMap doesn't need an API key
});

// Popular tourist locations for suggestions
export const POPULAR_TOUR_LOCATIONS = [
	'City Center',
	'Old Town Square',
	'Historic District',
	'Central Park',
	'Downtown',
	'Cathedral Square',
	'Market Square',
	'Harbor Area',
	'Museum Quarter',
	'Riverside',
	'Town Hall',
	'Castle',
	'Main Street',
	'Pedestrian Zone',
	'Tourist Information',
	'Train Station',
	'Bus Station',
	'City Hall',
	'Public Library',
	'Central Plaza'
];

// Function to get location suggestions based on user's country
export function getLocationSuggestionsForCountry(countryCode: string): string[] {
	const countrySpecificSuggestions: Record<string, string[]> = {
		'US': ['Times Square', 'Central Park', 'Union Square', 'City Hall', 'Downtown'],
		'GB': ['Piccadilly Circus', 'Trafalgar Square', 'Covent Garden', 'Tower Bridge', 'Westminster'],
		'FR': ['Place de la République', 'Champs-Élysées', 'Montmartre', 'Louvre', 'Notre-Dame'],
		'DE': ['Alexanderplatz', 'Brandenburg Gate', 'Marienplatz', 'Hauptbahnhof', 'Altstadt'],
		'IT': ['Piazza del Duomo', 'Colosseum', 'Trevi Fountain', 'Spanish Steps', 'Vatican'],
		'ES': ['Plaza Mayor', 'Park Güell', 'Sagrada Familia', 'Puerta del Sol', 'Las Ramblas'],
		// Add more countries as needed
	};
	
	return countrySpecificSuggestions[countryCode] || POPULAR_TOUR_LOCATIONS;
} 