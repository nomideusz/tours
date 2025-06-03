import { writable } from 'svelte/store';

// Global store to track which TimePicker is open
export const openTimePickerId = writable<string | null>(null); 