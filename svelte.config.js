import adapter from '@sveltejs/adapter-node';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';

const config = {
	preprocess: vitePreprocess(),
	kit: { 
		adapter: adapter({
			// Let CapRover set the port dynamically
			out: 'build',
			// Increase body size limit for image uploads (10MB)
			bodyParser: {
				sizeLimit: '10mb'
			}
		}),
		serviceWorker: {
			register: true
		}
	}
};

export default config;
