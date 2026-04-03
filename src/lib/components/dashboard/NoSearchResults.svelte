<script lang="ts">
	interface Props {
		query: string;
		isContextual?: boolean;
	}

	let { query, isContextual = false }: Props = $props();
</script>

<div class="flex flex-col items-center justify-center py-16 text-center" data-testid="no-search-results">
	<svg class="mb-3 h-10 w-10 text-gray-300 dark:text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
		<path stroke-linecap="round" stroke-linejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
	</svg>
	<p class="text-sm text-gray-500 dark:text-gray-400">
		{#if isContextual}
			<span class="font-medium" style="color: var(--color-orpi-navy, #002c51)">{query}</span>
		{:else}
			Aucun résultat pour '<span class="font-medium" style="color: var(--color-orpi-navy, #002c51)">{query}</span>'
		{/if}
	</p>
</div>
