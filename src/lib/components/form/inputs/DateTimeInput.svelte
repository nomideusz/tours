<script lang="ts">
	interface Props {
		id: string;
		name: string;
		label: string;
		value?: string | Date;
		placeholder?: string;
		required?: boolean;
		disabled?: boolean;
		error?: string;
		hasError?: boolean;
		onblur?: () => void;
		min?: string;
		max?: string;
	}

	let {
		id,
		name,
		label,
		value = $bindable(''),
		placeholder = '',
		required = false,
		disabled = false,
		error = '',
		hasError = false,
		onblur,
		min,
		max
	}: Props = $props();

	// Convert Date to datetime-local format
	function formatDateTimeLocal(date: string | Date | undefined): string {
		if (!date) return '';
		
		const d = typeof date === 'string' ? new Date(date) : date;
		if (isNaN(d.getTime())) return '';
		
		// Format as YYYY-MM-DDTHH:MM for datetime-local input
		const year = d.getFullYear();
		const month = String(d.getMonth() + 1).padStart(2, '0');
		const day = String(d.getDate()).padStart(2, '0');
		const hours = String(d.getHours()).padStart(2, '0');
		const minutes = String(d.getMinutes()).padStart(2, '0');
		
		return `${year}-${month}-${day}T${hours}:${minutes}`;
	}

	let displayValue = $derived(formatDateTimeLocal(value));

	function handleInput(event: Event) {
		const target = event.target as HTMLInputElement;
		value = target.value ? new Date(target.value).toISOString() : '';
	}
</script>

<div class="form-field">
	<label for={id} class="form-label">
		{label}
		{#if required}
			<span class="text-red-500">*</span>
		{/if}
	</label>
	
	<input
		type="datetime-local"
		{id}
		{name}
		value={displayValue}
		{placeholder}
		{required}
		{disabled}
		{min}
		{max}
		class="form-input {hasError ? 'error' : ''}"
		oninput={handleInput}
		onblur={onblur}
	/>
	
	{#if error}
		<p class="form-error">{error}</p>
	{/if}
</div> 