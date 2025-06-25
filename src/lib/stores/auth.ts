import { writable, derived, type Readable } from 'svelte/store';
import { page } from '$app/stores';

export interface AuthUser {
	id: string;
	email: string;
	name?: string;
	username?: string;
	businessName?: string;
	role?: string;
	avatar?: string;
	phone?: string;
	website?: string;
	description?: string;
	location?: string;
	country?: string;
	currency?: string;
	emailVerified?: boolean;
	lastLogin?: Date;
	// Payment fields
	stripeAccountId?: string;
	// Subscription fields
	subscriptionPlan?: 'free' | 'starter_pro' | 'professional' | 'agency';
	subscriptionStatus?: 'active' | 'canceled' | 'past_due' | 'unpaid' | 'incomplete' | 'incomplete_expired' | 'trialing';
	subscriptionCancelAtPeriodEnd?: boolean;
	subscriptionCurrentPeriodEnd?: string;
	monthlyBookingsUsed?: number;
	monthlyBookingsResetAt?: string;
	// Promo code fields
	promoCodeUsed?: string;
	subscriptionDiscountPercentage?: number;
	subscriptionFreeUntil?: string;
	isLifetimeDiscount?: boolean;
	earlyAccessMember?: boolean;
	deletedAt?: Date | null;
}

export interface AuthSession {
	id: string;
	userId: string;
	expiresAt: Date;
}

export interface AuthState {
	isAuthenticated: boolean;
	user: AuthUser | null;
	session: AuthSession | null;
	isAdmin: boolean;
	isLoading: boolean;
}

// Create the auth store
function createAuthStore() {
	const { subscribe, set, update } = writable<AuthState>({
		isAuthenticated: false,
		user: null,
		session: null,
		isAdmin: false,
		isLoading: true
	});

	return {
		subscribe,
		
		// Initialize auth state from page data (called in root layout)
		initialize: (data: any) => {
			set({
				isAuthenticated: data.isAuthenticated || false,
				user: data.user || null,
				session: data.session || null,
				isAdmin: data.isAdmin || false,
				isLoading: false
			});
		},
		
		// Update user data (for profile updates, etc.)
		updateUser: (user: AuthUser) => {
			update(state => ({
				...state,
				user: { ...state.user, ...user }
			}));
		},
		
		// Clear auth state (for logout)
		clear: () => {
			set({
				isAuthenticated: false,
				user: null,
				session: null,
				isAdmin: false,
				isLoading: false
			});
		},
		
		// Set loading state
		setLoading: (loading: boolean) => {
			update(state => ({ ...state, isLoading: loading }));
		}
	};
}

export const auth = createAuthStore();

// Derived stores for common auth checks
export const isAuthenticated: Readable<boolean> = derived(
	auth,
	$auth => $auth.isAuthenticated
);

export const isAdmin: Readable<boolean> = derived(
	auth,
	$auth => $auth.isAdmin
);

export const currentUser: Readable<AuthUser | null> = derived(
	auth,
	$auth => $auth.user
);

export const isLoading: Readable<boolean> = derived(
	auth,
	$auth => $auth.isLoading
);

// Helper function to check if user has a specific role
export function hasRole(requiredRole: string): Readable<boolean> {
	return derived(
		auth,
		$auth => $auth.user?.role === requiredRole || false
	);
}

// Helper function to check if user is verified
export const isVerified: Readable<boolean> = derived(
	auth,
	$auth => $auth.user?.emailVerified === true
); 