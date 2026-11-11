const { app, BrowserWindow, shell, nativeImage, Tray, Menu, globalShortcut, ipcMain, powerMonitor, session } = require('electron');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const contextMenu = require('electron-context-menu').default;
const windowStateKeeper = require('electron-window-state');
const { autoUpdater } = require('electron-updater');

const appDataPath = app.getPath('appData');
const oldDataDir = path.join(appDataPath, 'whatsapp-linux-client');
const newDataDir = path.join(appDataPath, 'openwhats');

if (fs.existsSync(oldDataDir) && !fs.existsSync(newDataDir)) {
    try {
        fs.renameSync(oldDataDir, newDataDir);
        console.log('User data migration completed successfully.');
    } catch (err) {
        console.error('User data migration failed, possibly due to Snap confinement:', err);
    }
}

contextMenu({
    showSaveImageAs: true,
    showCopyImage: true,
});

const configPath = path.join(app.getPath('userData'), 'config.json');

function loadConfig() {
    try {
        if (fs.existsSync(configPath)) {
            return JSON.parse(fs.readFileSync(configPath, 'utf8'));
        }
    } catch (err) {
        console.error('Failed to read config:', err);
    }
    return {};
}

function saveConfig(config) {
    try {
        fs.mkdirSync(path.dirname(configPath), { recursive: true });
        fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
    } catch (err) {
        console.error('Failed to write config:', err);
    }
}

const config = loadConfig();
if (!config.globalShortcut) {
    config.globalShortcut = 'Ctrl+Alt+W';
    saveConfig(config);
}
if (!config.appLock) {
    config.appLock = { enabled: false, lockOnStart: true, lockOnHide: true, idleMinutes: 5, hash: null, salt: null };
    saveConfig(config);
}
if (!config.downloads) {
    config.downloads = { root: path.join(app.getPath('home'), 'WhatsApp_Media') };
    saveConfig(config);
}

let mainWindow;
let tray = null;
let lockWindow = null;
let downloadsWindow = null;
let isLocked = false;
let lastActivity = Date.now();
let idleTimer = null;
let currentDownloadContext = 'Divers';
let verifyAttempts = 0;
let verifyResetTimer = null;

function showOrCreateWindow() {
    if (mainWindow) {
        mainWindow.show();
        mainWindow.focus();
        return;
    }

    createWindow();
}

let settingsWindow = null;

function openSettingsWindow() {
    if (settingsWindow && !settingsWindow.isDestroyed()) {
        settingsWindow.show();
        settingsWindow.focus();
        return;
    }
    settingsWindow = new BrowserWindow({
        width: 420,
        height: 420,
        icon: nativeImage.createFromPath(path.join(__dirname, 'build/icon.png')),
        webPreferences: {
            nodeIntegration: false,
            contextIsolation: true,
            preload: path.join(__dirname, 'preload.js'),
        }
    });
    settingsWindow.loadFile(path.join(__dirname, 'settings.html'));
    settingsWindow.on('closed', () => { settingsWindow = null; });
}

function buildTrayMenu() {
    return Menu.buildFromTemplate([
        { label: 'Show OpenWhats', click: showOrCreateWindow },
        { label: 'Settings', click: openSettingsWindow },
        { label: 'Downloads', click: openDownloadsWindow },
        { type: 'separator' },
        { label: 'Quit', click: () => { app.isQuitting = true; app.quit(); } }
    ]);
}

function ensureTray() {
    if (!tray) {
        tray = new Tray(path.join(__dirname, 'build/tray-icon.png'));
    }

    tray.setToolTip('OpenWhats');
    tray.setContextMenu(buildTrayMenu());
}

function hashPasscode(passcode, salt) {
    salt = salt || crypto.randomBytes(16).toString('hex');
    const hash = crypto.scryptSync(passcode, salt, 64).toString('hex');
    return { salt, hash };
}

function verifyPasscode(passcode) {
    const lockCfg = config.appLock || {};
    if (!lockCfg.hash || !lockCfg.salt) return false;
    try {
        const { hash } = hashPasscode(passcode, lockCfg.salt);
        return crypto.timingSafeEqual(Buffer.from(hash, 'hex'), Buffer.from(lockCfg.hash, 'hex'));
    } catch (e) {
        return false;
    }
}

function showLockWindow() {
    if (lockWindow && !lockWindow.isDestroyed()) {
        lockWindow.show();
        lockWindow.focus();
        return;
    }
    lockWindow = new BrowserWindow({
        width: 420,
        height: 320,
        resizable: false,
        minimizable: false,
        maximizable: false,
        alwaysOnTop: true,
        frame: false,
        modal: true,
        icon: nativeImage.createFromPath(path.join(__dirname, 'build/icon.png')),
        webPreferences: {
            nodeIntegration: false,
            contextIsolation: true,
            preload: path.join(__dirname, 'preload.js'),
        }
    });
    lockWindow.loadFile(path.join(__dirname, 'lock.html'));
    lockWindow.on('close', (e) => { if (isLocked) e.preventDefault(); });
    lockWindow.on('closed', () => { lockWindow = null; });
}

function lockApp() {
    if (!config.appLock || !config.appLock.enabled) return;
    if (isLocked) return;
    isLocked = true;
    if (mainWindow && !mainWindow.isDestroyed()) {
        mainWindow.hide();
    }
    showLockWindow();
}

function unlockApp() {
    isLocked = false;
    verifyAttempts = 0;
    if (lockWindow && !lockWindow.isDestroyed()) {
        lockWindow.close();
        lockWindow = null;
    }
    if (mainWindow && !mainWindow.isDestroyed()) {
        mainWindow.show();
        mainWindow.focus();
    }
}

function startIdleTimer() {
    if (idleTimer) clearInterval(idleTimer);
    idleTimer = setInterval(() => {
        if (!config.appLock || !config.appLock.enabled || !config.appLock.idleMinutes) return;
        if (isLocked) return;
        const idleMs = config.appLock.idleMinutes * 60 * 1000;
        if (Date.now() - lastActivity > idleMs) {
            lockApp();
        }
    }, 30000);
}

function openDownloadsWindow() {
    if (downloadsWindow && !downloadsWindow.isDestroyed()) {
        downloadsWindow.show();
        downloadsWindow.focus();
        return { ok: true };
    }
    downloadsWindow = new BrowserWindow({
        width: 600,
        height: 400,
        icon: nativeImage.createFromPath(path.join(__dirname, 'build/icon.png')),
        webPreferences: {
            nodeIntegration: false,
            contextIsolation: true,
            preload: path.join(__dirname, 'downloads-preload.js'),
        }
    });
    downloadsWindow.loadFile(path.join(__dirname, 'downloads.html'));
    downloadsWindow.on('closed', () => { downloadsWindow = null; });
    return { ok: true };
}

function createWindow() {
    if (mainWindow) {
        mainWindow.show();
        mainWindow.focus();
        return;
    }

    let mainWindowState = windowStateKeeper({
        defaultWidth: 1000,
        defaultHeight: 800
    });

    mainWindow = new BrowserWindow({
        x: mainWindowState.x,
        y: mainWindowState.y,
        width: mainWindowState.width,
        height: mainWindowState.height,
        icon: nativeImage.createFromPath(path.join(__dirname, 'build/icon.png')),
        webPreferences: {
            nodeIntegration: false,
            contextIsolation: true,
            spellcheck: true,
            preload: path.join(__dirname, 'preload.js'),
        }
    });

    mainWindowState.manage(mainWindow);

    const userAgent = `Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/${process.versions.chrome} Safari/537.36`;
    mainWindow.webContents.userAgent = userAgent;

    mainWindow.loadURL('https://web.whatsapp.com/', { userAgent });

    mainWindow.webContents.setWindowOpenHandler(({ url }) => {
        if (url.startsWith('http:') || url.startsWith('https:')) {
            shell.openExternal(url);
        }
        return { action: 'deny' };
    });

    let blurKey;
    mainWindow.on('blur', async () => {
        blurKey = await mainWindow.webContents.insertCSS(
            'body { filter: blur(15px) !important; pointer-events: none !important; }'
        );
    });
    mainWindow.on('focus', async () => {
        if (blurKey) {
            await mainWindow.webContents.removeInsertedCSS(blurKey);
        }
    });

    ensureTray();

    mainWindow.on('close', (event) => {
        if (!app.isQuitting) {
            event.preventDefault();
            mainWindow.hide();
            if (config.appLock && config.appLock.enabled && config.appLock.lockOnHide) {
                lockApp();
            }
        }
    });

    mainWindow.on('focus', () => { lastActivity = Date.now(); });
    mainWindow.webContents.on('before-input-event', () => { lastActivity = Date.now(); });

    mainWindow.on('closed', function () {
        mainWindow = null;
    });

    ipcMain.on('update-badge-count', (event, count) => {
        try {
            app.setBadgeCount(count || 0);
        } catch (err) {
            console.warn('Badge count not supported on this platform:', err);
        }
    });

    ipcMain.on('set-active-download-context', (event, clientName) => {
        const cleaned = String(clientName || '').replace(/[^a-zA-Z0-9-_ ]/g, '').trim();
        currentDownloadContext = cleaned || 'Divers';
    });

    session.defaultSession.on('will-download', (event, item, webContents) => {
        const ctx = currentDownloadContext || 'Divers';
        const targetFolder = path.join(config.downloads.root, ctx);
        try {
            if (!fs.existsSync(targetFolder)) {
                fs.mkdirSync(targetFolder, { recursive: true });
            }
            item.setSavePath(path.join(targetFolder, item.getFilename()));
        } catch (err) {
            console.error('Failed to set download path:', err);
        }

        const payload = {
            filename: item.getFilename(),
            savePath: item.getSavePath(),
            totalBytes: item.getTotalBytes(),
            context: ctx,
        };
        if (downloadsWindow && !downloadsWindow.isDestroyed()) {
            downloadsWindow.webContents.send('download:started', payload);
        }
        item.on('updated', (e, state) => {
            if (downloadsWindow && !downloadsWindow.isDestroyed()) {
                downloadsWindow.webContents.send('download:progress', {
                    savePath: item.getSavePath(),
                    receivedBytes: item.getReceivedBytes(),
                    totalBytes: item.getTotalBytes(),
                    state,
                });
            }
        });
        item.on('done', (e, state) => {
            if (downloadsWindow && !downloadsWindow.isDestroyed()) {
                downloadsWindow.webContents.send('download:done', {
                    savePath: item.getSavePath(),
                    state,
                });
            }
        });
    });

    // App lock IPC
    ipcMain.handle('lock:status', () => ({
        enabled: !!(config.appLock && config.appLock.enabled),
        hasPasscode: !!(config.appLock && config.appLock.hash),
    }));

    ipcMain.handle('lock:set-passcode', (event, passcode) => {
        if (typeof passcode !== 'string' || passcode.length < 4) {
            return { ok: false, error: 'Passcode must be at least 4 characters.' };
        }
        const { salt, hash } = hashPasscode(passcode);
        config.appLock = Object.assign({}, config.appLock, { enabled: true, salt, hash });
        saveConfig(config);
        return { ok: true };
    });

    ipcMain.handle('lock:disable', () => {
        config.appLock = Object.assign({}, config.appLock, { enabled: false, hash: null, salt: null });
        saveConfig(config);
        unlockApp();
        return { ok: true };
    });

    ipcMain.handle('lock:verify', (event, passcode) => {
        if (verifyAttempts >= 5) {
            return { ok: false, error: 'Too many attempts. Try again later.' };
        }
        if (verifyPasscode(passcode)) {
            unlockApp();
            return { ok: true };
        }
        verifyAttempts += 1;
        if (!verifyResetTimer) {
            verifyResetTimer = setTimeout(() => { verifyAttempts = 0; verifyResetTimer = null; }, 60000);
        }
        return { ok: false, error: 'Incorrect passcode.' };
    });

    ipcMain.handle('lock:lock-now', () => { lockApp(); return { ok: true }; });

    ipcMain.handle('downloads:open', () => openDownloadsWindow());

    autoUpdater.checkForUpdatesAndNotify().catch(err => {
        console.error('Update check failed:', err);
    });
}

app.whenReady().then(() => {
    createWindow();

    startIdleTimer();

    if (config.appLock && config.appLock.enabled && config.appLock.lockOnStart) {
        lockApp();
    }

    try {
        const shortcut = config.globalShortcut;
        if (shortcut) {
            const success = globalShortcut.register(shortcut, () => {
                if (mainWindow && mainWindow.isVisible() && mainWindow.isFocused()) {
                    mainWindow.hide();
                } else {
                    showOrCreateWindow();
                }
            });
            if (!success) {
                console.warn('The configured global shortcut is already in use by the system:', shortcut);
            }
        }
    } catch (err) {
        console.warn('Failed to register global shortcut:', err);
    }

    app.on('activate', function () {
        if (BrowserWindow.getAllWindows().length === 0) createWindow();
    });
});

app.on('window-all-closed', function () {
    if (process.platform !== 'darwin') app.quit();
});

app.on('before-quit', function () {
    app.isQuitting = true;
    if (idleTimer) { clearInterval(idleTimer); idleTimer = null; }

    try {
        globalShortcut.unregisterAll();
    } catch (err) {
        console.warn('Failed to unregister global shortcuts:', err);
    }

    if (tray) {
        tray.destroy();
        tray = null;
    }
});
