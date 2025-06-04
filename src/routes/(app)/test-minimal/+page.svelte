<script lang="ts">
	import type { PageData } from './$types.js';
	
	let { data }: { data: PageData } = $props();
</script>

<h1>Minimal Test Page</h1>
<pre>{JSON.stringify(data, null, 2)}</pre> 