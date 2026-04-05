const { app, BrowserWindow, globalShortcut, shell } = require('electron');
const path = require('path');

app.disableHardwareAcceleration();

let mainWindow;

function createWindow() {
    mainWindow = new BrowserWindow({
        width: 1400,
        height: 900,
        title: "Phasmophobia Cheatsheet", 
        icon: path.join(__dirname, 'icon.ico'), // Forces the taskbar & task manager icon
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

    // Force all external links (like Discord) to open in your default Windows browser
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
