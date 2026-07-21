import { initializeSettings, initializeWindowControls, decimalPlaces } from './settings.js';
import { evaluateInput } from './parser.js';
import { parseStockExpression } from './stocks/query.js';
import { parseWeatherQuery } from './weather/query.js';
import { escapeHtml, formatAnswer } from './answer-format.js';

const calculator = document.getElementById('calculator');
const PLACEHOLDERS = [
    'Try: 5 feet to cm',
    'Try: 20% off 85',
    'Try: sqrt4',
    'Try: 10 days ago',
    'Try: 60 mph to km/h',
    'Try: 1 ft3 to l',
    'Try: price = 24.99',
    'Try: 10 million to billion',
    'Try: ppi = 326',
    'Try: MSFT 10 days ago',
    'Try: Weather in Sydney'
];
let previousPlaceholderIndex = -1;
const asyncRowStates = new WeakMap();

async function loadLocalUnits() {
    try {
        console.log('Loading local unit definitions...');
        const unitModules = await window.electronAPI.getUnitDefinitions();

        for (const unitModule of unitModules) {
            console.log(`Registering unit family: ${unitModule.name}`);
            const unitDefinition = {};

            for (const unitSymbol in unitModule.units) {
                const {ratio } = unitModule.units[unitSymbol];
                if (unitSymbol === unitModule.baseUnit) {
                    unitDefinition[unitSymbol] = { definition: 1 };
                } else {
                    unitDefinition[unitSymbol] = { definition: `${ratio} ${unitModule.baseUnit}` };
                }
            }

            for (const alias in unitModule.aliases) {
                const targetUnitSymbol = unitModule.aliases[alias];
                if (unitDefinition[targetUnitSymbol]) {
                    if(!unitDefinition[targetUnitSymbol].aliases) {
                        unitDefinition[targetUnitSymbol].aliases = [];
                    } 
                    unitDefinition[targetUnitSymbol].aliases.push(alias);
                } else {
                    console.warn(`Alias '${alias}' points to an undefined target unit '${targetUnitSymbol}' in module '${unitModule.name}'. This alias will not be registered.`);
                }
            }

            math.createUnit(unitModule.name, unitDefinition);
        }
        console.log('✅ Local unit definitions loaded successfully.');
    } catch (error) {
        console.error('Could not load local unit definitions:', error);
    }
}

async function loadCurrencyUnits() {
    const API_KEY = 'df24400ed83912b02625032b';
    const API_URL = `https://v6.exchangerate-api.com/v6/${API_KEY}/latest/USD`;

    try {
        console.log('Fetching currency rates...');
        const response = await fetch(API_URL);
        if (!response.ok) throw new Error(`API request failed: ${response.status}`);

        const data = await response.json();
        if (data.result === 'error') throw new Error(`API error: ${data['error-type']}`);

        const rates = data.conversion_rates;

        const currencyAliases = {
            USD: ['$', 'usd', 'dollar', 'dollars', 'us dollar', 'us dollars'],
            EUR: ['€', 'eur', 'euro', 'euros'],
            GBP: ['£', 'gbp', 'pound', 'pounds', 'pound sterling', 'pounds sterling'],
            JPY: ['¥', 'jpy', 'yen']
        };

        math.createUnit('USD', { aliases: currencyAliases.USD }, { override: true });

        for (const currency in rates) {
            if (currency !== 'USD') {
                math.createUnit(currency, {
                    definition: `${1 / rates[currency]} USD`,
                    aliases: currencyAliases[currency] || [currency.toLowerCase()]
                }, {override: true});
            }
        }

        console.log('✅ Currency units loaded successfully.');
    } catch (error) {
        console.error('Could not load currency rates:', error);
    }
}

function resizeInput(input) {
    input.style.height = 'auto';
    input.style.height = `${input.scrollHeight}px`;
}

function highlightExpression(value) {
    const tokenPattern = /(?:\d+(?:\.\d+)?|\.\d+)|(?<![a-z])(?:km\/h|m\/s|nmi|mm|cm|dm|km|ft|yd|mi|mg|kg|lb|lbs|oz|psi|atm|kpa|hpa|mpa|mph|kph|mps|ml|gal|liters?|grams?|meters?|feet|miles?|pounds?|celsius|fahrenheit|kelvin|[cfkgm])\b|°[cfk]\b|\b(?:and|or|not|minus|plus|add|times|to|in|into|as|from|before|after|with|without|subtract|divide|multiplied|by|xor|mod)\b|[+\-*/%=]/gi;
    let html = '';
    let cursor = 0;
    for (const match of value.matchAll(tokenPattern)) {
        html += escapeHtml(value.slice(cursor, match.index));
        const token = match[0];
        const lower = token.toLowerCase();
        const className = /^(?:\d|\.)/.test(token) ? 'token-number'
            : /^(?:km\/h|m\/s|nmi|mm|cm|dm|km|ft|yd|mi|mg|kg|lb|lbs|oz|psi|atm|kpa|hpa|mpa|mph|kph|mps|ml|gal|liters?|grams?|meters?|feet|miles?|pounds?|celsius|fahrenheit|kelvin|°[cfk]|[cfkgm])$/i.test(token) ? 'token-unit'
            : /^(?:and|or|not|minus|plus|add|times|to|in|into|as|from|before|after|with|without|subtract|divide|multiplied|by|xor|mod)$/i.test(token) || /^[+\-*/%=]$/.test(token) ? 'token-connector'
            : '';
        html += className ? `<span class="${className}">${escapeHtml(token)}</span>` : escapeHtml(token);
        cursor = match.index + token.length;
    }
    return html + escapeHtml(value.slice(cursor));
}

function renderHighlight(input) {
    input.parentElement.querySelector('.calculation-highlight').innerHTML = highlightExpression(input.value);
    input.closest('.calculation-row').classList.toggle('is-empty', input.value.length === 0);
}

function setPlaceholder(input) {
    let index = Math.floor(Math.random() * PLACEHOLDERS.length);
    if (PLACEHOLDERS.length > 1 && index === previousPlaceholderIndex) {
        index = (index + 1) % PLACEHOLDERS.length;
    }
    previousPlaceholderIndex = index;
    input.parentElement.querySelector('.input-placeholder').textContent = PLACEHOLDERS[index];
}

function showCopyToast(message = 'Copied to clipboard') {
    let toast = document.getElementById('copy-toast');
    if (!toast) {
        toast = document.createElement('div');
        toast.id = 'copy-toast';
        toast.setAttribute('role', 'status');
        toast.setAttribute('aria-live', 'polite');
        document.body.append(toast);
    }
    toast.textContent = `✓  ${message}`;
    toast.classList.remove('visible');
    void toast.offsetWidth;
    toast.classList.add('visible');
    window.setTimeout(() => toast.classList.remove('visible'), 1600);
}

async function copyToClipboard(value) {
    if (window.electronAPI?.copyText) {
        await window.electronAPI.copyText(value);
        return;
    }
    await navigator.clipboard.writeText(value);
}

function attachCopyHandler(output) {
    output.addEventListener('click', async event => {
        if (event.detail !== 2) return;
        const value = output.textContent.trim();
        if (!value) return;

        event.preventDefault();
        try {
            await copyToClipboard(value);
            showCopyToast('Answer copied');
        } catch (error) {
            console.error('Could not copy result:', error);
        }
    });
}

function setOutput(output, answer) {
    output.innerHTML = formatAnswer(answer);
    output.setAttribute('aria-label', answer === '❌' ? 'Could not evaluate this calculation' : String(answer || ''));
}

function formatStockValue(result) {
    return `${result.value.toFixed(decimalPlaces)} ${result.currency}`;
}

function formatWeatherValue(result) {
    return `${result.temperature}° ${result.unit} (${result.condition})`;
}

function getCurrentCoordinates() {
    return new Promise((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(
            position => resolve({
                latitude: position.coords.latitude,
                longitude: position.coords.longitude
            }),
            reject,
            { enableHighAccuracy: false, timeout: 10000, maximumAge: 600000 }
        );
    });
}

function getCurrentRegion() {
    try {
        return new Intl.Locale(navigator.language).region || '';
    } catch {
        return '';
    }
}

async function loadWeather(query) {
    if (query.location) return window.electronAPI.getWeatherData(query);
    const allowed = await window.electronAPI.requestLocationAccess();
    if (!allowed) {
        const error = new Error('Location access was not allowed');
        error.locationPermission = true;
        throw error;
    }

    let coordinates;
    try {
        coordinates = await getCurrentCoordinates();
    } catch (cause) {
        await window.electronAPI.showLocationSettings();
        const error = new Error('Location Services could not provide a location', { cause });
        error.locationPermission = true;
        throw error;
    }

    return window.electronAPI.getWeatherData({
        source: query.source,
        coordinates,
        region: getCurrentRegion()
    });
}

function asyncQueryKey(kind, query) {
    return `${kind}:${JSON.stringify(query)}`;
}

function formatAsyncValue(kind, result) {
    return kind === 'weather' ? formatWeatherValue(result) : formatStockValue(result);
}

function startAsyncQuery(input, output, query, kind) {
    const key = asyncQueryKey(kind, query);
    const previous = asyncRowStates.get(input);
    if (previous?.key === key) {
        if (previous.result) setOutput(output, formatAsyncValue(kind, previous.result));
        else if (previous.message) setOutput(output, previous.message);
        return;
    }

    if (previous?.timer) window.clearTimeout(previous.timer);
    const state = { key, result: null, message: null, timer: null };
    asyncRowStates.set(input, state);
    setOutput(output, '…');

    state.timer = window.setTimeout(async () => {
        state.timer = null;
        try {
            const result = kind === 'weather'
                ? await loadWeather(query)
                : await window.electronAPI.getStockData(query);
            if (asyncRowStates.get(input) !== state || input.value !== query.source) return;
            state.result = result;
            setOutput(output, formatAsyncValue(kind, result));
        } catch (error) {
            if (asyncRowStates.get(input) !== state || input.value !== query.source) return;
            console.error(`Could not load ${kind} data:`, error);
            state.message = error.locationPermission ? 'Location access needed' : '❌';
            setOutput(output, state.message);
        }
    }, 250);
}

function updateOutputs() {
    const inputs = [...calculator.querySelectorAll('.calculation-input')];
    const weatherQueries = inputs.map(input => parseWeatherQuery(input.value));
    const knownVariables = new Set();
    const stockQueries = inputs.map((input, index) => {
        const query = weatherQueries[index] ? null : parseStockExpression(input.value, new Date(), knownVariables);
        const assignment = input.value.match(/^([a-zA-Z_][a-zA-Z0-9_]*(?:\s+[a-zA-Z_][a-zA-Z0-9_]*)*)\s*[:=]/);
        if (assignment) knownVariables.add(assignment[1].trim().toLowerCase());
        return query;
    });
    const asyncQueries = inputs.map((_, index) => weatherQueries[index] || stockQueries[index]);
    const results = evaluateInput(inputs.map((input, index) => asyncQueries[index] ? '' : input.value).join('\n'), decimalPlaces);
    inputs.forEach((input, index) => {
        const output = input.closest('.calculation-row').querySelector('.calculation-output');
        const query = asyncQueries[index];
        if (query) {
            startAsyncQuery(input, output, query, weatherQueries[index] ? 'weather' : 'stock');
        } else {
            const state = asyncRowStates.get(input);
            if (state?.timer) window.clearTimeout(state.timer);
            asyncRowStates.delete(input);
            setOutput(output, results[index]);
        }
        resizeInput(input);
        renderHighlight(input);
    });
}

function createRow(value = '') {
    const row = document.createElement('div');
    row.className = 'calculation-row';
    row.innerHTML = `
        <div class="input-stack">
            <pre class="calculation-highlight" aria-hidden="true"></pre>
            <pre class="input-placeholder" aria-hidden="true"></pre>
            <textarea class="calculation-input" rows="1" aria-label="Calculation"></textarea>
        </div>
        <output class="calculation-output"></output>`;
    const input = row.querySelector('.calculation-input');
    const output = row.querySelector('.calculation-output');
    input.value = value;

    input.addEventListener('input', updateOutputs);
    input.addEventListener('keydown', event => {
        if (event.key === 'Enter' && !event.isComposing) {
            event.preventDefault();
            const nextRow = createRow();
            row.after(nextRow);
            nextRow.querySelector('.calculation-input').focus();
            updateOutputs();
        }
    });
    attachCopyHandler(output);
    setPlaceholder(input);
    renderHighlight(input);
    return row;
}

function initializeCalculator() {
    const firstInput = calculator.querySelector('.calculation-input');
    const firstOutput = calculator.querySelector('.calculation-output');
    firstInput.addEventListener('input', updateOutputs);
    firstInput.addEventListener('keydown', event => {
        if (event.key === 'Enter' && !event.isComposing) {
            event.preventDefault();
            const nextRow = createRow();
            firstInput.closest('.calculation-row').after(nextRow);
            nextRow.querySelector('.calculation-input').focus();
            updateOutputs();
        }
    });
    resizeInput(firstInput);
    setPlaceholder(firstInput);
    renderHighlight(firstInput);
    attachCopyHandler(firstOutput);
}

function clearCalculator() {
    calculator.replaceChildren(createRow());
    calculator.querySelector('.calculation-input').focus();
    updateOutputs();
}

function deleteRow(row) {
    const rows = [...calculator.querySelectorAll('.calculation-row')];
    if (rows.length === 1) {
        const input = row.querySelector('.calculation-input');
        input.value = '';
        input.focus();
        input.dispatchEvent(new Event('input', { bubbles: true }));
        return;
    }

    const rowIndex = rows.indexOf(row);
    const nextInput = rows[rowIndex + 1]?.querySelector('.calculation-input')
        || rows[rowIndex - 1]?.querySelector('.calculation-input');
    row.remove();
    nextInput.focus();
    updateOutputs();
}

function focusCurrentInput() {
    const input = calculator.querySelector('.calculation-row:last-child .calculation-input');
    if (!input) return;
    input.focus();
    const end = input.value.length;
    input.setSelectionRange(end, end);
}

function insertIntoNewestInput(key) {
    const input = calculator.querySelector('.calculation-row:last-child .calculation-input');
    if (!input) return;
    focusCurrentInput();
    const cursor = input.selectionStart;
    input.setRangeText(key, cursor, cursor, 'end');
    input.dispatchEvent(new Event('input', { bubbles: true }));
}

let recentClearKeys = [];
let recentDeleteKeys = [];
window.addEventListener('keydown', event => {
    if (event.key.toLowerCase() !== 'c' || event.metaKey || event.ctrlKey || event.altKey) return;
    const now = Date.now();
    recentClearKeys = recentClearKeys.filter(time => now - time < 600);
    recentClearKeys.push(now);
    if (recentClearKeys.length === 3) {
        event.preventDefault();
        recentClearKeys = [];
        clearCalculator();
    }
});

window.addEventListener('keydown', event => {
    if (event.key.toLowerCase() !== 'x' || event.metaKey || event.ctrlKey || event.altKey) return;
    if (!document.getElementById('settings-panel').hidden) return;
    const activeInput = document.activeElement?.classList?.contains('calculation-input') && document.activeElement;
    if (!activeInput) return;

    const now = Date.now();
    recentDeleteKeys = recentDeleteKeys.filter(time => now - time < 600);
    recentDeleteKeys.push(now);
    if (recentDeleteKeys.length === 2) {
        event.preventDefault();
        recentDeleteKeys = [];
        deleteRow(activeInput.closest('.calculation-row'));
    }
});

document.addEventListener('keydown', async event => {
    if (event.key.toLowerCase() !== 'c' || (!event.ctrlKey && !event.metaKey)) return;
    if (!document.getElementById('settings-panel').hidden) return;

    const activeInput = document.activeElement?.classList?.contains('calculation-input') && document.activeElement;
    if (activeInput && activeInput.selectionStart !== activeInput.selectionEnd) return;
    if (window.getSelection()?.toString()) return;

    const input = activeInput || calculator.querySelector('.calculation-row:last-child .calculation-input');
    if (!input) return;
    const output = input.closest('.calculation-row').querySelector('.calculation-output').textContent.trim();
    const line = output ? `${input.value} = ${output}` : input.value;
    if (!line) return;

    event.preventDefault();
    try {
        await copyToClipboard(line);
        showCopyToast('Line copied');
    } catch (error) {
        console.error('Could not copy line:', error);
    }
});

document.addEventListener('keydown', event => {
    if (event.defaultPrevented || event.key.length !== 1 || event.metaKey || event.ctrlKey || event.altKey) return;

    const activeElement = document.activeElement;
    if (activeElement?.closest?.('#settings-panel') || activeElement === document.getElementById('settings-button')) return;
    if (activeElement?.classList?.contains('calculation-input')) return;

    event.preventDefault();
    insertIntoNewestInput(event.key);
});

window.addEventListener('focus', () => {
    window.requestAnimationFrame(() => {
        const activeElement = document.activeElement;
        if (activeElement === document.body || activeElement === document.documentElement) {
            focusCurrentInput();
        }
    });
});

document.addEventListener('tally:settings-changed', updateOutputs);
document.addEventListener('tally:begin-input', event => insertIntoNewestInput(event.detail));

async function main() {
    initializeWindowControls();
    initializeSettings();

    await loadLocalUnits();
    await loadCurrencyUnits();

    initializeCalculator();
}

main();
