<script lang="ts">
	import type { PageData } from './$types';
	import WizardLayout from '$lib/components/wizard/WizardLayout.svelte';
	import { proposalStore } from '$lib/stores/proposalStore';
	import { agencyStore, userStore, addToast } from '$lib/stores';
	import { propositionHelpers } from '$lib/db/helpers/propositionHelpers';
	import { PropositionStatus } from '$lib/types';
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';

	let { data }: { data: PageData } = $props();
	let isLoading = $state(true);

	onMount(async () => {
		try {
			if (data.id === 'new') {
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
			} else {
				const existing = await propositionHelpers.getById(data.id);
				if (existing) {
					proposalStore.set(existing);
				} else {
					addToast({ message: 'Proposition introuvable', type: 'error' });
					// eslint-disable-next-line svelte/no-navigation-without-resolve
					await goto('/');
					return;
				}
			}
		} catch (error) {
			console.error('[Wizard] Failed to initialize proposition:', error);
			addToast({ message: 'Erreur de chargement', type: 'error' });
		} finally {
			isLoading = false;
		}
	});
</script>

{#if isLoading}
	<div class="flex h-full items-center justify-center">
		<span class="text-sm text-gray-400">Chargement...</span>
	</div>
{:else}
	<WizardLayout />
{/if}
