<script lang="ts">
	import { previewStore } from '$lib/stores/previewStore';
	import {
		calculateHonorairesMensuel,
		calculateGLIMensuel,
		calculateQuittancement,
		calculateRevenuNetMensuel
	} from '$lib/utils/financialCalculator';

	const defaultBien = {
		loyerHC: 0
	};

	const defaultSimulation = {
		charges: 0,
		tauxGestion: 7.8,
		tauxGLI: 3.0,
		honorairesLocation: null,
		honorairesEtatLieux: null
	};

	let bien = $derived.by(() => {
		const preview = $previewStore;
		return preview?.bien ? { ...defaultBien, ...preview.bien } : defaultBien;
	});
	let sim = $derived.by(() => {
		const preview = $previewStore;
		return preview?.simulation ? { ...defaultSimulation, ...preview.simulation } : defaultSimulation;
	});

	let loyerHC = $derived(bien.loyerHC ?? 0);
	let charges = $derived(sim.charges ?? 0);
	let tauxGestion = $derived(sim.tauxGestion ?? 7.8);
	let tauxGLI = $derived(sim.tauxGLI ?? 3.0);

	let quittancement = $derived(calculateQuittancement(loyerHC, charges));
	let honorairesMensuel = $derived(calculateHonorairesMensuel(loyerHC, tauxGestion));
	let gliMensuel = $derived(calculateGLIMensuel(loyerHC, tauxGLI));
	let revenuNetMensuel = $derived(calculateRevenuNetMensuel(loyerHC, tauxGestion, tauxGLI));
	let revenuNetAnnuel = $derived(revenuNetMensuel * 12);

	function fmt(v: number): string {
		if (!Number.isFinite(v)) return '--';
		return v.toLocaleString('fr-FR');
	}

	// Scale dynamique pour adapter 1414×2000 au conteneur parent
	let wrapperEl: HTMLDivElement | undefined = $state(undefined);
	let scaleFactor = $state(1);

	$effect(() => {
		if (!wrapperEl) return;
		const ro = new ResizeObserver((entries) => {
			const { width } = entries[0].contentRect;
			scaleFactor = width / 1414;
		});
		ro.observe(wrapperEl);
		return () => ro.disconnect();
	});
</script>

<div class="page-wrapper" bind:this={wrapperEl}>
<div class="page-container" style="transform: scale({scaleFactor}); transform-origin: top left;">
	<!-- Fond Canva -->
	<img src="/pdf/page-06-simulation.jpg" alt="Page 6 : Simulation de vos revenus" class="page-bg" draggable="false" />

	<!-- R1 : REVENUS MENSUELS -->
	<div class="overlay overlay-col" style="left: 166px; top: 342px; width: 1084px; height: 565px; padding: 40px 60px; justify-content: center;">
		<div class="row">
			<span class="label">Loyer mensuel hors charges</span>
			<span class="value">{fmt(loyerHC)} €</span>
		</div>
		<div class="row">
			<span class="label">Provision sur charges</span>
			<span class="value">{fmt(charges)} €</span>
		</div>
		<div class="row row-border">
			<span class="label bold">Total quittancement</span>
			<span class="value bold">{fmt(quittancement)} €</span>
		</div>
		<div class="row">
			<span class="label deduction">- Honoraires gestion TTC ({tauxGestion}%)</span>
			<span class="value deduction">-{fmt(honorairesMensuel)} €</span>
		</div>
		<div class="row">
			<span class="label deduction">- Assurance loyers impayés GLI ({tauxGLI}%)</span>
			<span class="value deduction">-{fmt(gliMensuel)} €</span>
		</div>
		<div class="totals">
			<div class="total-box navy">
				<span class="total-label">Revenus nets mensuels</span>
				<span class="total-value">{fmt(revenuNetMensuel)} €</span>
			</div>
			<div class="total-box red">
				<span class="total-label">Revenus nets annuels</span>
				<span class="total-value">{fmt(revenuNetAnnuel)} €</span>
			</div>
		</div>
	</div>

	<!-- R2 : HONORAIRES D'ENTREMISE -->
	<div class="overlay overlay-small" style="left: 1070px; top: 1126px; width: 150px; height: 73px;">
		<span class="text-honoraire">90 € TTC</span>
	</div>

	<!-- R3 : HONORAIRES VISITES / DOSSIER / BAIL -->
	<div class="overlay overlay-small" style="left: 1000px; top: 1219px; width: 125px; height: 73px;">
		<span class="text-honoraire">{sim.honorairesLocation ? `${fmt(sim.honorairesLocation)} €` : '--'}</span>
	</div>

	<!-- R4 : HONORAIRE ÉTAT DES LIEUX ENTRÉE -->
	<div class="overlay overlay-small" style="left: 641px; top: 1297px; width: 130px; height: 65px;">
		<span class="text-honoraire">{sim.honorairesEtatLieux ? `${fmt(sim.honorairesEtatLieux)} €` : '--'}</span>
	</div>
</div>
</div>

<style>
	/* ─── Wrapper : contient le scale ─── */
	.page-wrapper {
		width: 100%;
		height: 100%;
		overflow: hidden;
	}

	.page-container {
		position: relative;
		width: 1414px;
		height: 2000px;
	}

	.page-bg {
		width: 100%;
		height: 100%;
		object-fit: fill;
		display: block;
	}

	/* ─── Zone masquante commune ─── */
	.overlay {
		position: absolute;
		background: #FFFFFF;
		display: flex;
		justify-content: center;
		align-items: center;
	}

	.overlay-col {
		flex-direction: column;
		justify-content: flex-start;
		gap: 16px;
	}

	/* ─── Tableau revenus ─── */
	.row {
		display: flex;
		justify-content: space-between;
		align-items: center;
		width: 100%;
	}

	.row-border {
		border-top: 2px solid #ddd;
		padding-top: 14px;
	}

	.label {
		font-size: 27px;
		color: #555;
	}

	.value {
		font-size: 27px;
		font-weight: 700;
		color: #1a2b5f;
	}

	.bold {
		font-weight: 700;
		color: #1a2b5f;
	}

	.deduction {
		color: #c0392b;
	}

	.totals {
		display: flex;
		gap: 20px;
		width: 100%;
		margin-top: 10px;
	}

	.total-box {
		flex: 1;
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		padding: 16px;
		border-radius: 8px;
		color: white;
	}

	.total-box.navy {
		background-color: #1a2b5f;
	}

	.total-box.red {
		background-color: #e4003a;
	}

	.total-label {
		font-size: 18px;
		opacity: 0.85;
	}

	.total-value {
		font-size: 32px;
		font-weight: 700;
	}

	/* ─── Petits rectangles (fix html2canvas) ─── */
	.overlay-small {
		display: block;
		position: absolute;
		background: #FFFFFF;
	}

	.overlay-small .text-honoraire {
		position: absolute;
		top: 42%;
		left: 50%;
		transform: translate(-50%, -50%);
		width: 100%;
	}

	/* ─── Honoraires ─── */
	.text-honoraire {
		font-size: 24px;
		font-weight: 700;
		color: #1a2b5f;
		text-align: center;
	}
</style>
