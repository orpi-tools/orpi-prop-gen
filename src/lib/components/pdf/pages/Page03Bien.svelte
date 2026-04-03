<script lang="ts">
	import { previewStore } from '$lib/stores/previewStore';
	import { agencyStore } from '$lib/stores/agencyStore';

	interface Props {
		photoUrl?: string;
	}

	let { photoUrl }: Props = $props();

	function formatDate(timestamp: number): string {
		return new Date(timestamp).toLocaleDateString('fr-FR', {
			day: '2-digit',
			month: 'long',
			year: 'numeric'
		});
	}

	function formatEuro(value: number): string {
		if (!Number.isFinite(value)) return '--';
		return value.toLocaleString('fr-FR');
	}

	const defaultBien = {
		adresse: '',
		surface: null,
		nbPieces: null,
		etage: null,
		typeLogement: '',
		proprietairePrenom: '',
		proprietaireNom: '',
		loyerHC: 0,
		description: ''
	};

	let bien = $derived.by(() => {
		const preview = $previewStore;
		return preview?.bien ? { ...defaultBien, ...preview.bien } : defaultBien;
	});
	let createdAt = $derived($previewStore?.createdAt ?? Date.now());
	let agency = $derived($agencyStore);

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
	<img src="/pdf/page-03-bien.jpg" alt="Page 3 : Présentation du bien" class="page-bg" draggable="false" />

	<!-- R1 : PHOTO -->
	<div class="overlay" style="left: 88px; top: 450px; width: 1249px; height: 752px;">
		{#if photoUrl}
			<img src={photoUrl} alt="Bien principal" class="photo-cover" draggable="false" />
		{:else}
			<span class="placeholder">Photo principale</span>
		{/if}
	</div>

	<!-- R8 : ADRESSE -->
	<div class="overlay" style="left: 739px; top: 334px; width: 598px; height: 82px;">
		<span class="text-adresse">{bien.adresse || ''}</span>
	</div>

	<!-- R2 : SURFACE -->
	<div class="overlay" style="left: 126px; top: 1253px; width: 280px; height: 120px;">
		<span class="text-value">{bien.surface || '--'} m²</span>
	</div>

	<!-- R3 : PIECES -->
	<div class="overlay" style="left: 432px; top: 1253px; width: 285px; height: 120px;">
		<span class="text-value">{bien.nbPieces ? `${bien.nbPieces} pièce${bien.nbPieces > 1 ? 's' : ''}` : '--'}</span>
	</div>

	<!-- R4 : ETAGE -->
	<div class="overlay" style="left: 739px; top: 1253px; width: 283px; height: 120px;">
		<span class="text-value">{bien.etage != null ? (bien.etage === 0 ? 'RDC' : `Étage n°${bien.etage}`) : '--'}</span>
	</div>

	<!-- R5 : TYPE -->
	<div class="overlay" style="left: 1050px; top: 1253px; width: 281px; height: 120px;">
		<span class="text-value">{bien.typeLogement || '--'}</span>
	</div>

	<!-- R6 : PROPRIETAIRE -->
	<div class="overlay" style="left: 178px; top: 1426px; width: 460px; height: 257px;">
		<span class="text-proprietaire">{bien.proprietairePrenom || ''} {bien.proprietaireNom || ''}</span>
	</div>

	<!-- R7 : LOYER PROPOSE + Date de l'étude -->
	<div class="overlay overlay-col" style="left: 797px; top: 1426px; width: 449px; height: 257px; gap: 20px;">
		<span class="text-loyer">
			{bien.loyerHC > 0 ? `${formatEuro(bien.loyerHC)} €/mois` : '--'}
		</span>
		<span class="text-date">Étude réalisée le {formatDate(createdAt)}</span>
	</div>

	<!-- R9 : AGENCE -->
	{#if agency}
		<div class="overlay overlay-col" style="left: 317px; top: 1847px; width: 347px; height: 125px;">
			<span class="text-agence-name">{agency.name}</span>
			<span class="text-agence-detail">{agency.address}</span>
			<span class="text-agence-detail">{agency.email}</span>
		</div>
	{/if}

	<!-- R10 : MENTIONS LEGALES -->
	{#if agency}
		<div class="overlay" style="left: 694px; top: 1847px; width: 674px; height: 125px;">
			<span class="text-mentions">{agency.mentionsLegales ?? ''}</span>
		</div>
	{/if}
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
		gap: 4px;
	}

	/* ─── Photo ─── */
	.photo-cover {
		width: 100%;
		height: 100%;
		object-fit: cover;
	}

	.placeholder {
		font-size: 18px;
		color: #aaa;
	}

	/* ─── Typographies ─── */
	.text-adresse {
		font-size: 22px;
		font-style: italic;
		color: #666;
		text-align: center;
	}

	.text-value {
		font-size: 36px;
		font-weight: 700;
		color: #1a2b5f;
		text-align: center;
	}

	.text-proprietaire {
		font-size: 34px;
		font-weight: 700;
		color: #1a2b5f;
		text-align: center;
	}

	.text-loyer {
		font-size: 34px;
		font-weight: 700;
		color: #1a2b5f;
		text-align: center;
	}

	.text-date {
		font-size: 24px;
		color: #1a2b5f;
		text-align: center;
	}

	.text-agence-name {
		font-size: 14px;
		font-weight: 600;
		color: #1a2b5f;
		text-align: center;
	}

	.text-agence-detail {
		font-size: 12px;
		color: #666;
		text-align: center;
	}

	.text-mentions {
		font-size: 10px;
		line-height: 1.3;
		color: #999;
		text-align: center;
		padding: 4px;
	}
</style>
