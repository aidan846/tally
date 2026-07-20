const { app, BrowserWindow } = require('electron');
const { ipcMain } = require('electron');
const path = require('node:path');
const fs = require('node:fs');
const { getStockData } = require('./stocks/provider.cjs');

if (require('electron-squirrel-startup')) {
  app.quit();
}

const configPath = path.join(app.getPath('userData'), 'config.json');

function loadConfig() {
  try {
    const data = fs.readFileSync(configPath, 'utf-8');
    return JSON.parse(data);
  } catch (error) {
    if (error.code !== 'ENOENT') console.error('Failed to load config:', error);
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

ipcMain.handle('set-config', (_event, newConfig) => {
  config = { ...config, ...newConfig };
  saveConfig(config);
  return config;
});

ipcMain.handle('get-stock-data', (_event, query) => getStockData(query));

function readUnitDefinitions() {
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
      const unitModule = require(filePath);
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

  mainWindow.loadFile(path.join(__dirname, 'index.html'));
};

app.whenReady().then(() => {
  createWindow();

  ipcMain.handle('get-unit-definitions', readUnitDefinitions);

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
