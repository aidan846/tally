export let decimalPlaces = 2;
const systemThemeQuery = window.matchMedia('(prefers-color-scheme: dark)');
const SUPPORT_PROMPT_INTERVAL_MS = 7 * 24 * 60 * 60 * 1000;
const SUPPORT_PROMPT_FIRST_LAUNCH = 3;

function openSupportLink(url) {
    window.electronAPI.openExternalUrl(url);
}

function initializeSupportLinks() {
    document.querySelectorAll('[data-support-link]').forEach(link => {
        link.addEventListener('click', event => {
            event.preventDefault();
            openSupportLink(link.href);
        });
    });
}

function scheduleSupportPrompt(config) {
    const toast = document.getElementById('support-toast');
    const dismissButton = document.getElementById('support-toast-dismiss');
    const launchCount = Number(config.launchCount) || 0;
    const nextLaunchCount = launchCount + 1;
    const lastPromptAt = Number(config.lastSupportPromptAt) || 0;
    const canShow = nextLaunchCount >= SUPPORT_PROMPT_FIRST_LAUNCH
        && Date.now() - lastPromptAt >= SUPPORT_PROMPT_INTERVAL_MS;

    window.electronAPI.setConfig({ launchCount: nextLaunchCount });
    dismissButton?.addEventListener('click', () => { toast.hidden = true; });
    if (!canShow) return;

    window.setTimeout(() => {
        toast.hidden = false;
        window.electronAPI.setConfig({ lastSupportPromptAt: Date.now() });
    }, 1000);
}

export function initializeWindowControls() {
    const minimizeButton = document.getElementById('minimize-button');
    const maximizeButton = document.getElementById('maximize-button');
    const closeButton = document.getElementById('close-button');

    minimizeButton?.addEventListener('click', () => window.electronAPI.minimizeWindow());
    maximizeButton?.addEventListener('click', async () => {
        const isMaximized = await window.electronAPI.toggleMaximizeWindow();
        maximizeButton.title = isMaximized ? 'Restore' : 'Maximize';
        maximizeButton.setAttribute('aria-label', maximizeButton.title);
    });
    closeButton?.addEventListener('click', () => window.electronAPI.closeWindow());

    document.querySelector('.traffic-light.red')?.addEventListener('click', () => window.electronAPI.closeWindow());
    document.querySelector('.traffic-light.yellow')?.addEventListener('click', () => window.electronAPI.minimizeWindow());
    document.querySelector('.traffic-light.green')?.addEventListener('click', () => window.electronAPI.toggleMaximizeWindow());
}

function applyTheme(theme) {
    if (theme === 'auto') {
        const systemPrefersDark = systemThemeQuery.matches;
        document.body.classList.toggle('light', !systemPrefersDark);
    } else {
        document.body.classList.toggle('light', theme === 'light');
    }
}

export async function initializeSettings() {
    const config = await window.electronAPI.getConfig();
    initializeSupportLinks();
    scheduleSupportPrompt(config);
    const themeSelect = document.getElementById('theme-select');
    const decimalsSelect = document.getElementById('decimals-select');
    const fontSizeSelect = document.getElementById('font-size-select');
    const settingsPage = document.getElementById('settings-page');
    const settingsClose = document.getElementById('settings-close');
    const checkUpdatesButton = document.getElementById('check-updates-button');
    const updateStatus = document.getElementById('update-status');
    let latestUpdate = null;
    let installerReady = false;

    const initialTheme = config.theme || themeSelect.value;
    themeSelect.value = initialTheme;
    applyTheme(initialTheme);

    // `zoom` was the old preference name. Keep it as a one-time fallback so
    // existing users retain their chosen size, while the new default is 100%.
    const initialFontSize = Number(config.fontSize ?? config.zoom) || 1;
    fontSizeSelect.value = String(initialFontSize);
    document.documentElement.style.setProperty('--content-font-scale', String(initialFontSize));

    if (typeof config.decimals === 'number') {
        decimalPlaces = config.decimals;
        decimalsSelect.value = config.decimals.toString();
    }

    themeSelect.addEventListener('change', async (e) => {
        const theme = e.target.value;
        applyTheme(theme);
        await window.electronAPI.setConfig({ theme });
    });

    systemThemeQuery.addEventListener('change', () => {
        if (themeSelect.value === 'auto') applyTheme('auto');
    });

    decimalsSelect.addEventListener('change', async (e) => {
        const decimals = parseInt(e.target.value, 10);
        decimalPlaces = decimals;
        
        document.dispatchEvent(new Event('tally:settings-changed'));
        await window.electronAPI.setConfig({ decimals });
    });

    fontSizeSelect.addEventListener('change', async (e) => {
        const fontSize = Number(e.target.value) || 1;
        document.documentElement.style.setProperty('--content-font-scale', String(fontSize));
        await window.electronAPI.setConfig({ fontSize });
    });

    const settingsButton = document.getElementById('settings-button');
    const versionLink = document.getElementById('version-link');
    const closeSettings = () => { settingsPage.hidden = true; document.body.classList.remove('settings-open'); };
    const openSettings = () => { settingsPage.hidden = false; document.body.classList.add('settings-open'); };
    closeSettings();

    try {
        const version = await window.electronAPI.getAppVersion();
        versionLink.textContent = `v${version}`;
    } catch {
        versionLink.textContent = 'Unavailable';
    }
    versionLink.addEventListener('click', () => window.electronAPI.openReleasesPage());

    let updateStatusTimer;
    const showUpdateStatus = (message, duration = 0) => {
        window.clearTimeout(updateStatusTimer);
        updateStatus.textContent = message;
        if (duration > 0) {
            updateStatusTimer = window.setTimeout(() => { updateStatus.textContent = ''; }, duration);
        }
    };

    const renderUpdateState = (update, showSuccess = false) => {
        latestUpdate = update;
        installerReady = false;
        checkUpdatesButton.disabled = false;
        if (!update) {
            checkUpdatesButton.textContent = 'Check Now';
            showUpdateStatus('Couldn’t check for updates', 4000);
            return;
        }
        versionLink.textContent = `v${update.currentVersion}`;
        if (update.updateAvailable) {
            checkUpdatesButton.textContent = 'Update';
            showUpdateStatus(`v${update.latestVersion} available`);
        } else {
            checkUpdatesButton.textContent = 'Check Now';
            showUpdateStatus(showSuccess ? 'You’re up to date' : '', showSuccess ? 3000 : 0);
        }
    };

    checkUpdatesButton.addEventListener('click', async () => {
        if (installerReady) {
            await window.electronAPI.restartApp?.();
            return;
        }
        if (latestUpdate?.updateAvailable) {
            if (!latestUpdate.downloadUrl) return window.electronAPI.openReleasesPage();
            checkUpdatesButton.disabled = true;
            checkUpdatesButton.textContent = 'Opening…';
            showUpdateStatus('Downloading update');
            try {
                const installResult = await window.electronAPI.installUpdate(latestUpdate.downloadUrl);
                checkUpdatesButton.disabled = false;
                installerReady = Boolean(installResult?.requiresRestart);
                checkUpdatesButton.textContent = installerReady ? 'Restart to finish update' : 'Update';
                showUpdateStatus(installerReady ? 'Installer opened' : 'Download opened', 3000);
            } catch (error) {
                console.error('Could not install update:', error);
                checkUpdatesButton.disabled = false;
                renderUpdateState(latestUpdate);
                showUpdateStatus('Download failed — try again', 4000);
            }
            return;
        }

        checkUpdatesButton.disabled = true;
        checkUpdatesButton.textContent = 'Checking…';
        showUpdateStatus('');
        try {
            const update = await window.electronAPI.checkForUpdates?.();
            renderUpdateState(update, true);
        } catch (error) {
            console.error('Could not check for updates:', error);
            renderUpdateState(null);
        }
    });
    document.addEventListener('tally:update-state', event => renderUpdateState(event.detail, false));

    settingsButton.addEventListener('click', event => {
        event.stopPropagation();
        if (settingsPage.hidden) openSettings(); else closeSettings();
    });
    settingsClose.addEventListener('click', closeSettings);

    document.addEventListener('pointerdown', event => {
        if (!settingsPage.contains(event.target) && !settingsButton.contains(event.target)) closeSettings();
    }, true);
    document.getElementById('titlebar').addEventListener('mousedown', event => {
        if (!settingsButton.contains(event.target)) closeSettings();
    });
    document.addEventListener('keydown', event => {
        if (!document.hasFocus()) return;
        if (event.key === 'Escape') {
            closeSettings();
            return;
        }
        if (!settingsPage.hidden) {
            if (event.key.length === 1 && !event.metaKey && !event.ctrlKey && !event.altKey) {
                event.preventDefault();
                closeSettings();
                document.dispatchEvent(new CustomEvent('tally:begin-input', { detail: event.key }));
            }
        }
    });
}
