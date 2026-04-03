import { describe, it, expect } from 'vitest';
import { generateDescription, canGenerate } from './descriptionGenerator';
import type { BienData } from '$lib/types';

function makeBien(overrides: Partial<BienData> = {}): BienData {
	return {
		proprietairePrenom: 'Jean',
		proprietaireNom: 'Dupont',
		proprietaireEmail: '',
		rue: '12 rue de la Paix',
		codePostal: '78000',
		ville: 'Versailles',
		adresse: '12 rue de la Paix, 78000, Versailles',
		typeLogement: 'Appartement',
		surface: 65,
		nbPieces: 3,
		loyerHC: 680,
		equipements: ['balcon', 'parking', 'cave'],
		description: '',
		...overrides
	};
}

describe('canGenerate', () => {
	it('returns true when all required fields are filled and at least 1 equipment', () => {
		expect(canGenerate(makeBien())).toBe(true);
	});

	it('returns false when typeLogement is empty', () => {
		expect(canGenerate(makeBien({ typeLogement: '' }))).toBe(false);
	});

	it('returns false when surface is 0', () => {
		expect(canGenerate(makeBien({ surface: 0 }))).toBe(false);
	});

	it('returns false when nbPieces is 0', () => {
		expect(canGenerate(makeBien({ nbPieces: 0 }))).toBe(false);
	});

	it('returns false when ville is empty', () => {
		expect(canGenerate(makeBien({ ville: '' }))).toBe(false);
	});

	it('returns true when equipements is empty (no longer required)', () => {
		expect(canGenerate(makeBien({ equipements: [] }))).toBe(true);
	});
});

describe('generateDescription', () => {
	it('includes the property type in the description', () => {
		const desc = generateDescription(makeBien({ typeLogement: 'Appartement' }));
		expect(desc.toLowerCase()).toContain('appartement');
	});

	it('includes the surface in m²', () => {
		const desc = generateDescription(makeBien({ surface: 65 }));
		expect(desc).toContain('65');
		expect(desc).toContain('m²');
	});

	it('includes the number of rooms', () => {
		const desc = generateDescription(makeBien({ nbPieces: 3 }));
		expect(desc).toContain('3');
	});

	it('includes the city name', () => {
		const desc = generateDescription(makeBien({ ville: 'Versailles' }));
		expect(desc).toContain('Versailles');
	});

	it('includes equipment mentions', () => {
		const desc = generateDescription(makeBien({ equipements: ['balcon', 'parking'] }));
		const lower = desc.toLowerCase();
		expect(lower).toContain('balcon');
		expect(lower).toContain('parking');
	});

	it('handles a single equipment', () => {
		const desc = generateDescription(makeBien({ equipements: ['ascenseur'] }));
		expect(desc.toLowerCase()).toContain('ascenseur');
	});

	it('handles all equipment types', () => {
		const allEquipements = [
			'balcon',
			'terrasse',
			'parking',
			'cave',
			'ascenseur',
			'gardien',
			'digicode',
			'interphone',
			'meuble'
		];
		const desc = generateDescription(makeBien({ equipements: allEquipements }));
		expect(desc.toLowerCase()).toContain('balcon');
		expect(desc.toLowerCase()).toContain('meublé');
	});

	it('generates different intros for Maison vs Appartement', () => {
		const descAppart = generateDescription(makeBien({ typeLogement: 'Appartement' }));
		const descMaison = generateDescription(makeBien({ typeLogement: 'Maison' }));
		// Both should be valid descriptions but differ
		expect(descAppart.toLowerCase()).toContain('appartement');
		expect(descMaison.toLowerCase()).toContain('maison');
	});

	it('generates description for Studio type', () => {
		const desc = generateDescription(makeBien({ typeLogement: 'Studio', nbPieces: 1 }));
		expect(desc.toLowerCase()).toContain('studio');
	});

	it('generates description for Duplex type', () => {
		const desc = generateDescription(makeBien({ typeLogement: 'Duplex' }));
		expect(desc.toLowerCase()).toContain('duplex');
	});

	it('generates description for Loft type', () => {
		const desc = generateDescription(makeBien({ typeLogement: 'Loft' }));
		expect(desc.toLowerCase()).toContain('loft');
	});

	it('returns a non-empty string', () => {
		const desc = generateDescription(makeBien());
		expect(desc.length).toBeGreaterThan(20);
	});

	it('produces different descriptions on repeated calls (variability)', () => {
		const bien = makeBien();
		const descriptions = new Set<string>();
		// Generate 20 descriptions — at least 2 should differ due to randomization
		for (let i = 0; i < 20; i++) {
			descriptions.add(generateDescription(bien));
		}
		expect(descriptions.size).toBeGreaterThanOrEqual(2);
	});
});
