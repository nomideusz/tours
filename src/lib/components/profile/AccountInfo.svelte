<script lang="ts">
	let { user }: { user: any } = $props();
	
	function formatMemberSince(dateString: string | undefined) {
		if (!dateString) return 'Recently';
		
		const date = new Date(dateString);
		if (isNaN(date.getTime())) return 'Recently';
		
		const now = new Date();
		const diffTime = Math.abs(now.getTime() - date.getTime());
		const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
		
		if (diffDays < 7) return 'This week';
		if (diffDays < 30) return 'This month';
		if (diffDays < 365) {
			const months = Math.floor(diffDays / 30);
			return months === 1 ? '1 month ago' : `${months} months ago`;
		}
		
		return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
	}
</script>

<div class="rounded-xl" style="background: var(--bg-primary); border: 1px solid var(--border-primary);">
	<div class="p-4 border-b" style="border-color: var(--border-primary);">
		<h3 class="font-semibold" style="color: var(--text-primary);">Account Info</h3>
	</div>
	<div class="p-4 space-y-3 text-sm">
		<div class="flex justify-between">
			<span style="color: var(--text-secondary);">Member Since</span>
			<span style="color: var(--text-primary);">{formatMemberSince(user?.created)}</span>
		</div>
		<div class="flex justify-between">
			<span style="color: var(--text-secondary);">Email Status</span>
			<span style="color: var(--text-primary);">{user?.emailVerified ? 'Verified' : 'Unverified'}</span>
		</div>
		{#if user?.isOAuth2User}
			<div class="flex justify-between">
				<span style="color: var(--text-secondary);">Login Method</span>
				<span style="color: var(--text-primary);">OAuth2</span>
			</div>
		{/if}
	</div>
</div> 