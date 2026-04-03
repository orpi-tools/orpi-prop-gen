import { get } from 'svelte/store';
import { proposalStore } from '$lib/stores/proposalStore';
import { agencyStore } from '$lib/stores/agencyStore';
import { userStore } from '$lib/stores/userStore';

/**
 * PdfData — snapshot of all data needed for PDF generation.
 * Built from stores via get() (not previewStore).
 */
export interface PdfData {
	generatedAt: string;
	filename: string;
	propositionId: string;

	owner: {
		firstName: string;
		lastName: string;
		fullName: string;
		email: string;
	};
}

/**
 * Format a date as "DD/MM/YYYY" string.
 */
function formatDateForFilename(date: Date): string {
	const y = date.getFullYear();
	const m = String(date.getMonth() + 1).padStart(2, '0');
	const d = String(date.getDate()).padStart(2, '0');
	return `${y}${m}${d}`;
}

/**
 * Sanitize a string for use in a filename (remove accents, special chars).
 */
function sanitizeForFilename(str: string): string {
	return str
		.normalize('NFD')
		.replace(/[\u0300-\u036f]/g, '')
		.replace(/[^a-zA-Z0-9-]/g, '-')
		.replace(/-+/g, '-')
		.replace(/^-|-$/g, '');
}

/**
 * Build a PdfData snapshot from current store values.
 * Uses get() for atomic read — NOT previewStore (debounced).
 */
export function buildPdfData(): PdfData {
	const proposal = get(proposalStore);
	const agency = get(agencyStore);
	const user = get(userStore);

	const now = new Date();
	const firstName = proposal?.bien?.proprietairePrenom || 'Proprietaire';
	const lastName = proposal?.bien?.proprietaireNom || 'Inconnu';
	const fullName = `${firstName} ${lastName}`.trim();

	// Sanitize and truncate to prevent filename length issues (NTFS 255-byte limit)
	const sanitizedFirst = sanitizeForFilename(firstName).slice(0, 30);
	const sanitizedLast = sanitizeForFilename(lastName).slice(0, 30);

	// Include proposalId in filename when both owner names are missing (prevent collisions)
	const hasOwnerName = firstName !== 'Proprietaire' && lastName !== 'Inconnu';
	const filenameBody = hasOwnerName
		? `${sanitizedFirst}-${sanitizedLast}`
		: `${sanitizedFirst}-${sanitizedLast}-${proposal?.id?.slice(0, 8) || 'unknown'}`;

	const filename = `Orpi_${filenameBody}_${formatDateForFilename(now)}.pdf`;
	const generatedAtFormatted = now.toLocaleDateString('fr-FR', {
		day: '2-digit',
		month: 'long',
		year: 'numeric'
	});

	return {
		generatedAt: generatedAtFormatted,
		filename,
		propositionId: proposal?.id || '',

		owner: {
			firstName,
			lastName,
			fullName,
			email: proposal?.bien?.proprietaireEmail || ''
		}
	};
}
