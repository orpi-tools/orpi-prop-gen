<script lang="ts">
	interface Props {
		open: boolean;
		title: string;
		message: string;
		confirmText?: string;
		cancelText?: string;
		onConfirm: () => void;
		onCancel: () => void;
	}

	let {
		open,
		title,
		message,
		confirmText = 'OK',
		cancelText = 'Annuler',
		onConfirm,
		onCancel
	}: Props = $props();

	function handleKeydown(event: KeyboardEvent) {
		if (event.key === 'Escape') {
			onCancel();
		} else if (event.key === 'Enter') {
			event.preventDefault();
			handleConfirm();
		}
	}

	function handleConfirm() {
		try {
			onConfirm();
		} catch (e) {
			console.error('[ConfirmModal] onConfirm error:', e);
		}
	}

	function handleCancelSafe() {
		try {
			onCancel();
		} catch (e) {
			console.error('[ConfirmModal] onCancel error:', e);
		}
	}

	let confirmBtnRef = $state<HTMLButtonElement | undefined>(undefined);

	$effect(() => {
		if (open && confirmBtnRef) {
			// Defer focus to next tick to ensure modal is rendered
			setTimeout(() => confirmBtnRef?.focus(), 0);
		}
	});
</script>

{#if open}
	<!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
	<!-- svelte-ignore a11y_interactive_supports_focus -->
	<div
		class="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
		role="dialog"
		aria-modal="true"
		aria-labelledby="confirm-title"
		onkeydown={handleKeydown}
		data-testid="confirm-modal"
	>
		<!-- Backdrop click to cancel -->
		<button
			type="button"
			class="absolute inset-0"
			onclick={handleCancelSafe}
			aria-label="Fermer"
			tabindex={-1}
		></button>

		<!-- Modal content -->
		<div class="relative z-10 mx-4 w-full max-w-sm rounded-xl bg-white p-6 shadow-xl dark:bg-gray-800">
			<h2 id="confirm-title" class="text-base font-bold" style="color: var(--color-orpi-navy, #002c51)">
				{title}
			</h2>
			<p class="mt-2 text-sm text-gray-600 dark:text-gray-400">{message}</p>

			<div class="mt-6 flex justify-end gap-3">
				<button
					type="button"
					onclick={handleCancelSafe}
					class="rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-50 dark:border-gray-600 dark:text-gray-400 dark:hover:bg-gray-700"
					data-testid="confirm-cancel"
				>
					{cancelText}
				</button>
				<button
					type="button"
					onclick={handleConfirm}
					class="rounded-lg px-4 py-2 text-sm font-semibold text-white transition-opacity hover:opacity-90"
					style="background-color: var(--color-orpi-red, #e60000)"
					data-testid="confirm-ok"
					bind:this={confirmBtnRef}
				>
					{confirmText}
				</button>
			</div>
		</div>
	</div>
{/if}
