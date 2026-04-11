const { app, BrowserWindow, protocol, net, ipcMain, shell } = require('electron');
const path = require('node:path');
const { pathToFileURL } = require('node:url');

// ─── Constants ────────────────────────────────────────────────────────────────
const isDev = !app.isPackaged;
const BUILD_DIR = path.join(__dirname, '..', 'build');
const APP_SCHEME = 'app';

// ─── Register custom scheme BEFORE app is ready ───────────────────────────────
protocol.registerSchemesAsPrivileged([
	{
		scheme: APP_SCHEME,
		privileges: {
			standard: true,
			secure: true,
			supportFetchAPI: true,
			corsEnabled: true,
			stream: true
		}
	}
]);

let mainWindow = null;
let autoUpdater = null;
let log = null;

// Lazy initialization of updater — must happen after app is ready
function initUpdater() {
	if (autoUpdater) return autoUpdater;
	try {
		log = require('electron-log');
		log.transports.file.level = 'info';
		autoUpdater = require('electron-updater').autoUpdater;
		autoUpdater.logger = log;
		autoUpdater.autoDownload = false;
		autoUpdater.autoInstallOnAppQuit = true;

		for (const ev of [
			'checking-for-update',
			'update-available',
			'update-not-available',
			'error',
			'download-progress',
			'update-downloaded'
		]) {
			autoUpdater.on(ev, (payload) => {
				if (mainWindow && !mainWindow.isDestroyed()) {
					mainWindow.webContents.send(`updater:${ev}`, payload);
				}
			});
		}
	} catch (err) {
		console.error('[initUpdater] failed', err);
	}
	return autoUpdater;
}

function createWindow() {
	mainWindow = new BrowserWindow({
		width: 1400,
		height: 900,
		minWidth: 1024,
		minHeight: 700,
		backgroundColor: '#ffffff',
		webPreferences: {
			preload: path.join(__dirname, 'preload.cjs'),
			contextIsolation: true,
			nodeIntegration: false,
			sandbox: false
		}
	});

	mainWindow.setMenuBarVisibility(false);

	if (isDev && process.env.VITE_DEV_SERVER_URL) {
		mainWindow.loadURL(process.env.VITE_DEV_SERVER_URL);
		mainWindow.webContents.openDevTools();
	} else {
		mainWindow.loadURL(`${APP_SCHEME}://localhost/`);
	}

	mainWindow.webContents.setWindowOpenHandler(({ url }) => {
		if (url.startsWith('http://') || url.startsWith('https://')) {
			shell.openExternal(url);
			return { action: 'deny' };
		}
		return { action: 'allow' };
	});

	mainWindow.on('closed', () => {
		mainWindow = null;
	});
}

// ─── Custom protocol: app://localhost/... → build/... ─────────────────────────
function registerAppProtocol() {
	protocol.handle(APP_SCHEME, async (request) => {
		try {
			const url = new URL(request.url);
			let pathname = decodeURIComponent(url.pathname);
			pathname = path.normalize(pathname).replace(/^(\.\.(\/|\\|$))+/, '');

			let filePath = path.join(BUILD_DIR, pathname);

			const fs = require('node:fs');
			try {
				const stat = fs.statSync(filePath);
				if (stat.isDirectory()) {
					filePath = path.join(filePath, 'index.html');
				}
			} catch {
				filePath = path.join(BUILD_DIR, 'index.html');
			}

			return net.fetch(pathToFileURL(filePath).toString());
		} catch (err) {
			console.error('[app-protocol] failed', err);
			return new Response('Not Found', { status: 404 });
		}
	});
}

// ─── IPC : auto-updater ───────────────────────────────────────────────────────
ipcMain.handle('app:get-version', () => app.getVersion());

ipcMain.handle('updater:check', async () => {
	const u = initUpdater();
	if (!u) return { ok: false, error: 'Updater indisponible' };
	if (isDev) {
		return {
			ok: false,
			error: 'Vérification des mises à jour désactivée en développement'
		};
	}
	try {
		const result = await u.checkForUpdates();
		const updateAvailable =
			!!result?.updateInfo && result.updateInfo.version !== app.getVersion();
		// Si aucune mise à jour détectée, on émet manuellement l'événement
		// (electron-updater ne le fait pas toujours après checkForUpdates)
		if (!updateAvailable && mainWindow && !mainWindow.isDestroyed()) {
			mainWindow.webContents.send('updater:update-not-available');
		}
		return {
			ok: true,
			updateAvailable,
			version: result?.updateInfo?.version ?? null,
			currentVersion: app.getVersion()
		};
	} catch (err) {
		console.error('[updater:check] failed', err);
		const msg = err?.message ?? String(err);
		// Cas typique : dépôt sans aucune release → 404 sur releases.atom
		// → on considère que l'utilisateur est à jour
		if (/404/.test(msg) || /releases\.atom/.test(msg) || /Cannot find latest/.test(msg)) {
			if (mainWindow && !mainWindow.isDestroyed()) {
				mainWindow.webContents.send('updater:update-not-available');
			}
			return { ok: true, updateAvailable: false, currentVersion: app.getVersion() };
		}
		return { ok: false, error: msg };
	}
});

ipcMain.handle('updater:download', async () => {
	const u = initUpdater();
	if (!u) return { ok: false, error: 'Updater indisponible' };
	try {
		await u.downloadUpdate();
		return { ok: true };
	} catch (err) {
		console.error('[updater:download] failed', err);
		return { ok: false, error: err?.message ?? String(err) };
	}
});

ipcMain.handle('updater:quit-and-install', () => {
	const u = initUpdater();
	if (u) u.quitAndInstall();
});

// ─── App lifecycle ────────────────────────────────────────────────────────────
app.whenReady().then(() => {
	registerAppProtocol();
	createWindow();

	app.on('activate', () => {
		if (BrowserWindow.getAllWindows().length === 0) createWindow();
	});
});

app.on('window-all-closed', () => {
	if (process.platform !== 'darwin') app.quit();
});
