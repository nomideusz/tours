import { writable } from 'svelte/store';

export interface TourOwner {
	username: string;
	name: string;
}

export const tourOwnerStore = writable<TourOwner | null>(null); 