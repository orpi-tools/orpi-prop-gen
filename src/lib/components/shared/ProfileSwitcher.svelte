<script lang="ts">
	import Avatar from '$lib/components/shared/Avatar.svelte';
	import { slide } from 'svelte/transition';
	import { userStore } from '$lib/stores/userStore';
	import { addToast } from '$lib/stores/uiStore';
	import { gestionnaireHelpers } from '$lib/db/helpers/gestionnaireHelpers';
	import type { Gestionnaire } from '$lib/types';

	let {
		currentUser,
		agencyId
	}: {
		currentUser: Gestionnaire;
		agencyId: string;
	} = $props();

	let isOpen = $state(false);
	let isLoading = $state(false);
	let isSwitching = $state<string | null>(null);
	let gestionnaires = $state<Gestionnaire[]>([]);
	let menuRequestId = 0;

	async function toggleMenu() {
		if (isOpen) {
			isOpen = false;
			return;
		}
		const requestId = ++menuRequestId;
		isLoading = true;
		isOpen = true;
		try {
			gestionnaires = await gestionnaireHelpers.getByAgency(agencyId);
		} catch (error) {
			console.error('[ProfileSwitcher] Failed to load profiles:', error);
			addToast({ message: 'Erreur chargement des profils', type: 'error' });
			isOpen = false;
			return;
		} finally {
			isLoading = false;
		}
		if (requestId !== menuRequestId) {
			return;
		}
	}

	async function switchProfile(gestionnaire: Gestionnaire) {
		if (gestionnaire.id === currentUser.id) {
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
		<Avatar gestionnaire={currentUser} size="sm" />
		<span class="text-sm font-medium text-gray-700 dark:text-gray-300">{currentUser.firstName}</span>
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
								{gestionnaire.id === currentUser.id ? 'bg-red-50 dark:bg-red-950' : ''}
								disabled:cursor-not-allowed disabled:opacity-50"
						role="option"
						aria-selected={gestionnaire.id === currentUser.id}
					>
						<Avatar {gestionnaire} size="sm" />
						<div class="min-w-0 flex-1">
							<p class="truncate text-sm font-medium text-gray-900 dark:text-gray-50">
								{gestionnaire.firstName}
								{gestionnaire.lastName}
							</p>
						</div>
						{#if gestionnaire.id === currentUser.id}
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
		</div>
	{/if}
</div>
