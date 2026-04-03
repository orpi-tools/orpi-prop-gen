<script lang="ts">
	import type { Agency } from '$lib/types';
	import agencies from '$lib/assets/agencies.json';

	let { onSelect, disabled = false }: { onSelect: (agency: Agency) => void; disabled?: boolean } =
		$props();
</script>

<div class="mx-auto grid max-w-2xl grid-cols-2 gap-6">
	{#each agencies as agency (agency.id)}
		<button
			class="agency-card flex cursor-pointer flex-col items-center gap-4 rounded-xl border border-gray-200 bg-white p-6 shadow-sm transition-colors duration-150 hover:border-[var(--color-orpi-red)] hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-700 dark:bg-gray-800 dark:hover:bg-gray-700"
			onclick={() => onSelect(agency as Agency)}
			{disabled}
		>
			<img
				src="/logos/{agency.logoFilename}"
				alt={agency.name}
				class="h-16 w-16 object-contain"
				onerror={(e) => {
					(e.currentTarget as HTMLImageElement).style.display = 'none';
				}}
			/>
			<div class="text-center">
				<h3 class="font-semibold text-gray-900 dark:text-gray-50">{agency.name}</h3>
				<p class="mt-1 text-sm text-gray-500 dark:text-gray-400">{agency.address}</p>
			</div>
		</button>
	{:else}
		<p class="col-span-2 text-center text-gray-500 dark:text-gray-400">Aucune agence disponible.</p>
	{/each}
</div>
