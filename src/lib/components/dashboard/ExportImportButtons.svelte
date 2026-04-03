<script lang="ts">
	interface Props {
		onExport: () => void | Promise<void>;
		onImport: (file: File) => void | Promise<void>;
		disabled?: boolean;
	}

	let { onExport, onImport, disabled = false }: Props = $props();

	let fileInput = $state<HTMLInputElement | undefined>(undefined);

	function triggerImport() {
		fileInput?.click();
	}

	function handleFileSelected(event: Event) {
		if (!(event.target instanceof HTMLInputElement)) return;
		const file = event.target.files?.[0];
		if (!file) return;
		onImport(file);
		event.target.value = '';
	}
</script>

<div class="flex flex-col gap-2 sm:flex-row" data-testid="export-import-buttons">
	<button
		type="button"
		onclick={onExport}
		{disabled}
		class="flex items-center gap-1.5 rounded-lg border border-gray-200 px-3 py-2 text-xs font-medium text-gray-600 transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-600 dark:text-gray-400 dark:hover:bg-gray-700"
		data-testid="export-btn"
	>
		<svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
			<path stroke-linecap="round" stroke-linejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
		</svg>
		Exporter
	</button>
	<button
		type="button"
		onclick={triggerImport}
		{disabled}
		class="flex items-center gap-1.5 rounded-lg border border-gray-200 px-3 py-2 text-xs font-medium text-gray-600 transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-600 dark:text-gray-400 dark:hover:bg-gray-700"
		data-testid="import-btn"
	>
		<svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
			<path stroke-linecap="round" stroke-linejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
		</svg>
		Importer
	</button>
	<input
		type="file"
		accept=".json"
		class="hidden"
		onchange={handleFileSelected}
		bind:this={fileInput}
		data-testid="import-file-input"
	/>
</div>
