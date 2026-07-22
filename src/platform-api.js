import { getName, getVersion } from '@tauri-apps/api/app';
import { getCurrentWindow } from '@tauri-apps/api/window';
import { writeText } from '@tauri-apps/plugin-clipboard-manager';
import { ask } from '@tauri-apps/plugin-dialog';
import { fetch as tauriFetch } from '@tauri-apps/plugin-http';
import { openUrl } from '@tauri-apps/plugin-opener';

import area from './units/area.js';
import data from './units/data.js';
import length from './units/length.js';
import mass from './units/mass.js';
import speed from './units/speed.js';
import temperature from './units/temperature.js';
import time from './units/time.js';
import volume from './units/volume.js';
import { resolveStockData } from './stocks/provider.js';
import { getWeatherData } from './weather/provider.js';
import { isNewerVersion } from './version.js';

const RELEASES_URL = 'https://github.com/aidan846/tally/releases/latest';
const RELEASE_API_URL = 'https://api.github.com/repos/aidan846/tally/releases/latest';
const CONFIG_KEY = 'tally-config';
const isTauri = '__TAURI_INTERNALS__' in window;
const platform = /Mac/i.test(navigator.userAgent) ? 'darwin' : /Windows/i.test(navigator.userAgent) ? 'win32' : isTauri ? 'linux' : 'web';
const appWindow = isTauri ? getCurrentWindow() : null;
const request = isTauri ? tauriFetch : window.fetch.bind(window);
const unitDefinitions = [area, data, length, mass, speed, temperature, time, volume];

function readConfig() {
  try { return JSON.parse(localStorage.getItem(CONFIG_KEY) || '{}'); } catch { return {}; }
}

async function currentVersion() {
  if (isTauri) return getVersion();
  return document.querySelector('meta[name="tally-version"]')?.content || '2.0.0';
}

async function checkForUpdates() {
  const current = await currentVersion();
  try {
    const response = await request(RELEASE_API_URL, {
      headers: { Accept: 'application/vnd.github+json' },
      signal: AbortSignal.timeout(6000)
    });
    if (!response.ok) return null;
    const release = await response.json();
    const latestVersion = String(release.tag_name || '').replace(/^v/i, '');
    const assets = Array.isArray(release.assets) ? release.assets : [];
    const architecture = navigator.userAgent.includes('ARM64') ? 'arm64' : navigator.userAgent.includes('WOW64') ? 'x86' : 'x64';
    const asset = platform === 'win32'
      ? assets.find(item => /setup.*\.exe$/i.test(item.name) && new RegExp(architecture, 'i').test(item.name)) || assets.find(item => /setup.*\.exe$/i.test(item.name))
      : platform === 'darwin'
        ? assets.find(item => /\.dmg$/i.test(item.name))
        : assets.find(item => /\.AppImage$/i.test(item.name)) || assets.find(item => /\.deb$/i.test(item.name));
    return {
      currentVersion: current,
      latestVersion: latestVersion || null,
      updateAvailable: Boolean(latestVersion) && isNewerVersion(latestVersion, current),
      releasesUrl: RELEASES_URL,
      releaseUrl: release.html_url || RELEASES_URL,
      downloadUrl: asset?.browser_download_url || null,
      architecture
    };
  } catch (error) {
    console.warn('Could not check for updates:', error);
    return null;
  }
}

window.electronAPI = {
  platform,
  minimizeWindow: () => appWindow?.minimize(),
  toggleMaximizeWindow: async () => {
    if (!appWindow) return false;
    await appWindow.toggleMaximize();
    return appWindow.isMaximized();
  },
  closeWindow: () => appWindow?.close(),
  getConfig: async () => readConfig(),
  getAppVersion: currentVersion,
  setConfig: async next => {
    const value = { ...readConfig(), ...next };
    localStorage.setItem(CONFIG_KEY, JSON.stringify(value));
    return value;
  },
  setZoomFactor: async factor => factor,
  getUnitDefinitions: async () => unitDefinitions,
  getStockData: query => resolveStockData(query, request),
  getWeatherData: query => getWeatherData(query, request),
  fetchJson: async url => {
    const response = await request(url, { signal: AbortSignal.timeout(8000) });
    if (!response.ok) throw new Error(`Request failed: ${response.status}`);
    return response.json();
  },
  requestLocationAccess: async () => {
    const config = readConfig();
    if (config.locationAccessAccepted) return true;
    const allowed = isTauri
      ? await ask('Tally uses your location only when you request weather without naming a city.', { title: 'Allow Location Access', kind: 'info', okLabel: 'Allow Location', cancelLabel: 'Not Now' })
      : true;
    if (allowed) localStorage.setItem(CONFIG_KEY, JSON.stringify({ ...config, locationAccessAccepted: true }));
    return allowed;
  },
  showLocationSettings: async () => {
    if (platform === 'win32') return openUrl('ms-settings:privacy-location');
    if (platform === 'darwin') return openUrl('x-apple.systempreferences:com.apple.preference.security?Privacy_LocationServices');
  },
  copyText: value => isTauri ? writeText(value) : navigator.clipboard.writeText(value),
  checkForUpdates,
  installUpdate: async downloadUrl => {
    const url = downloadUrl || RELEASES_URL;
    if (isTauri) await openUrl(url); else window.open(url, '_blank', 'noopener');
    return { started: true, requiresRestart: false };
  },
  onUpdateProgress: () => {},
  restartApp: () => window.location.reload(),
  openReleasesPage: () => isTauri ? openUrl(RELEASES_URL) : window.open(RELEASES_URL, '_blank', 'noopener'),
  getAppName: async () => isTauri ? getName() : 'Tally'
};
