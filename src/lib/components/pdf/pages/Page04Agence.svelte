<script lang="ts">
	import { previewStore } from '$lib/stores/previewStore';
	import { agencyStore } from '$lib/stores/agencyStore';
	import { userStore } from '$lib/stores/userStore';

	interface Props {
		agencyPhotoUrl?: string;
		gestionnairePhotoUrl?: string;
	}

	let { agencyPhotoUrl, gestionnairePhotoUrl }: Props = $props();

	const defaultBien = {
		proprietairePrenom: '',
		proprietaireNom: ''
	};

	let bien = $derived.by(() => {
		const preview = $previewStore;
		return preview?.bien ? { ...defaultBien, ...preview.bien } : defaultBien;
	});
	let agency = $derived($agencyStore);
	let gestionnaire = $derived($userStore);

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
	<img src="/pdf/page-04-agence.jpg" alt="Page 4 : Votre agence Orpi" class="page-bg" draggable="false" />

	<!-- R1 : NOM AGENCE -->
	{#if agency}
		<div class="overlay overlay-col" style="left: 82px; top: 330px; width: 481px; height: 538px;">
			<span class="text-agence-name">{agency.name}</span>
			<span class="text-agence-info">{agency.address}</span>
			<span class="text-agence-info">Tél : {agency.phone}</span>
			<span class="text-agence-info">{agency.email}</span>
		</div>
	{/if}

	<!-- R2 : PHOTO AGENCE -->
	<div class="overlay" style="left: 589px; top: 273px; width: 753px; height: 615px;">
		{#if agencyPhotoUrl}
			<img src={agencyPhotoUrl} alt="Agence" class="photo-cover" draggable="false" />
		{:else}
			<span class="placeholder">Photo agence</span>
		{/if}
	</div>

	<!-- R3 : PROPRIETAIRE -->
	<div class="overlay" style="left: 66px; top: 1021px; width: 372px; height: 60px;">
		<span class="text-proprietaire">{bien.proprietairePrenom || ''} {bien.proprietaireNom || ''}</span>
	</div>

	<!-- R4 : BADGE GESTIONNAIRE -->
	{#if gestionnaire}
		<div class="overlay badge" style="left: 520px; top: 1668px; width: 344px; height: 155px;">
			{#if gestionnairePhotoUrl}
				<img src={gestionnairePhotoUrl} alt="{gestionnaire.firstName} {gestionnaire.lastName}" class="badge-photo" draggable="false" />
			{:else}
				<div class="badge-initiales">
					{gestionnaire.initiales}
				</div>
			{/if}
			<div class="badge-info">
				<span class="text-gestionnaire-name">{gestionnaire.firstName} {gestionnaire.lastName}</span>
				<span class="text-gestionnaire-detail">{gestionnaire.poste ?? 'Gestionnaire locatif'}</span>
				<span class="text-gestionnaire-detail">{gestionnaire.phone}</span>
				<span class="text-gestionnaire-detail">{gestionnaire.email}</span>
			</div>
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
		gap: 8px;
		align-items: flex-start;
		justify-content: center;
		padding-left: 20px;
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

	/* ─── Badge gestionnaire ─── */
	.badge {
		gap: 12px;
	}

	.badge-photo {
		width: 80px;
		height: 80px;
		border-radius: 50%;
		object-fit: cover;
		flex-shrink: 0;
	}

	.badge-initiales {
		width: 80px;
		height: 80px;
		border-radius: 50%;
		background-color: #1a2b5f;
		color: white;
		font-size: 24px;
		font-weight: 700;
		display: flex;
		justify-content: center;
		align-items: center;
		flex-shrink: 0;
	}

	.badge-info {
		display: flex;
		flex-direction: column;
		gap: 2px;
	}

	/* ─── Typographies ─── */
	.text-agence-name {
		font-size: 38px;
		font-weight: 700;
		color: #1a2b5f;
		text-align: left;
	}

	.text-agence-info {
		font-size: 22px;
		color: #555;
		text-align: left;
	}

	.text-proprietaire {
		font-size: 34px;
		font-weight: 700;
		color: #1a2b5f;
		text-align: center;
	}

	.text-gestionnaire-name {
		font-size: 18px;
		font-weight: 700;
		color: #1a2b5f;
	}

	.text-gestionnaire-detail {
		font-size: 14px;
		color: #666;
	}
</style>
