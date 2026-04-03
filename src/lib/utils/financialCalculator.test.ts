import { describe, it, expect } from 'vitest';
import {
	calculateBigNumbers,
	calculateLoyerBrutAnnuel,
	calculateHonorairesTTC,
	calculatePrimeGLI,
	calculateRevenuNetTMI
} from './financialCalculator';

describe('calculateLoyerBrutAnnuel', () => {
	it('multiplie le loyer HC par 12', () => {
		expect(calculateLoyerBrutAnnuel(680)).toBe(8160);
	});

	it('retourne 0 pour un loyer de 0', () => {
		expect(calculateLoyerBrutAnnuel(0)).toBe(0);
	});

	it('arrondit au euro le plus proche', () => {
		expect(calculateLoyerBrutAnnuel(99.99)).toBe(1200);
	});
});

describe('calculateHonorairesTTC', () => {
	it('calcule les honoraires annuels TTC', () => {
		// 680 * 7.8/100 * 12 = 636.48 → 636
		expect(calculateHonorairesTTC(680, 7.8)).toBe(636);
	});

	it('retourne 0 pour un taux de 0%', () => {
		expect(calculateHonorairesTTC(680, 0)).toBe(0);
	});

	it('retourne 0 pour un loyer de 0', () => {
		expect(calculateHonorairesTTC(0, 7.8)).toBe(0);
	});
});

describe('calculatePrimeGLI', () => {
	it('calcule la prime GLI annuelle', () => {
		// 680 * 3.0/100 * 12 = 244.8 → 245
		expect(calculatePrimeGLI(680, 3.0)).toBe(245);
	});

	it('retourne 0 pour un taux de 0%', () => {
		expect(calculatePrimeGLI(680, 0)).toBe(0);
	});

	it('retourne 0 pour un loyer de 0', () => {
		expect(calculatePrimeGLI(0, 3.0)).toBe(0);
	});
});

describe('calculateRevenuNetTMI', () => {
	it('calcule le revenu net après TMI à 30%', () => {
		// (8160 - 636 - 245) * (1 - 0.30) = 7279 * 0.70 = 5095.3 → 5095
		expect(calculateRevenuNetTMI(8160, 636, 245, 30)).toBe(5095);
	});

	it('retourne le revenu brut avec TMI à 0%', () => {
		// (8160 - 636 - 245) * (1 - 0) = 7279
		expect(calculateRevenuNetTMI(8160, 636, 245, 0)).toBe(7279);
	});

	it('calcule avec TMI à 45%', () => {
		// (8160 - 636 - 245) * (1 - 0.45) = 7279 * 0.55 = 4003.45 → 4003
		expect(calculateRevenuNetTMI(8160, 636, 245, 45)).toBe(4003);
	});

	it('retourne 0 quand les charges dépassent le revenu', () => {
		// (1000 - 600 - 500) * (1 - 0.30) = -100 * 0.70 = -70 → -70 (peut être négatif)
		expect(calculateRevenuNetTMI(1000, 600, 500, 30)).toBe(-70);
	});
});

describe('calculateBigNumbers', () => {
	it('calcule les 4 indicateurs pour un cas standard', () => {
		const result = calculateBigNumbers({
			loyerHC: 680,
			tauxGestion: 7.8,
			tauxGLI: 3.0,
			tmi: 30
		});

		expect(result.loyerBrutAnnuel).toBe(8160);
		expect(result.honorairesTTC).toBe(636);
		expect(result.primeGLI).toBe(245);
		expect(result.revenuNetTMI).toBe(5095);
	});

	it('calcule correctement avec tous les paramètres à 0', () => {
		const result = calculateBigNumbers({
			loyerHC: 0,
			tauxGestion: 0,
			tauxGLI: 0,
			tmi: 0
		});

		expect(result.loyerBrutAnnuel).toBe(0);
		expect(result.honorairesTTC).toBe(0);
		expect(result.primeGLI).toBe(0);
		expect(result.revenuNetTMI).toBe(0);
	});

	it('calcule avec TMI à 11%', () => {
		const result = calculateBigNumbers({
			loyerHC: 1000,
			tauxGestion: 7.8,
			tauxGLI: 3.0,
			tmi: 11
		});

		expect(result.loyerBrutAnnuel).toBe(12000);
		// 1000 * 7.8/100 * 12 = 936
		expect(result.honorairesTTC).toBe(936);
		// 1000 * 3.0/100 * 12 = 360
		expect(result.primeGLI).toBe(360);
		// (12000 - 936 - 360) * (1 - 0.11) = 10704 * 0.89 = 9526.56 → 9527
		expect(result.revenuNetTMI).toBe(9527);
	});

	it('calcule avec TMI à 41%', () => {
		const result = calculateBigNumbers({
			loyerHC: 500,
			tauxGestion: 10,
			tauxGLI: 2.5,
			tmi: 41
		});

		expect(result.loyerBrutAnnuel).toBe(6000);
		// 500 * 10/100 * 12 = 600
		expect(result.honorairesTTC).toBe(600);
		// 500 * 2.5/100 * 12 = 150
		expect(result.primeGLI).toBe(150);
		// (6000 - 600 - 150) * (1 - 0.41) = 5250 * 0.59 = 3097.5 → 3098
		expect(result.revenuNetTMI).toBe(3098);
	});

	it('produit des valeurs cohérentes avec les fonctions individuelles', () => {
		const params = { loyerHC: 750, tauxGestion: 8.5, tauxGLI: 2.8, tmi: 30 };
		const result = calculateBigNumbers(params);

		expect(result.loyerBrutAnnuel).toBe(calculateLoyerBrutAnnuel(params.loyerHC));
		expect(result.honorairesTTC).toBe(calculateHonorairesTTC(params.loyerHC, params.tauxGestion));
		expect(result.primeGLI).toBe(calculatePrimeGLI(params.loyerHC, params.tauxGLI));
		expect(result.revenuNetTMI).toBe(
			calculateRevenuNetTMI(
				result.loyerBrutAnnuel,
				result.honorairesTTC,
				result.primeGLI,
				params.tmi
			)
		);
	});
});
