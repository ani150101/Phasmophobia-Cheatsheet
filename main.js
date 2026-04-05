const { app, BrowserWindow, globalShortcut } = require('electron');
const path = require('path');

let mainWindow;

function createWindow() {
    mainWindow = new BrowserWindow({
        width: 1400,
        height: 900,
        transparent: true,     // Allows the UI rounded corners to float
        frame: false,          // Strips away the Windows title bar and close buttons
        alwaysOnTop: true,     // Forces it to stay over Phasmophobia
        skipTaskbar: true,     // Keeps your taskbar clean
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false
        }
    });

    // Load your cheatsheet
    mainWindow.loadFile('index.html');

    // Optional: Starts hidden so it doesn't block your screen immediately
    // mainWindow.hide(); 
}

app.whenReady().then(() => {
    createWindow();

    // The Global Hotkey to toggle the menu (Works inside the game)
    globalShortcut.register('Alt+X', () => {
        if (mainWindow.isVisible()) {
            mainWindow.hide();
        } else {
            mainWindow.show();
            mainWindow.focus(); // Forces your mouse to interact with the menu
        }
    });

    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) {
            createWindow();
        }
    });
});

// Clean up hotkeys when you close the app
app.on('will-quit', () => {
    globalShortcut.unregisterAll();
});

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});