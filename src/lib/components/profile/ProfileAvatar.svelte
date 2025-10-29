<script lang="ts">
	import User from 'lucide-svelte/icons/user';
	import Camera from 'lucide-svelte/icons/camera';
	import X from 'lucide-svelte/icons/x';

	let {
		user,
		avatarPreview,
		avatarSaved,
		avatarRemoved,
		avatarLoadError,
		uploadingAvatar = false,
		onAvatarSelect,
		onRemoveAvatar
	}: {
		user: any;
		avatarPreview: string;
		avatarSaved: boolean;
		avatarRemoved: boolean;
		avatarLoadError: boolean;
		uploadingAvatar?: boolean;
		onAvatarSelect: (event: Event) => void;
		onRemoveAvatar: () => void;
	} = $props();

	let avatarInputElement = $state<HTMLInputElement>();

	// Determine which avatar to show
	let currentAvatarUrl = $derived(
		avatarPreview || (user?.avatar && !avatarLoadError ? user.avatar : null)
	);
</script>

<div class="flex items-center gap-6">
	<!-- Avatar -->
	<div class="relative">
		<div class="w-20 h-20 rounded-full overflow-hidden" style="background: var(--bg-secondary); border: 2px solid var(--border-primary);">
			{#if currentAvatarUrl}
				<img 
					src={currentAvatarUrl} 
					alt="Profile avatar"
					class="w-full h-full object-cover"
					onerror={() => avatarLoadError = true}
				/>
			{:else}
				<div class="w-full h-full flex items-center justify-center">
					<User class="h-8 w-8" style="color: var(--text-tertiary);" />
				</div>
			{/if}
		</div>
		
		{#if uploadingAvatar}
			<div class="absolute inset-0 bg-black bg-opacity-50 rounded-full flex items-center justify-center">
				<div class="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
			</div>
		{/if}
	</div>
	
	<!-- Controls -->
	<div class="flex-1">
		<input
			type="file"
			id="avatar"
			name="avatar"
			accept="image/jpeg,image/jpg,image/png,image/webp"
			class="hidden"
			onchange={onAvatarSelect}
			bind:this={avatarInputElement}
			disabled={uploadingAvatar}
		/>
		
		<div class="flex gap-2">
			<label
				for="avatar"
				class="button-secondary button-gap button-small cursor-pointer {uploadingAvatar ? 'opacity-60 cursor-not-allowed' : ''}"
			>
				<Camera class="h-3 w-3" />
				{uploadingAvatar ? 'Uploading...' : 'Change Photo'}
			</label>
			
			{#if currentAvatarUrl && !uploadingAvatar}
				<button
					type="button"
					onclick={onRemoveAvatar}
					class="button-danger button-small"
				>
					<X class="h-3 w-3" />
				</button>
			{/if}
		</div>
		
		<p class="text-xs mt-2" style="color: var(--text-tertiary);">
			JPG, PNG or WebP. Max 2MB.
		</p>
	</div>
</div> 