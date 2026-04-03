import type { BienData } from '$lib/types';

// ─── Données de référence ─────────────────────────────────────────────────

const equipementLabels: Record<string, string> = {
	balcon: 'un balcon',
	terrasse: 'une terrasse',
	jardin: 'un jardin',
	parking: 'un parking',
	garage: 'un garage',
	cave: 'une cave',
	piscine: 'une piscine',
	ascenseur: 'un ascenseur',
	gardien: 'un gardien',
	digicode: 'un digicode',
	interphone: 'un interphone',
	'cuisine-equipee': 'une cuisine équipée',
	'double-vitrage': 'un double vitrage',
	lumineux: 'lumineux',
	meuble: 'meublé'
};

const adjectiveEquipments = new Set(['lumineux', 'meuble']);

const feminineTypes = new Set(['Maison', 'Chambre']);

// ─── Banques de phrases ───────────────────────────────────────────────────

const openings: Record<string, string[]> = {
	Appartement: [
		'Votre appartement',
		'Cet appartement de qualité',
		'Bel appartement',
		'Cet agréable appartement',
		'Cet appartement soigné'
	],
	Maison: [
		'Votre maison',
		'Cette maison de caractère',
		'Belle maison',
		'Cette agréable maison',
		'Cette maison soignée'
	],
	Studio: [
		'Votre studio',
		'Ce studio bien agencé',
		'Ce studio fonctionnel',
		'Cet agréable studio'
	],
	Duplex: [
		'Votre duplex',
		'Ce duplex de standing',
		'Beau duplex',
		'Ce spacieux duplex'
	],
	Loft: [
		'Votre loft',
		'Ce loft de caractère',
		'Ce loft au cachet unique',
		'Ce spacieux loft'
	],
	Chambre: [
		'Votre chambre',
		'Cette chambre confortable',
		'Cette agréable chambre'
	]
};

const defaultOpenings = [
	'Votre bien',
	'Ce bien de qualité',
	'Ce logement soigné'
];

const locationPhrases = {
	standard: [
		'situé${e} à ${ville}',
		'idéalement situé${e} à ${ville}',
		'implanté${e} à ${ville}',
		'au cœur de ${ville}',
		'dans un quartier prisé de ${ville}'
	],
	withAddress: [
		'situé${e} ${rue}, à ${ville}',
		'idéalement positionné${e} ${rue} à ${ville}',
		'implanté${e} ${rue}, en plein ${ville}'
	]
};

const surfacePhrases = [
	'offre une belle surface de ${surface} m²',
	'd\'une surface de ${surface} m²',
	'développe ${surface} m² de surface habitable',
	's\'étend sur ${surface} m² bien agencés'
];

const roomPhrases: Record<string, string[]> = {
	'1': ['comprenant 1 pièce principale'],
	'2': ['comprenant 2 pièces', 'avec ses 2 pièces bien distribuées'],
	'3': [
		'comprenant 3 pièces',
		'avec ses 3 pièces fonctionnelles',
		'disposant de 3 pièces agréables à vivre'
	],
	default: [
		'comprenant ${n} pièces',
		'avec ses ${n} pièces bien distribuées',
		'disposant de ${n} pièces fonctionnelles'
	]
};

const floorPhrases = [
	'Situé${e} au ${etage}ème étage',
	'Au ${etage}ème étage de l\'immeuble',
	'Positionné${e} au ${etage}ème étage'
];

const floorRdcPhrases = [
	'En rez-de-chaussée',
	'Situé${e} en rez-de-chaussée',
	'Au rez-de-chaussée de l\'immeuble'
];

const expositionPhrases: Record<string, string[]> = {
	Sud: [
		'bénéficiant d\'une exposition plein sud',
		'avec une belle exposition sud très lumineuse',
		'baigné${e} de lumière grâce à son exposition sud'
	],
	Nord: [
		'avec une exposition nord',
		'orienté${e} au nord'
	],
	Est: [
		'bénéficiant d\'une exposition est',
		'avec une belle luminosité matinale grâce à son orientation est',
		'orienté${e} est, profitant du soleil du matin'
	],
	Ouest: [
		'bénéficiant d\'une exposition ouest',
		'avec une belle lumière de fin de journée grâce à son orientation ouest',
		'orienté${e} ouest'
	],
	'Sud-Est': [
		'bénéficiant d\'une exposition sud-est très agréable',
		'avec une orientation sud-est idéale',
		'baigné${e} de lumière grâce à son exposition sud-est'
	],
	'Sud-Ouest': [
		'bénéficiant d\'une exposition sud-ouest privilégiée',
		'avec une orientation sud-ouest et une belle luminosité',
		'profitant d\'une exposition sud-ouest très recherchée'
	],
	'Nord-Est': [
		'avec une exposition nord-est',
		'orienté${e} nord-est'
	],
	'Nord-Ouest': [
		'avec une exposition nord-ouest',
		'orienté${e} nord-ouest'
	]
};

const equipmentIntros = [
	'Il bénéficie de',
	'Parmi ses atouts, on retrouve',
	'Le bien dispose de',
	'On apprécie particulièrement',
	'Il se distingue par'
];

const closingPhrases = [
	'Un bien qui présente de réels atouts pour une mise en gestion locative sereine.',
	'Ses caractéristiques en font un bien particulièrement attractif sur le marché locatif.',
	'Un bien de qualité qui saura séduire les locataires les plus exigeants.',
	'Des prestations de qualité qui garantissent une mise en location rapide et pérenne.',
	'Un bien qui réunit tous les critères pour une gestion locative performante.'
];

const rentPhrases = [
	'Le loyer est estimé à ${loyer} €/mois hors charges',
	'Avec un loyer de ${loyer} € hors charges mensuelles',
	'Le loyer proposé s\'élève à ${loyer} €/mois hors charges'
];

// ─── Utilitaires ──────────────────────────────────────────────────────────

function pick<T>(arr: T[]): T {
	return arr[Math.floor(Math.random() * arr.length)];
}

function applyAccord(template: string, feminine: boolean): string {
	return template.replace(/\$\{e\}/g, feminine ? 'e' : '');
}

function applyVars(template: string, vars: Record<string, string | number>): string {
	let result = template;
	for (const [key, value] of Object.entries(vars)) {
		result = result.replace(new RegExp(`\\$\\{${key}\\}`, 'g'), String(value));
	}
	return result;
}

function formatEquipements(equipements: string[]): { nouns: string[]; adjectives: string[] } {
	const nouns: string[] = [];
	const adjectives: string[] = [];

	for (const eq of equipements) {
		const label = equipementLabels[eq];
		if (!label) continue;
		if (adjectiveEquipments.has(eq)) {
			adjectives.push(label);
		} else {
			nouns.push(label);
		}
	}

	return { nouns, adjectives };
}

function joinList(items: string[]): string {
	if (items.length === 0) return '';
	if (items.length === 1) return items[0];
	if (items.length === 2) return `${items[0]} et ${items[1]}`;
	const last = items[items.length - 1];
	return `${items.slice(0, -1).join(', ')} et ${last}`;
}

/**
 * Apply French elision rules: "de un" → "d'un", "de une" → "d'une", etc.
 */
function applyElision(text: string): string {
	return text
		.replace(/\bde un/gi, "d'un")
		.replace(/\bde une/gi, "d'une")
		.replace(/\bde il/gi, "d'il")
		.replace(/\bque il/gi, "qu'il")
		.replace(/\bque elle/gi, "qu'elle");
}

// ─── API publique ─────────────────────────────────────────────────────────

/**
 * Check if enough data is available to generate a description.
 * Requires: typeLogement, surface > 0, nbPieces > 0, ville.
 */
export function canGenerate(bien: BienData): boolean {
	return (
		bien.typeLogement.trim() !== '' &&
		bien.surface > 0 &&
		bien.nbPieces > 0 &&
		bien.ville.trim() !== ''
	);
}

/**
 * Generate a professional property description in French from BienData fields.
 * Advanced template engine — no API calls, 100% local.
 * Produces varied, natural descriptions adapted to the property type.
 */
export function generateDescription(bien: BienData): string {
	const { typeLogement, surface, nbPieces, ville, rue, equipements, loyerHC, etage, exposition } =
		bien;

	const isFeminine = feminineTypes.has(typeLogement);
	const vars = {
		ville,
		rue,
		surface,
		n: nbPieces,
		loyer: loyerHC,
		etage: etage ?? 0
	};

	const paragraphs: string[] = [];

	// ── Phrase 1 : Ouverture + surface + localisation ──────────────────────

	const opening = pick(openings[typeLogement] || defaultOpenings);
	const surfacePhrase = applyVars(pick(surfacePhrases), vars);

	const hasRue = rue && rue.trim() !== '';
	const locationPool = hasRue
		? [...locationPhrases.standard, ...locationPhrases.withAddress]
		: locationPhrases.standard;
	const locationPhrase = applyAccord(applyVars(pick(locationPool), vars), isFeminine);

	const roomPool = roomPhrases[String(nbPieces)] || roomPhrases['default'];
	const roomPhrase = applyVars(pick(roomPool), vars);

	paragraphs.push(`${opening} ${surfacePhrase}, ${locationPhrase}, ${roomPhrase}.`);

	// ── Phrase 2 : Étage + exposition (si disponibles) ─────────────────────

	const details: string[] = [];

	if (etage !== undefined && etage !== null) {
		if (etage === 0) {
			details.push(applyAccord(pick(floorRdcPhrases), isFeminine));
		} else {
			details.push(applyAccord(applyVars(pick(floorPhrases), vars), isFeminine));
		}
	}

	if (exposition && expositionPhrases[exposition]) {
		details.push(applyAccord(pick(expositionPhrases[exposition]), isFeminine));
	}

	if (details.length > 0) {
		paragraphs.push(details.join(', ') + '.');
	}

	// ── Phrase 3 : Équipements ─────────────────────────────────────────────

	if (equipements.length > 0) {
		const { nouns, adjectives } = formatEquipements(equipements);

		// Filter out "lumineux" if already mentioned in opening or exposition
		const openingLower = opening.toLowerCase();
		const alreadyMentionsLumineux =
			openingLower.includes('lumineu') ||
			paragraphs.some((s) => s.toLowerCase().includes('lumineu'));
		const filteredAdjectives = alreadyMentionsLumineux
			? adjectives.filter((a) => a !== 'lumineux')
			: adjectives;

		const parts: string[] = [];

		if (nouns.length > 0) {
			const intro = pick(equipmentIntros);
			parts.push(`${intro} ${joinList(nouns)}.`);
		}

		if (filteredAdjectives.length > 0) {
			const adjectivePhrase =
				filteredAdjectives.length === 1
					? `Ce bien est ${filteredAdjectives[0]}.`
					: `Ce bien est ${joinList(filteredAdjectives)}.`;
			parts.push(adjectivePhrase);
		}

		if (parts.length > 0) {
			paragraphs.push(parts.join(' '));
		}
	}

	// ── Phrase 4 : Loyer (si renseigné) ───────────────────────────────────

	if (loyerHC > 0) {
		paragraphs.push(
			applyVars(pick(rentPhrases), vars) + '.'
		);
	}

	// ── Phrase 5 : Conclusion ─────────────────────────────────────────────

	paragraphs.push(pick(closingPhrases));

	return applyElision(paragraphs.join(' '));
}
