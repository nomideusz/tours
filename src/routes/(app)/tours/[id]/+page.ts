export const load = async ({ params }) => {
	return {
		tourId: params.id
	};
};

// Disable SSR to prevent 502 errors on refresh
export const ssr = false;
export const prerender = false; 