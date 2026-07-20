const { app, BrowserWindow, clipboard, dialog, session, shell } = require('electron');
const { ipcMain } = require('electron');
const path = require('node:path');
const fs = require('node:fs');
const { getStockData } = require('./stocks/provider.cjs');
const { getWeatherData } = require('./weather/provider.cjs');

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
ipcMain.handle('get-weather-data', (_event, query) => getWeatherData(query));
ipcMain.handle('copy-text', (_event, value) => {
  if (typeof value !== 'string') throw new Error('Invalid clipboard value');
  clipboard.writeText(value);
});

ipcMain.handle('request-location-access', async event => {
  if (config.locationAccessAccepted) return true;
  const window = BrowserWindow.fromWebContents(event.sender);
  const result = await dialog.showMessageBox(window, {
    type: 'question',
    title: 'Allow Location Access',
    message: 'Allow Tally to use your location?',
    detail: 'Tally uses it only when you request weather without naming a city.',
    buttons: ['Allow Location', 'Not Now'],
    defaultId: 0,
    cancelId: 1,
    noLink: true
  });
  if (result.response !== 0) return false;
  config = { ...config, locationAccessAccepted: true };
  saveConfig(config);
  return true;
});

ipcMain.handle('show-location-settings', async event => {
  const window = BrowserWindow.fromWebContents(event.sender);
  const canOpenSettings = process.platform === 'darwin' || process.platform === 'win32';
  const buttons = canOpenSettings ? ['Open Location Settings', 'Cancel'] : ['OK'];
  const result = await dialog.showMessageBox(window, {
    type: 'warning',
    title: 'Location Access Needed',
    message: 'Tally could not access your location.',
    detail: 'Turn on Location Services and allow Tally, then try Weather again.',
    buttons,
    defaultId: 0,
    cancelId: canOpenSettings ? 1 : 0,
    noLink: true
  });
  if (!canOpenSettings || result.response !== 0) return;
  const settingsUrl = process.platform === 'darwin'
    ? 'x-apple.systempreferences:com.apple.preference.security?Privacy_LocationServices'
    : 'ms-settings:privacy-location';
  await shell.openExternal(settingsUrl);
});

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
  const allowLocation = webContents => webContents?.getURL().startsWith('file://');
  session.defaultSession.setPermissionCheckHandler((webContents, permission) => permission === 'geolocation' && allowLocation(webContents));
  session.defaultSession.setPermissionRequestHandler((webContents, permission, callback) => callback(permission === 'geolocation' && allowLocation(webContents)));

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
