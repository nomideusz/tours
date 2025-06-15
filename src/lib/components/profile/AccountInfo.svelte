<script lang="ts">
	let { user }: { user: any } = $props();
</script>

<div class="rounded-xl" style="background: var(--bg-primary); border: 1px solid var(--border-primary);">
	<div class="p-4 border-b" style="border-color: var(--border-primary);">
		<h3 class="font-semibold" style="color: var(--text-primary);">Account Info</h3>
	</div>
	<div class="p-4 space-y-3 text-sm">
		<div class="flex justify-between">
			<span style="color: var(--text-secondary);">Account Type</span>
			<span style="color: var(--text-primary);">{user?.role === 'admin' ? 'Administrator' : 'Tour Guide'}</span>
		</div>
		<div class="flex justify-between">
			<span style="color: var(--text-secondary);">Member Since</span>
			<span style="color: var(--text-primary);">Recently</span>
		</div>
		<div class="flex justify-between">
			<span style="color: var(--text-secondary);">Email Status</span>
			<span style="color: var(--text-primary);">{user?.verified ? 'Verified' : 'Unverified'}</span>
		</div>
		{#if user?.isOAuth2User}
			<div class="flex justify-between">
				<span style="color: var(--text-secondary);">Login Method</span>
				<span style="color: var(--text-primary);">OAuth2</span>
			</div>
		{/if}
	</div>
</div> 