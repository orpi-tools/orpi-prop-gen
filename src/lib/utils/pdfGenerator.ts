import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';
import { get } from 'svelte/store';
import { uiStore, addToast } from '$lib/stores/uiStore';
import { proposalStore } from '$lib/stores/proposalStore';
import { propositionHelpers } from '$lib/db/helpers/propositionHelpers';
import { PropositionStatus } from '$lib/types';
import { buildPdfData } from './pdfDataMapper';

// ─── Constants ────────────────────────────────────────────────────────────────
const A4_WIDTH_MM = 210;
const A4_HEIGHT_MM = 297;
const A4_WIDTH_PX = 794;
const A4_HEIGHT_PX = 1123;
const CAPTURE_SCALE = 2;
const JPEG_QUALITY = 0.95;

/**
 * Static page image paths (served from /static/pdf/).
 * Keys are 0-based array indices → map to 1-based page numbers in final PDF.
 * Example: index 0 → Page 1 (Cover), index 6 → Page 7 (Interlocutrices)
 */
const STATIC_PAGES: Record<number, string> = {
	0: '/pdf/page-01-cover.jpg',           // Page 1 (Cover)
	1: '/pdf/page-02-accroche.jpg',        // Page 2 (Accroche)
	6: '/pdf/page-07-interlocutrices.jpg', // Page 7 (Interlocutrices)
	7: '/pdf/page-08-gli.jpg',             // Page 8 (GLI)
	8: '/pdf/page-09-bareme.jpg',          // Page 9 (Barème transaction)
	9: '/pdf/page-10-bareme-gestion.jpg',  // Page 10 (Barème gestion)
	10: '/pdf/page-11-closing.jpg'         // Page 11 (Closing)
};

/**
 * Dynamic page indices (0-based array indices).
 * Maps to 1-based pages 3, 4, 5, 6 in final PDF:
 * - Index 2 → Page 3 (Votre Bien)
 * - Index 3 → Page 4 (Votre Agence)
 * - Index 4 → Page 5 (Mise en Location)
 * - Index 5 → Page 6 (Simulation Revenus)
 */
const DYNAMIC_PAGE_INDICES = new Set([2, 3, 4, 5]);

/**
 * Load an image as an HTMLImageElement. Returns a data URL.
 * Includes retry logic for transient failures.
 */
function loadImage(src: string, retries = 2): Promise<string> {
	return new Promise((resolve, reject) => {
		const attemptLoad = (attemptsLeft: number) => {
			const img = new Image();
			img.crossOrigin = 'anonymous';
			img.onload = () => {
				const canvas = document.createElement('canvas');
				canvas.width = img.naturalWidth;
				canvas.height = img.naturalHeight;
				const ctx = canvas.getContext('2d');
				if (!ctx) {
					reject(new Error(`Cannot get 2d context for ${src}`));
					return;
				}
				ctx.drawImage(img, 0, 0);
				resolve(canvas.toDataURL('image/jpeg', JPEG_QUALITY));
			};
			img.onerror = () => {
				if (attemptsLeft > 0) {
					// Retry with exponential backoff
					setTimeout(() => attemptLoad(attemptsLeft - 1), 500 * (retries - attemptsLeft + 1));
				} else {
					reject(new Error(`Failed to load image after ${retries + 1} attempts: ${src}`));
				}
			};
			img.src = src;
		};
		attemptLoad(retries);
	});
}

/**
 * Capture a DOM element as a JPEG data URL using html2canvas.
 * Includes timeout to prevent hanging on complex pages.
 */
async function captureElement(element: HTMLElement, timeoutMs = 30000): Promise<string> {
	const timeoutPromise = new Promise<string>((_, reject) =>
		setTimeout(() => reject(new Error(`html2canvas timeout after ${timeoutMs}ms`)), timeoutMs)
	);

	const capturePromise = (async () => {
		const canvas = await html2canvas(element, {
			scale: CAPTURE_SCALE,
			useCORS: true,
			backgroundColor: '#ffffff',
			width: A4_WIDTH_PX,
			height: A4_HEIGHT_PX
		});
		return canvas.toDataURL('image/jpeg', JPEG_QUALITY);
	})();

	return Promise.race([capturePromise, timeoutPromise]);
}

/**
 * Find dynamic page elements in the preview container.
 * Expects elements with data-pdf-page="N" attribute (0-based index).
 */
function findDynamicPageElements(): Map<number, HTMLElement> {
	const elements = new Map<number, HTMLElement>();
	const nodes = document.querySelectorAll<HTMLElement>('[data-pdf-page]');
	for (const node of nodes) {
		const pageIndex = parseInt(node.dataset.pdfPage!, 10);
		if (!isNaN(pageIndex) && DYNAMIC_PAGE_INDICES.has(pageIndex)) {
			elements.set(pageIndex, node);
		}
	}
	return elements;
}

/**
 * Main PDF generation pipeline.
 *
 * @param pageSelection - boolean[11] indicating which pages to include
 */
export async function generatePdf(pageSelection: boolean[]): Promise<void> {
	// Validate input
	if (pageSelection.length !== 11) {
		throw new Error('pageSelection must have exactly 11 elements');
	}

	// Validate at least one page selected
	if (!pageSelection.some(selected => selected)) {
		throw new Error('At least one page must be selected');
	}

	// Set loading state
	uiStore.update((s) => ({ ...s, isPdfGenerating: true }));

	try {
		const pdfData = buildPdfData();
		const doc = new jsPDF('portrait', 'mm', 'a4');
		let isFirstPageAdded = false;

		// Find dynamic page DOM elements
		const dynamicElements = findDynamicPageElements();

		// Process all 11 pages sequentially
		for (let i = 0; i < 11; i++) {
			// Skip unchecked pages
			if (!pageSelection[i]) continue;

			if (STATIC_PAGES[i] !== undefined) {
				// Fixed page — load static JPEG and add to PDF
				try {
					const imgData = await loadImage(STATIC_PAGES[i]);
					if (isFirstPageAdded) {
						doc.addPage();
					}
					doc.addImage(imgData, 'JPEG', 0, 0, A4_WIDTH_MM, A4_HEIGHT_MM);
					isFirstPageAdded = true;
				} catch (error) {
					const errorMsg = error instanceof Error ? error.message : String(error);
					throw new Error(`Impossible de charger page ${i + 1} (fichier statique): ${errorMsg}`);
				}
			} else if (DYNAMIC_PAGE_INDICES.has(i)) {
				// Dynamic page — capture from DOM via html2canvas
				const element = dynamicElements.get(i);
				if (!element) {
					throw new Error(`Élément DOM manquant pour page ${i + 1}. Page non trouvée dans le formulaire.`);
				}
				if (isFirstPageAdded) {
					doc.addPage();
				}
				try {
					const imgData = await captureElement(element);
					doc.addImage(imgData, 'JPEG', 0, 0, A4_WIDTH_MM, A4_HEIGHT_MM);
					isFirstPageAdded = true;
				} catch (error) {
					const errorMsg = error instanceof Error ? error.message : String(error);
					throw new Error(`Impossible de capturer page ${i + 1} (contenu dynamique): ${errorMsg}`);
				}
			} else {
				// Page index has no source (neither static nor dynamic)
				throw new Error(`Configuration page ${i + 1} introuvable. Veuillez contacter le support.`);
			}
		}

		// Download the PDF
		doc.save(pdfData.filename);

		// Update proposition status to finalized (atomically via store.update to prevent race conditions)
		proposalStore.update((proposal) => ({
			...proposal,
			status: PropositionStatus.Finalized,
			pdfGeneratedAt: Date.now(),
			updatedAt: Date.now()
		}));

		// Persist to database
		const proposal = get(proposalStore);
		if (proposal.id) {
			await propositionHelpers.save(proposal);
		}

		// Success toast removed — ConclusionRitual now provides visual confirmation
	} catch (error) {
		console.error('[pdfGenerator] Generation failed:', error);

		// Provide specific error messages based on error type
		let userMessage = 'Erreur lors de la génération. Réessayer ?';
		if (error instanceof Error) {
			if (error.message.includes('html2canvas timeout')) {
				userMessage = 'La capture a pris trop longtemps. Simplifiez le formulaire et réessayez.';
			} else if (error.message.includes('Failed to load image') || error.message.includes('fichier statique')) {
				userMessage = 'Impossible de charger une image. Vérifiez votre connexion.';
			} else if (error.message.includes('Configuration')) {
				userMessage = 'Configuration de PDF invalide. Veuillez contacter le support.';
			} else if (error.message.includes('Élément DOM')) {
				userMessage = 'Élément du formulaire manquant. Rafraîchissez et réessayez.';
			} else {
				userMessage = error.message || userMessage;
			}
		}

		addToast({ message: userMessage, type: 'error' });
		// Do not re-throw — error is already handled and user notified
	} finally {
		// Always reset loading state
		uiStore.update((s) => ({ ...s, isPdfGenerating: false }));
	}
}
