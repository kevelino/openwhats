const { app, BrowserWindow, shell, nativeImage, Tray, Menu } = require('electron');
const fs = require('fs');
const path = require('path');
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

let mainWindow;
let tray = null;

function showOrCreateWindow() {
    if (mainWindow) {
        mainWindow.show();
        mainWindow.focus();
        return;
    }

    createWindow();
}

function buildTrayMenu() {
    return Menu.buildFromTemplate([
        { label: 'Show OpenWhats', click: showOrCreateWindow },
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

    mainWindow.on('closed', function () {
        mainWindow = null;
    });

    autoUpdater.checkForUpdatesAndNotify().catch(err => {
        console.error('Update check failed:', err);
    });
}

app.whenReady().then(() => {
    createWindow();

    app.on('activate', function () {
        if (BrowserWindow.getAllWindows().length === 0) createWindow();
    });
});

app.on('window-all-closed', function () {
    if (process.platform !== 'darwin') app.quit();
});

app.on('before-quit', function () {
    app.isQuitting = true;

    if (tray) {
        tray.destroy();
        tray = null;
    }
});
