<script lang="ts">
	import User from 'lucide-svelte/icons/user';
	import Upload from 'lucide-svelte/icons/upload';
	import X from 'lucide-svelte/icons/x';
	import CheckCircle from 'lucide-svelte/icons/check-circle';
	import LoadingSpinner from '$lib/components/LoadingSpinner.svelte';

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

	// Determine which avatar to show with proper priority
	let currentAvatarUrl = $derived.by(() => {
		// Priority: preview > user avatar (if not error) > fallback to user icon
		if (avatarPreview) return avatarPreview;
		if (user?.avatar && !avatarLoadError) return user.avatar;
		return null;
	});

	let hasAvatar = $derived(!!currentAvatarUrl);
</script>

<div class="pb-6 border-b" style="border-color: var(--border-primary);">
	<div class="flex items-center justify-between mb-4">
		<h3 class="font-medium" style="color: var(--text-primary);">Profile Avatar</h3>
		{#if uploadingAvatar}
			<div class="flex items-center gap-2 text-sm" style="color: var(--color-primary);">
				<LoadingSpinner size="small" />
				Uploading...
			</div>
		{:else if avatarSaved}
			<div class="flex items-center gap-2 text-sm" style="color: var(--color-success);">
				<CheckCircle class="h-4 w-4" />
				Avatar updated!
			</div>
		{:else if avatarRemoved}
			<div class="flex items-center gap-2 text-sm" style="color: var(--color-success);">
				<CheckCircle class="h-4 w-4" />
				Avatar removed!
			</div>
		{/if}
	</div>

	<!-- Mobile-First Layout: Avatar centered, then controls below -->
	<div class="space-y-4">
		<!-- Avatar Display - Centered on mobile, left-aligned on desktop -->
		<div class="flex flex-col sm:flex-row sm:items-start gap-4">
			<!-- Avatar Container -->
			<div class="flex justify-center sm:justify-start">
				<div class="relative">
					<div class="w-24 h-24 sm:w-20 sm:h-20 rounded-full overflow-hidden" style="background: var(--bg-secondary); border: 2px solid var(--border-primary);">
						{#if currentAvatarUrl}
							<img 
								src={currentAvatarUrl} 
								alt={avatarPreview ? "Avatar preview" : "Current avatar"}
								class="w-full h-full object-cover"
								onerror={() => avatarLoadError = true}
							/>
						{:else}
							<div class="w-full h-full flex items-center justify-center">
								<User class="h-8 w-8 sm:h-7 sm:w-7" style="color: var(--text-tertiary);" />
							</div>
						{/if}
					</div>
					
					<!-- Loading overlay for uploads -->
					{#if uploadingAvatar}
						<div class="absolute inset-0 bg-black bg-opacity-50 rounded-full flex items-center justify-center">
							<LoadingSpinner size="small" variant="white" />
						</div>
					{/if}
				</div>
			</div>
			
			<!-- Upload Controls -->
			<div class="flex-1 space-y-3">
				<!-- Buttons - Stacked on mobile, inline on desktop -->
				<div class="flex flex-col sm:flex-row gap-2 sm:gap-2">
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
					<label
						for="avatar"
						class="button-secondary button--gap button--small cursor-pointer {uploadingAvatar ? 'opacity-60 cursor-not-allowed' : ''} text-center sm:text-left"
					>
						<Upload class="h-3 w-3" />
						{uploadingAvatar ? 'Uploading...' : 'Choose Avatar'}
					</label>
					
					{#if hasAvatar && !uploadingAvatar}
						<button
							type="button"
							onclick={onRemoveAvatar}
							class="button--danger button--gap button--small text-center sm:text-left"
						>
							<X class="h-3 w-3" />
							Remove
						</button>
					{/if}
				</div>
				
				<!-- Help Text -->
				<p class="text-xs text-center sm:text-left" style="color: var(--text-tertiary);">
					Upload a square image (JPEG, PNG, WebP) up to 2MB. 
					<span class="block sm:inline">Automatically saved when selected.</span>
				</p>
			</div>
		</div>
	</div>
</div> 