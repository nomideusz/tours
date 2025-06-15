<script lang="ts">
	import Lock from 'lucide-svelte/icons/lock';
	import Shield from 'lucide-svelte/icons/shield';
	import CheckCircle from 'lucide-svelte/icons/check-circle';
	import LoadingSpinner from '$lib/components/LoadingSpinner.svelte';
	import ErrorAlert from '$lib/components/ErrorAlert.svelte';

	let {
		currentPassword = $bindable(),
		newPassword = $bindable(),
		confirmPassword = $bindable(),
		passwordError,
		passwordChanged,
		passwordLoading,
		onSubmit
	}: {
		currentPassword: string;
		newPassword: string;
		confirmPassword: string;
		passwordError: string;
		passwordChanged: boolean;
		passwordLoading: boolean;
		onSubmit: () => void;
	} = $props();
</script>

<div class="rounded-xl" style="background: var(--bg-primary); border: 1px solid var(--border-primary);">
	<div class="p-4 border-b" style="border-color: var(--border-primary);">
		<div class="flex items-center gap-3">
			<div class="p-2 rounded-lg" style="background: var(--color-warning-50);">
				<Lock class="h-4 w-4" style="color: var(--color-warning-600);" />
			</div>
			<div>
				<h2 class="font-semibold" style="color: var(--text-primary);">Security Settings</h2>
				<p class="text-sm" style="color: var(--text-secondary);">Change your password and security preferences</p>
			</div>
		</div>
	</div>
	<div class="p-4 sm:p-6">
		<form onsubmit={(e) => { e.preventDefault(); onSubmit(); }}>
			<div class="space-y-4">
				{#if passwordError}
					<ErrorAlert variant="error" message={passwordError} />
				{/if}

				<div>
					<label for="currentPassword" class="form-label">Current Password</label>
					<div class="relative">
						<Lock class="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4" style="color: var(--text-tertiary);" />
						<input
							type="password"
							id="currentPassword"
							name="currentPassword"
							bind:value={currentPassword}
							class="form-input pl-10"
							placeholder="Enter current password"
							required
						/>
					</div>
				</div>

				<div>
					<label for="newPassword" class="form-label">New Password</label>
					<div class="relative">
						<Lock class="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4" style="color: var(--text-tertiary);" />
						<input
							type="password"
							id="newPassword"
							name="newPassword"
							bind:value={newPassword}
							class="form-input pl-10"
							placeholder="Enter new password"
							required
						/>
					</div>
				</div>

				<div>
					<label for="confirmPassword" class="form-label">Confirm New Password</label>
					<div class="relative">
						<Lock class="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4" style="color: var(--text-tertiary);" />
						<input
							type="password"
							id="confirmPassword"
							name="confirmPassword"
							bind:value={confirmPassword}
							class="form-input pl-10"
							placeholder="Confirm new password"
							required
						/>
					</div>
				</div>

				<div class="flex items-center justify-end gap-3 pt-4">
					{#if passwordChanged}
						<div class="flex items-center gap-2 text-sm" style="color: var(--color-success);">
							<CheckCircle class="h-4 w-4" />
							Password changed successfully!
						</div>
					{/if}
					<button
						type="submit"
						disabled={passwordLoading}
						class="button-secondary button--gap"
					>
						{#if passwordLoading}
							<LoadingSpinner size="small" text="Changing..." />
						{:else if passwordChanged}
							<CheckCircle class="h-4 w-4" />
							Changed!
						{:else}
							<Shield class="h-4 w-4" />
							Change Password
						{/if}
					</button>
				</div>
			</div>
		</form>
	</div>
</div> 