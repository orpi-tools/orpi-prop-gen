<script lang="ts">
	import { proposalStore } from '$lib/stores/proposalStore';
	import { uiStore, addToast } from '$lib/stores/uiStore';
	import { generatePdf } from '$lib/utils/pdfGenerator';
	import { goto } from '$app/navigation';
	import { PropositionStatus } from '$lib/types';
	import { agencyStore, userStore } from '$lib/stores';
	import ConclusionRitual from '$lib/components/shared/ConclusionRitual.svelte';

	interface Props {
		onBack: () => void;
	}

	let { onBack }: Props = $props();

	let isPdfGenerating = $derived($uiStore.isPdfGenerating);
	let showConclusionRitual = $state(false);

	// ─── Derived data from store ───────────────────────────────────────────────
	let bien = $derived($proposalStore?.bien ?? {});
	let bigNumbers = $derived($proposalStore?.simulation?.bigNumbers ?? {
		loyerBrutAnnuel: 0,
		honorairesTTC: 0,
		primeGLI: 0,
		revenuNetTMI: 0
	});

	// ─── PDF page checklist (local state, not persisted) ───────────────────────
	const pdfPages = Object.freeze([
		'Couverture',
		'Présentation propriétaire',
		'Caractéristiques du bien',
		'Photos',
		'Gestion locative',
		'Simulation financière',
		'Présentation agence',
		'Garanties',
		'Description détaillée',
		'Processus',
		'Contacts'
	]);

	let pageChecks = $state(pdfPages.map(() => true));

	function togglePage(index: number) {
		if (index < 0 || index >= pdfPages.length) return;
		pageChecks[index] = !pageChecks[index];
	}

	// ─── PDF Generation ────────────────────────────────────────────────────────
	async function handleGenerate() {
		// Validate at least one page is selected
		if (!pageChecks.some(checked => checked)) {
			addToast({ message: 'Sélectionnez au moins une page pour la proposition', type: 'warning' });
			return;
		}

		try {
			await generatePdf([...pageChecks]);
			showConclusionRitual = true;
		} catch {
			// Error toast already handled by pdfGenerator
		}
	}

	// ─── Post-generation actions ───────────────────────────────────────────────
	function handleNewProposal() {
		showConclusionRitual = false; // Reset ritual state
		proposalStore.set({
			id: crypto.randomUUID(),
			agencyId: $agencyStore?.id ?? '',
			gestionnaireId: $userStore?.id ?? '',
			status: PropositionStatus.Draft,
			createdAt: Date.now(),
			updatedAt: Date.now(),
			bien: {
				proprietairePrenom: '',
				proprietaireNom: '',
				proprietaireEmail: '',
				rue: '',
				codePostal: '',
				ville: '',
				adresse: '',
				typeLogement: '',
				surface: 0,
				nbPieces: 0,
				loyerHC: 0,
				equipements: [],
				description: ''
			},
			simulation: {
				charges: 0,
				tauxGestion: $agencyStore?.tauxGestion ?? 7.8,
				tauxGLI: $agencyStore?.tauxGLI ?? 3.0,
				tmi: 30,
				honorairesLocation: 0,
				honorairesEtatLieux: 0,
				bigNumbers: {
					loyerBrutAnnuel: 0,
					honorairesTTC: 0,
					primeGLI: 0,
					revenuNetTMI: 0
				}
			}
		});
		goto('/wizard/new');
	}

	function handleBackToDashboard() {
		showConclusionRitual = false; // Reset ritual state
		goto('/');
	}

	// ─── Formatting ────────────────────────────────────────────────────────────
	function formatEuro(value: number): string {
		if (typeof value !== 'number' || !Number.isFinite(value)) {
			return '--';
		}
		return value.toLocaleString('fr-FR');
	}
</script>

{#if showConclusionRitual}
	<ConclusionRitual
		ownerFirstName={$proposalStore.bien?.proprietairePrenom ?? ''}
		ownerEmail={$proposalStore.bien?.proprietaireEmail ?? ''}
		onNewProposal={handleNewProposal}
		onBackToDashboard={handleBackToDashboard}
	/>
{:else}
<div class="relative space-y-6">
	<!-- PDF Generation Overlay -->
	{#if isPdfGenerating}
		<div class="absolute inset-0 z-10 flex flex-col items-center justify-center rounded-xl bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm">
			<svg class="h-10 w-10 animate-spin" style="color: var(--color-orpi-red)" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
				<circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
				<path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
			</svg>
			<p class="mt-3 text-sm font-medium" style="color: var(--color-orpi-navy)">Génération du PDF en cours...</p>
		</div>
	{/if}

	<!-- Section: Résumé du bien -->
	<section>
		<h3 class="mb-3 text-sm font-semibold tracking-wide text-gray-500 dark:text-gray-400 uppercase">Résumé du bien</h3>
		<div class="rounded-xl border border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-800 p-4 shadow-sm">
			<div class="space-y-2">
				{#if bien.typeLogement}
					<p class="text-sm">
						<span class="font-medium text-gray-500 dark:text-gray-400">Type :</span>
						<span class="ml-1" style="color: var(--color-orpi-navy)">{bien.typeLogement}</span>
					</p>
				{/if}
				{#if bien.adresse}
					<p class="text-sm">
						<span class="font-medium text-gray-500 dark:text-gray-400">Adresse :</span>
						<span class="ml-1" style="color: var(--color-orpi-navy)">{bien.adresse}</span>
					</p>
				{/if}
				<div class="flex gap-6">
					{#if bien.surface > 0}
						<p class="text-sm">
							<span class="font-medium text-gray-500 dark:text-gray-400">Surface :</span>
							<span class="ml-1" style="color: var(--color-orpi-navy)">{bien.surface} m²</span>
						</p>
					{/if}
					{#if bien.nbPieces > 0}
						<p class="text-sm">
							<span class="font-medium text-gray-500 dark:text-gray-400">Pièces :</span>
							<span class="ml-1" style="color: var(--color-orpi-navy)">{bien.nbPieces}</span>
						</p>
					{/if}
				</div>
				{#if bien.loyerHC > 0}
					<p class="text-sm">
						<span class="font-medium text-gray-500 dark:text-gray-400">Loyer HC :</span>
						<span class="ml-1 font-semibold" style="color: var(--color-orpi-navy)"
							>{formatEuro(bien.loyerHC)} €/mois</span
						>
					</p>
				{/if}
			</div>
		</div>
	</section>

	<!-- Section: Simulation financière (Big Numbers) -->
	<section>
		<h3 class="mb-3 text-sm font-semibold tracking-wide text-gray-500 dark:text-gray-400 uppercase">
			Simulation financière
		</h3>
		<div class="grid grid-cols-2 gap-3">
			<div class="rounded-xl border border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-800 p-3 shadow-sm">
				<p class="text-xs font-medium text-gray-500 dark:text-gray-400">Loyer brut annuel</p>
				<p class="mt-0.5 text-xl font-bold" style="color: var(--color-orpi-navy)">
					{formatEuro(bigNumbers.loyerBrutAnnuel)}
					<span class="text-xs font-normal text-gray-500 dark:text-gray-400">€/an</span>
				</p>
			</div>
			<div class="rounded-xl border border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-800 p-3 shadow-sm">
				<p class="text-xs font-medium text-gray-500 dark:text-gray-400">Honoraires TTC</p>
				<p class="mt-0.5 text-xl font-bold" style="color: var(--color-orpi-navy)">
					{formatEuro(bigNumbers.honorairesTTC)}
					<span class="text-xs font-normal text-gray-500 dark:text-gray-400">€/an</span>
				</p>
			</div>
			<div class="rounded-xl border border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-800 p-3 shadow-sm">
				<p class="text-xs font-medium text-gray-500 dark:text-gray-400">Prime GLI</p>
				<p class="mt-0.5 text-xl font-bold" style="color: var(--color-orpi-navy)">
					{formatEuro(bigNumbers.primeGLI)}
					<span class="text-xs font-normal text-gray-500 dark:text-gray-400">€/an</span>
				</p>
			</div>
			<div class="rounded-xl border border-[var(--color-orpi-red)]/20 bg-red-50/30 dark:bg-red-950/30 p-3 shadow-sm">
				<p class="text-xs font-medium text-gray-500 dark:text-gray-400">Revenu net après TMI</p>
				<p class="mt-0.5 text-xl font-bold" style="color: var(--color-orpi-red)">
					{formatEuro(bigNumbers.revenuNetTMI)}
					<span class="text-xs font-normal text-gray-500 dark:text-gray-400">€/an</span>
				</p>
			</div>
		</div>
	</section>

	<!-- Section: Checklist pages PDF -->
	<section>
		<h3 class="mb-3 text-sm font-semibold tracking-wide text-gray-500 dark:text-gray-400 uppercase">
			Pages de la proposition
		</h3>
		<div class="rounded-xl border border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-800 p-4 shadow-sm">
			<div class="grid grid-cols-2 gap-2">
				{#each pdfPages as page, i (page)}
					<label class="flex cursor-pointer items-center gap-2 rounded-lg p-1.5 hover:bg-gray-50 dark:hover:bg-gray-700">
						<input
							type="checkbox"
							checked={pageChecks[i]}
							onchange={() => togglePage(i)}
							class="h-4 w-4 rounded border-gray-300 dark:border-gray-600 accent-[var(--color-orpi-red)]"
						/>
						<span class="text-sm text-gray-700 dark:text-gray-300">
							{i + 1}. {page}
						</span>
					</label>
				{/each}
			</div>
		</div>
	</section>

	<!-- Actions -->
	<div class="space-y-3 pt-2">
		<button
			type="button"
			disabled={isPdfGenerating}
			onclick={handleGenerate}
			class="w-full rounded-xl px-8 py-4 text-lg font-bold text-white transition-all
				{isPdfGenerating
				? 'cursor-not-allowed bg-gray-400'
				: 'bg-[var(--color-orpi-red)] hover:brightness-95 dark:hover:brightness-110'}"
		>
			{isPdfGenerating ? 'Génération en cours...' : 'Générer la proposition'}
		</button>

		<button
			type="button"
			onclick={onBack}
			class="w-full rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-8 py-3 text-sm font-medium text-gray-700 dark:text-gray-300 transition-colors hover:bg-gray-50 dark:hover:bg-gray-700"
		>
			Retour
		</button>
	</div>
</div>
{/if}
