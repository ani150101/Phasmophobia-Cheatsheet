const { app, BrowserWindow, globalShortcut } = require('electron');

// CRITICAL FIX: Disables hardware acceleration. This forces Windows to render 
// the transparent background properly so your opacity slider actually works.
app.disableHardwareAcceleration();

let mainWindow;

function createWindow() {
    mainWindow = new BrowserWindow({
        width: 1400,
        height: 900,
        title: "Phasmo Cheatsheet Overlay", // Forces Task Manager to see a proper name
        transparent: true,     
        frame: false,          
        alwaysOnTop: true,     
        skipTaskbar: false,    // Forces it onto the taskbar so you can see it
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
