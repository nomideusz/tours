// Map integration utilities for Zaur
// This file provides a foundation for integrating various map services

import type { PlaceSuggestion, PlaceDetails, AutocompleteOptions, PlaceDetailsOptions } from '$lib/types/places.js';

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
		// Use server-side proxy endpoint to avoid CORS and API key restrictions
		const url = `/api/maps/geocode?query=${encodeURIComponent(query)}`;
		
		try {
			const response = await fetch(url);
			const data = await response.json();
			
			if (!response.ok) {
				console.error('Geocoding API error:', data.error);
				return [];
			}
			
			if (!data.results || data.results.length === 0) {
				return [];
			}
			
			return data.results.map((result: any) => ({
				name: result.name,
				fullAddress: result.fullAddress,
				coordinates: result.coordinates,
				type: this.getLocationType(result.types || [])
			}));
		} catch (error) {
			console.error('Geocoding error:', error);
			return [];
		}
	}
	
	async reverseGeocode(coordinates: LocationCoordinates): Promise<LocationSearchResult> {
		// Use server-side proxy endpoint
		const url = `/api/maps/reverse-geocode?lat=${coordinates.lat}&lng=${coordinates.lng}`;
		
		const response = await fetch(url);
		const data = await response.json();
		
		if (!response.ok) {
			throw new Error('Unable to reverse geocode location');
		}
		
		return {
			name: data.name,
			fullAddress: data.fullAddress,
			coordinates: data.coordinates,
			type: this.getLocationType(data.types || [])
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

/**
 * Google Places API (New) implementation
 * Uses the new Places API with enhanced features:
 * - Better autocomplete
 * - Rich place details (ratings, photos, opening hours)
 * - AI-powered summaries
 */
export class GooglePlacesAPIService extends MapService {
	/**
	 * Search locations using Places API Autocomplete (New)
	 * More accurate and feature-rich than Geocoding API
	 */
	async searchLocationsWithPlacesAPI(
		input: string,
		options?: Partial<AutocompleteOptions>
	): Promise<PlaceSuggestion[]> {
		try {
			const response = await fetch('/api/places/autocomplete', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					input,
					types: options?.types,
					locationBias: options?.locationBias,
					sessionToken: options?.sessionToken
				})
			});
			
			if (!response.ok) {
				console.error('Places Autocomplete failed:', response.status);
				return [];
			}
			
			const data = await response.json();
			return data.suggestions || [];
		} catch (error) {
			console.error('Places Autocomplete error:', error);
			return [];
		}
	}
	
	/**
	 * Get detailed place information using Place ID
	 */
	async getPlaceDetails(
		placeId: string,
		fields?: string[]
	): Promise<PlaceDetails | null> {
		try {
			const response = await fetch('/api/places/details', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ placeId, fields })
			});
			
			if (!response.ok) {
				console.error('Place Details failed:', response.status);
				return null;
			}
			
			const data = await response.json();
			return data;
		} catch (error) {
			console.error('Place Details error:', error);
			return null;
		}
	}
	
	/**
	 * Legacy searchLocations method - uses Geocoding API for backward compatibility
	 */
	async searchLocations(query: string): Promise<LocationSearchResult[]> {
		// Use existing Geocoding API implementation
		const url = `/api/maps/geocode?query=${encodeURIComponent(query)}`;
		
		try {
			const response = await fetch(url);
			const data = await response.json();
			
			if (!response.ok || !data.results) {
				return [];
			}
			
			return data.results.map((result: any) => ({
				name: result.name,
				fullAddress: result.fullAddress,
				coordinates: result.coordinates,
				type: this.getLocationType(result.types || [])
			}));
		} catch (error) {
			console.error('Geocoding error:', error);
			return [];
		}
	}
	
	async reverseGeocode(coordinates: LocationCoordinates): Promise<LocationSearchResult> {
		const url = `/api/maps/reverse-geocode?lat=${coordinates.lat}&lng=${coordinates.lng}`;
		
		const response = await fetch(url);
		const data = await response.json();
		
		if (!response.ok) {
			throw new Error('Unable to reverse geocode location');
		}
		
		return {
			name: data.name,
			fullAddress: data.fullAddress,
			coordinates: data.coordinates,
			type: this.getLocationType(data.types || [])
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
	// These should be set via SvelteKit public environment variables
	// Add to .env: PUBLIC_GOOGLE_MAPS_API_KEY=your_key_here
	GOOGLE_MAPS_API_KEY: '',
	MAPBOX_ACCESS_TOKEN: '',
	
	// Google Maps is now the default provider (requires API key)
	DEFAULT_PROVIDER: 'google' as const,
	
	// Default map settings
	DEFAULT_ZOOM: 15,
	DEFAULT_MAP_SIZE: '600x400',
	
	// Rate limiting (requests per second)
	RATE_LIMIT_DELAY: 100 // milliseconds between requests
};

/**
 * Create default map service based on environment configuration
 * Falls back to OpenStreetMap if Google Maps API key is not available
 */
export function createDefaultMapService(googleApiKey?: string): MapService {
	if (googleApiKey) {
		return createMapService('google', { apiKey: googleApiKey });
	}
	
	// Fallback to OpenStreetMap if no API key provided
	console.warn('Google Maps API key not found, using OpenStreetMap as fallback');
	return createMapService('openstreetmap', { apiKey: '' });
}

// Default map service instance - uses Google Maps via server proxies
export const defaultMapService = createMapService('google', { apiKey: '' });

/**
 * Get map service - always uses Google Maps via server proxy
 * API key is handled server-side for security
 */
export function getMapService(apiKey?: string): MapService {
	// Always use Google Maps now (calls server endpoints)
	// API key parameter is ignored but kept for backward compatibility
	return createMapService('google', { apiKey: '' });
}

/**
 * Get Places API service - uses the new Google Places API
 * Provides enhanced features like better autocomplete, place details, photos, etc.
 */
export function getPlacesAPIService(apiKey?: string): GooglePlacesAPIService {
	// API key is handled server-side for security
	return new GooglePlacesAPIService({ apiKey: '' });
}

/**
 * Default Places API service instance
 */
export const defaultPlacesAPIService = getPlacesAPIService();

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