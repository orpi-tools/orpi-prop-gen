<script lang="ts">
	import { previewStore } from '$lib/stores/previewStore';

	interface Props {
		photoUrls?: string[];
	}

	let { photoUrls = [] }: Props = $props();

	const defaultBien = {
		description: ''
	};

	let bien = $derived.by(() => {
		const preview = $previewStore;
		return preview?.bien ? { ...defaultBien, ...preview.bien } : defaultBien;
	});

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
	<img src="/pdf/page-05-location.jpg" alt="Page 5 : La mise en location" class="page-bg" draggable="false" />

	<!-- R1 : PHOTO BIEN 1 -->
	<div class="overlay" style="left: 124px; top: 683px; width: 480px; height: 317px;">
		{#if photoUrls[0]}
			<img src={photoUrls[0]} alt="Bien 1" class="photo-cover" draggable="false" />
		{:else}
			<span class="placeholder">Photo 1</span>
		{/if}
	</div>

	<!-- R2 : PHOTO BIEN 2 -->
	<div class="overlay" style="left: 795px; top: 683px; width: 467px; height: 317px;">
		{#if photoUrls[1]}
			<img src={photoUrls[1]} alt="Bien 2" class="photo-cover" draggable="false" />
		{:else}
			<span class="placeholder">Photo 2</span>
		{/if}
	</div>

	<!-- R3 : PHOTO BIEN 3 -->
	<div class="overlay" style="left: 124px; top: 1085px; width: 480px; height: 317px;">
		{#if photoUrls[2]}
			<img src={photoUrls[2]} alt="Bien 3" class="photo-cover" draggable="false" />
		{:else}
			<span class="placeholder">Photo 3</span>
		{/if}
	</div>

	<!-- R4 : DESCRIPTION BIEN -->
	<div class="overlay overlay-desc" style="left: 794px; top: 1087px; width: 468px; height: 318px;">
		{#if bien.description}
			<span class="text-description">{bien.description}</span>
		{:else}
			<span class="placeholder">Descriptif du bien</span>
		{/if}
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

	.overlay-desc {
		align-items: center;
		padding: 16px;
		overflow: hidden;
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
	.text-description {
		font-size: 20px;
		line-height: 1.5;
		color: #444;
		text-align: center;
	}
</style>
