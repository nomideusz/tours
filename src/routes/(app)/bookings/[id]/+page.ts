export const load = async ({ params }) => {
	return {
		bookingId: params.id
	};
};

// Disable SSR to prevent 502 errors on refresh
export const ssr = false; 