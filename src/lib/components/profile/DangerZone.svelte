<script lang="ts">
	import Trash2 from 'lucide-svelte/icons/trash-2';
	import Download from 'lucide-svelte/icons/download';
	import AlertTriangle from 'lucide-svelte/icons/alert-triangle';
	import type { AuthUser } from '$lib/stores/auth.js';

	let {
		user,
		onDelete
	}: {
		user: AuthUser | null;
		onDelete: (password: string) => Promise<void>;
	} = $props();

	let showDeleteModal = $state(false);
	let deletePassword = $state('');
	let deleteError = $state('');
	let isDeleting = $state(false);
	let exportingData = $state(false);

	async function exportData() {
		if (exportingData) return;

		try {
			exportingData = true;
			const response = await fetch('/api/profile/export');
			
			if (!response.ok) {
				throw new Error('Failed to export data');
			}

			// Get filename from Content-Disposition header
			const contentDisposition = response.headers.get('Content-Disposition');
			const filenameMatch = contentDisposition?.match(/filename="(.+)"/);
			const filename = filenameMatch ? filenameMatch[1] : 'zaur-export.json';

			// Download the file
			const blob = await response.blob();
			const url = window.URL.createObjectURL(blob);
			const a = document.createElement('a');
			a.href = url;
			a.download = filename;
			document.body.appendChild(a);
			a.click();
			document.body.removeChild(a);
			window.URL.revokeObjectURL(url);
		} catch (error) {
			console.error('Export error:', error);
			alert('Failed to export data. Please try again.');
		} finally {
			exportingData = false;
		}
	}

	async function confirmDelete() {
		// Check if user has password (non-OAuth user)
		const hasPassword = user && !user.avatar?.startsWith('http');
		
		if (!deletePassword && hasPassword) {
			deleteError = 'Password is required';
			return;
		}

		try {
			isDeleting = true;
			deleteError = '';
			await onDelete(deletePassword);
		} catch (error) {
			deleteError = error instanceof Error ? error.message : 'Failed to delete account';
			isDeleting = false;
		}
	}

	function openDeleteModal() {
		showDeleteModal = true;
		deletePassword = '';
		deleteError = '';
	}
</script>

<div class="rounded-xl" style="background: var(--bg-primary); border: 1px solid var(--color-danger-200);">
	<div class="p-6 border-b" style="border-color: var(--color-danger-200);">
		<div class="flex items-center gap-2">
			<AlertTriangle class="h-5 w-5" style="color: var(--color-danger-400);" />
			<h2 class="text-lg font-semibold" style="color: var(--color-danger-400);">Danger Zone</h2>
		</div>
	</div>
	
	<div class="p-6 space-y-4">
		<!-- Export Data -->
		<div class="flex items-center justify-between p-4 rounded-lg" style="border: 1px solid var(--border-primary);">
			<div>
				<h3 class="font-medium" style="color: var(--text-primary);">Export Your Data</h3>
				<p class="text-sm mt-1" style="color: var(--text-secondary);">
					Download all your data including tours, bookings, and settings
				</p>
			</div>
			<button 
				onclick={exportData}
				disabled={exportingData}
				class="button-secondary button--gap"
			>
				<Download class="h-4 w-4" />
				{exportingData ? 'Exporting...' : 'Export Data'}
			</button>
		</div>

		<!-- Delete Account -->
		<div class="flex items-center justify-between p-4 rounded-lg" style="border: 1px solid var(--color-danger-200); background: var(--color-danger-50);">
			<div>
				<h3 class="font-medium" style="color: var(--color-danger-900);">Delete Account</h3>
				<p class="text-sm mt-1" style="color: var(--color-danger-700);">
					Permanently delete your account and all associated data
				</p>
			</div>
			<button 
				onclick={openDeleteModal}
				class="button-danger button--gap"
			>
				<Trash2 class="h-4 w-4" />
				Delete Account
			</button>
		</div>

		<!-- Information -->
		<div class="p-4 rounded-lg" style="background: var(--color-warning-50); border: 1px solid var(--color-warning-200);">
			<p class="text-sm" style="color: var(--color-warning-800);">
				<strong>Before deleting your account:</strong>
			</p>
			<ul class="text-sm mt-2 space-y-1 list-disc list-inside" style="color: var(--color-warning-700);">
				<li>Export your data for your records</li>
				<li>Cancel or complete all upcoming bookings</li>
				<li>Withdraw any pending payments</li>
				<li>Your account can be recovered within 30 days</li>
			</ul>
		</div>
	</div>
</div>

<!-- Delete Confirmation Modal -->
{#if showDeleteModal}
	<div class="fixed inset-0 flex items-center justify-center p-4" style="z-index: 50; background: rgba(0, 0, 0, 0.5);">
		<div class="relative w-full max-w-md rounded-xl shadow-lg p-6" style="background: var(--bg-primary); border: 1px solid var(--border-primary);">
			<!-- Header -->
			<div class="flex items-start gap-4 mb-4">
				<div class="flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center" style="background: var(--color-danger-100);">
					<Trash2 class="h-5 w-5" style="color: var(--color-danger-600);" />
				</div>
				<div class="flex-1">
					<h3 class="text-lg font-semibold" style="color: var(--text-primary);">Delete Your Account?</h3>
					<p class="text-sm mt-1" style="color: var(--text-secondary);">
						This action cannot be undone. Your account and all associated data will be permanently deleted after 30 days.
					</p>
				</div>
			</div>

			<!-- Password confirmation for non-OAuth users -->
			{#if user && !user.avatar?.startsWith('http')}
				<div class="mb-4">
					<label for="delete-password" class="form-label">
						Confirm your password to continue
					</label>
					<input
						type="password"
						id="delete-password"
						bind:value={deletePassword}
						class="form-input"
						placeholder="Enter your password"
						disabled={isDeleting}
					/>
					{#if deleteError}
						<p class="text-sm text-red-600 mt-2">{deleteError}</p>
					{/if}
				</div>
			{/if}
			
			<!-- Warning box -->
			<div class="mb-6 p-3 rounded-lg" style="background: var(--color-danger-50); border: 1px solid var(--color-danger-200);">
				<p class="text-sm font-medium" style="color: var(--color-danger-900);">
					This will immediately:
				</p>
				<ul class="text-sm mt-1 list-disc list-inside" style="color: var(--color-danger-700);">
					<li>Deactivate all your tours</li>
					<li>Cancel future bookings</li>
					<li>Close your payment account</li>
					<li>Delete your personal information</li>
				</ul>
			</div>

			<!-- Actions -->
			<div class="flex gap-3">
				<button 
					onclick={() => {
						showDeleteModal = false;
						deletePassword = '';
						deleteError = '';
					}}
					class="button-secondary flex-1"
					disabled={isDeleting}
				>
					Cancel
				</button>
				<button 
					onclick={confirmDelete}
					class="button-danger flex-1"
					disabled={isDeleting}
				>
					{isDeleting ? "Deleting..." : "Yes, Delete My Account"}
				</button>
			</div>
		</div>
	</div>
{/if} 