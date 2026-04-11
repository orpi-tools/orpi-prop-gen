<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { agencyHelpers } from '$lib/db/helpers/agencyHelpers';
	import { gestionnaireHelpers } from '$lib/db/helpers/gestionnaireHelpers';
	import { agencyStore } from '$lib/stores/agencyStore';
	import { userStore } from '$lib/stores/userStore';
	import { addToast } from '$lib/stores/uiStore';
	import AgencySelector from '$lib/components/onboarding/AgencySelector.svelte';
	import ProfileCreator from '$lib/components/onboarding/ProfileCreator.svelte';
	import ProfileSelector from '$lib/components/onboarding/ProfileSelector.svelte';
	import type { Agency, Gestionnaire } from '$lib/types';

	let currentStep = $state<'agency' | 'profile'>('agency');
	let isLoading = $state(false);
	let navigationError = $state<string | null>(null);
	let existingProfiles = $state<Gestionnaire[]>([]);
	let profileStep = $state<'select' | 'create'>('create');

	onMount(async () => {
		// L'onboarding commence TOUJOURS par le choix de l'agence (étape 'agency').
		// Si un utilisateur arrive ici alors qu'il a déjà un profil actif, on le
		// renvoie au dashboard.
		if ($agencyStore && $userStore) {
			try {
				// eslint-disable-next-line svelte/no-navigation-without-resolve
				await goto('/');
			} catch (navError) {
				console.error('[Onboarding] Navigation failed:', navError);
				navigationError = navError instanceof Error ? navError.message : 'Navigation failed';
			}
			return;
		}
		// Sinon on reste sur l'étape 'agency' (valeur initiale).
	});

	async function handleAgencySelect(agencyData: Agency) {
		isLoading = true;
		try {
			// Les agences sont seedées au démarrage — on récupère celle qui correspond
			let saved = await agencyHelpers.getById(agencyData.id);
			if (!saved) {
				// Sécurité : si jamais elle n'existe pas en DB (premier lancement avant seed), on la crée
				saved = await agencyHelpers.create(agencyData);
			}
			agencyStore.set(saved);

			try {
				existingProfiles = await gestionnaireHelpers.getByAgency(saved.id);
			} catch (profileError) {
				console.error('[Onboarding] Failed to load profiles:', profileError);
				existingProfiles = [];
			}

			profileStep = existingProfiles.length > 0 ? 'select' : 'create';
			currentStep = 'profile';
		} catch (error) {
			console.error('[Onboarding] Agency select failed:', error);
			const errorMessage =
				error instanceof Error ? error.message : "Erreur lors de la sélection de l'agence";
			addToast({ message: errorMessage, type: 'error' });
		} finally {
			isLoading = false;
		}
	}

	async function handleProfileSelect(gestionnaire: Gestionnaire) {
		userStore.set(gestionnaire);
		addToast({ message: `Bienvenue ${gestionnaire.firstName} !`, type: 'success' });
		try {
			// eslint-disable-next-line svelte/no-navigation-without-resolve
			await goto('/');
		} catch (navError) {
			console.error('[Onboarding] Navigation failed:', navError);
			addToast({ message: 'Erreur de navigation', type: 'error' });
		}
	}

	function handleSwitchToCreate() {
		profileStep = 'create';
	}

	async function handleProfileCreated(gestionnaire: Gestionnaire) {
		if (!gestionnaire || !gestionnaire.id) {
			console.error('[Onboarding] Invalid gestionnaire received');
			addToast({ message: 'Erreur: profil invalide', type: 'error' });
			return;
		}

		userStore.set(gestionnaire);
		addToast({ message: `Bienvenue ${gestionnaire.firstName} !`, type: 'success' });

		try {
			// eslint-disable-next-line svelte/no-navigation-without-resolve
			await goto('/');
		} catch (navError) {
			console.error('[Onboarding] Navigation to dashboard failed:', navError);
			const errorMessage = navError instanceof Error ? navError.message : 'Erreur de navigation';
			addToast({ message: errorMessage, type: 'error' });
		}
	}
</script>

<div class="flex min-h-full flex-col items-center justify-center py-12">
	{#if navigationError}
		<div class="w-full max-w-2xl text-center">
			<p class="mb-4 text-red-600">Erreur de navigation: {navigationError}</p>
			<button
				onclick={() => {
					navigationError = null;
				}}
				class="rounded-lg bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
			>
				Réessayer
			</button>
		</div>
	{:else if currentStep === 'agency'}
		<div class="w-full max-w-2xl">
			<h1 class="mb-8 text-center text-3xl font-bold text-gray-900 dark:text-gray-50">
				Choisissez votre agence Orpi
			</h1>
			{#if isLoading}
				<div class="flex justify-center py-8">
					<span class="text-gray-500 dark:text-gray-400">Enregistrement en cours…</span>
				</div>
			{:else}
				<AgencySelector onSelect={handleAgencySelect} disabled={isLoading} />
			{/if}
		</div>
	{:else if currentStep === 'profile'}
		{#if $agencyStore}
			<div class="w-full max-w-2xl">
				{#if profileStep === 'select'}
					<h1 class="mb-8 text-center text-3xl font-bold text-gray-900 dark:text-gray-50">Choisissez votre profil</h1>
					<ProfileSelector
						gestionnaires={existingProfiles}
						onSelect={handleProfileSelect}
						onCreateNew={handleSwitchToCreate}
					/>
				{:else}
					<h1 class="mb-8 text-center text-3xl font-bold text-gray-900 dark:text-gray-50">Créez votre profil</h1>
					<ProfileCreator agencyId={$agencyStore.id} onCreated={handleProfileCreated} />
				{/if}
			</div>
		{:else}
			<div class="w-full max-w-2xl text-center">
				<p class="mb-4 text-gray-600 dark:text-gray-400">Erreur: agence non trouvée. Veuillez recommencer.</p>
				<button
					onclick={() => {
						currentStep = 'agency';
					}}
					class="rounded-lg bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
				>
					Retour à la sélection d'agence
				</button>
			</div>
		{/if}
	{/if}
</div>
