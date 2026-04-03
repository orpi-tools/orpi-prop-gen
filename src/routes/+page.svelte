<script lang="ts">
	import { goto } from '$app/navigation';
	import { fly } from 'svelte/transition';
	import { agencyStore } from '$lib/stores';
	import { addToast } from '$lib/stores/uiStore';
	import { propositionHelpers } from '$lib/db/helpers/propositionHelpers';
	import type { Proposition } from '$lib/types';
	import PropositionCard from '$lib/components/dashboard/PropositionCard.svelte';
	import EmptyState from '$lib/components/dashboard/EmptyState.svelte';
	import SearchBar from '$lib/components/dashboard/SearchBar.svelte';
	import StatusFilter from '$lib/components/dashboard/StatusFilter.svelte';
	import NoSearchResults from '$lib/components/dashboard/NoSearchResults.svelte';
	import ConfirmModal from '$lib/components/common/ConfirmModal.svelte';
	import ExportImportButtons from '$lib/components/dashboard/ExportImportButtons.svelte';
	import StatsPanel from '$lib/components/dashboard/StatsPanel.svelte';
	import ActivityChart from '$lib/components/dashboard/ActivityChart.svelte';
	import { exportImportHelpers } from '$lib/db/helpers/exportImportHelpers';
	import { statsHelpers, type AgencyStats, type MonthlyActivity } from '$lib/db/helpers/statsHelpers';

	// ─── State ────────────────────────────────────────────────────────────────────
	let propositions = $state<Proposition[]>([]);
	let isLoading = $state(true);
	let selectedId = $state<string | null>(null);
	let searchQuery = $state('');
	let statusFilter = $state<'all' | 'draft' | 'finalized'>('all');
	let isProcessing = $state(false);

	// ─── Stats state ─────────────────────────────────────────────────────────────
	let agencyStats = $state<AgencyStats>({ total: 0, thisMonth: 0, finalizedThisMonth: 0, finalizationRate: null });
	let monthlyActivity = $state<MonthlyActivity[]>([]);
	let statsLoading = $state(true);

	// ─── Confirm modal state ──────────────────────────────────────────────────────
	let confirmModal = $state<{
		open: boolean;
		title: string;
		message: string;
		confirmText: string;
		onConfirm: () => void;
	}>({ open: false, title: '', message: '', confirmText: 'OK', onConfirm: () => {} });

	// ─── Filtering logic (AC1, AC3-AC6) ──────────────────────────────────────────
	function filterPropositions(
		propositions: Proposition[],
		query: string,
		filter: 'all' | 'draft' | 'finalized'
	): Proposition[] {
		const normalized = query.toLowerCase().trim();
		return propositions.filter((p) => {
			// Status filter
			if (filter !== 'all' && p.status !== filter) return false;

			// Search filter (case-insensitive, null-safe)
			if (normalized) {
				const matches =
					p.bien?.proprietairePrenom?.toLowerCase?.().includes(normalized) ||
					p.bien?.adresse?.toLowerCase?.().includes(normalized) ||
					p.bien?.proprietaireEmail?.toLowerCase?.().includes(normalized);
				if (!matches) return false;
			}

			return true;
		});
	}

	let filteredPropositions = $derived(filterPropositions(propositions, searchQuery, statusFilter));

	// ─── Data loading ─────────────────────────────────────────────────────────────
	async function loadPropositions() {
		isLoading = true;
		const controller = new AbortController();
		const timeoutId = setTimeout(() => {
			controller.abort();
		}, 5000);

		try {
			const all = await propositionHelpers.getAll({ limit: 50 });
			clearTimeout(timeoutId);
			const agencyId = $agencyStore?.id?.trim();
			if (!agencyId) {
				console.warn('[Dashboard] No active agency');
				propositions = [];
				addToast({ message: 'Aucune agence sélectionnée', type: 'warning' });
				return;
			}
			propositions = all.filter((p) => p.agencyId === agencyId);
		} catch (error) {
			clearTimeout(timeoutId);
			console.error('[Dashboard] Failed to load propositions:', error);
			propositions = [];
			addToast({ message: 'Erreur lors du chargement des propositions', type: 'error' });
		} finally {
			isLoading = false;
		}
	}

	// Reload when agency changes
	$effect(() => {
		if ($agencyStore?.id) {
			loadPropositions();
			loadStats();
		}
	});

	async function loadStats() {
		// Capture agencyId before async to prevent race condition
		const agencyId = $agencyStore?.id?.trim();
		if (!agencyId) return;
		statsLoading = true;
		try {
			const [stats, activity] = await Promise.all([
				statsHelpers.getStats(agencyId),
				statsHelpers.getMonthlyActivity(agencyId, 6)
			]);
			// Only update if still same agency (prevent race condition)
			if (agencyId === $agencyStore?.id?.trim()) {
				agencyStats = stats;
				monthlyActivity = activity;
			}
		} catch (error) {
			console.error('[Dashboard] Failed to load stats:', error);
			addToast({ message: 'Erreur lors du chargement des statistiques', type: 'error' });
		} finally {
			statsLoading = false;
		}
	}

	// ─── Navigation ───────────────────────────────────────────────────────────────
	function handleCardClick(proposition: Proposition) {
		selectedId = proposition.id;
		goto(`/wizard/${proposition.id}`);
	}

	function handleNewProposal() {
		goto('/wizard/new');
	}

	// ─── Actions (AC7-AC9) ────────────────────────────────────────────────────────
	function handleOpen(proposition: Proposition) {
		goto(`/wizard/${proposition.id}`);
	}

	function handleDuplicate(proposition: Proposition) {
		if (isProcessing) return;
		confirmModal = {
			open: true,
			title: 'Dupliquer la proposition',
			message: `Dupliquer la proposition de ${proposition.bien?.proprietairePrenom || 'ce propriétaire'} ?`,
			confirmText: 'Dupliquer',
			onConfirm: async () => {
				if (isProcessing) return;
				isProcessing = true;
				confirmModal.open = false;
				try {
					await propositionHelpers.duplicate(proposition.id);
					await loadPropositions();
					addToast({ message: 'Proposition dupliquée', type: 'success' });
				} catch (error) {
					console.error('[Dashboard] Duplicate failed:', error);
					addToast({ message: 'Erreur lors de la duplication', type: 'error' });
				} finally {
					isProcessing = false;
				}
			}
		};
	}

	function handleDelete(proposition: Proposition) {
		if (isProcessing) return;
		confirmModal = {
			open: true,
			title: 'Supprimer la proposition',
			message: 'Êtes-vous sûr ? Cette action est irréversible.',
			confirmText: 'Supprimer',
			onConfirm: async () => {
				if (isProcessing) return;
				isProcessing = true;
				confirmModal.open = false;
				try {
					await propositionHelpers.delete(proposition.id);
					await loadPropositions();
					addToast({ message: 'Proposition supprimée', type: 'success' });
				} catch (error) {
					console.error('[Dashboard] Delete failed:', error);
					addToast({ message: 'Erreur lors de la suppression', type: 'error' });
				} finally {
					isProcessing = false;
				}
			}
		};
	}

	function closeModal() {
		confirmModal.open = false;
	}

	// ─── Export / Import (AC1-AC6) ────────────────────────────────────────────────
	async function handleExport() {
		if (isProcessing) return;
		isProcessing = true;
		try {
			const agencyId = $agencyStore?.id?.trim();
		if (!agencyId) {
			addToast({ message: 'Aucune agence sélectionnée', type: 'warning' });
			return;
		}
		const count = await exportImportHelpers.exportAll(agencyId);
			addToast({ message: `Export terminé — ${count} proposition(s)`, type: 'success' });
		} catch (error) {
			console.error('[Dashboard] Export failed:', error);
			addToast({ message: 'Erreur lors de l\'export', type: 'error' });
		} finally {
			isProcessing = false;
		}
	}

	async function handleImport(file: File) {
		if (isProcessing) return;
		isProcessing = true;
		try {
			const count = await exportImportHelpers.importFromFile(file);
			if (count === 0) {
				addToast({ message: 'Aucune proposition à importer', type: 'info' });
			} else {
				addToast({ message: `${count} proposition(s) importée(s)`, type: 'success' });
				await loadPropositions();
			}
		} catch (error) {
			console.error('[Dashboard] Import failed:', error);
			addToast({ message: 'Fichier invalide — import annulé', type: 'error' });
		} finally {
			isProcessing = false;
		}
	}
</script>

{#if isLoading}
	<!-- Loading state -->
	<div class="flex items-center justify-center py-24">
		<svg class="h-8 w-8 animate-spin" style="color: var(--color-orpi-red, #e60000)" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
			<circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
			<path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
		</svg>
		<span class="ml-3 text-sm text-gray-400 dark:text-gray-500">Chargement...</span>
	</div>
{:else if propositions.length === 0}
	<!-- AC1: Empty state -->
	<EmptyState />
{:else}
	<!-- Split layout — list (60%) + detail panel (40%) -->
	<div class="dashboard-split h-full" data-testid="dashboard">
		<!-- Left panel: Proposition list (60%) -->
		<div class="flex flex-col overflow-hidden" data-testid="dashboard-list">
			<!-- Header -->
			<div class="border-b border-gray-100 px-6 py-4 dark:border-gray-700">
				<div class="flex items-center justify-between">
					<div>
						<h1 class="text-lg font-bold" style="color: var(--color-orpi-navy, #002c51)">
							Mes propositions
						</h1>
						<p class="text-xs text-gray-400 dark:text-gray-500">
							{filteredPropositions.length}/{propositions.length} proposition{propositions.length > 1 ? 's' : ''}
						</p>
					</div>
					<div class="flex items-center gap-2">
						<ExportImportButtons onExport={handleExport} onImport={handleImport} disabled={isProcessing} />
						<button
							type="button"
							onclick={handleNewProposal}
							class="rounded-lg px-4 py-2 text-sm font-semibold text-white transition-all hover:brightness-95 dark:hover:brightness-110"
							style="background-color: var(--color-orpi-red, #e60000)"
							data-testid="new-proposal-btn"
						>
							+ Nouvelle proposition
						</button>
					</div>
				</div>
				<!-- Search + Filter bar -->
				<div class="mt-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-3">
					<div class="flex-1">
						<SearchBar onSearch={(q) => (searchQuery = q)} />
					</div>
					<StatusFilter value={statusFilter} onChange={(f) => (statusFilter = f)} />
				</div>
			</div>

			<!-- Card list (scrollable) -->
			<div class="flex-1 space-y-3 overflow-y-auto p-4">
				{#if filteredPropositions.length === 0}
					{#if searchQuery}
						<NoSearchResults query={searchQuery} isContextual={false} />
					{:else if statusFilter !== 'all'}
						<NoSearchResults
							query={statusFilter === 'draft' ? 'Aucun brouillon' : 'Aucune proposition finalisée'}
							isContextual={true}
						/>
					{:else}
						<NoSearchResults query="aucun résultat" isContextual={true} />
					{/if}
				{:else}
					{#each filteredPropositions as proposition, i (proposition.id)}
						<div in:fly={{ y: 8, duration: 200, delay: Math.min(i * 50, 500) }}>
							<PropositionCard
								{proposition}
								selected={selectedId === proposition.id}
								onClick={() => handleCardClick(proposition)}
								onOpen={() => handleOpen(proposition)}
								onDuplicate={() => handleDuplicate(proposition)}
								onDelete={() => handleDelete(proposition)}
							/>
						</div>
					{/each}
				{/if}
			</div>
		</div>

		<!-- Right panel: Stats (40%) -->
		<div class="hidden border-l border-gray-100 overflow-y-auto p-6 md:flex md:flex-col dark:border-gray-700" data-testid="detail-panel">
			{#if statsLoading}
				<div class="flex flex-1 items-center justify-center">
					<svg class="h-6 w-6 animate-spin" style="color: var(--color-orpi-red, #e60000)" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
						<circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
						<path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
					</svg>
				</div>
			{:else}
				<h2 class="mb-4 text-base font-bold" style="color: var(--color-orpi-navy, #002c51)">Statistiques</h2>
				<StatsPanel stats={agencyStats} />
				<ActivityChart data={monthlyActivity} />
			{/if}
		</div>
	</div>
{/if}

<!-- Confirm modal -->
<ConfirmModal
	open={confirmModal.open}
	title={confirmModal.title}
	message={confirmModal.message}
	confirmText={confirmModal.confirmText}
	onConfirm={confirmModal.onConfirm}
	onCancel={closeModal}
/>

<style>
	/* Split layout */
	.dashboard-split {
		display: grid;
		grid-template-columns: 1fr;
	}

	@media (min-width: 768px) {
		.dashboard-split {
			grid-template-columns: 60fr 40fr;
		}
	}
</style>
