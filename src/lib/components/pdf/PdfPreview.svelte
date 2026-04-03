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

<div class="h-full overflow-y-auto bg-gray-100 p-4 dark:bg-gray-800">
	<div class="mx-auto max-w-md space-y-4">
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
