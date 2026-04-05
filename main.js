const { app, BrowserWindow, globalShortcut, shell, ipcMain } = require('electron');
const path = require('path');

app.disableHardwareAcceleration();

let mainWindow;
let currentHotkey = 'Alt+X'; // Default hotkey

function registerOverlayHotkey(keyCombination) {
    // Unregister the old hotkey first
    if (currentHotkey) {
        globalShortcut.unregister(currentHotkey);
    }

    try {
        const success = globalShortcut.register(keyCombination, () => {
            if (mainWindow.isVisible()) {
                mainWindow.hide();
            } else {
                mainWindow.show();
                mainWindow.focus();
            }
        });

        if (success) {
            currentHotkey = keyCombination;
        } else {
            console.error('Hotkey registration failed');
        }
    } catch (error) {
        console.error('Invalid hotkey combination:', error);
    }
}

function createWindow() {
    mainWindow = new BrowserWindow({
        width: 1400,
        height: 900,
        title: "Phasmophobia Cheatsheet", 
        icon: path.join(__dirname, 'icon.ico'),
        transparent: true,     
        frame: false,          
        alwaysOnTop: true,     
        skipTaskbar: false,    
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false
        }
    });

    mainWindow.loadFile('index.html');

    mainWindow.webContents.setWindowOpenHandler(({ url }) => {
        if (url.startsWith('http')) {
            shell.openExternal(url);
            return { action: 'deny' }; 
        }
        return { action: 'allow' };
    });
}

app.whenReady().then(() => {
    createWindow();
    
    // Register the initial default hotkey
    registerOverlayHotkey(currentHotkey);

    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) {
            createWindow();
        }
    });
});

// Listen for the frontend sending a new hotkey
ipcMain.on('update-hotkey', (event, newHotkey) => {
    registerOverlayHotkey(newHotkey);
});

app.on('will-quit', () => {
    globalShortcut.unregisterAll();
});

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});
