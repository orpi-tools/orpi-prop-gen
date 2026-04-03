<script lang="ts">
	import { TMI_RATES } from '$lib/types';
	import type { TmiRate } from '$lib/types';

	interface Props {
		selected: TmiRate;
		onSelect: (tmi: TmiRate) => void;
	}

	let { selected, onSelect }: Props = $props();
</script>

<div class="space-y-2" role="group" aria-label="Tranche marginale d'imposition (TMI)">
	<p class="mb-1 text-sm font-medium text-gray-700 dark:text-gray-300">Tranche marginale d'imposition (TMI)</p>
	<div class="flex gap-2">
		{#each TMI_RATES as rate (rate)}
			<button
				type="button"
				onclick={() => onSelect(rate)}
				class="flex-1 rounded-lg border-2 px-3 py-2.5 text-center text-sm font-semibold transition-colors
					{selected === rate
					? 'border-[var(--color-orpi-red)] bg-[var(--color-orpi-red)] text-white'
					: 'border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:border-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'}"
			>
				{rate}%
			</button>
		{/each}
	</div>
</div>
