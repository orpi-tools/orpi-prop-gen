const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
	getVersion: () => ipcRenderer.invoke('app:get-version'),
	checkForUpdates: () => ipcRenderer.invoke('updater:check'),
	downloadUpdate: () => ipcRenderer.invoke('updater:download'),
	quitAndInstall: () => ipcRenderer.invoke('updater:quit-and-install'),
	onUpdateEvent: (event, callback) => {
		const channel = `updater:${event}`;
		const handler = (_e, payload) => callback(payload);
		ipcRenderer.on(channel, handler);
		return () => ipcRenderer.removeListener(channel, handler);
	}
});
