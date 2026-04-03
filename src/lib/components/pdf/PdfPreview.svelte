<script lang="ts">
	import PdfPage from './PdfPage.svelte';
	import PdfPageFixed from './PdfPageFixed.svelte';
	import Page03Bien from './pages/Page03Bien.svelte';
	import Page04Agence from './pages/Page04Agence.svelte';
	import Page05Location from './pages/Page05Location.svelte';
	import Page06Simulation from './pages/Page06Simulation.svelte';
	import { proposalStore } from '$lib/stores/proposalStore';
	import { agencyStore } from '$lib/stores/agencyStore';
	import { userStore } from '$lib/stores/userStore';
	import { photoHelpers } from '$lib/db/helpers/photoHelpers';
	import { createBlobUrl, revokeBlobUrl } from '$lib/utils/blobUrl';

	interface Props {
		currentStep: number;
	}

	let { currentStep }: Props = $props();

	// ─── Photo blob URLs ───────────────────────────────────────────────────
	let photoUrls: string[] = $state([]);
	let agencyPhotoUrl: string | undefined = $state(undefined);
	let gestionnairePhotoUrl: string | undefined = $state(undefined);

	// Charger les photos de la proposition
	$effect(() => {
		const proposalId = $proposalStore?.id;
		if (!proposalId) return;

		let cancelled = false;
		let urls: string[] = [];

		// F2: reset immédiat pour éviter d'afficher des URLs révoquées
		photoUrls = [];

		photoHelpers.getByProposition(proposalId).then((photos) => {
			if (cancelled) return;
			const newUrls: string[] = [];
			for (const photo of photos) {
				try {
					newUrls.push(createBlobUrl(new Blob([photo.blob], { type: photo.mimeType })));
				} catch (err) {
					// F4: quota exhausted ou blob invalide — skip cette photo
					console.error('[PdfPreview] Blob URL creation failed:', err);
				}
			}
			urls = newUrls;
			photoUrls = newUrls;
		}).catch((err) => {
			// F3: reset photoUrls en cas d'échec DB
			console.error('[PdfPreview] Photo load failed:', err);
			photoUrls = [];
		});

		return () => {
			cancelled = true;
			// F1: révoquer les URLs effectivement créées via la référence locale
			urls.forEach((url) => revokeBlobUrl(url));
		};
	});

	// Photo agence
	$effect(() => {
		const agency = $agencyStore;
		if (!agency?.photoAgence) { agencyPhotoUrl = undefined; return; }
		const url = createBlobUrl(agency.photoAgence);
		agencyPhotoUrl = url;
		return () => revokeBlobUrl(url);
	});

	// Photo gestionnaire
	$effect(() => {
		const user = $userStore;
		if (!user?.photo) { gestionnairePhotoUrl = undefined; return; }
		const url = createBlobUrl(user.photo);
		gestionnairePhotoUrl = url;
		return () => revokeBlobUrl(url);
	});

	// ─── Page definitions ──────────────────────────────────────────────────
	type FixedPage = { type: 'fixed'; src: string; alt: string };
	type DynamicPage = { type: 'dynamic'; component: 'Page03Bien' | 'Page04Agence' | 'Page05Location' | 'Page06Simulation' };
	type PageDef = FixedPage | DynamicPage;

	// pages.length utilisé comme TOTAL_PAGES (évite la redondance)
	const pages: PageDef[] = [
		{ type: 'fixed', src: '/pdf/page-01-cover.jpg', alt: 'Couverture' },
		{ type: 'fixed', src: '/pdf/page-02-accroche.jpg', alt: 'Accroche — Gérer un bien' },
		{ type: 'dynamic', component: 'Page03Bien' },
		{ type: 'dynamic', component: 'Page04Agence' },
		{ type: 'dynamic', component: 'Page05Location' },
		{ type: 'dynamic', component: 'Page06Simulation' },
		{ type: 'fixed', src: '/pdf/page-07-interlocutrices.jpg', alt: 'Vos interlocutrices privilégiées' },
		{ type: 'fixed', src: '/pdf/page-08-gli.jpg', alt: 'Garantie Loyers Impayés' },
		{ type: 'fixed', src: '/pdf/page-09-bareme.jpg', alt: 'Barème de transaction' },
		{ type: 'fixed', src: '/pdf/page-10-bareme-gestion.jpg', alt: 'Barème de gestion' },
		{ type: 'fixed', src: '/pdf/page-11-closing.jpg', alt: 'Conclusion' }
	];

	// ─── Zoom ──────────────────────────────────────────────────────────────
	let zoom = $state(100);

	// ─── Scroll sync ───────────────────────────────────────────────────────
	const stepToPage: Record<number, number> = { 1: 0, 2: 5, 3: 7 };
	let pageRefs: (HTMLDivElement | undefined)[] = $state(Array(pages.length));

	$effect(() => {
		const targetPage = stepToPage[currentStep];
		if (targetPage === undefined) {
			console.warn('[PdfPreview] currentStep inconnu:', currentStep);
		}
		const ref = pageRefs[targetPage ?? 0];
		if (ref) {
			ref.scrollIntoView({ behavior: 'smooth', block: 'start' });
		}
	});
</script>

<div class="relative h-full overflow-y-auto bg-gray-100 dark:bg-gray-800">
	<!-- Zoom slider -->
	<div class="sticky top-0 z-10 flex items-center gap-2 bg-gray-100/90 px-4 py-2 backdrop-blur-sm dark:bg-gray-800/90">
		<svg class="h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
			<path stroke-linecap="round" stroke-linejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" />
		</svg>
		<input
			type="range"
			min="50"
			max="200"
			step="5"
			bind:value={zoom}
			class="h-1.5 flex-1 cursor-pointer appearance-none rounded-full bg-gray-300 accent-[var(--color-orpi-red)] dark:bg-gray-600"
		/>
		<span class="w-10 text-right text-xs font-medium text-gray-500 dark:text-gray-400">{zoom}%</span>
	</div>
	<div class="p-4">
	<div class="mx-auto space-y-4" style="max-width: {Math.round(448 * zoom / 100)}px;">
		{#each pages as page, i (i)}
			<div bind:this={pageRefs[i]}>
				<PdfPage pageNum={i + 1} totalPages={pages.length}>
					{#if page.type === 'fixed'}
						<PdfPageFixed src={page.src} alt={page.alt} />
					{:else if page.component === 'Page03Bien'}
						<Page03Bien photoUrl={photoUrls[0]} />
					{:else if page.component === 'Page04Agence'}
						<Page04Agence {agencyPhotoUrl} {gestionnairePhotoUrl} />
					{:else if page.component === 'Page05Location'}
						<Page05Location photoUrls={photoUrls.slice(0, 3)} />
					{:else if page.component === 'Page06Simulation'}
						<Page06Simulation />
					{/if}
				</PdfPage>
			</div>
		{/each}
	</div>
	</div>
</div>

<!-- Hidden capture container for PDF generation (html2canvas) -->
<div class="pdf-capture-container" aria-hidden="true">
	<div data-pdf-page="2" class="pdf-capture-page">
		<Page03Bien photoUrl={photoUrls[0]} />
	</div>
	<div data-pdf-page="3" class="pdf-capture-page">
		<Page04Agence {agencyPhotoUrl} {gestionnairePhotoUrl} />
	</div>
	<div data-pdf-page="4" class="pdf-capture-page">
		<Page05Location photoUrls={photoUrls.slice(0, 3)} />
	</div>
	<div data-pdf-page="5" class="pdf-capture-page">
		<Page06Simulation />
	</div>
</div>

<style>
	.pdf-capture-container {
		position: absolute;
		left: -9999px;
		top: 0;
		pointer-events: none;
		/* Force light mode for PDF capture — prevent dark: classes from applying */
		color-scheme: light !important;
	}
	.pdf-capture-container,
	.pdf-capture-container * {
		--color-bg: white !important;
		--color-bg-card: white !important;
		--color-text: #1f2937 !important;
		--color-border: #e5e7eb !important;
	}
	.pdf-capture-page {
		width: 794px;
		height: 1123px;
		overflow: hidden;
		background: white;
	}
</style>
