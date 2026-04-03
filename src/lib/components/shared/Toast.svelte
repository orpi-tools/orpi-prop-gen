<script lang="ts">
	import { removeToast } from '$lib/stores/uiStore';

	interface Props {
		message: string;
		type?: 'success' | 'error' | 'info' | 'warning';
		id: string;
	}

	let { message, type = 'info', id }: Props = $props();

	const colors: Record<string, { bg: string; border: string; text: string; icon: string }> = {
		success: { bg: 'bg-green-50', border: 'border-green-200', text: 'text-green-800', icon: '✓' },
		error: { bg: 'bg-red-50', border: 'border-red-200', text: 'text-red-800', icon: '✕' },
		info: { bg: 'bg-blue-50', border: 'border-blue-200', text: 'text-blue-800', icon: 'ℹ' },
		warning: { bg: 'bg-yellow-50', border: 'border-yellow-200', text: 'text-yellow-800', icon: '⚠' }
	};

	const color = $derived(colors[type]);
</script>

<div
	class="{color.bg} {color.border} min-w-72 rounded-lg border p-4 shadow-lg !dark:border-gray-700 !dark:bg-gray-800"
	role="alert"
	aria-live="polite"
>
	<div class="flex items-start gap-3">
		<span class="{color.text} text-lg font-bold !dark:text-gray-50" aria-hidden="true">{color.icon}</span>
		<p class="{color.text} flex-1 text-sm !dark:text-gray-50">{message}</p>
		<button
			onclick={() => removeToast(id)}
			class="ml-2 text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-200"
			aria-label="Fermer la notification"
		>
			✕
		</button>
	</div>
</div>
