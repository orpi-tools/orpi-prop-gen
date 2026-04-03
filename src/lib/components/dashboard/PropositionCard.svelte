<script lang="ts">
	import type { Proposition } from '$lib/types';
	import { PropositionStatus } from '$lib/types';
	import PropositionCardMenu from './PropositionCardMenu.svelte';

	interface Props {
		proposition: Proposition;
		onClick: () => void;
		selected?: boolean;
		onOpen?: () => void;
		onDuplicate?: () => void;
		onDelete?: () => void;
	}

	let { proposition, onClick, selected = false, onOpen, onDuplicate, onDelete }: Props = $props();

	// ─── Formatters (Task 5) ──────────────────────────────────────────────────
	const dateFormatter = new Intl.DateTimeFormat('fr-FR', {
		year: 'numeric',
		month: 'short',
		day: 'numeric'
	});

	const currencyFormatter = new Intl.NumberFormat('fr-FR', {
		style: 'currency',
		currency: 'EUR',
		minimumFractionDigits: 0,
		maximumFractionDigits: 0
	});

	let formattedDate = $derived(
		proposition.createdAt ? dateFormatter.format(new Date(proposition.createdAt)) : '—'
	);

	let formattedLoyer = $derived(
		proposition.bien?.loyerHC != null && proposition.bien.loyerHC > 0
			? `${currencyFormatter.format(proposition.bien.loyerHC)}/mois`
			: '—'
	);

	let adresse = $derived(proposition.bien?.adresse || 'Adresse non renseignée');
	let ownerName = $derived(proposition.bien?.proprietairePrenom || 'Propriétaire');
	let isDraft = $derived(proposition.status === PropositionStatus.Draft);
</script>

<button
	type="button"
	onclick={onClick}
	class="w-full cursor-pointer rounded-xl border bg-white p-4 text-left shadow-sm transition-all hover:shadow-md dark:bg-gray-800 dark:border-gray-700"
	style={selected
		? `border-color: var(--color-orpi-red, #e60000); box-shadow: 0 0 0 1px var(--color-orpi-red, #e60000);`
		: `border-color: rgb(243, 244, 246);`}
	data-testid="proposition-card"
>
	<!-- Top row: address + badge + menu -->
	<div class="flex items-start justify-between gap-2">
		<h3 class="min-w-0 flex-1 text-sm font-semibold leading-tight" style="color: var(--color-orpi-navy, #002c51)">
			{adresse}
		</h3>
		<div class="flex shrink-0 items-center gap-1.5">
			<span
				class="rounded-full px-2.5 py-0.5 text-xs font-medium"
				style={isDraft
					? `background-color: #9CA3AF; color: white;`
					: `background-color: #22C55E; color: white;`}
				data-testid="status-badge"
			>
				{isDraft ? 'Brouillon' : 'Finalisée'}
			</span>
			{#if onOpen && onDuplicate && onDelete}
				<PropositionCardMenu {onOpen} {onDuplicate} {onDelete} />
			{/if}
		</div>
	</div>

	<!-- Bottom row: meta info -->
	<div class="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-gray-500 dark:text-gray-400">
		<span>{ownerName}</span>
		<span>{formattedDate}</span>
		<span class="font-medium" style="color: var(--color-orpi-navy, #002c51)">{formattedLoyer}</span>
	</div>
</button>
