import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { proposalStore } from '$lib/stores/proposalStore';
import { agencyStore } from '$lib/stores/agencyStore';
import { userStore } from '$lib/stores/userStore';
import { uiStore } from '$lib/stores/uiStore';
import { PropositionStatus } from '$lib/types';
import { get } from 'svelte/store';

// ─── Mock jsPDF ──────────────────────────────────────────────────────────────
const mockAddImage = vi.fn();
const mockAddPage = vi.fn();
const mockSave = vi.fn();
const mockDeletePage = vi.fn();
const mockGetNumberOfPages = vi.fn(() => 1);

vi.mock('jspdf', () => ({
	jsPDF: class MockJsPDF {
		addImage = mockAddImage;
		addPage = mockAddPage;
		save = mockSave;
		deletePage = mockDeletePage;
		getNumberOfPages = mockGetNumberOfPages;
	}
}));

// ─── Mock html2canvas ────────────────────────────────────────────────────────
vi.mock('html2canvas', () => ({
	default: vi.fn().mockResolvedValue({
		toDataURL: vi.fn(() => 'data:image/jpeg;base64,dynamicmock')
	})
}));

// ─── Mock propositionHelpers ─────────────────────────────────────────────────
vi.mock('$lib/db/helpers/propositionHelpers', () => ({
	propositionHelpers: {
		save: vi.fn().mockResolvedValue(undefined)
	}
}));

// ─── Mock DOM APIs needed by pdfGenerator ────────────────────────────────────
function createMockElement(pageIndex: number): Record<string, unknown> {
	return {
		dataset: { pdfPage: String(pageIndex) },
		tagName: 'DIV',
		style: {},
		offsetWidth: 794,
		offsetHeight: 1123
	};
}

const mockDynamicElements = [
	createMockElement(2),
	createMockElement(3),
	createMockElement(4),
	createMockElement(5)
];

// Mock document.querySelectorAll for finding dynamic page elements
vi.stubGlobal('document', {
	querySelectorAll: vi.fn((selector: string) => {
		if (selector === '[data-pdf-page]') {
			return mockDynamicElements;
		}
		return [];
	}),
	createElement: vi.fn((tag: string) => {
		if (tag === 'canvas') {
			return {
				width: 0,
				height: 0,
				getContext: vi.fn(() => ({
					drawImage: vi.fn()
				})),
				toDataURL: vi.fn(() => 'data:image/jpeg;base64,staticmock')
			};
		}
		return {};
	})
});

// Mock Image constructor
class MockImage {
	crossOrigin = '';
	naturalWidth = 2480;
	naturalHeight = 3508;
	onload: (() => void) | null = null;
	onerror: (() => void) | null = null;
	private _src = '';

	get src() {
		return this._src;
	}
	set src(value: string) {
		this._src = value;
		// Simulate async image load
		Promise.resolve().then(() => this.onload?.());
	}
}

vi.stubGlobal('Image', MockImage);

describe('pdfGenerator', () => {
	beforeEach(() => {
		vi.clearAllMocks();

		// Reset stores
		proposalStore.set({
			id: 'prop-test-1',
			agencyId: 'agency-1',
			gestionnaireId: 'gest-1',
			status: PropositionStatus.Draft,
			createdAt: Date.now(),
			updatedAt: Date.now(),
			bien: {
				proprietairePrenom: 'Jean',
				proprietaireNom: 'Dupont',
				proprietaireEmail: 'jean@test.com',
				rue: '12 rue Test',
				codePostal: '75001',
				ville: 'Paris',
				adresse: '12 rue Test, 75001 Paris',
				typeLogement: 'Appartement',
				surface: 50,
				nbPieces: 2,
				loyerHC: 800,
				equipements: [],
				description: ''
			},
			simulation: {
				charges: 0,
				tauxGestion: 7.8,
				tauxGLI: 3.0,
				tmi: 30,
				honorairesLocation: 0,
				honorairesEtatLieux: 0,
				bigNumbers: {
					loyerBrutAnnuel: 9600,
					honorairesTTC: 749,
					primeGLI: 288,
					revenuNetTMI: 5994
				}
			}
		});

		agencyStore.set({
			id: 'agency-1',
			name: 'Test Agency',
			address: '1 rue Test',
			phone: '0100000000',
			email: 'test@agency.com',
			tauxGestion: 7.8,
			tauxGLI: 3.0
		});

		userStore.set({
			id: 'gest-1',
			agencyId: 'agency-1',
			firstName: 'Test',
			lastName: 'User',
			email: 'test@user.com',
			phone: '0600000000',
			initiales: 'TU'
		});

		// Reset uiStore
		uiStore.set({
			darkMode: false,
			toasts: [],
			isPdfGenerating: false
		});
	});

	afterEach(() => {
		vi.restoreAllMocks();
	});

	it('sets isPdfGenerating to true then false on success', async () => {
		const { generatePdf } = await import('./pdfGenerator');

		const states: boolean[] = [];
		const unsub = uiStore.subscribe((s) => states.push(s.isPdfGenerating));

		await generatePdf(Array(11).fill(true));
		unsub();

		// Should have been set to true during generation and false after
		expect(states).toContain(true);
		expect(states[states.length - 1]).toBe(false);
	});

	it('calls doc.save with correct filename pattern', async () => {
		const { generatePdf } = await import('./pdfGenerator');
		await generatePdf(Array(11).fill(true));

		expect(mockSave).toHaveBeenCalledTimes(1);
		const filename = mockSave.mock.calls[0][0];
		expect(filename).toMatch(/^Orpi_Jean-Dupont_\d{8}\.pdf$/);
	});

	it('skips unchecked pages', async () => {
		const { generatePdf } = await import('./pdfGenerator');

		// Only include page 1 (index 0 - cover) — a static page
		const selection = Array(11).fill(false);
		selection[0] = true;

		await generatePdf(selection);

		// Should call addImage once for the cover page only
		expect(mockAddImage).toHaveBeenCalledTimes(1);
		// Should not call addPage (only 1 page)
		expect(mockAddPage).not.toHaveBeenCalled();
	});

	it('resets isPdfGenerating on error and shows error toast', async () => {
		const html2canvas = (await import('html2canvas')).default;
		vi.mocked(html2canvas).mockRejectedValueOnce(new Error('capture failed'));

		const { generatePdf } = await import('./pdfGenerator');

		// Only include a dynamic page to trigger the error
		const selection = Array(11).fill(false);
		selection[2] = true; // Page 3 - dynamic

		// Error is caught and not re-thrown (per spec)
		await generatePdf(selection);

		const state = get(uiStore);
		expect(state.isPdfGenerating).toBe(false);
		// Verify error toast was shown with specific error message
		expect(state.toasts.length).toBeGreaterThan(0);
		const errorToast = state.toasts[0];
		expect(errorToast?.type).toBe('error');
		// Error message should be specific (e.g., capture failed, missing element, etc.)
		expect(errorToast?.message).toBeTruthy();
		expect(typeof errorToast?.message).toBe('string');
	});

	it('updates proposition status to Finalized on success', async () => {
		const { propositionHelpers } = await import('$lib/db/helpers/propositionHelpers');
		const { generatePdf } = await import('./pdfGenerator');

		await generatePdf(Array(11).fill(true));

		expect(propositionHelpers.save).toHaveBeenCalledTimes(1);
		const savedProposal = vi.mocked(propositionHelpers.save).mock.calls[0][0];
		expect(savedProposal.status).toBe(PropositionStatus.Finalized);
		expect(savedProposal.pdfGeneratedAt).toBeGreaterThan(0);
	});

	it('does not update status on error', async () => {
		const html2canvas = (await import('html2canvas')).default;
		vi.mocked(html2canvas).mockRejectedValueOnce(new Error('fail'));
		const { propositionHelpers } = await import('$lib/db/helpers/propositionHelpers');
		const { generatePdf } = await import('./pdfGenerator');

		const selection = Array(11).fill(false);
		selection[2] = true; // dynamic page to trigger error

		// Error is caught and not re-thrown (per spec)
		await generatePdf(selection);

		// Verify propositionHelpers.save was not called (status not updated on error)
		expect(propositionHelpers.save).not.toHaveBeenCalled();
	});

	it('processes all 11 pages when all selected', async () => {
		const { generatePdf } = await import('./pdfGenerator');
		await generatePdf(Array(11).fill(true));

		// 7 static + 4 dynamic = 11 addImage calls
		expect(mockAddImage).toHaveBeenCalledTimes(11);
		// 10 addPage calls (first page has no addPage)
		expect(mockAddPage).toHaveBeenCalledTimes(10);
	});

	it('does not show success toast after successful generation', async () => {
		const { generatePdf } = await import('./pdfGenerator');

		await generatePdf(Array(11).fill(true));

		const state = get(uiStore);
		// ConclusionRitual now handles visual confirmation — no success toast from pdfGenerator
		const successToasts = state.toasts.filter((t) => t.type === 'success');
		expect(successToasts).toHaveLength(0);
	});

	it('throws error if pageSelection length is not 11', async () => {
		const { generatePdf } = await import('./pdfGenerator');

		await expect(generatePdf([true, false])).rejects.toThrow(
			'pageSelection must have exactly 11 elements'
		);

		// Verify isPdfGenerating was reset even on validation error
		const state = get(uiStore);
		expect(state.isPdfGenerating).toBe(false);
	});
});
