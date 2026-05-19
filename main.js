const { app, BrowserWindow, shell, nativeImage } = require('electron');
const path = require('path');
const contextMenu = require('electron-context-menu').default;
const windowStateKeeper = require('electron-window-state');

// Setup context menu (right-click for copy/paste, etc.)
contextMenu({
    showSaveImageAs: true,
    showCopyImage: true,
});

let mainWindow;

function createWindow() {
    // Load the previous state with fallback to defaults
    let mainWindowState = windowStateKeeper({
        defaultWidth: 1000,
        defaultHeight: 800
    });

    // Create the browser window using the state information
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

    // Let us register listeners on the window, so we can update the state
    // automatically (the listeners will be removed when the window is closed)
    mainWindowState.manage(mainWindow);

    // Set a custom User-Agent to bypass WhatsApp Web's Electron block
    const userAgent = 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';
    mainWindow.webContents.userAgent = userAgent;

    // Load WhatsApp Web
    mainWindow.loadURL('https://web.whatsapp.com/', { userAgent });

    // Open links in the default external browser
    mainWindow.webContents.setWindowOpenHandler(({ url }) => {
        if (url.startsWith('http:') || url.startsWith('https:')) {
            shell.openExternal(url);
        }
        return { action: 'deny' };
    });

    mainWindow.on('closed', function () {
        mainWindow = null;
    });
}

// Some Linux window managers require this for the icon to work properly
app.whenReady().then(() => {
    createWindow();

    app.on('activate', function () {
        if (BrowserWindow.getAllWindows().length === 0) createWindow();
    });
});

// Quit when all windows are closed, except on macOS.
app.on('window-all-closed', function () {
    if (process.platform !== 'darwin') app.quit();
});
