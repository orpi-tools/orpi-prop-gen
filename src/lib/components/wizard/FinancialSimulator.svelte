<script lang="ts">
	import { proposalStore } from '$lib/stores/proposalStore';
	import { calculateBigNumbers, calculateMonthlyNumbers } from '$lib/utils/financialCalculator';
	import type { MonthlyNumbers } from '$lib/utils/financialCalculator';
	import { debounce } from '$lib/utils/debounce';
	import TmiSelector from './TmiSelector.svelte';
	import type { BigNumbers, TmiRate } from '$lib/types';

	// ─── Local state from store ────────────────────────────────────────────────
	let loyerHC = $derived($proposalStore.bien.loyerHC);
	let charges = $derived($proposalStore.simulation.charges);
	let tauxGestion = $derived($proposalStore.simulation.tauxGestion);
	let tauxGLI = $derived($proposalStore.simulation.tauxGLI);
	let selectedTmi = $derived($proposalStore.simulation.tmi);

	// ─── Calculated Numbers ────────────────────────────────────────────────────
	let bigNumbers: BigNumbers = $derived(
		calculateBigNumbers({ loyerHC, tauxGestion, tauxGLI, tmi: selectedTmi })
	);

	let monthlyNumbers: MonthlyNumbers = $derived(
		calculateMonthlyNumbers({ loyerHC, tauxGestion, tauxGLI, tmi: selectedTmi, charges })
	);

	// ─── Persist to store (debounced) ──────────────────────────────────────────
	const persistBigNumbers = debounce((bn: BigNumbers) => {
		proposalStore.update((p) => ({
			...p,
			simulation: { ...p.simulation, bigNumbers: bn }
		}));
	}, 100);

	$effect(() => {
		persistBigNumbers(bigNumbers);
	});

	// ─── Animated display values ───────────────────────────────────────────────
	let displayLoyer = $state(0);
	let displayHonoraires = $state(0);
	let displayGLI = $state(0);
	let displayNet = $state(0);

	let rafLoyer = $state<number | null>(null);
	let rafHonoraires = $state<number | null>(null);
	let rafGLI = $state<number | null>(null);
	let rafNet = $state<number | null>(null);

	function animateValue(
		getCurrent: () => number,
		setCurrent: (v: number) => void,
		target: number,
		getRaf: () => number | null,
		setRaf: (id: number | null) => void
	) {
		if (getRaf() !== null) cancelAnimationFrame(getRaf()!);
		const start = getCurrent();
		if (start === target) {
			setRaf(null);
			return;
		}
		const startTime = performance.now();
		const duration = 200;

		function tick(now: number) {
			const elapsed = now - startTime;
			const progress = Math.min(elapsed / duration, 1);
			setCurrent(Math.round(start + (target - start) * progress));
			if (progress < 1) {
				setRaf(requestAnimationFrame(tick));
			} else {
				setRaf(null);
			}
		}
		setRaf(requestAnimationFrame(tick));
	}

	const debouncedAnimate = debounce((bn: BigNumbers) => {
		animateValue(
			() => displayLoyer,
			(v) => (displayLoyer = v),
			bn.loyerBrutAnnuel,
			() => rafLoyer,
			(id) => (rafLoyer = id)
		);
		animateValue(
			() => displayHonoraires,
			(v) => (displayHonoraires = v),
			bn.honorairesTTC,
			() => rafHonoraires,
			(id) => (rafHonoraires = id)
		);
		animateValue(
			() => displayGLI,
			(v) => (displayGLI = v),
			bn.primeGLI,
			() => rafGLI,
			(id) => (rafGLI = id)
		);
		animateValue(
			() => displayNet,
			(v) => (displayNet = v),
			bn.revenuNetTMI,
			() => rafNet,
			(id) => (rafNet = id)
		);
	}, 200);

	$effect(() => {
		// Lecture réactive de bigNumbers, puis animation debouncée
		const bn = bigNumbers;
		debouncedAnimate(bn);
	});

	// ─── Form helpers ──────────────────────────────────────────────────────────
	function updateSimulation<K extends keyof typeof $proposalStore.simulation>(
		field: K,
		value: (typeof $proposalStore.simulation)[K]
	) {
		proposalStore.update((p) => ({
			...p,
			simulation: { ...p.simulation, [field]: value }
		}));
	}

	function handleNumberInput(e: Event, field: 'charges' | 'tauxGestion' | 'tauxGLI' | 'honorairesLocation' | 'honorairesEtatLieux') {
		const input = e.currentTarget as HTMLInputElement;
		const value = Number(input.value) || 0;
		updateSimulation(field, Math.max(0, value));
	}

	function handleLoyerInput(e: Event) {
		const input = e.currentTarget as HTMLInputElement;
		const value = Number(input.value) || 0;
		proposalStore.update((p) => ({
			...p,
			bien: { ...p.bien, loyerHC: Math.max(0, value) }
		}));
	}

	function handleTmiSelect(tmi: TmiRate) {
		updateSimulation('tmi', tmi);
	}

	// ─── Formatting ────────────────────────────────────────────────────────────
	function formatEuro(value: number): string {
		return value.toLocaleString('fr-FR');
	}

	const baseInputClass =
		'w-full rounded-lg border px-4 py-2 focus:ring-1 focus:outline-none transition-colors dark:bg-gray-700 dark:text-gray-50 dark:border-gray-600';
	const focusClass = 'focus:border-[var(--color-orpi-red)] focus:ring-[var(--color-orpi-red)]';
	const labelClass = 'mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300';
</script>

<div class="space-y-6">
	<!-- Section: Paramètres du simulateur -->
	<section>
		<h3 class="mb-3 text-sm font-semibold tracking-wide text-gray-500 dark:text-gray-400 uppercase">
			Paramètres financiers
		</h3>
		<div class="space-y-4">
			<div class="grid grid-cols-2 gap-4">
				<div>
					<label for="sim-loyer" class={labelClass}>Loyer HC (€/mois)</label>
					<input
						id="sim-loyer"
						type="number"
						min="0"
						step="1"
						value={loyerHC === 0 ? '' : loyerHC}
						oninput={handleLoyerInput}
						class="{baseInputClass} border-gray-300 {focusClass}"
						placeholder="680"
					/>
				</div>
				<div>
					<label for="sim-charges" class={labelClass}>
						Charges mensuelles (€)
						<span class="text-gray-400 dark:text-gray-400">(optionnel)</span>
					</label>
					<input
						id="sim-charges"
						type="number"
						min="0"
						step="1"
						value={charges === 0 ? '' : charges}
						oninput={(e) => handleNumberInput(e, 'charges')}
						class="{baseInputClass} border-gray-300 {focusClass}"
						placeholder="0"
					/>
				</div>
			</div>
			<div class="grid grid-cols-2 gap-4">
				<div>
					<label for="sim-gestion" class={labelClass}>Taux de gestion (%)</label>
					<input
						id="sim-gestion"
						type="number"
						min="0"
						max="100"
						step="0.1"
						value={tauxGestion}
						oninput={(e) => handleNumberInput(e, 'tauxGestion')}
						class="{baseInputClass} border-gray-300 {focusClass}"
					/>
				</div>
				<div>
					<label for="sim-gli" class={labelClass}>Taux GLI (%)</label>
					<input
						id="sim-gli"
						type="number"
						min="0"
						max="100"
						step="0.1"
						value={tauxGLI}
						oninput={(e) => handleNumberInput(e, 'tauxGLI')}
						class="{baseInputClass} border-gray-300 {focusClass}"
					/>
				</div>
			</div>
		</div>
	</section>

	<!-- Section: Honoraires de location -->
	<section>
		<h3 class="mb-3 text-sm font-semibold tracking-wide text-gray-500 dark:text-gray-400 uppercase">
			Honoraires de location
		</h3>
		<div class="space-y-4">
			<div class="grid grid-cols-2 gap-4">
				<div>
					<label for="sim-honoraires-location" class={labelClass}>Honoraires dossier/visite/bail (€)</label>
					<input
						id="sim-honoraires-location"
						type="number"
						min="0"
						step="1"
						value={$proposalStore.simulation.honorairesLocation === 0 ? '' : $proposalStore.simulation.honorairesLocation}
						oninput={(e) => handleNumberInput(e, 'honorairesLocation')}
						class="{baseInputClass} border-gray-300 {focusClass}"
						placeholder="0"
					/>
				</div>
				<div>
					<label for="sim-honoraires-edl" class={labelClass}>Honoraires états des lieux (€)</label>
					<input
						id="sim-honoraires-edl"
						type="number"
						min="0"
						step="1"
						value={$proposalStore.simulation.honorairesEtatLieux === 0 ? '' : $proposalStore.simulation.honorairesEtatLieux}
						oninput={(e) => handleNumberInput(e, 'honorairesEtatLieux')}
						class="{baseInputClass} border-gray-300 {focusClass}"
						placeholder="0"
					/>
				</div>
			</div>
			<div class="rounded-lg border border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 px-4 py-2">
				<p class="text-xs text-gray-500 dark:text-gray-400">
					Honoraires d'entremise : <span class="font-semibold">90 € TTC</span> (fixe)
				</p>
			</div>
		</div>
	</section>

	<!-- Section: TMI Selector -->
	<section>
		<TmiSelector selected={selectedTmi} onSelect={handleTmiSelect} />
	</section>

	<!-- Section: Simulation mensuelle -->
	<section>
		<h3 class="mb-3 text-sm font-semibold tracking-wide text-gray-500 dark:text-gray-400 uppercase">
			Simulation mensuelle
		</h3>
		<div class="grid grid-cols-2 gap-3">
			<div class="rounded-xl border border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-800 p-3 shadow-sm">
				<p class="text-xs font-medium text-gray-500 dark:text-gray-400">Total quittancement</p>
				<p class="mt-0.5 text-xl font-bold" style="color: var(--color-orpi-navy)">
					{formatEuro(monthlyNumbers.quittancement)}
					<span class="text-xs font-normal text-gray-500 dark:text-gray-400">€/mois</span>
				</p>
			</div>
			<div class="rounded-xl border border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-800 p-3 shadow-sm">
				<p class="text-xs font-medium text-gray-500 dark:text-gray-400">Honoraires gestion ({tauxGestion}%)</p>
				<p class="mt-0.5 text-xl font-bold" style="color: var(--color-orpi-navy)">
					{formatEuro(monthlyNumbers.honorairesGestion)}
					<span class="text-xs font-normal text-gray-500 dark:text-gray-400">€/mois</span>
				</p>
			</div>
			<div class="rounded-xl border border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-800 p-3 shadow-sm">
				<p class="text-xs font-medium text-gray-500 dark:text-gray-400">Assurance GLI ({tauxGLI}%)</p>
				<p class="mt-0.5 text-xl font-bold" style="color: var(--color-orpi-navy)">
					{formatEuro(monthlyNumbers.primeGLI)}
					<span class="text-xs font-normal text-gray-500 dark:text-gray-400">€/mois</span>
				</p>
			</div>
			<div class="rounded-xl border border-[var(--color-orpi-red)]/20 bg-red-50/30 dark:bg-red-950/30 p-3 shadow-sm">
				<p class="text-xs font-medium text-gray-500 dark:text-gray-400">Revenu net mensuel</p>
				<p class="mt-0.5 text-xl font-bold" style="color: var(--color-orpi-red)">
					{formatEuro(monthlyNumbers.revenuNet)}
					<span class="text-xs font-normal text-gray-500 dark:text-gray-400">€/mois</span>
				</p>
			</div>
		</div>
	</section>

	<!-- Section: Simulation annuelle -->
	<section>
		<h3 class="mb-3 text-sm font-semibold tracking-wide text-gray-500 dark:text-gray-400 uppercase">
			Simulation annuelle
		</h3>
		<div class="grid grid-cols-2 gap-4">
			<div class="rounded-xl border border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-800 p-4 shadow-sm">
				<p class="text-xs font-medium text-gray-500 dark:text-gray-400">Loyer brut annuel</p>
				<p class="mt-1 text-3xl font-bold" style="color: var(--color-orpi-navy)">
					{formatEuro(displayLoyer)}
					<span class="text-sm font-normal text-gray-500 dark:text-gray-400">€/an</span>
				</p>
			</div>

			<div class="rounded-xl border border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-800 p-4 shadow-sm">
				<p class="text-xs font-medium text-gray-500 dark:text-gray-400">Honoraires de gestion TTC</p>
				<p class="mt-1 text-3xl font-bold" style="color: var(--color-orpi-navy)">
					{formatEuro(displayHonoraires)}
					<span class="text-sm font-normal text-gray-500 dark:text-gray-400">€/an</span>
				</p>
			</div>

			<div class="rounded-xl border border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-800 p-4 shadow-sm">
				<p class="text-xs font-medium text-gray-500 dark:text-gray-400">Prime GLI annuelle</p>
				<p class="mt-1 text-3xl font-bold" style="color: var(--color-orpi-navy)">
					{formatEuro(displayGLI)}
					<span class="text-sm font-normal text-gray-500 dark:text-gray-400">€/an</span>
				</p>
			</div>

			<div class="rounded-xl border border-[var(--color-orpi-red)]/20 bg-red-50/30 dark:bg-red-950/30 p-4 shadow-sm">
				<p class="text-xs font-medium text-gray-500 dark:text-gray-400">Revenu net après TMI</p>
				<p class="mt-1 text-3xl font-bold" style="color: var(--color-orpi-red)">
					{formatEuro(displayNet)}
					<span class="text-sm font-normal text-gray-500 dark:text-gray-400">€/an</span>
				</p>
			</div>
		</div>
	</section>
</div>
