/**
 * Types for Google Places API (New)
 * 
 * References:
 * - https://developers.google.com/maps/documentation/places/web-service/place-autocomplete
 * - https://developers.google.com/maps/documentation/places/web-service/place-details
 */

import type { LocationCoordinates } from '$lib/utils/map-integration.js';

/**
 * Place autocomplete suggestion
 */
export interface PlaceSuggestion {
	placeId: string;
	name: string;
	fullAddress: string;
	types: string[];
	type: 'address' | 'poi' | 'establishment' | 'locality';
}

/**
 * Place details response
 */
export interface PlaceDetails {
	placeId: string;
	name: string;
	fullAddress: string;
	coordinates: LocationCoordinates | null;
	types: string[];
	viewport?: {
		northeast: LocationCoordinates;
		southwest: LocationCoordinates;
	} | null;
	// Optional advanced fields
	rating?: number;
	userRatingCount?: number;
	editorialSummary?: string;
	photos?: PlacePhoto[];
	currentOpeningHours?: OpeningHours;
	paymentOptions?: PaymentOptions;
	parkingOptions?: ParkingOptions;
	accessibilityOptions?: AccessibilityOptions;
}

/**
 * Place photo metadata
 */
export interface PlacePhoto {
	name: string;
	widthPx: number;
	heightPx: number;
}

/**
 * Opening hours information
 */
export interface OpeningHours {
	openNow: boolean;
	periods: OpeningPeriod[];
	weekdayDescriptions: string[];
}

export interface OpeningPeriod {
	open: {
		day: number;
		hour: number;
		minute: number;
	};
	close?: {
		day: number;
		hour: number;
		minute: number;
	};
}

/**
 * Payment options (New in Places API)
 */
export interface PaymentOptions {
	acceptsCreditCards?: boolean;
	acceptsDebitCards?: boolean;
	acceptsCashOnly?: boolean;
	acceptsNfc?: boolean;
}

/**
 * Parking options (New in Places API)
 */
export interface ParkingOptions {
	freeParkingLot?: boolean;
	paidParkingLot?: boolean;
	freeStreetParking?: boolean;
	valetParking?: boolean;
	freeGarageParking?: boolean;
	paidGarageParking?: boolean;
}

/**
 * Accessibility options (New in Places API)
 */
export interface AccessibilityOptions {
	wheelchairAccessibleParking?: boolean;
	wheelchairAccessibleEntrance?: boolean;
	wheelchairAccessibleRestroom?: boolean;
	wheelchairAccessibleSeating?: boolean;
}

/**
 * Location bias for autocomplete
 */
export interface LocationBias {
	lat: number;
	lng: number;
	radius?: number; // in meters
}

/**
 * Autocomplete request options
 */
export interface AutocompleteOptions {
	input: string;
	types?: string[]; // e.g., ['tourist_attraction', 'restaurant']
	locationBias?: LocationBias;
	sessionToken?: string; // For session-based pricing
}

/**
 * Place Details request options
 */
export interface PlaceDetailsOptions {
	placeId: string;
	fields?: string[]; // Field mask to control pricing
}

/**
 * Common place types for tours
 */
export const TOUR_PLACE_TYPES = {
	// Attractions
	TOURIST_ATTRACTION: 'tourist_attraction',
	MUSEUM: 'museum',
	ART_GALLERY: 'art_gallery',
	PARK: 'park',
	ZOO: 'zoo',
	AQUARIUM: 'aquarium',
	AMUSEMENT_PARK: 'amusement_park',
	
	// Landmarks
	CHURCH: 'church',
	MOSQUE: 'mosque',
	HINDU_TEMPLE: 'hindu_temple',
	SYNAGOGUE: 'synagogue',
	LANDMARK: 'landmark',
	
	// Cultural
	PERFORMING_ARTS_THEATER: 'performing_arts_theater',
	MOVIE_THEATER: 'movie_theater',
	NIGHT_CLUB: 'night_club',
	
	// Food & Drink
	RESTAURANT: 'restaurant',
	CAFE: 'cafe',
	BAR: 'bar',
	
	// Accommodation
	LODGING: 'lodging',
	HOTEL: 'hotel',
	
	// Transport
	BUS_STATION: 'bus_station',
	TRAIN_STATION: 'train_station',
	SUBWAY_STATION: 'subway_station',
	AIRPORT: 'airport',
	
	// Other
	SHOPPING_MALL: 'shopping_mall',
	STORE: 'store',
	POINT_OF_INTEREST: 'point_of_interest',
	ESTABLISHMENT: 'establishment'
} as const;

/**
 * Suggested types for meeting points
 */
export const MEETING_POINT_TYPES = [
	TOUR_PLACE_TYPES.TOURIST_ATTRACTION,
	TOUR_PLACE_TYPES.MUSEUM,
	TOUR_PLACE_TYPES.PARK,
	TOUR_PLACE_TYPES.LANDMARK,
	TOUR_PLACE_TYPES.TRAIN_STATION,
	TOUR_PLACE_TYPES.BUS_STATION,
	TOUR_PLACE_TYPES.SUBWAY_STATION,
	TOUR_PLACE_TYPES.CAFE,
	TOUR_PLACE_TYPES.HOTEL,
	TOUR_PLACE_TYPES.POINT_OF_INTEREST
];

