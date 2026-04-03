import type { BigNumbers } from '$lib/types';

// ─── Calculs annuels ──────────────────────────────────────────────────────

export function calculateLoyerBrutAnnuel(loyerHC: number): number {
	return Math.round(loyerHC * 12);
}

export function calculateHonorairesTTC(loyerHC: number, tauxGestion: number): number {
	return Math.round(loyerHC * (tauxGestion / 100) * 12);
}

export function calculatePrimeGLI(loyerHC: number, tauxGLI: number): number {
	return Math.round(loyerHC * (tauxGLI / 100) * 12);
}

export function calculateRevenuNetTMI(
	loyerBrutAnnuel: number,
	honorairesTTC: number,
	primeGLI: number,
	tmi: number
): number {
	return Math.round((loyerBrutAnnuel - honorairesTTC - primeGLI) * (1 - tmi / 100));
}

// ─── Calculs mensuels ─────────────────────────────────────────────────────

export function calculateHonorairesMensuel(loyerHC: number, tauxGestion: number): number {
	return Math.round(loyerHC * (tauxGestion / 100));
}

export function calculateGLIMensuel(loyerHC: number, tauxGLI: number): number {
	return Math.round(loyerHC * (tauxGLI / 100));
}

export function calculateQuittancement(loyerHC: number, charges: number): number {
	return loyerHC + charges;
}

export function calculateRevenuNetMensuel(
	loyerHC: number,
	tauxGestion: number,
	tauxGLI: number
): number {
	return Math.round(loyerHC - calculateHonorairesMensuel(loyerHC, tauxGestion) - calculateGLIMensuel(loyerHC, tauxGLI));
}

// ─── Composite ────────────────────────────────────────────────────────────

interface CalculationInput {
	loyerHC: number;
	tauxGestion: number;
	tauxGLI: number;
	tmi: number;
}

export interface MonthlyNumbers {
	quittancement: number;
	honorairesGestion: number;
	primeGLI: number;
	revenuNet: number;
}

export function calculateBigNumbers(input: CalculationInput): BigNumbers {
	const loyerBrutAnnuel = calculateLoyerBrutAnnuel(input.loyerHC);
	const honorairesTTC = calculateHonorairesTTC(input.loyerHC, input.tauxGestion);
	const primeGLI = calculatePrimeGLI(input.loyerHC, input.tauxGLI);
	const revenuNetTMI = calculateRevenuNetTMI(loyerBrutAnnuel, honorairesTTC, primeGLI, input.tmi);

	return { loyerBrutAnnuel, honorairesTTC, primeGLI, revenuNetTMI };
}

export function calculateMonthlyNumbers(input: CalculationInput & { charges: number }): MonthlyNumbers {
	return {
		quittancement: calculateQuittancement(input.loyerHC, input.charges),
		honorairesGestion: calculateHonorairesMensuel(input.loyerHC, input.tauxGestion),
		primeGLI: calculateGLIMensuel(input.loyerHC, input.tauxGLI),
		revenuNet: calculateRevenuNetMensuel(input.loyerHC, input.tauxGestion, input.tauxGLI)
	};
}
