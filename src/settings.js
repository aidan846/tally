export let decimalPlaces = 2;

function applyTheme(theme) {
    if (theme === 'auto') {
        const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        document.body.classList.toggle('light', !systemPrefersDark);
    } else {
        document.body.classList.toggle('light', theme === 'light');
    }
}

export async function initializeSettings() {
    // Get saved config
    const config = await window.electronAPI.getConfig();
    const themeSelect = document.getElementById('theme-select');
    const decimalsSelect = document.getElementById('decimals-select');

    // Apply saved theme
    if (config.theme) {
        applyTheme(config.theme);
        themeSelect.value = config.theme;
        // if 'auto' is selected
        if (config.theme === 'auto') {
            window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => applyTheme('auto'));
        }
    }

    // Apply saved decimal
    if (typeof config.decimals === 'number') {
        decimalPlaces = config.decimals;
        decimalsSelect.value = config.decimals.toString();
    }

    // Listen for theme changes from the dropdown
    themeSelect.addEventListener('change', async (e) => {
        const theme = e.target.value;
        applyTheme(theme);
        await window.electronAPI.setConfig({ theme }); // Save setting
    });

    // Listen for decimals changes from the dropdown
    decimalsSelect.addEventListener('change', async (e) => {
        const decimals = parseInt(e.target.value, 10);
        decimalPlaces = decimals;
        
        document.dispatchEvent(new Event('tally:settings-changed'));
        await window.electronAPI.setConfig({ decimals }); // Save setting
    });

    const settingsButton = document.getElementById('settings-button');
    const settingsPanel = document.getElementById('settings-panel');
    const closeSettings = () => { settingsPanel.hidden = true; };
    closeSettings();

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
        if (event.key === 'Escape') closeSettings();
    });
}
