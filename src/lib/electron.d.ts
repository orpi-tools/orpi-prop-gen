export type UpdaterEvent =
	| 'checking-for-update'
	| 'update-available'
	| 'update-not-available'
	| 'error'
	| 'download-progress'
	| 'update-downloaded';

export interface ElectronAPI {
	getVersion(): Promise<string>;
	checkForUpdates(): Promise<{
		ok: boolean;
		updateAvailable?: boolean;
		version?: string | null;
		currentVersion?: string;
		error?: string;
	}>;
	downloadUpdate(): Promise<{ ok: boolean; error?: string }>;
	quitAndInstall(): Promise<void>;
	onUpdateEvent(event: UpdaterEvent, callback: (payload: unknown) => void): () => void;
}

declare global {
	interface Window {
		electronAPI?: ElectronAPI;
	}
}

export {};
