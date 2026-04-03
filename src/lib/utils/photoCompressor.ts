export const ACCEPTED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp'] as const;

export interface CompressOptions {
	maxWidth?: number;
	quality?: number;
}

const DEFAULT_MAX_WIDTH = 1200;
const DEFAULT_QUALITY = 0.8;

/**
 * Compress a photo file using Canvas API.
 * Resizes to maxWidth (default 1200px) keeping aspect ratio,
 * outputs JPEG at given quality (default 80%).
 * Returns compressed image as ArrayBuffer.
 */
export async function compressPhoto(
	file: File,
	options: CompressOptions = {}
): Promise<ArrayBuffer> {
	const { maxWidth = DEFAULT_MAX_WIDTH, quality = DEFAULT_QUALITY } = options;

	const objectUrl = URL.createObjectURL(file);

	try {
		const img = await loadImage(objectUrl);

		let { width, height } = img;

		// Scale down if larger than maxWidth (never upscale)
		if (width > maxWidth) {
			const ratio = maxWidth / width;
			width = maxWidth;
			height = Math.round(height * ratio);
		}

		const canvas = document.createElement('canvas');
		canvas.width = width;
		canvas.height = height;

		const ctx = canvas.getContext('2d');
		if (!ctx) {
			throw new Error('Cannot get canvas 2d context');
		}

		ctx.drawImage(img, 0, 0, width, height);

		const blob = await canvasToBlob(canvas, quality);
		return blob.arrayBuffer();
	} finally {
		URL.revokeObjectURL(objectUrl);
	}
}

function loadImage(src: string): Promise<HTMLImageElement> {
	return new Promise((resolve, reject) => {
		const img = new Image();
		img.onload = () => resolve(img);
		img.onerror = (e) => reject(new Error(`Failed to load image: ${e}`));
		img.src = src;
	});
}

function canvasToBlob(canvas: HTMLCanvasElement, quality: number): Promise<Blob> {
	return new Promise((resolve, reject) => {
		canvas.toBlob(
			(blob) => {
				if (blob) {
					resolve(blob);
				} else {
					reject(new Error('Canvas toBlob returned null'));
				}
			},
			'image/jpeg',
			quality
		);
	});
}
