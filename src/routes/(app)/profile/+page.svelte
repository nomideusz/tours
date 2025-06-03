<script lang="ts">
	import { enhance } from '$app/forms';
	import { t, language } from '$lib/i18n.js';
	import Loader from 'lucide-svelte/icons/loader';
	import User from 'lucide-svelte/icons/user';
	import Lock from 'lucide-svelte/icons/lock';
	import Mail from 'lucide-svelte/icons/mail';
	import Shield from 'lucide-svelte/icons/shield';
	import PageHeader from '$lib/components/PageHeader.svelte';
	import LoadingSpinner from '$lib/components/LoadingSpinner.svelte';
	import ErrorAlert from '$lib/components/ErrorAlert.svelte';
	import Calendar from 'lucide-svelte/icons/calendar';
	import Save from 'lucide-svelte/icons/save';

	let { data, form } = $props();

	// Loading states
	let profileLoading = $state(false);
	let passwordLoading = $state(false);
	let verificationLoading = $state(false);

	// Form data
	let name = $state(data.user.name);
	let username = $state(data.user.username);
	let businessName = $state(data.user.businessName);
	let description = $state(data.user.description);
	let phone = $state(data.user.phone);
	let website = $state(data.user.website);

	// Password form data
	let currentPassword = $state('');
	let newPassword = $state('');
	let confirmPassword = $state('');

	// Reset password form on success
	$effect(() => {
		if (form?.success && form?.message?.includes('Password')) {
			currentPassword = '';
			newPassword = '';
			confirmPassword = '';
		}
	});

	let isSubmitting = $state(false);
</script>

<svelte:head>
	<title>Profile Settings - Zaur</title>
</svelte:head>

<div class="max-w-screen-2xl mx-auto px-6 sm:px-8 lg:px-12 py-8">
	<PageHeader 
		title="Profile Settings"
		subtitle="Manage your account information and preferences"
	/>

	<div class="max-w-2xl">
		<!-- Profile Form -->
		<div class="bg-white rounded-xl border border-gray-200 p-6">
			<div class="flex items-center gap-3 mb-6">
				<div class="p-2 bg-blue-50 rounded-lg">
					<User class="h-5 w-5 text-blue-600" />
				</div>
				<div>
					<h2 class="text-lg font-semibold text-gray-900">Personal Information</h2>
					<p class="text-sm text-gray-600">Update your profile details</p>
				</div>
			</div>

			{#if form?.error}
				<div class="mb-6">
					<ErrorAlert variant="error" message={form.error} />
				</div>
			{/if}

			{#if form?.success}
				<div class="mb-6">
					<ErrorAlert variant="info" title="Success" message="Profile updated successfully!" />
				</div>
			{/if}

			<form 
				method="POST" 
				action="?/updateProfile"
				use:enhance={() => {
					isSubmitting = true;
					return async ({ update }) => {
						await update();
						isSubmitting = false;
					};
				}}
			>
				<div class="space-y-6">
					<!-- Username -->
					<div>
						<label for="username" class="block text-sm font-medium text-gray-700 mb-2">
							Username
						</label>
						<div class="relative">
							<User class="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
							<input
								type="text"
								id="username" 
								name="username"
								value={data.user?.username || ''}
								class="form-input pl-10"
								placeholder="Enter your username"
								required
							/>
						</div>
					</div>

					<!-- Name -->
					<div>
						<label for="name" class="block text-sm font-medium text-gray-700 mb-2">
							Full Name
						</label>
						<div class="relative">
							<User class="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
							<input
								type="text"
								id="name"
								name="name" 
								value={data.user?.name || ''}
								class="form-input pl-10"
								placeholder="Enter your full name"
							/>
						</div>
					</div>

					<!-- Email -->
					<div>
						<label for="email" class="block text-sm font-medium text-gray-700 mb-2">
							Email Address
						</label>
						<div class="relative">
							<Mail class="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
							<input
								type="email"
								id="email"
								name="email"
								value={data.user?.email || ''}
								class="form-input pl-10"
								placeholder="Enter your email"
								required
							/>
						</div>
					</div>


				</div>

				<!-- Submit Button -->
				<div class="flex justify-end pt-6 border-t border-gray-200 mt-8">
					<button
						type="submit"
						disabled={isSubmitting}
						class="button-primary button--gap"
					>
						{#if isSubmitting}
							<LoadingSpinner size="small" variant="white" text="Saving..." />
						{:else}
							<Save class="h-4 w-4" />
							Save Changes
						{/if}
					</button>
				</div>
			</form>
		</div>
	</div>
</div> 