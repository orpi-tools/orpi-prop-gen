<script lang="ts">
	import { addToast } from '$lib/stores/uiStore';

	interface Props {
		ownerFirstName?: string;
		ownerEmail?: string;
		onNewProposal: () => void;
		onBackToDashboard: () => void;
	}

	let { ownerFirstName = '', ownerEmail = '', onNewProposal, onBackToDashboard }: Props = $props();

	// ─── Validation ───────────────────────────────────────────────────────────────
	$effect.pre(() => {
		if (typeof onNewProposal !== 'function' || typeof onBackToDashboard !== 'function') {
			throw new Error('ConclusionRitual: callbacks onNewProposal and onBackToDashboard are required');
		}
	});

	// ─── Animation phases ──────────────────────────────────────────────────────────
	let phase = $state<'flipping' | 'confirmation' | 'actions'>('flipping');
	let isMounted = $state(true);

	$effect(() => {
		// Phase 1 → Phase 2 at 500ms
		const t1 = setTimeout(() => {
			if (isMounted) phase = 'confirmation';
		}, 500);

		// Phase 2 → Phase 3 at 1500ms
		const t2 = setTimeout(() => {
			if (isMounted) phase = 'actions';
		}, 1500);

		return () => {
			isMounted = false;
			clearTimeout(t1);
			clearTimeout(t2);
		};
	});

	// ─── Email validation ─────────────────────────────────────────────────────────
	function isValidEmail(email: string): boolean {
		// Basic validation: must contain @ and a dot after @
		return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
	}

	// ─── Clipboard ─────────────────────────────────────────────────────────────────
	async function copyEmail() {
		// Check clipboard API availability
		if (!navigator?.clipboard?.writeText) {
			addToast({ message: 'Copie non supportée sur ce navigateur', type: 'error' });
			return;
		}

		try {
			await navigator.clipboard.writeText(ownerEmail);
			addToast({ message: 'Email copié !', type: 'success', duration: 2000 });
		} catch (error) {
			const message = error instanceof Error && error.name === 'NotAllowedError'
				? 'Permission refusée pour copier'
				: "Impossible de copier l'email";
			addToast({ message, type: 'error' });
		}
	}

	let hasEmail = $derived(ownerEmail?.trim()?.length > 0 && isValidEmail(ownerEmail));
</script>

<div class="flex h-full flex-col items-center justify-center px-6 py-10" data-testid="conclusion-ritual">
	<!-- Phase 1: Page flipping animation (0–0.5s) -->
	{#if phase === 'flipping'}
		<div class="flip-container" data-testid="flip-animation">
			{#each Array(11) as _, i}
				<div
					class="flip-page"
					style="animation-delay: {i * 40}ms"
				>
					<span class="text-[10px] font-medium text-gray-400">{i + 1}</span>
				</div>
			{/each}
		</div>
	{/if}

	<!-- Phase 2: Confirmation screen (0.5–1.5s) -->
	{#if phase === 'confirmation' || phase === 'actions'}
		<div class="flex flex-col items-center gap-4" data-testid="confirmation-screen">
			<!-- Animated checkmark -->
			<div class="check-icon" data-testid="check-icon">
				<svg class="h-16 w-16 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
					<path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" />
				</svg>
			</div>

			<h2 class="text-xl font-bold" style="color: var(--color-orpi-navy)">
				Proposition générée !
			</h2>
		</div>
	{/if}

	<!-- Phase 3: Action buttons (1.5–2s) -->
	{#if phase === 'actions'}
		<div class="mt-8 flex w-full max-w-xs flex-col gap-3 action-buttons" data-testid="action-buttons">
			{#if hasEmail}
				<button
					type="button"
					onclick={copyEmail}
					class="w-full rounded-xl px-6 py-3 text-sm font-semibold text-white transition-colors hover:opacity-90"
					style="background-color: var(--color-orpi-navy, #002c51)"
					aria-label="Copier l'email du propriétaire"
					data-testid="copy-email-btn"
				>
					Copier l'email de {ownerFirstName ?? 'propriétaire'}
				</button>
			{/if}

			<button
				type="button"
				onclick={onNewProposal}
				class="w-full rounded-xl border-2 px-6 py-3 text-sm font-semibold transition-colors hover:bg-red-50"
				style="border-color: var(--color-orpi-red, #e60000); color: var(--color-orpi-red, #e60000)"
				aria-label="Créer une nouvelle proposition"
				data-testid="new-proposal-btn"
			>
				Nouvelle proposition
			</button>

			<button
				type="button"
				onclick={onBackToDashboard}
				class="w-full rounded-xl border border-gray-300 bg-white px-6 py-3 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
				aria-label="Retourner au tableau de bord"
				data-testid="back-dashboard-btn"
			>
				Retour historique
			</button>
		</div>
	{/if}
</div>

<style>
	/* ─── Phase 1: Page flipping ──────────────────────────────────────────── */
	.flip-container {
		display: flex;
		gap: 4px;
		align-items: center;
		justify-content: center;
		height: 80px;
	}

	.flip-page {
		width: 32px;
		height: 45px;
		border-radius: 3px;
		background: white;
		border: 1px solid #e5e7eb;
		display: flex;
		align-items: center;
		justify-content: center;
		box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
		animation: flip-page 0.5s ease-out forwards;
		opacity: 0;
		transform: rotateY(90deg);
	}

	@keyframes flip-page {
		from {
			opacity: 0;
			transform: rotateY(90deg) scale(0.8);
		}
		to {
			opacity: 1;
			transform: rotateY(0deg) scale(1);
		}
	}

	/* ─── Phase 2: Checkmark scale-in ─────────────────────────────────────── */
	.check-icon {
		animation: check-scale 0.4s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
	}

	@keyframes check-scale {
		from {
			opacity: 0;
			transform: scale(0);
		}
		to {
			opacity: 1;
			transform: scale(1);
		}
	}

	/* ─── Phase 3: Action buttons fade-in ─────────────────────────────────── */
	.action-buttons {
		animation: buttons-fade-in 0.5s ease-out forwards;
		/* Prevent clicks during animation (0–1500ms total, buttons appear at 1500ms) */
		pointer-events: auto;
	}

	/* Prevent accidental clicks before phase 3 */
	:global(body) .action-buttons {
		pointer-events: none;
	}

	.action-buttons button {
		pointer-events: auto;
	}

	@keyframes buttons-fade-in {
		from {
			opacity: 0;
			transform: translateY(10px);
			pointer-events: none;
		}
		to {
			opacity: 1;
			transform: translateY(0);
			pointer-events: auto;
		}
	}
</style>
