<script lang="ts">
	let {
		selected,
		onToggle
	}: {
		selected: string[];
		onToggle: (equipement: string) => void;
	} = $props();

	const equipements = [
		{ id: 'balcon', label: 'Balcon' },
		{ id: 'terrasse', label: 'Terrasse' },
		{ id: 'jardin', label: 'Jardin' },
		{ id: 'parking', label: 'Parking' },
		{ id: 'garage', label: 'Garage' },
		{ id: 'cave', label: 'Cave' },
		{ id: 'piscine', label: 'Piscine' },
		{ id: 'ascenseur', label: 'Ascenseur' },
		{ id: 'gardien', label: 'Gardien' },
		{ id: 'digicode', label: 'Digicode' },
		{ id: 'interphone', label: 'Interphone' },
		{ id: 'cuisine-equipee', label: 'Cuisine équipée' },
		{ id: 'double-vitrage', label: 'Double vitrage' },
		{ id: 'lumineux', label: 'Lumineux' },
		{ id: 'meuble', label: 'Meublé' }
	];
</script>

<div class="flex flex-wrap gap-2">
	{#each equipements as eq (eq.id)}
		<button
			type="button"
			onclick={() => onToggle(eq.id)}
			class="rounded-lg border px-3 py-2 text-sm font-medium transition-colors
				{selected.includes(eq.id)
				? 'border-[var(--color-orpi-red)] bg-[var(--color-orpi-red)] text-white'
				: 'border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-900 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'}"
		>
			{eq.label}
		</button>
	{/each}
</div>
