import adapter from '@sveltejs/adapter-node';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';

const config = {
	preprocess: vitePreprocess(),
	kit: { 
		adapter: adapter({
			// Let CapRover set the port dynamically
			out: 'build'
		}),
		serviceWorker: {
			register: false
		}
	}
};

export default config;
