<script lang="ts">
	import User from 'lucide-svelte/icons/user';
	import Mail from 'lucide-svelte/icons/mail';
	import Building from 'lucide-svelte/icons/building';
	import Phone from 'lucide-svelte/icons/phone';
	import Globe from 'lucide-svelte/icons/globe';
	import CheckCircle from 'lucide-svelte/icons/check-circle';

	let {
		user,
		username,
		businessName,
		phone,
		website,
		avatarPreview,
		avatarLoadError = $bindable()
	}: {
		user: any;
		username: string;
		businessName: string;
		phone: string;
		website: string;
		avatarPreview: string;
		avatarLoadError: boolean;
	} = $props();
</script>

<div class="rounded-xl" style="background: var(--bg-primary); border: 1px solid var(--border-primary);">
	<div class="p-4 border-b" style="border-color: var(--border-primary);">
		<h3 class="font-semibold" style="color: var(--text-primary);">Profile Summary</h3>
	</div>
	<div class="p-4 space-y-4">
		<div class="flex items-center gap-3">
			<div class="w-12 h-12 rounded-full flex items-center justify-center" style="background: var(--bg-secondary);">
				{#if avatarPreview}
					<img src={avatarPreview} alt="Avatar preview" class="w-full h-full rounded-full object-cover" />
				{:else if user?.avatar && !avatarLoadError}
					<img 
						src={user.avatar} 
						alt="Avatar" 
						class="w-full h-full rounded-full object-cover"
						onerror={() => avatarLoadError = true}
					/>
				{:else}
					<User class="h-6 w-6" style="color: var(--text-secondary);" />
				{/if}
			</div>
			<div class="flex-1 min-w-0">
				<p class="font-medium truncate" style="color: var(--text-primary);">{user?.name || 'No name set'}</p>
				<p class="text-sm truncate" style="color: var(--text-secondary);">@{username || 'username-required'}</p>
			</div>
		</div>

		<div class="space-y-2 text-sm">
			<div class="flex items-center gap-2">
				<Mail class="h-4 w-4" style="color: var(--text-tertiary);" />
				<span style="color: var(--text-secondary);">{user?.email}</span>
				{#if user?.verified}
					<CheckCircle class="h-3 w-3" style="color: var(--color-success);" />
				{/if}
			</div>

			{#if businessName}
				<div class="flex items-center gap-2">
					<Building class="h-4 w-4" style="color: var(--text-tertiary);" />
					<span style="color: var(--text-secondary);">{businessName}</span>
				</div>
			{/if}

			{#if phone}
				<div class="flex items-center gap-2">
					<Phone class="h-4 w-4" style="color: var(--text-tertiary);" />
					<span style="color: var(--text-secondary);">{phone}</span>
				</div>
			{/if}

			{#if website}
				<div class="flex items-center gap-2">
					<Globe class="h-4 w-4" style="color: var(--text-tertiary);" />
					<a href={website} target="_blank" class="text-blue-600 hover:text-blue-800 truncate">{website}</a>
				</div>
			{/if}
		</div>

		{#if username}
			<div class="pt-3 border-t" style="border-color: var(--border-primary);">
				<div class="flex items-center justify-between">
					<span class="text-sm" style="color: var(--text-secondary);">Public Profile</span>
					<button onclick={() => window.open(`/${username}`, '_blank')} class="text-xs" style="color: var(--color-primary-600);">
						View Live
					</button>
				</div>
			</div>
		{/if}
	</div>
</div> 