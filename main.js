const { app, BrowserWindow, globalShortcut, shell, ipcMain } = require('electron');
const path = require('path');
const fs = require('fs');

let mainWindow;

// Default config state
let config = {
    hotkey: 'Alt+X',
    bounds: { width: 1400, height: 900 },
    theme: 'dark',
    customSpeed: 1.0,
    tapTolerance: 0.25,
    hideCrossed: false
};

// Locate where to save the file
let configPath;
const configFileName = 'PhasmoOverlay_Settings.json';

if (process.env.PORTABLE_EXECUTABLE_DIR) {
    configPath = path.join(process.env.PORTABLE_EXECUTABLE_DIR, configFileName);
} else if (app.isPackaged) {
    configPath = path.join(path.dirname(app.getPath('exe')), configFileName);
} else {
    configPath = path.join(__dirname, configFileName);
}

function loadConfig() {
    try {
        if (fs.existsSync(configPath)) {
            const rawData = fs.readFileSync(configPath, 'utf8');
            const data = JSON.parse(rawData);
            config = { ...config, ...data }; // Merge saved data into defaults
        }
    } catch (error) {
        console.error('Failed to read config file:', error);
    }
}

function saveConfig() {
    try {
        if (mainWindow) {
            config.bounds = mainWindow.getBounds(); // Grab exact X, Y, W, H
        }
        const data = JSON.stringify(config, null, 4);
        fs.writeFileSync(configPath, data, 'utf8');
    } catch (error) {
        console.error('Failed to save config file:', error);
    }
}

function registerOverlayHotkey(keyCombination) {
    if (config.hotkey && globalShortcut.isRegistered(config.hotkey)) {
        globalShortcut.unregister(config.hotkey);
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
            config.hotkey = keyCombination;
            saveConfig();
        }
    } catch (error) {
        console.error('Invalid hotkey:', error);
    }
}

function createWindow() {
    mainWindow = new BrowserWindow({
        width: config.bounds.width,
        height: config.bounds.height,
        x: config.bounds.x, // Spawns exactly where you left it
        y: config.bounds.y,
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

    // Send the loaded config to the UI once it finishes loading
    mainWindow.webContents.once('did-finish-load', () => {
        mainWindow.webContents.send('init-config', config);
    });

    // Save bounds safely when window is moved or resized (Waits 1 second to prevent lag)
    let saveTimeout;
    const triggerSave = () => {
        clearTimeout(saveTimeout);
        saveTimeout = setTimeout(saveConfig, 1000);
    };
    mainWindow.on('resize', triggerSave);
    mainWindow.on('move', triggerSave);
}

app.whenReady().then(() => {
    loadConfig();
    createWindow();
    registerOverlayHotkey(config.hotkey);

    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) createWindow();
    });
});

ipcMain.on('update-hotkey', (event, newHotkey) => {
    registerOverlayHotkey(newHotkey);
});

// Receives UI setting updates and saves them to the file
ipcMain.on('update-settings', (event, newSettings) => {
    config = { ...config, ...newSettings };
    saveConfig();
});

app.on('will-quit', () => {
    globalShortcut.unregisterAll();
});

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') app.quit();
});
