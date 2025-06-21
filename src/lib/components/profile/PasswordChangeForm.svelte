<script lang="ts">
	import Lock from 'lucide-svelte/icons/lock';
	import Shield from 'lucide-svelte/icons/shield';
	import AlertCircle from 'lucide-svelte/icons/alert-circle';

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

	// Validation state
	let errors = $state<Record<string, string>>({});
	let touched = $state<Record<string, boolean>>({});

	// Validation rules
	function validatePassword(value: string, field: string): string | null {
		if (!value) return `${field} is required`;
		if (field === 'New password' && value.length < 8) {
			return 'Password must be at least 8 characters';
		}
		return null;
	}

	function validatePasswordMatch(): string | null {
		if (newPassword && confirmPassword && newPassword !== confirmPassword) {
			return 'Passwords do not match';
		}
		return null;
	}

	// Handle blur events
	function handleBlur(field: string) {
		touched[field] = true;
		validateField(field);
	}

	// Real-time validation
	function validateField(field: string) {
		switch (field) {
			case 'currentPassword':
				errors[field] = validatePassword(currentPassword, 'Current password') || '';
				break;
			case 'newPassword':
				errors[field] = validatePassword(newPassword, 'New password') || '';
				// Also check password match if confirm is filled
				if (confirmPassword) {
					errors.confirmPassword = validatePasswordMatch() || '';
				}
				break;
			case 'confirmPassword':
				errors[field] = validatePasswordMatch() || '';
				break;
		}
	}

	// Form submission
	function handleSubmit(e: Event) {
		e.preventDefault();
		
		// Validate all fields
		errors = {};
		const currentError = validatePassword(currentPassword, 'Current password');
		const newError = validatePassword(newPassword, 'New password');
		const matchError = validatePasswordMatch();
		
		if (currentError) errors.currentPassword = currentError;
		if (newError) errors.newPassword = newError;
		if (matchError) errors.confirmPassword = matchError;
		
		// Mark all as touched
		touched = {
			currentPassword: true,
			newPassword: true,
			confirmPassword: true
		};
		
		// If no errors, submit
		if (Object.keys(errors).length === 0) {
			onSubmit();
		}
	}

	// Watch for changes to clear match error when typing
	$effect(() => {
		if (touched.confirmPassword && confirmPassword) {
			validateField('confirmPassword');
		}
	});
</script>

<div class="rounded-xl" style="background: var(--bg-primary); border: 1px solid var(--border-primary);">
	<div class="p-6 border-b" style="border-color: var(--border-primary);">
		<h2 class="text-lg font-semibold" style="color: var(--text-primary);">Security</h2>
	</div>
	<div class="p-6">
		<form onsubmit={handleSubmit} novalidate class="space-y-4">
			{#if passwordError}
				<div class="p-3 rounded-lg flex items-start gap-2" style="background: var(--color-error-light);">
					<AlertCircle class="h-4 w-4 flex-shrink-0 mt-0.5" style="color: var(--color-error);" />
					<p class="text-sm" style="color: var(--color-error);">{passwordError}</p>
				</div>
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
						onblur={() => handleBlur('currentPassword')}
						class="form-input pl-10"
						class:border-red-300={touched.currentPassword && errors.currentPassword}
						class:focus:border-red-500={touched.currentPassword && errors.currentPassword}
						placeholder="Enter current password"
					/>
				</div>
				{#if touched.currentPassword && errors.currentPassword}
					<div class="flex items-center gap-1 mt-1">
						<AlertCircle class="h-3 w-3 text-red-500" />
						<p class="text-xs text-red-600">{errors.currentPassword}</p>
					</div>
				{/if}
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
						onblur={() => handleBlur('newPassword')}
						oninput={() => touched.newPassword && validateField('newPassword')}
						class="form-input pl-10"
						class:border-red-300={touched.newPassword && errors.newPassword}
						class:focus:border-red-500={touched.newPassword && errors.newPassword}
						placeholder="Enter new password"
					/>
				</div>
				{#if touched.newPassword && errors.newPassword}
					<div class="flex items-center gap-1 mt-1">
						<AlertCircle class="h-3 w-3 text-red-500" />
						<p class="text-xs text-red-600">{errors.newPassword}</p>
					</div>
				{:else}
					<p class="text-xs mt-1" style="color: var(--text-tertiary);">
						Minimum 8 characters
					</p>
				{/if}
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
						onblur={() => handleBlur('confirmPassword')}
						oninput={() => touched.confirmPassword && validateField('confirmPassword')}
						class="form-input pl-10"
						class:border-red-300={touched.confirmPassword && errors.confirmPassword}
						class:focus:border-red-500={touched.confirmPassword && errors.confirmPassword}
						placeholder="Confirm new password"
					/>
				</div>
				{#if touched.confirmPassword && errors.confirmPassword}
					<div class="flex items-center gap-1 mt-1">
						<AlertCircle class="h-3 w-3 text-red-500" />
						<p class="text-xs text-red-600">{errors.confirmPassword}</p>
					</div>
				{/if}
			</div>

			<div class="flex justify-end pt-2">
				<button
					type="submit"
					disabled={passwordLoading}
					class="button-secondary button--gap"
				>
					{#if passwordLoading}
						<span class="flex items-center gap-2">
							<span class="w-4 h-4 border-2 border-gray-600 border-t-transparent rounded-full animate-spin"></span>
							Changing...
						</span>
					{:else}
						<Shield class="h-4 w-4" />
						Change Password
					{/if}
				</button>
			</div>
		</form>
	</div>
</div> 