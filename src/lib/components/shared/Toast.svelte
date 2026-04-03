<script lang="ts">
	import { removeToast } from '$lib/stores/uiStore';

	interface Props {
		message: string;
		type?: 'success' | 'error' | 'info' | 'warning';
		id: string;
	}

	let { message, type = 'info', id }: Props = $props();

	const styles: Record<string, { border: string; iconColor: string }> = {
		success: { border: 'border-l-green-600', iconColor: 'text-green-600' },
		error: { border: 'border-l-red-600', iconColor: 'text-red-600' },
		info: { border: 'border-l-[var(--color-orpi-navy)]', iconColor: 'text-[var(--color-orpi-navy)]' },
		warning: { border: 'border-l-yellow-500', iconColor: 'text-yellow-600' }
	};

	const style = $derived(styles[type] ?? styles.info);
</script>

<div
	class="flex min-w-72 max-w-sm items-start gap-3 rounded-lg border-l-4 bg-white px-4 py-3 shadow-lg dark:bg-gray-800 {style.border}"
	role="alert"
	aria-live={type === 'error' ? 'assertive' : 'polite'}
>
	<!-- Icon -->
	<span class="mt-0.5 shrink-0 {style.iconColor}" aria-hidden="true">
		{#if type === 'success'}
			<svg class="h-4 w-4" fill="none" viewBox="0 0 16 16" stroke="currentColor" stroke-width="2">
				<path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" />
			</svg>
		{:else if type === 'error'}
			<svg class="h-4 w-4" fill="none" viewBox="0 0 16 16" stroke="currentColor" stroke-width="2">
				<path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
			</svg>
		{:else if type === 'info'}
			<svg class="h-4 w-4" fill="none" viewBox="0 0 16 16" stroke="currentColor" stroke-width="2">
				<circle cx="12" cy="12" r="10" />
				<path stroke-linecap="round" d="M12 16v-4M12 8h.01" />
			</svg>
		{:else}
			<svg class="h-4 w-4" fill="none" viewBox="0 0 16 16" stroke="currentColor" stroke-width="2">
				<path stroke-linecap="round" stroke-linejoin="round" d="M12 9v2m0 4h.01M10.29 3.86l-8.6 14.86A1 1 0 002.56 20h18.88a1 1 0 00.87-1.28l-8.6-14.86a1 1 0 00-1.74 0z" />
			</svg>
		{/if}
	</span>

	<!-- Message -->
	<p class="flex-1 text-sm text-gray-800 dark:text-gray-50">{message}</p>

	<!-- Close button -->
	<button
		onclick={() => removeToast(id)}
		class="shrink-0 text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-200"
		aria-label="Fermer la notification"
	>
		<svg class="h-4 w-4" fill="none" viewBox="0 0 16 16" stroke="currentColor" stroke-width="2">
			<path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
		</svg>
	</button>
</div>
