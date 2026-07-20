const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  onSetTheme: (callback) => ipcRenderer.on('set-theme', (event, theme) => callback(theme)),
  onSetDecimals: (callback) => ipcRenderer.on('set-decimals', (_, value) => callback(value)),

  getConfig: () => ipcRenderer.invoke('get-config'),
  setConfig: (newConfig) => ipcRenderer.invoke('set-config', newConfig),

  getUnitDefinitions: () => ipcRenderer.invoke('get-unit-definitions'),
  getStockData: (query) => ipcRenderer.invoke('get-stock-data', query)
});

console.log("Preload script loaded and electronAPI exposed to renderer.");
