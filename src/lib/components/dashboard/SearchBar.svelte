<script lang="ts">
	interface Props {
		onSearch: (query: string) => void;
	}

	let { onSearch }: Props = $props();

	let inputValue = $state('');
	let debounceTimer: ReturnType<typeof setTimeout> | undefined;

	function handleInput(event: Event) {
		if (!(event.target instanceof HTMLInputElement)) return;
		const target = event.target as HTMLInputElement;
		inputValue = target.value;

		clearTimeout(debounceTimer);
		debounceTimer = setTimeout(() => {
			onSearch(inputValue);
		}, 300);
	}
</script>

<div class="relative" data-testid="search-bar">
	<svg
		class="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400"
		fill="none"
		viewBox="0 0 24 24"
		stroke="currentColor"
		stroke-width="2"
	>
		<path stroke-linecap="round" stroke-linejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
	</svg>
	<input
		type="text"
		placeholder="Rechercher par nom, adresse, email..."
		value={inputValue}
		oninput={handleInput}
		class="w-full rounded-lg border border-gray-200 bg-white py-2 pl-10 pr-4 text-sm transition-colors focus:border-transparent focus:outline-none focus:ring-2 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-50 dark:placeholder-gray-500"
		style="--tw-ring-color: var(--color-orpi-red, #e60000)"
		data-testid="search-input"
	/>
</div>
