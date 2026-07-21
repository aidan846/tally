const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  platform: process.platform,
  minimizeWindow: () => ipcRenderer.invoke('window-minimize'),
  toggleMaximizeWindow: () => ipcRenderer.invoke('window-toggle-maximize'),
  closeWindow: () => ipcRenderer.invoke('window-close'),
  onSetTheme: (callback) => ipcRenderer.on('set-theme', (event, theme) => callback(theme)),
  onSetDecimals: (callback) => ipcRenderer.on('set-decimals', (_, value) => callback(value)),

  getConfig: () => ipcRenderer.invoke('get-config'),
  getAppVersion: () => ipcRenderer.invoke('get-app-version'),
  setConfig: (newConfig) => ipcRenderer.invoke('set-config', newConfig),

  getUnitDefinitions: () => ipcRenderer.invoke('get-unit-definitions'),
  getStockData: (query) => ipcRenderer.invoke('get-stock-data', query),
  getWeatherData: (query) => ipcRenderer.invoke('get-weather-data', query),
  requestLocationAccess: () => ipcRenderer.invoke('request-location-access'),
  showLocationSettings: () => ipcRenderer.invoke('show-location-settings'),
  copyText: (value) => ipcRenderer.invoke('copy-text', value),
  checkForUpdates: () => ipcRenderer.invoke('check-for-updates'),
  openReleasesPage: () => ipcRenderer.invoke('open-releases-page')
});

console.log("Preload script loaded and electronAPI exposed to renderer.");
