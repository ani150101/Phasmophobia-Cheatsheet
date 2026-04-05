const { app, BrowserWindow, globalShortcut } = require('electron');

// CRITICAL FIX: Disables hardware acceleration to fix the black background bug on Windows
app.disableHardwareAcceleration();

let mainWindow;

function createWindow() {
    mainWindow = new BrowserWindow({
        width: 1400,
        height: 900,
        transparent: true,     // Tells the window to be see-through
        frame: false,          // Frameless
        alwaysOnTop: true,     
        skipTaskbar: false,    // FIXED: App will now show in your taskbar
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false
        }
    });

    mainWindow.loadFile('index.html');
}

app.whenReady().then(() => {
    createWindow();

    globalShortcut.register('Alt+X', () => {
        if (mainWindow.isVisible()) {
            mainWindow.hide();
        } else {
            mainWindow.show();
            mainWindow.focus();
        }
    });

    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) {
            createWindow();
        }
    });
});

app.on('will-quit', () => {
    globalShortcut.unregisterAll();
});

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});
