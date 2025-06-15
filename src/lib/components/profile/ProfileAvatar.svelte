<script lang="ts">
	import User from 'lucide-svelte/icons/user';
	import Upload from 'lucide-svelte/icons/upload';
	import X from 'lucide-svelte/icons/x';
	import CheckCircle from 'lucide-svelte/icons/check-circle';

	let {
		user,
		avatarPreview,
		avatarSaved,
		avatarRemoved,
		avatarLoadError,
		onAvatarSelect,
		onRemoveAvatar
	}: {
		user: any;
		avatarPreview: string;
		avatarSaved: boolean;
		avatarRemoved: boolean;
		avatarLoadError: boolean;
		onAvatarSelect: (event: Event) => void;
		onRemoveAvatar: () => void;
	} = $props();

	let avatarInputElement = $state<HTMLInputElement>();
</script>

<div class="pb-6 border-b" style="border-color: var(--border-primary);">
	<div class="flex items-center justify-between mb-4">
		<h3 class="font-medium" style="color: var(--text-primary);">Profile Avatar</h3>
		{#if avatarSaved}
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

	<div class="space-y-4">
		<div class="flex items-start gap-4">
			<!-- Current Avatar Display -->
			<div class="flex-shrink-0">
				<div class="w-20 h-20 rounded-full overflow-hidden" style="background: var(--bg-secondary); border: 2px solid var(--border-primary);">
					{#if avatarPreview}
						<img src={avatarPreview} alt="Avatar preview" class="w-full h-full object-cover" />
					{:else if user?.avatar && !avatarLoadError}
						<img 
							src={user.avatar} 
							alt="Current avatar" 
							class="w-full h-full object-cover"
							onerror={() => avatarLoadError = true}
						/>
					{:else}
						<div class="w-full h-full flex items-center justify-center">
							<User class="h-8 w-8" style="color: var(--text-tertiary);" />
						</div>
					{/if}
				</div>
			</div>
			
			<!-- Upload Controls -->
			<div class="flex-1 space-y-3">
				<div class="flex gap-2">
					<input
						type="file"
						id="avatar"
						name="avatar"
						accept="image/jpeg,image/jpg,image/png,image/webp"
						class="hidden"
						onchange={onAvatarSelect}
						bind:this={avatarInputElement}
					/>
					<label
						for="avatar"
						class="button-secondary button--gap button--small cursor-pointer"
					>
						<Upload class="h-3 w-3" />
						Choose Avatar
					</label>
					
					{#if avatarPreview || (user?.avatar && !avatarLoadError)}
						<button
							type="button"
							onclick={onRemoveAvatar}
							class="button--danger button--gap button--small"
						>
							<X class="h-3 w-3" />
							Remove
						</button>
					{/if}
				</div>
				
				<p class="text-xs" style="color: var(--text-tertiary);">
					Upload a square image (JPEG, PNG, WebP) up to 2MB. Automatically saved when selected.
				</p>
			</div>
		</div>
	</div>
</div> 