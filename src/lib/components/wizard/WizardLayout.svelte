<script lang="ts">
	import ProgressBar from './ProgressBar.svelte';
	import Step1Bien from './Step1Bien.svelte';
	import Step2Simulation from './Step2Simulation.svelte';
	import Step3Recap from './Step3Recap.svelte';
	import PdfPreview from '$lib/components/pdf/PdfPreview.svelte';
	import { fly } from 'svelte/transition';
	import { proposalStore } from '$lib/stores/proposalStore';
	import { propositionHelpers } from '$lib/db/helpers/propositionHelpers';
	import { addToast } from '$lib/stores/uiStore';
	import { get } from 'svelte/store';

	let currentStep = $state(1);
	let direction = $state(1);

	function handleStepClick(step: number) {
		if (step === currentStep) return;
		direction = step > currentStep ? 1 : -1;
		currentStep = step;
	}

	// ─── Auto-save silencieux (debounce 1000ms) ────────────────────────────
	const ERROR_MESSAGE = 'Erreur lors de la sauvegarde';
	let saveTimeoutId: ReturnType<typeof setTimeout> | null = null;
	let isFirstRender = true;
	let isSaving = false;

	$effect(() => {
		// Read store to create reactive dependency
		void $proposalStore;

		// Skip the initial render (store hydration from +page.svelte)
		if (isFirstRender) {
			isFirstRender = false;
			return;
		}

		if (saveTimeoutId) clearTimeout(saveTimeoutId);
		saveTimeoutId = setTimeout(async () => {
			try {
				const proposal = get(proposalStore);
				if (proposal?.id == null) return;

				// Re-entry guard: skip if already saving
				if (isSaving) return;
				isSaving = true;

				await propositionHelpers.save(proposal);
				isSaving = false;
			} catch (error) {
				console.error('[WizardLayout] Auto-save failed:', error);
				isSaving = false;
				try {
					addToast({ message: ERROR_MESSAGE, type: 'error' });
				} catch (toastError) {
					console.error('[WizardLayout] Toast failed:', toastError);
				}
			}
		}, 1000);

		// Cleanup on unmount
		return () => {
			if (saveTimeoutId) {
				clearTimeout(saveTimeoutId);
				saveTimeoutId = null;
			}
		};
	});
</script>

<div class="flex h-full flex-col">
	<!-- Progress bar — top of left panel -->
	<ProgressBar {currentStep} onStepClick={handleStepClick} />

	<!-- Split-screen layout -->
	<div class="flex min-h-0 flex-1">
		<!-- Left panel: form area -->
		<div class="flex w-1/2 flex-col bg-white dark:bg-gray-900">
			<div class="flex-1 overflow-y-auto p-6">
				{#key currentStep}
					<div
						in:fly={{ x: direction * 300, duration: 250 }}
						out:fly={{ x: direction * -300, duration: 250 }}
					>
						{#if currentStep === 1}
							<Step1Bien />
						{:else if currentStep === 2}
							<Step2Simulation />
						{:else}
							<Step3Recap onBack={() => handleStepClick(2)} />
						{/if}
					</div>
				{/key}
			</div>

			<!-- Navigation buttons -->
			{#if currentStep < 3}
				<div class="flex items-center justify-between border-t border-gray-200 bg-white px-6 py-3 dark:border-gray-700 dark:bg-gray-800">
					{#if currentStep > 1}
						<button
							type="button"
							onclick={() => handleStepClick(currentStep - 1)}
							class="flex items-center gap-1 rounded-lg px-4 py-2 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-700"
						>
							<svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
								<path stroke-linecap="round" stroke-linejoin="round" d="M15 19l-7-7 7-7" />
							</svg>
							Précédent
						</button>
					{:else}
						<div></div>
					{/if}
					<button
						type="button"
						onclick={() => handleStepClick(currentStep + 1)}
						class="flex items-center gap-1 rounded-lg px-5 py-2 text-sm font-semibold text-white transition-all hover:brightness-95"
						style="background-color: var(--color-orpi-red, #e60000)"
					>
						Suivant
						<svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
							<path stroke-linecap="round" stroke-linejoin="round" d="M9 5l7 7-7 7" />
						</svg>
					</button>
				</div>
			{/if}
		</div>

		<!-- Right panel: PDF preview -->
		<div class="w-1/2 border-l border-gray-200 dark:border-gray-700">
			<PdfPreview {currentStep} />
		</div>
	</div>
</div>
