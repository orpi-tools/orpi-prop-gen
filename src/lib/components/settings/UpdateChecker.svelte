<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import { addToast } from '$lib/stores/uiStore';

	let currentVersion = $state<string>('—');
	let latestVersion = $state<string | null>(null);
	let status = $state<'idle' | 'checking' | 'available' | 'up-to-date' | 'downloading' | 'downloaded' | 'error'>(
		'idle'
	);
	let progress = $state<number>(0);
	let errorMessage = $state<string>('');
	let isElectron = $state<boolean>(false);

	const cleanupFns: Array<() => void> = [];

	onMount(async () => {
		if (typeof window === 'undefined' || !window.electronAPI) {
			isElectron = false;
			return;
		}
		isElectron = true;
		try {
			currentVersion = await window.electronAPI.getVersion();
		} catch (e) {
			console.error('[UpdateChecker] getVersion failed', e);
		}

		cleanupFns.push(
			window.electronAPI.onUpdateEvent('checking-for-update', () => {
				status = 'checking';
			}),
			window.electronAPI.onUpdateEvent('update-available', (info: unknown) => {
				const v = (info as { version?: string })?.version ?? null;
				latestVersion = v;
				status = 'available';
			}),
			window.electronAPI.onUpdateEvent('update-not-available', () => {
				status = 'up-to-date';
			}),
			window.electronAPI.onUpdateEvent('download-progress', (info: unknown) => {
				const p = (info as { percent?: number })?.percent ?? 0;
				progress = Math.round(p);
				status = 'downloading';
			}),
			window.electronAPI.onUpdateEvent('update-downloaded', () => {
				status = 'downloaded';
			}),
			window.electronAPI.onUpdateEvent('error', (err: unknown) => {
				errorMessage = (err as Error)?.message ?? String(err);
				status = 'error';
			})
		);
	});

	onDestroy(() => {
		for (const fn of cleanupFns) fn();
	});

	async function handleCheck() {
		if (!window.electronAPI) return;
		status = 'checking';
		errorMessage = '';
		const res = await window.electronAPI.checkForUpdates();
		if (!res.ok) {
			status = 'error';
			errorMessage = res.error ?? 'Erreur inconnue';
			addToast({ message: `Erreur de vérification : ${errorMessage}`, type: 'error' });
		}
	}

	async function handleDownload() {
		if (!window.electronAPI) return;
		const res = await window.electronAPI.downloadUpdate();
		if (!res.ok) {
			status = 'error';
			errorMessage = res.error ?? 'Erreur inconnue';
			addToast({ message: `Erreur de téléchargement : ${errorMessage}`, type: 'error' });
		}
	}

	async function handleInstall() {
		if (!window.electronAPI) return;
		await window.electronAPI.quitAndInstall();
	}
</script>

{#if isElectron}
	<section class="rounded-xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800">
		<h2 class="mb-1 text-lg font-semibold text-gray-900 dark:text-gray-50">Mise à jour du logiciel</h2>
		<p class="mb-4 text-xs text-gray-500 dark:text-gray-400">
			Version installée : <span class="font-mono">{currentVersion}</span>
		</p>

		<div class="flex items-center gap-3">
			{#if status === 'idle' || status === 'up-to-date' || status === 'error'}
				<button
					onclick={handleCheck}
					class="rounded-lg bg-[var(--color-orpi-red)] px-4 py-2 text-sm font-semibold text-white transition-all hover:brightness-95"
				>
					Vérifier les mises à jour
				</button>
			{/if}

			{#if status === 'checking'}
				<span class="text-sm text-gray-600 dark:text-gray-400">Vérification en cours…</span>
			{/if}

			{#if status === 'up-to-date'}
				<span class="text-sm text-green-600 dark:text-green-400">✓ Logiciel à jour</span>
			{/if}

			{#if status === 'available'}
				<span class="text-sm text-gray-700 dark:text-gray-300">
					Nouvelle version disponible : <strong>{latestVersion}</strong>
				</span>
				<button
					onclick={handleDownload}
					class="rounded-lg bg-[var(--color-orpi-red)] px-4 py-2 text-sm font-semibold text-white transition-all hover:brightness-95"
				>
					Télécharger
				</button>
			{/if}

			{#if status === 'downloading'}
				<div class="flex-1">
					<div class="mb-1 text-sm text-gray-600 dark:text-gray-400">Téléchargement… {progress}%</div>
					<div class="h-2 w-full rounded-full bg-gray-200 dark:bg-gray-700">
						<div
							class="h-2 rounded-full bg-[var(--color-orpi-red)] transition-all"
							style="width: {progress}%"
						></div>
					</div>
				</div>
			{/if}

			{#if status === 'downloaded'}
				<span class="text-sm text-gray-700 dark:text-gray-300">Mise à jour prête</span>
				<button
					onclick={handleInstall}
					class="rounded-lg bg-green-600 px-4 py-2 text-sm font-semibold text-white transition-all hover:brightness-95"
				>
					Redémarrer et installer
				</button>
			{/if}
		</div>

		{#if status === 'error' && errorMessage}
			<p class="mt-3 text-sm text-red-600 dark:text-red-400">Erreur : {errorMessage}</p>
		{/if}
	</section>
{/if}
