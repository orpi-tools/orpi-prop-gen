/**
 * Blob URL helpers — create and revoke object URLs for photo display.
 * Always revoke URLs when no longer needed to avoid memory leaks.
 */

export function createBlobUrl(blob: Blob): string {
	return URL.createObjectURL(blob);
}

export function revokeBlobUrl(url: string): void {
	URL.revokeObjectURL(url);
}
