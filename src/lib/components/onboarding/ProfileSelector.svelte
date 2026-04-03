<script lang="ts">
	import Avatar from '$lib/components/shared/Avatar.svelte';
	import type { Gestionnaire } from '$lib/types';

	let {
		gestionnaires,
		onSelect,
		onCreateNew
	}: {
		gestionnaires: Gestionnaire[];
		onSelect: (g: Gestionnaire) => void;
		onCreateNew: () => void;
	} = $props();

	let selectedId = $state<string | null>(null);

	async function handleSelect(g: Gestionnaire) {
		if (selectedId) return; // Empêcher double-clic
		selectedId = g.id;
		try {
			onSelect(g);
		} catch {
			selectedId = null;
		}
	}
</script>

<div class="flex flex-col gap-3">
	{#each gestionnaires as gestionnaire (gestionnaire.id)}
		<button
			onclick={() => handleSelect(gestionnaire)}
			disabled={selectedId !== null}
			class="flex items-center gap-4 rounded-xl border border-gray-200 bg-white p-4 shadow-sm
			       transition-all hover:border-[var(--color-orpi-red)] hover:shadow-md
			       disabled:cursor-not-allowed disabled:opacity-50
			       dark:border-gray-700 dark:bg-gray-800 dark:hover:bg-gray-700
			       {selectedId === gestionnaire.id ? 'border-[var(--color-orpi-red)] bg-red-50' : ''}"
		>
			<Avatar {gestionnaire} size="lg" />
			<div class="text-left">
				<p class="font-semibold text-gray-900 dark:text-gray-50">
					{gestionnaire.firstName}
					{gestionnaire.lastName}
				</p>
				{#if gestionnaire.email}
					<p class="text-sm text-gray-500 dark:text-gray-400">{gestionnaire.email}</p>
				{/if}
			</div>
			{#if selectedId === gestionnaire.id}
				<span class="ml-auto text-sm text-[var(--color-orpi-red)]">Connexion…</span>
			{/if}
		</button>
	{/each}

	<button
		onclick={onCreateNew}
		disabled={selectedId !== null}
		class="mt-2 w-full rounded-lg border border-[var(--color-orpi-red)] px-6 py-3
		       font-semibold text-[var(--color-orpi-red)] transition-colors hover:bg-red-50
		       disabled:cursor-not-allowed disabled:opacity-50
		       dark:hover:bg-gray-700"
	>
		+ Créer mon profil
	</button>
</div>
