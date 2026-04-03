<script lang="ts">
	import { goto } from '$app/navigation';
	import { userStore } from '$lib/stores';

	function handleNewProposal() {
		goto('/wizard/new');
	}
</script>

<div class="flex flex-col items-center justify-center py-24 text-center" data-testid="empty-state">
	<!-- House illustration -->
	<svg
		class="mb-6 h-24 w-24 text-gray-300 dark:text-gray-600"
		fill="none"
		viewBox="0 0 80 80"
		stroke="currentColor"
		stroke-width="1.5"
	>
		<path stroke-linecap="round" stroke-linejoin="round" d="M10 38L40 14L70 38" />
		<path stroke-linecap="round" stroke-linejoin="round" d="M18 35V62H62V35" />
		<rect x="32" y="44" width="16" height="18" rx="1" stroke-linecap="round" />
		<circle cx="62" cy="20" r="2" fill="currentColor" class="text-[var(--color-orpi-red,#e60000)]" />
		<path
			d="M62 14V16M62 24V26M56 20H58M66 20H68"
			stroke="currentColor"
			stroke-width="1.5"
			stroke-linecap="round"
			class="text-[var(--color-orpi-red,#e60000)]"
		/>
	</svg>

	<h2 class="mb-2 text-xl font-semibold" style="color: var(--color-orpi-navy, #002c51)">
		Bienvenue {$userStore?.firstName ? `${$userStore.firstName}.` : 'Gestionnaire.'}.
	</h2>
	<p class="mb-8 text-gray-500 dark:text-gray-400">Aucune proposition. Créez la première !</p>

	<button
		type="button"
		onclick={handleNewProposal}
		class="rounded-xl px-6 py-3 font-semibold text-white transition-opacity hover:opacity-90"
		style="background-color: var(--color-orpi-red, #e60000)"
		data-testid="new-proposal-cta"
	>
		Nouvelle proposition
	</button>
</div>
