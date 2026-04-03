<script lang="ts">
	import { agencyStore, userStore, addToast } from '$lib/stores';
	import { agencyHelpers } from '$lib/db/helpers/agencyHelpers';
	import { gestionnaireHelpers } from '$lib/db/helpers/gestionnaireHelpers';
	import Avatar from '$lib/components/shared/Avatar.svelte';
	import type { Agency, Gestionnaire } from '$lib/types';
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';

	let gestionnaires = $state<Gestionnaire[]>([]);
	let isLoadingGestionnaires = $state(true);
	let isSaving = $state(false);
	let saveTimeoutId: ReturnType<typeof setTimeout> | null = null;

	// Editable fields — initialized from store
	let name = $state('');
	let address = $state('');
	let phone = $state('');
	let email = $state('');
	let tauxGestion = $state(7.8);
	let tauxGLI = $state(3.0);

	// Logo URL management
	let logoUrl = $state<string | null>(null);
	let logoFilename = $state<string | undefined>(undefined);

	// Photo agence URL management
	let photoAgenceUrl = $state<string | null>(null);

	$effect(() => {
		const agency = $agencyStore;
		if (agency?.logo) {
			const url = URL.createObjectURL(agency.logo);
			logoUrl = url;
			return () => URL.revokeObjectURL(url);
		} else {
			logoUrl = null;
		}
	});

	$effect(() => {
		const agency = $agencyStore;
		if (agency?.photoAgence) {
			const url = URL.createObjectURL(agency.photoAgence);
			photoAgenceUrl = url;
			return () => URL.revokeObjectURL(url);
		} else {
			photoAgenceUrl = null;
		}
	});

	async function handlePhotoAgence(e: Event) {
		const input = e.currentTarget as HTMLInputElement;
		const file = input.files?.[0];
		if (!file) return;
		const agency = $agencyStore;
		if (!agency) return;

		const blob = new Blob([await file.arrayBuffer()], { type: file.type });
		await agencyHelpers.update(agency.id, { photoAgence: blob });
		agencyStore.set({ ...agency, photoAgence: blob });
		addToast({ message: 'Photo agence sauvegardée', type: 'success' });
	}

	onMount(async () => {
		const agency = $agencyStore;
		if (!agency) {
			// eslint-disable-next-line svelte/no-navigation-without-resolve
			await goto('/onboarding');
			return;
		}

		name = agency.name;
		address = agency.address;
		phone = agency.phone;
		email = agency.email;
		tauxGestion = agency.tauxGestion;
		tauxGLI = agency.tauxGLI;
		logoFilename = agency.logoFilename;

		try {
			gestionnaires = await gestionnaireHelpers.getByAgency(agency.id);
		} catch (error) {
			console.error('[Settings] Failed to load gestionnaires:', error);
			addToast({ message: 'Erreur chargement des profils', type: 'error' });
		} finally {
			isLoadingGestionnaires = false;
		}
	});

	function scheduleAutoSave() {
		if (saveTimeoutId) clearTimeout(saveTimeoutId);
		saveTimeoutId = setTimeout(() => saveChanges(), 2000);
	}

	async function saveChanges() {
		const agency = $agencyStore;
		if (!agency || isSaving) return;
		isSaving = true;
		try {
			const changes: Partial<Omit<Agency, 'id'>> = {
				name: name.trim(),
				address: address.trim(),
				phone: phone.trim(),
				email: email.trim(),
				tauxGestion,
				tauxGLI
			};
			await agencyHelpers.update(agency.id, changes);
			agencyStore.set({ ...agency, ...changes });
			addToast({ message: 'Paramètres sauvegardés', type: 'success' });
		} catch (error) {
			console.error('[Settings] Save failed:', error);
			addToast({ message: 'Erreur lors de la sauvegarde', type: 'error' });
		} finally {
			isSaving = false;
		}
	}
</script>

<div class="mx-auto max-w-2xl space-y-6">
	<!-- Header with back button -->
	<div class="flex items-center gap-4">
		<a
			href="/"
			class="flex items-center gap-1 text-sm text-gray-500 transition-colors hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
		>
			<svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
				<path stroke-linecap="round" stroke-linejoin="round" d="M15 19l-7-7 7-7" />
			</svg>
			Retour
		</a>
		<h1 class="text-2xl font-bold text-gray-900 dark:text-gray-50">Paramètres Agence</h1>
	</div>

	<!-- Section: Informations agence -->
	<section class="rounded-xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800">
		<h2 class="mb-4 text-lg font-semibold text-gray-900 dark:text-gray-50">Informations agence</h2>

		<!-- Logo display -->
		<div class="mb-6 flex items-center gap-4">
			{#if logoUrl}
				<img
					src={logoUrl}
					alt="Logo {name}"
					class="h-16 w-16 rounded-lg border border-gray-200 object-contain"
				/>
			{:else if logoFilename}
				<img
					src="/logos/{logoFilename}"
					alt="Logo {name}"
					class="h-16 w-16 rounded-lg border border-gray-200 object-contain"
				/>
			{:else}
				<div
					class="flex h-16 w-16 items-center justify-center rounded-lg border border-gray-200 bg-gray-50 dark:border-gray-600 dark:bg-gray-700"
				>
					<span class="text-xs text-gray-400 dark:text-gray-500">Logo</span>
				</div>
			{/if}
			<div>
				<p class="text-sm font-medium text-gray-700 dark:text-gray-300">{name || 'Agence'}</p>
				<p class="text-xs text-gray-400">Logo en lecture seule</p>
			</div>
		</div>

		<!-- Photo agence -->
		<div class="mb-6 flex items-center gap-4">
			{#if photoAgenceUrl}
				<img
					src={photoAgenceUrl}
					alt="Façade agence"
					class="h-20 w-32 rounded-lg border border-gray-200 object-cover"
				/>
			{:else}
				<div
					class="flex h-20 w-32 items-center justify-center rounded-lg border border-dashed border-gray-300 bg-gray-50 dark:border-gray-600 dark:bg-gray-700"
				>
					<span class="text-xs text-gray-400 dark:text-gray-500">Photo agence</span>
				</div>
			{/if}
			<div>
				<label
					for="photo-agence-upload"
					class="cursor-pointer rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
				>
					{photoAgenceUrl ? 'Changer la photo' : 'Ajouter une photo'}
				</label>
				<input
					id="photo-agence-upload"
					type="file"
					accept="image/*"
					class="hidden"
					onchange={handlePhotoAgence}
				/>
				<p class="mt-1 text-xs text-gray-400">Photo de la vitrine / façade de l'agence</p>
			</div>
		</div>

		<div class="space-y-4">
			<div>
				<label for="agency-name" class="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
					Nom de l'agence
				</label>
				<input
					id="agency-name"
					type="text"
					bind:value={name}
					oninput={scheduleAutoSave}
					disabled={isSaving}
					class="w-full rounded-lg border border-gray-300 bg-white px-4 py-2 focus:border-[var(--color-orpi-red)] focus:ring-1 focus:ring-[var(--color-orpi-red)] focus:outline-none disabled:cursor-not-allowed disabled:bg-gray-100 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-50 dark:disabled:bg-gray-800"
				/>
			</div>

			<div>
				<label for="agency-address" class="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
					Adresse
				</label>
				<input
					id="agency-address"
					type="text"
					bind:value={address}
					oninput={scheduleAutoSave}
					disabled={isSaving}
					class="w-full rounded-lg border border-gray-300 bg-white px-4 py-2 focus:border-[var(--color-orpi-red)] focus:ring-1 focus:ring-[var(--color-orpi-red)] focus:outline-none disabled:cursor-not-allowed disabled:bg-gray-100 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-50 dark:disabled:bg-gray-800"
				/>
			</div>

			<div class="grid grid-cols-2 gap-4">
				<div>
					<label for="agency-phone" class="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
						Téléphone
					</label>
					<input
						id="agency-phone"
						type="tel"
						bind:value={phone}
						oninput={scheduleAutoSave}
						disabled={isSaving}
						class="w-full rounded-lg border border-gray-300 bg-white px-4 py-2 focus:border-[var(--color-orpi-red)] focus:ring-1 focus:ring-[var(--color-orpi-red)] focus:outline-none disabled:cursor-not-allowed disabled:bg-gray-100 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-50 dark:disabled:bg-gray-800"
					/>
				</div>
				<div>
					<label for="agency-email" class="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
						Email
					</label>
					<input
						id="agency-email"
						type="email"
						bind:value={email}
						oninput={scheduleAutoSave}
						disabled={isSaving}
						class="w-full rounded-lg border border-gray-300 bg-white px-4 py-2 focus:border-[var(--color-orpi-red)] focus:ring-1 focus:ring-[var(--color-orpi-red)] focus:outline-none disabled:cursor-not-allowed disabled:bg-gray-100 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-50 dark:disabled:bg-gray-800"
					/>
				</div>
			</div>
		</div>
	</section>

	<!-- Section: Taux par défaut -->
	<section class="rounded-xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800">
		<h2 class="mb-4 text-lg font-semibold text-gray-900 dark:text-gray-50">Taux par défaut</h2>
		<p class="mb-4 text-sm text-gray-500 dark:text-gray-400">
			Ces taux seront pré-remplis dans chaque nouveau simulateur financier.
		</p>

		<div class="grid grid-cols-2 gap-4">
			<div>
				<label for="taux-gestion" class="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
					Taux de gestion (%)
				</label>
				<input
					id="taux-gestion"
					type="number"
					step="0.1"
					min="0"
					max="100"
					bind:value={tauxGestion}
					oninput={scheduleAutoSave}
					disabled={isSaving}
					class="w-full rounded-lg border border-gray-300 bg-white px-4 py-2 focus:border-[var(--color-orpi-red)] focus:ring-1 focus:ring-[var(--color-orpi-red)] focus:outline-none disabled:cursor-not-allowed disabled:bg-gray-100 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-50 dark:disabled:bg-gray-800"
				/>
			</div>
			<div>
				<label for="taux-gli" class="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
					Taux GLI (%)
				</label>
				<input
					id="taux-gli"
					type="number"
					step="0.1"
					min="0"
					max="100"
					bind:value={tauxGLI}
					oninput={scheduleAutoSave}
					disabled={isSaving}
					class="w-full rounded-lg border border-gray-300 bg-white px-4 py-2 focus:border-[var(--color-orpi-red)] focus:ring-1 focus:ring-[var(--color-orpi-red)] focus:outline-none disabled:cursor-not-allowed disabled:bg-gray-100 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-50 dark:disabled:bg-gray-800"
				/>
			</div>
		</div>
	</section>

	<!-- Section: Profils gestionnaires -->
	<section class="rounded-xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800">
		<h2 class="mb-4 text-lg font-semibold text-gray-900 dark:text-gray-50">Profils gestionnaires</h2>

		{#if isLoadingGestionnaires}
			<div class="flex items-center justify-center py-8">
				<span class="text-sm text-gray-500">Chargement des profils...</span>
			</div>
		{:else if gestionnaires.length === 0}
			<p class="py-4 text-center text-sm text-gray-500">Aucun gestionnaire enregistré.</p>
		{:else}
			<div class="space-y-2">
				{#each gestionnaires as gestionnaire (gestionnaire.id)}
					<div
						class="flex items-center gap-4 rounded-lg px-4 py-3 transition-colors {gestionnaire.id ===
						$userStore?.id
							? 'border-l-4 border-[var(--color-orpi-red)] bg-red-50 dark:bg-red-950'
							: 'border-l-4 border-transparent hover:bg-gray-50 dark:hover:bg-gray-700'}"
					>
						<Avatar {gestionnaire} size="sm" />
						<div class="min-w-0 flex-1">
							<p class="truncate text-sm font-medium text-gray-900 dark:text-gray-50">
								{gestionnaire.firstName}
								{gestionnaire.lastName}
								{#if gestionnaire.id === $userStore?.id}
									<span class="ml-1 text-xs text-[var(--color-orpi-red)]">(actif)</span>
								{/if}
							</p>
							<div class="flex gap-4 text-xs text-gray-500 dark:text-gray-400">
								{#if gestionnaire.email}
									<span>{gestionnaire.email}</span>
								{/if}
								{#if gestionnaire.phone}
									<span>{gestionnaire.phone}</span>
								{/if}
							</div>
						</div>
					</div>
				{/each}
			</div>
		{/if}
	</section>
</div>
