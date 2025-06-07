// See https://kit.svelte.dev/docs/types#app
// for information about these interfaces
declare global {
	namespace App {
		// interface Error {}
		interface Locals {
			user?: AuthUser;
			session?: Session;
			isAdmin?: boolean;
		}
		// interface PageData {}
		// interface PageState {}
		// interface Platform {}
	}
}

// Define custom types for layout data
import type { SharedStats } from '$lib/utils/shared-stats.js';

declare global {
	namespace App {
		interface LayoutData {
			isAuthenticated: boolean;
			isAdmin: boolean;
			user: AuthUser | null;
			sharedStats: SharedStats | null;
		}
	}
}

export {};
