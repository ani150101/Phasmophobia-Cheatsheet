const { app, BrowserWindow, globalShortcut, shell, ipcMain } = require('electron');
const path = require('path');
const fs = require('fs');

let mainWindow;
let currentHotkey = 'Alt+X'; // Fallback default

// Figure out exactly where the user put the Portable .exe file
let configPath;
const configFileName = 'PhasmoOverlay_Settings.json';

if (process.env.PORTABLE_EXECUTABLE_DIR) {
    // If running as a compiled Portable EXE, save it exactly next to the EXE
    configPath = path.join(process.env.PORTABLE_EXECUTABLE_DIR, configFileName);
} else if (app.isPackaged) {
    // Fallback for standard installations
    configPath = path.join(path.dirname(app.getPath('exe')), configFileName);
} else {
    // If running in development (npm start)
    configPath = path.join(__dirname, configFileName);
}

// Load the hotkey from the JSON config
function loadConfig() {
    try {
        if (fs.existsSync(configPath)) {
            const rawData = fs.readFileSync(configPath, 'utf8');
            const data = JSON.parse(rawData);
            if (data.hotkey) {
                currentHotkey = data.hotkey;
            }
        }
    } catch (error) {
        console.error('Failed to read config file:', error);
    }
}

// Save the new hotkey to the JSON config
function saveConfig(key) {
    try {
        const data = JSON.stringify({ hotkey: key }, null, 4);
        fs.writeFileSync(configPath, data, 'utf8');
    } catch (error) {
        console.error('Failed to save config file:', error);
    }
}

function registerOverlayHotkey(keyCombination) {
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
            saveConfig(keyCombination); // Save to file whenever successfully updated
        }
    } catch (error) {
        console.error('Invalid hotkey:', error);
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

    // When the UI finishes loading, send it the saved hotkey so the button text updates
    mainWindow.webContents.once('did-finish-load', () => {
        mainWindow.webContents.send('init-hotkey', currentHotkey);
    });
}

app.whenReady().then(() => {
    loadConfig(); // Read the file before doing anything
    createWindow();
    registerOverlayHotkey(currentHotkey);

    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) {
            createWindow();
        }
    });
});

// Listen for the UI sending a new key combination
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
