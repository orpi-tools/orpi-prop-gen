<script lang="ts">
	import Avatar from '$lib/components/shared/Avatar.svelte';
	import { slide } from 'svelte/transition';
	import { userStore } from '$lib/stores/userStore';
	import { addToast } from '$lib/stores/uiStore';
	import { gestionnaireHelpers } from '$lib/db/helpers/gestionnaireHelpers';
	import { goto } from '$app/navigation';
	import type { Gestionnaire } from '$lib/types';

	let {
		currentUser,
		agencyId
	}: {
		currentUser: Gestionnaire | null;
		agencyId: string;
	} = $props();

	let isOpen = $state(false);
	let isLoading = $state(false);
	let isSwitching = $state<string | null>(null);
	let gestionnaires = $state<Gestionnaire[]>([]);
	let abortController: AbortController | null = null;

	async function loadGestionnaires() {
		abortController?.abort();
		abortController = new AbortController();
		isLoading = true;
		try {
			gestionnaires = await gestionnaireHelpers.getByAgency(agencyId);
		} catch (error) {
			if (error instanceof DOMException && error.name === 'AbortError') return;
			console.error('[ProfileSwitcher] Failed to load profiles:', error);
			addToast({ message: 'Erreur chargement des profils', type: 'error' });
		} finally {
			isLoading = false;
		}
	}

	async function toggleMenu() {
		if (isOpen) {
			isOpen = false;
			return;
		}
		if (isSwitching || isLoading) return;
		isOpen = true;
		await loadGestionnaires();
	}

	async function switchProfile(gestionnaire: Gestionnaire) {
		if (gestionnaire.id === currentUser?.id) {
			isOpen = false;
			return;
		}
		if (isSwitching) return;
		isSwitching = gestionnaire.id;
		try {
			userStore.set(gestionnaire);
			addToast({
				message: `Profil changé — Bienvenue ${gestionnaire.firstName}`,
				type: 'success'
			});
		} catch (error) {
			console.error('[ProfileSwitcher] Switch failed:', error);
			addToast({ message: 'Erreur changement de profil', type: 'error' });
		} finally {
			isSwitching = null;
			isOpen = false;
		}
	}

	$effect(() => {
		if (!isOpen) return;
		const handler = (event: PointerEvent) => {
			const target = event.target as HTMLElement;
			if (!target.closest('[data-profile-switcher]')) {
				isOpen = false;
			}
		};
		window.addEventListener('pointerdown', handler);
		return () => window.removeEventListener('pointerdown', handler);
	});
</script>

<div class="relative" data-profile-switcher>
	<!-- Trigger : badge cliquable -->
	<button
		onclick={toggleMenu}
		disabled={isSwitching !== null}
		class="flex items-center gap-2 rounded-lg px-2 py-1 transition-colors hover:bg-gray-100 dark:hover:bg-gray-700
				disabled:cursor-not-allowed disabled:opacity-50"
		aria-expanded={isOpen}
		aria-haspopup="listbox"
	>
		{#if currentUser}
			<Avatar gestionnaire={currentUser} size="sm" />
			<span class="text-sm font-medium text-gray-700 dark:text-gray-300">{currentUser.firstName}</span>
		{:else}
			<div class="flex h-8 w-8 items-center justify-center rounded-full bg-gray-200 text-xs text-gray-500 dark:bg-gray-700 dark:text-gray-400">?</div>
			<span class="text-sm font-medium text-gray-500 dark:text-gray-400">Sélectionner un profil</span>
		{/if}
		<svg
			class="h-4 w-4 text-gray-400 transition-transform {isOpen ? 'rotate-180' : ''}"
			fill="none"
			viewBox="0 0 24 24"
			stroke="currentColor"
			stroke-width="2"
		>
			<path d="M19 9l-7 7-7-7" />
		</svg>
	</button>

	<!-- Dropdown menu -->
	{#if isOpen}
		<div
			transition:slide={{ duration: 200 }}
			class="absolute top-full right-0 z-50 mt-2 w-64 rounded-xl border border-gray-200 bg-white py-2 shadow-lg dark:border-gray-700 dark:bg-gray-800"
			role="listbox"
			aria-label="Changer de profil"
		>
			{#if isLoading}
				<div class="flex items-center justify-center py-4">
					<span class="text-sm text-gray-500 dark:text-gray-400">Chargement...</span>
				</div>
			{:else if gestionnaires.length === 0}
				<div class="flex items-center justify-center py-4">
					<span class="text-sm text-gray-500 dark:text-gray-400">Aucun profil disponible</span>
				</div>
			{:else}
				{#each gestionnaires as gestionnaire (gestionnaire.id)}
					<button
						onclick={() => switchProfile(gestionnaire)}
						disabled={isSwitching !== null}
						class="flex w-full items-center gap-3 px-4 py-2 text-left transition-colors hover:bg-gray-50 dark:hover:bg-gray-700
								{gestionnaire.id === currentUser?.id ? 'bg-red-50 dark:bg-red-950' : ''}
								disabled:cursor-not-allowed disabled:opacity-50"
						role="option"
						aria-selected={gestionnaire.id === currentUser?.id}
					>
						<Avatar {gestionnaire} size="sm" />
						<div class="min-w-0 flex-1">
							<p class="truncate text-sm font-medium text-gray-900 dark:text-gray-50">
								{gestionnaire.firstName}
								{gestionnaire.lastName}
							</p>
						</div>
						{#if gestionnaire.id === currentUser?.id}
							<svg
								class="h-4 w-4 text-[var(--color-orpi-red)]"
								fill="currentColor"
								viewBox="0 0 20 20"
							>
								<path
									fill-rule="evenodd"
									d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
									clip-rule="evenodd"
								/>
							</svg>
						{/if}
						{#if isSwitching === gestionnaire.id}
							<span class="text-xs text-[var(--color-orpi-red)]">...</span>
						{/if}
					</button>
				{/each}
			{/if}
				<!-- Séparateur + Ajouter un profil -->
				<div class="mt-1 border-t border-gray-200 pt-1 dark:border-gray-700">
					<button
						onclick={() => { isOpen = false; goto('/settings#gestionnaires'); }}
						class="flex w-full items-center gap-2 px-4 py-2 text-left text-sm text-gray-600 transition-colors hover:bg-gray-50 dark:text-gray-400 dark:hover:bg-gray-700"
					>
						<svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
							<path stroke-linecap="round" stroke-linejoin="round" d="M12 4v16m8-8H4" />
						</svg>
						Ajouter un profil
					</button>
				</div>
		</div>
	{/if}
</div>
