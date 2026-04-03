import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { ACCEPTED_MIME_TYPES } from './photoCompressor';

describe('ACCEPTED_MIME_TYPES', () => {
	it('accepts image/jpeg', () => {
		expect(ACCEPTED_MIME_TYPES).toContain('image/jpeg');
	});

	it('accepts image/png', () => {
		expect(ACCEPTED_MIME_TYPES).toContain('image/png');
	});

	it('accepts image/webp', () => {
		expect(ACCEPTED_MIME_TYPES).toContain('image/webp');
	});

	it('has exactly 3 accepted types', () => {
		expect(ACCEPTED_MIME_TYPES).toHaveLength(3);
	});
});

describe('compressPhoto', () => {
	let mockCtx: { drawImage: ReturnType<typeof vi.fn> };
	let mockCanvas: {
		width: number;
		height: number;
		getContext: ReturnType<typeof vi.fn>;
		toBlob: ReturnType<typeof vi.fn>;
	};

	function stubImage(width: number, height: number, shouldFail = false) {
		class MockImage {
			_src = '';
			width = 0;
			height = 0;
			onload: (() => void) | null = null;
			onerror: ((e: unknown) => void) | null = null;

			set src(_val: string) {
				setTimeout(() => {
					if (shouldFail) {
						if (this.onerror) this.onerror(new Error('load failed'));
					} else {
						this.width = width;
						this.height = height;
						if (this.onload) this.onload();
					}
				}, 0);
			}

			get src() {
				return this._src;
			}
		}

		vi.stubGlobal('Image', MockImage);
	}

	beforeEach(() => {
		mockCtx = { drawImage: vi.fn() };
		mockCanvas = {
			width: 0,
			height: 0,
			getContext: vi.fn(() => mockCtx),
			toBlob: vi.fn((callback: (blob: Blob | null) => void) => {
				callback(new Blob(['compressed'], { type: 'image/jpeg' }));
			})
		};

		vi.stubGlobal('document', {
			createElement: vi.fn((tag: string) => {
				if (tag === 'canvas') return mockCanvas;
				throw new Error(`Unexpected createElement: ${tag}`);
			})
		});

		stubImage(2400, 1600);

		vi.stubGlobal('URL', {
			...globalThis.URL,
			createObjectURL: vi.fn(() => 'blob:mock-url'),
			revokeObjectURL: vi.fn()
		});
	});

	afterEach(() => {
		vi.restoreAllMocks();
		vi.unstubAllGlobals();
	});

	it('returns an ArrayBuffer', async () => {
		const { compressPhoto } = await import('./photoCompressor');
		const file = new File(['test'], 'photo.jpg', { type: 'image/jpeg' });
		const result = await compressPhoto(file);
		expect(result).toBeInstanceOf(ArrayBuffer);
	});

	it('creates an object URL and revokes it after compression', async () => {
		const { compressPhoto } = await import('./photoCompressor');
		const file = new File(['test'], 'photo.jpg', { type: 'image/jpeg' });
		await compressPhoto(file);
		expect(URL.createObjectURL).toHaveBeenCalledWith(file);
		expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:mock-url');
	});

	it('scales down images wider than maxWidth', async () => {
		const { compressPhoto } = await import('./photoCompressor');
		const file = new File(['test'], 'photo.jpg', { type: 'image/jpeg' });
		await compressPhoto(file);
		expect(mockCanvas.width).toBe(1200);
		expect(mockCanvas.height).toBe(800);
	});

	it('respects custom maxWidth option', async () => {
		const { compressPhoto } = await import('./photoCompressor');
		const file = new File(['test'], 'photo.jpg', { type: 'image/jpeg' });
		await compressPhoto(file, { maxWidth: 600 });
		expect(mockCanvas.width).toBe(600);
		expect(mockCanvas.height).toBe(400);
	});

	it('does not upscale images smaller than maxWidth', async () => {
		stubImage(800, 600);

		const { compressPhoto } = await import('./photoCompressor');
		const file = new File(['test'], 'small.jpg', { type: 'image/jpeg' });
		await compressPhoto(file, { maxWidth: 1200 });
		expect(mockCanvas.width).toBe(800);
		expect(mockCanvas.height).toBe(600);
	});

	it('rejects if image fails to load', async () => {
		stubImage(0, 0, true);

		const { compressPhoto } = await import('./photoCompressor');
		const file = new File(['bad'], 'broken.jpg', { type: 'image/jpeg' });
		await expect(compressPhoto(file)).rejects.toThrow();
	});

	it('rejects if canvas.toBlob returns null', async () => {
		mockCanvas.toBlob = vi.fn((callback: (blob: Blob | null) => void) => {
			callback(null);
		});

		const { compressPhoto } = await import('./photoCompressor');
		const file = new File(['test'], 'photo.jpg', { type: 'image/jpeg' });
		await expect(compressPhoto(file)).rejects.toThrow('Canvas toBlob returned null');
	});
});
