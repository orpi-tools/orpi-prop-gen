import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createBlobUrl, revokeBlobUrl } from './blobUrl';

describe('blobUrl', () => {
	const fakeUrl = 'blob:http://localhost/fake-uuid';

	beforeEach(() => {
		vi.stubGlobal('URL', {
			createObjectURL: vi.fn(() => fakeUrl),
			revokeObjectURL: vi.fn()
		});
	});

	describe('createBlobUrl', () => {
		it('should call URL.createObjectURL and return the blob URL', () => {
			const blob = new Blob(['test'], { type: 'image/jpeg' });
			const result = createBlobUrl(blob);

			expect(URL.createObjectURL).toHaveBeenCalledWith(blob);
			expect(result).toBe(fakeUrl);
		});
	});

	describe('revokeBlobUrl', () => {
		it('should call URL.revokeObjectURL with the given URL', () => {
			revokeBlobUrl(fakeUrl);

			expect(URL.revokeObjectURL).toHaveBeenCalledWith(fakeUrl);
		});
	});
});
