<script lang="ts">
	import { slide } from 'svelte/transition';

	interface Props {
		onOpen: () => void;
		onDuplicate: () => void;
		onDelete: () => void;
	}

	let { onOpen, onDuplicate, onDelete }: Props = $props();

	let isOpen = $state(false);

	function toggle(event: MouseEvent) {
		event.stopPropagation();
		if (!isOpen) {
			isOpen = true;
		}
	}

	function handleAction(action: () => void) {
		return (event: MouseEvent) => {
			event.stopPropagation();
			isOpen = false;
			action();
		};
	}

	// Close on outside click
	$effect(() => {
		if (!isOpen) return;

		const handler = (event: PointerEvent) => {
			const target = event.target as HTMLElement;
			if (!target.closest('[data-card-menu]')) {
				isOpen = false;
			}
		};

		window.addEventListener('pointerdown', handler);
		return () => {
			window.removeEventListener('pointerdown', handler);
		};
	});
</script>

<div class="relative" data-card-menu>
	<button
		type="button"
		onclick={toggle}
		class="rounded-md p-1 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-700 dark:hover:text-gray-300"
		aria-label="Menu actions"
		data-testid="card-menu-trigger"
	>
		<svg class="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
			<path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
		</svg>
	</button>

	{#if isOpen}
		<div
			transition:slide={{ duration: 200 }}
			class="absolute right-0 top-full z-20 mt-1 w-40 rounded-lg border border-gray-100 bg-white py-1 shadow-lg dark:border-gray-700 dark:bg-gray-800"
			data-testid="card-menu-dropdown"
		>
			<button
				type="button"
				onclick={handleAction(onOpen)}
				class="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-gray-700 transition-colors hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-gray-700"
			>
				<svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
					<path stroke-linecap="round" stroke-linejoin="round" d="M15 12H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" />
				</svg>
				Ouvrir
			</button>
			<button
				type="button"
				onclick={handleAction(onDuplicate)}
				class="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-gray-700 transition-colors hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-gray-700"
			>
				<svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
					<path stroke-linecap="round" stroke-linejoin="round" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
				</svg>
				Dupliquer
			</button>
			<button
				type="button"
				onclick={handleAction(onDelete)}
				class="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-red-600 transition-colors hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950"
			>
				<svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
					<path stroke-linecap="round" stroke-linejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
				</svg>
				Supprimer
			</button>
		</div>
	{/if}
</div>
