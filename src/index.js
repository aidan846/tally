const { app, BrowserWindow, Menu, nativeTheme, session } = require('electron');
const { ipcMain } = require('electron');
const path = require('node:path');
const fs = require('node:fs');


// Handle creating/removing shortcuts on Windows when installing/uninstalling.
if (require('electron-squirrel-startup')) {
  app.quit();
}

const configPath = path.join(app.getPath('userData'), 'config.json');

function loadConfig() {
  try {
    const data = fs.readFileSync(configPath, 'utf-8');
    return JSON.parse(data);
  } catch (err) {
    console.error('Failed to load config:', err);
    return {};
  }
}

function saveConfig(config) {
  try {
    fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
  } catch (err) {
    console.error('Failed to save config:', err);
  }
}

let config = loadConfig();

ipcMain.handle('get-config', () => {
  return config;
});

ipcMain.handle('set-config', (event, newConfig) => {
  config = { ...config, ...newConfig };
  saveConfig(config);
  return config;
});

function readUnitDefinitions() {
  // Determine the path to the 'units' folder.
  // Assuming 'units' folder is in the root directory, alongside index.js
  const unitsDirPath = path.join(__dirname, 'units');

  if (!fs.existsSync(unitsDirPath)) {
    console.warn(`Units directory not found at: ${unitsDirPath}`);
    return [];
  }

  const unitFiles = fs.readdirSync(unitsDirPath).filter(file => file.endsWith('.js'));
  const unitDefinitions = [];

  for (const file of unitFiles) {
    const filePath = path.join(unitsDirPath, file);
    try {
      // Require the JavaScript module. This will execute the module and return its exports.
      const unitModule = require(filePath);
      // Basic validation to ensure the required module has the expected structure
      if (unitModule && unitModule.name && unitModule.baseUnit && unitModule.units) {
        unitDefinitions.push(unitModule);
      } else {
        console.warn(`Skipping unit file '${file}': Missing expected properties (name, baseUnit, units).`);
      }
    } catch (error) {
      console.error(`Error loading unit file '${file}':`, error);
    }
  }
  return unitDefinitions;
}

const createWindow = () => {
  // Create the browser window.
  const mainWindow = new BrowserWindow({
    width: 460,
    height: 360,
    frame: false,
    transparent: true,
    titleBarStyle: 'hiddenInset',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  // and load the index.html of the app.
  mainWindow.loadFile(path.join(__dirname, 'index.html'));
};

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(() => {
  createWindow();

  ipcMain.handle('get-unit-definitions', async (event) => {
    return readUnitDefinitions();
  });

  // On OS X it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and import them here.
