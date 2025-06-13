export const load = async ({ params }) => {
	return {
		tourId: params.id,
		slotId: params.slotId
	};
};

// Disable SSR to prevent 502 errors on refresh
export const ssr = false; 