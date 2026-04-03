<script lang="ts">
	import '../app.css';
	import { uiStore, toggleDarkMode, initDarkMode } from '$lib/stores/uiStore';
	import { agencyStore } from '$lib/stores/agencyStore';
	import { userStore } from '$lib/stores/userStore';
	import { agencyHelpers } from '$lib/db/helpers/agencyHelpers';
	import { gestionnaireHelpers } from '$lib/db/helpers/gestionnaireHelpers';
	import { onMount } from 'svelte';
	import ToastContainer from '$lib/components/shared/ToastContainer.svelte';
	import ProfileSwitcher from '$lib/components/shared/ProfileSwitcher.svelte';
	import { goto, onNavigate } from '$app/navigation';
	import { page } from '$app/state';

	let { children } = $props();
	let mounted = $state(false);
	let initError = $state<Error | null>(null);
	let transitioning = $state(false);

	onNavigate((navigation) => {
		if (transitioning) return;
		if (!document.startViewTransition) return;
		transitioning = true;
		return new Promise((resolve) => {
			const timeout = setTimeout(() => {
				transitioning = false;
				resolve();
			}, 500); // Fallback timeout
			try {
				document.startViewTransition(async () => {
					clearTimeout(timeout);
					resolve();
					await navigation.complete;
					transitioning = false;
				});
			} catch (error) {
				clearTimeout(timeout);
				console.error('[Layout] View Transition error:', error);
				transitioning = false;
				resolve();
			}
		});
	});

	onMount(async () => {
		initDarkMode();
		try {
			const agencies = await agencyHelpers.getAll();
			if (agencies.length > 0) {
				agencyStore.set(agencies[0]);
				const gestionnaires = await gestionnaireHelpers.getByAgency(agencies[0].id);
				if (gestionnaires.length > 0) {
					userStore.set(gestionnaires[0]);
				}
			} else {
				const currentPath = page.url.pathname;
				if (currentPath !== '/onboarding') {
					try {
						// eslint-disable-next-line svelte/no-navigation-without-resolve
						await goto('/onboarding');
					} catch (navError) {
						console.error('[Layout] Navigation to onboarding failed:', navError);
						initError = navError instanceof Error ? navError : new Error('Navigation failed');
					}
				}
			}
		} catch (error) {
			console.error('[Layout] Failed to load agencies:', error);
			initError = error instanceof Error ? error : new Error('Failed to load initial data');
		} finally {
			mounted = true;
		}
	});
</script>

<div class="flex h-screen flex-col dark:bg-gray-900">
	<!-- Header -->
	<header
		class="flex items-center justify-between border-b border-gray-200 bg-white px-6 py-3 shadow-sm dark:border-gray-700 dark:bg-gray-800"
	>
		<div class="flex items-center gap-2">
			<a href="/" class="transition-opacity hover:opacity-80">
				<img src="/logos/orpi-logo.png" alt="Orpi" class="h-8 w-auto" />
			</a>
		</div>

		<div class="flex-1"></div>

		<!-- Badge gestionnaire + switch profil -->
		{#if $userStore && $agencyStore}
			<div class="mr-4">
				<ProfileSwitcher currentUser={$userStore} agencyId={$agencyStore.id} />
			</div>
		{/if}

		<!-- Dark mode toggle -->
		<button
			onclick={toggleDarkMode}
			class="rounded-lg p-2 transition-colors hover:bg-gray-100 dark:hover:bg-gray-700"
			aria-label={$uiStore.darkMode ? 'Activer le mode clair' : 'Activer le mode sombre'}
		>
			{#if $uiStore.darkMode}
				<!-- Sun icon (switch to light) -->
				<svg class="h-5 w-5 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
				</svg>
			{:else}
				<!-- Moon icon (switch to dark) -->
				<svg class="h-5 w-5 text-gray-600 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
				</svg>
			{/if}
		</button>

		<!-- Help icon — guide utilisateur -->
		<a
			href="/guide-utilisateur.html"
			target="_blank"
			class="rounded-lg p-2 transition-colors hover:bg-gray-100 dark:hover:bg-gray-700"
			title="Guide utilisateur"
			aria-label="Ouvrir le guide utilisateur"
		>
			<svg
				class="h-6 w-6 text-gray-600 dark:text-gray-400"
				fill="none"
				stroke="currentColor"
				viewBox="0 0 24 24"
				aria-hidden="true"
			>
				<path
					stroke-linecap="round"
					stroke-linejoin="round"
					stroke-width="2"
					d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
				/>
			</svg>
		</a>

		<!-- Gear icon — settings -->
		<!-- eslint-disable-next-line svelte/no-navigation-without-resolve -->
		<a
			href="/settings"
			class="rounded-lg p-2 transition-colors hover:bg-gray-100 dark:hover:bg-gray-700"
			title="Paramètres"
			aria-label="Ouvrir les paramètres"
		>
			<svg
				class="h-6 w-6 text-gray-600 dark:text-gray-400"
				fill="none"
				stroke="currentColor"
				viewBox="0 0 24 24"
				aria-hidden="true"
			>
				<path
					stroke-linecap="round"
					stroke-linejoin="round"
					stroke-width="2"
					d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
				/>
				<path
					stroke-linecap="round"
					stroke-linejoin="round"
					stroke-width="2"
					d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
				/>
			</svg>
		</a>
	</header>

	<!-- Main content -->
	<!-- TODO (P10): Add focus management during View Transitions to prevent focus from moving to animated elements.
			 Consider using aria-hidden + inert or focus-visible patterns. Track in accessibility backlog. -->
	<main class="flex-1 overflow-auto bg-gray-50 p-6 dark:bg-gray-900">
		{#if initError}
			<div class="mx-auto max-w-2xl rounded-lg border border-red-300 bg-red-50 p-6 dark:border-red-900 dark:bg-red-900">
				<h2 class="mb-2 text-lg font-semibold text-red-900 dark:text-red-100">Erreur d'initialisation</h2>
				<p class="mb-4 text-red-700 dark:text-red-200">{initError.message}</p>
				<button
					onclick={() => {
						location.reload();
					}}
					class="rounded-lg bg-red-600 px-4 py-2 text-white hover:bg-red-700"
				>
					Recharger la page
				</button>
			</div>
		{:else if mounted}
			{@render children()}
		{/if}
	</main>

	<!-- Toast container -->
	<ToastContainer />
</div>

<style>
	:global(body) {
		margin: 0;
		padding: 0;
	}
</style>
