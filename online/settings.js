export let decimalPlaces = 2;
const systemThemeQuery = window.matchMedia('(prefers-color-scheme: dark)');

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
    const themeSelect = document.getElementById('theme-select');
    const decimalsSelect = document.getElementById('decimals-select');

    const initialTheme = config.theme || themeSelect.value;
    themeSelect.value = initialTheme;
    applyTheme(initialTheme);

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

    const settingsButton = document.getElementById('settings-button');
    const settingsPanel = document.getElementById('settings-panel');
    const versionLink = document.getElementById('version-link');
    const closeSettings = () => { settingsPanel.hidden = true; };
    closeSettings();

    try {
        const version = await window.electronAPI.getAppVersion();
        versionLink.textContent = `Version ${version}`;
    } catch {
        versionLink.textContent = 'Version unavailable';
    }
    versionLink.addEventListener('click', () => window.electronAPI.openReleasesPage());

    settingsButton.addEventListener('click', event => {
        event.stopPropagation();
        settingsPanel.hidden = !settingsPanel.hidden;
    });

    document.addEventListener('pointerdown', event => {
        if (!settingsPanel.contains(event.target) && !settingsButton.contains(event.target)) {
            closeSettings();
        }
    }, true);
    document.getElementById('titlebar').addEventListener('mousedown', event => {
        if (!settingsButton.contains(event.target)) closeSettings();
    });
    window.addEventListener('blur', closeSettings);
    document.addEventListener('keydown', event => {
        if (event.key === 'Escape') {
            closeSettings();
            return;
        }
        if (!settingsPanel.hidden) {
            event.preventDefault();
            closeSettings();
            if (event.key.length === 1 && !event.metaKey && !event.ctrlKey && !event.altKey) {
                document.dispatchEvent(new CustomEvent('tally:begin-input', { detail: event.key }));
            }
        }
    });
}
