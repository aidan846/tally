import { initializeSettings, initializeWindowControls, decimalPlaces, numberFormat } from './settings.js';
import { evaluateInput } from './parser.js';
import { parseStockExpression } from './stocks/query.js';
import { parseWeatherQuery } from './weather/query.js';
import { formatAnswer } from './answer-format.js';
import { highlightExpression } from './syntax-highlight.js';
import { getInputHint } from './parser/hints.js';

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
let updateNoticeTimer = 0;

function hideUpdateNotice() {
    window.clearTimeout(updateNoticeTimer);
    document.getElementById('update-notice').hidden = true;
}

async function checkForUpdates() {
    if (!window.electronAPI?.checkForUpdates) return null;

    const update = await window.electronAPI.checkForUpdates();
    document.dispatchEvent(new CustomEvent('tally:update-state', { detail: update }));
    if (!update?.updateAvailable) return update;

    const notice = document.getElementById('update-notice');
    const detail = document.getElementById('update-notice-detail');
    const openButton = document.getElementById('update-notice-open');
    const dismissButton = document.getElementById('update-notice-dismiss');
    detail.textContent = `Tally v${update.latestVersion} is ready (you have v${update.currentVersion}).`;
    openButton.textContent = update.downloadUrl ? `Update to v${update.latestVersion}` : 'View release';
    openButton.onclick = async () => {
        window.clearTimeout(updateNoticeTimer);
        if (!update.downloadUrl) return window.electronAPI.openReleasesPage();
        openButton.disabled = true;
        openButton.textContent = 'Opening installer…';
        try {
            await window.electronAPI.installUpdate(update.downloadUrl);
        } catch (error) {
            console.error('Could not install update:', error);
            openButton.disabled = false;
            openButton.textContent = 'View release';
            window.electronAPI.openReleasesPage();
        }
    };
    dismissButton.onclick = hideUpdateNotice;
    // Pause auto-dismiss while hovered so the update button stays clickable.
    notice.onmouseenter = () => window.clearTimeout(updateNoticeTimer);
    notice.onmouseleave = () => {
        if (notice.hidden) return;
        window.clearTimeout(updateNoticeTimer);
        updateNoticeTimer = window.setTimeout(hideUpdateNotice, 5000);
    };
    notice.hidden = false;
    window.clearTimeout(updateNoticeTimer);
    updateNoticeTimer = window.setTimeout(hideUpdateNotice, 5000);
}

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
    const cacheKey = 'tally-currency-rates';
    const setCurrencyStatus = message => {
        const status = document.getElementById('currency-status');
        status.textContent = message;
        status.hidden = !message;
    };
    let cached = null;
    try { cached = JSON.parse(localStorage.getItem(cacheKey) || 'null'); } catch { cached = null; }
    const registerCachedRates = rates => {
        const aliases = { USD: ['usd', '$'], EUR: ['eur', '€'], GBP: ['gbp', '£'], JPY: ['jpy', '¥'] };
        math.createUnit('USD', { aliases: aliases.USD }, { override: true });
        for (const currency in rates) {
            if (currency !== 'USD') math.createUnit(currency, {
                definition: `${1 / rates[currency]} USD`,
                aliases: aliases[currency] || [currency.toLowerCase()]
            }, { override: true });
        }
    };

    try {
        console.log('Fetching currency rates...');
        const data = await window.electronAPI.fetchJson(API_URL);
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
        localStorage.setItem(cacheKey, JSON.stringify({ rates, fetchedAt: Date.now() }));
        setCurrencyStatus('');
    } catch (error) {
        if (cached?.rates && cached.fetchedAt) {
            registerCachedRates(cached.rates);
            setCurrencyStatus(`Currency rates unavailable — using rates from ${new Date(cached.fetchedAt).toLocaleString()}`);
        } else {
            setCurrencyStatus('Currency rates unavailable — live currency conversions may fail');
        }
        console.error('Could not load currency rates:', error);
    }
}

function resizeInput(input) {
    input.style.height = 'auto';
    input.style.height = `${input.scrollHeight}px`;
}

function renderHighlight(input, resolvedStockQuery = undefined) {
    const stockQuery = resolvedStockQuery === undefined
        ? parseStockExpression(input.value, new Date(), new Set())
        : resolvedStockQuery;
    const stockSymbols = stockQuery?.operands?.map(operand => operand.symbol) || [];
    input.parentElement.querySelector('.calculation-highlight').innerHTML = highlightExpression(input.value, { stockSymbols });
    const ghost = input.parentElement.querySelector('.input-ghost');
    const hint = getInputHint(input.value);
    ghost.replaceChildren(document.createTextNode(input.value));
    if (hint) {
        const hintElement = document.createElement('span');
        hintElement.textContent = hint;
        ghost.append(hintElement);
    }
    input.closest('.calculation-row').classList.toggle('is-empty', input.value.length === 0);
}

function setPlaceholder(input) {
    let index = Math.floor(Math.random() * PLACEHOLDERS.length);
    if (PLACEHOLDERS.length > 1 && index === previousPlaceholderIndex) {
        index = (index + 1) % PLACEHOLDERS.length;
    }
    previousPlaceholderIndex = index;
    input.parentElement.querySelector('.input-placeholder').textContent = PLACEHOLDERS[index];
    input.closest('.calculation-row').classList.add('has-placeholder');
}

const isMac = /Mac/i.test(navigator.userAgent);

function showCopyToast(message = 'Copied to clipboard', duration = 1600) {
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
    window.clearTimeout(toast.hideTimer);
    toast.hideTimer = window.setTimeout(() => toast.classList.remove('visible'), duration);
}

async function copyToClipboard(value) {
    if (window.electronAPI?.copyText) {
        await window.electronAPI.copyText(value);
        return;
    }
    await navigator.clipboard.writeText(value);
}

// Single-click an answer to use it in the current line; double-click copies it.
const ANSWER_CLICK_DELAY_MS = 300;
let lastAnswerInsert = null;

function useAnswer(output, value) {
    const row = output.closest('.calculation-row');
    const newestRow = calculator.querySelector('.calculation-row:last-child');
    let input = newestRow.querySelector('.calculation-input');
    let createdRow = null;
    // Clicking the current line's own answer starts a new line with it.
    if (row === newestRow && input.value.trim()) {
        newestRow.classList.remove('has-placeholder');
        createdRow = createRow();
        newestRow.after(createdRow);
        input = createdRow.querySelector('.calculation-input');
    }
    input.focus();
    const start = input.selectionStart ?? input.value.length;
    const before = input.value.slice(0, start);
    const text = `${before && !/[\s(+\-*/^×÷=:]$/.test(before) ? ' ' : ''}${value}`;
    input.setRangeText(text, start, input.selectionEnd ?? start, 'end');
    input.dispatchEvent(new Event('input', { bubbles: true }));
    lastAnswerInsert = { output, input, start, text, createdRow, at: Date.now() };
}

// If a slow double-click already inserted the answer, take it back out.
// Only an insert made by the first click of this same double-click counts.
function undoRecentAnswerInsert(output, firstClickAt) {
    const insert = lastAnswerInsert;
    if (!insert || insert.output !== output || insert.at < firstClickAt) return;
    lastAnswerInsert = null;
    const { input, start, text, createdRow } = insert;
    if (input.value.slice(start, start + text.length) !== text) return;
    if (createdRow && input.value === text) {
        deleteRow(createdRow, { preferPrevious: true });
        return;
    }
    input.setRangeText('', start, start + text.length, 'end');
    input.dispatchEvent(new Event('input', { bubbles: true }));
}

function attachCopyHandler(output) {
    let clickTimer = 0;
    let firstClickAt = 0;
    output.addEventListener('click', async event => {
        const value = output.textContent.trim();
        if (!value) return;

        if (event.detail >= 2) {
            window.clearTimeout(clickTimer);
            clickTimer = 0;
            if (event.detail !== 2) return;
            event.preventDefault();
            undoRecentAnswerInsert(output, firstClickAt);
            try {
                await copyToClipboard(value);
                showCopyToast('Answer copied');
            } catch (error) {
                console.error('Could not copy result:', error);
            }
            return;
        }

        // Only numbers, amounts, dates… are worth inserting (not "…" or errors).
        firstClickAt = Date.now();
        if (!/\d/.test(value)) return;
        window.clearTimeout(clickTimer);
        clickTimer = window.setTimeout(() => {
            clickTimer = 0;
            useAnswer(output, value);
        }, ANSWER_CLICK_DELAY_MS);
    });
}

// Copy the whole sheet as "line = answer" text.
function buildSummary() {
    const lines = [...calculator.querySelectorAll('.calculation-row')].map(row => {
        const input = row.querySelector('.calculation-input').value.trim();
        const answer = row.querySelector('.calculation-output').textContent.trim();
        if (!input) return '';
        if (!answer || /^\s*(?:#|\/\/)/.test(input)) return input;
        const assignment = input.match(/^([a-zA-Z_][a-zA-Z0-9_ ]*?)\s*[:=]/);
        return assignment ? `${assignment[1]} = ${answer}` : `${input} = ${answer}`;
    });
    return lines.join('\n').replace(/^\n+|\n+$/g, '').replace(/\n{3,}/g, '\n\n');
}

// In 1.234,56 mode, swap the separators in displayed numbers.
function displayNumbers(text) {
    if (numberFormat !== 'eu') return text;
    return text.replace(/\d+(?:,\d{3})*(?:\.\d+)?/g, number => number.replace(/[.,]/g, mark => (mark === '.' ? ',' : '.')));
}

function setOutput(output, answer) {
    answer = answer === '❌' ? answer : displayNumbers(String(answer ?? ''));
    output.innerHTML = formatAnswer(answer);
    output.setAttribute('aria-label', answer === '❌' ? 'Could not evaluate this calculation' : String(answer || ''));
}

function formatStockValue(result) {
    return `${result.value.toFixed(decimalPlaces)} ${result.currency}`;
}

function formatWeatherValue(result) {
    return Number.isFinite(result.rain)
        ? `${result.rain} ${result.unit} rain (${result.location})`
        : `${result.temperature}° ${result.unit} (${result.condition})`;
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

function updateOutputs(changedInput = null) {
    const inputs = [...calculator.querySelectorAll('.calculation-input')];
    // Re-evaluating just the edited line is faster, but variables, totals,
    // `prev` and lines starting with an operator (+13) depend on other lines.
    const dependsOnOtherLines = input => /^\s*[a-zA-Z_][a-zA-Z0-9_ ]*\s*[:=]|^\s*[+\-*/×÷^]|^\s*(?:sum|total|average|avg|mean)\s*:?\s*$|\bprev\b/i.test(input.value);
    if (changedInput && inputs.includes(changedInput) && !inputs.some(dependsOnOtherLines)) {
        const output = changedInput.closest('.calculation-row').querySelector('.calculation-output');
        const weatherQuery = parseWeatherQuery(changedInput.value);
        const stockQuery = weatherQuery ? null : parseStockExpression(changedInput.value, new Date(), new Set());
        if (weatherQuery || stockQuery) {
            startAsyncQuery(changedInput, output, weatherQuery || stockQuery, weatherQuery ? 'weather' : 'stock');
        } else {
            const state = asyncRowStates.get(changedInput);
            if (state?.timer) window.clearTimeout(state.timer);
            asyncRowStates.delete(changedInput);
            setOutput(output, evaluateInput(changedInput.value, decimalPlaces)[0]);
        }
        resizeInput(changedInput);
        renderHighlight(changedInput, stockQuery);
        return;
    }
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
        renderHighlight(input, stockQueries[index]);
    });
}

function createRow(value = '', { showPlaceholder = false } = {}) {
    const row = document.createElement('div');
    row.className = 'calculation-row';
    row.innerHTML = `
        <div class="input-stack">
            <pre class="calculation-highlight" aria-hidden="true"></pre>
            <span class="input-ghost" aria-hidden="true"></span>
            <pre class="input-placeholder" aria-hidden="true"></pre>
            <textarea class="calculation-input" rows="1" aria-label="Calculation"></textarea>
        </div>
        <output class="calculation-output"></output>`;
    const input = row.querySelector('.calculation-input');
    const output = row.querySelector('.calculation-output');
    input.value = value;

    input.addEventListener('input', () => scheduleUpdateOutputs(input));
    input.addEventListener('keydown', event => {
        if (navigateCalculationRows(input, event)) return;
        if (
            event.key === 'Backspace'
            && input.selectionStart === 0
            && input.selectionEnd === 0
            && row.previousElementSibling?.classList.contains('calculation-row')
        ) {
            event.preventDefault();
            deleteRow(row, { preferPrevious: true });
            return;
        }

        if (event.key === 'Enter' && !event.isComposing) {
            event.preventDefault();
            row.classList.remove('has-placeholder');
            const nextRow = createRow();
            row.after(nextRow);
            nextRow.querySelector('.calculation-input').focus();
            updateOutputs();
        }
    });
    attachCopyHandler(output);
    if (showPlaceholder) setPlaceholder(input);
    renderHighlight(input);
    return row;
}

function initializeCalculator() {
    const firstInput = calculator.querySelector('.calculation-input');
    const firstOutput = calculator.querySelector('.calculation-output');
    firstInput.addEventListener('input', () => scheduleUpdateOutputs(firstInput));
    firstInput.addEventListener('keydown', event => {
        if (navigateCalculationRows(firstInput, event)) return;
        if (event.key === 'Enter' && !event.isComposing) {
            event.preventDefault();
            firstInput.closest('.calculation-row').classList.remove('has-placeholder');
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
    document.documentElement.classList.add('renderer-ready');
}

let clearedSheet = null;

function clearCalculator() {
    const values = [...calculator.querySelectorAll('.calculation-input')].map(input => input.value);
    clearedSheet = values.some(value => value.trim()) ? values : null;
    calculator.replaceChildren(createRow('', { showPlaceholder: true }));
    calculator.querySelector('.calculation-input').focus();
    updateOutputs();
    if (clearedSheet) showCopyToast(`Cleared · ${isMac ? '⌘' : 'Ctrl+'}Z to undo`, 3000);
}

// Bring back a sheet cleared with "cc", as long as nothing new was typed.
function restoreClearedSheet() {
    const inputs = calculator.querySelectorAll('.calculation-input');
    if (!clearedSheet || inputs.length !== 1 || inputs[0].value) return false;
    calculator.replaceChildren(...clearedSheet.map(value => createRow(value)));
    clearedSheet = null;
    focusCurrentInput();
    updateOutputs();
    return true;
}

function deleteRow(row, { preferPrevious = false } = {}) {
    const rows = [...calculator.querySelectorAll('.calculation-row')];
    if (rows.length === 1) {
        const input = row.querySelector('.calculation-input');
        input.value = '';
        input.focus();
        input.dispatchEvent(new Event('input', { bubbles: true }));
        return;
    }

    const rowIndex = rows.indexOf(row);
    const previousInput = rows[rowIndex - 1]?.querySelector('.calculation-input');
    const nextInput = rows[rowIndex + 1]?.querySelector('.calculation-input');
    const targetInput = preferPrevious ? previousInput : nextInput || previousInput;
    row.remove();
    targetInput.focus();
    if (preferPrevious) {
        const end = targetInput.value.length;
        targetInput.setSelectionRange(end, end);
    }
    updateOutputs();
}

function navigateCalculationRows(input, event) {
    if (event.metaKey || event.ctrlKey || event.altKey || event.shiftKey || input.selectionStart !== input.selectionEnd) return false;
    const row = input.closest('.calculation-row');
    if (event.key === 'ArrowDown' && input.selectionStart === input.value.length) {
        const nextInput = row.nextElementSibling?.querySelector('.calculation-input');
        if (!nextInput) return false;
        event.preventDefault();
        nextInput.focus();
        nextInput.setSelectionRange(0, 0);
        return true;
    }
    if (event.key === 'ArrowUp' && input.selectionStart === 0) {
        const previousInput = row.previousElementSibling?.querySelector('.calculation-input');
        if (!previousInput) return false;
        event.preventDefault();
        previousInput.focus();
        const end = previousInput.value.length;
        previousInput.setSelectionRange(end, end);
        return true;
    }
    return false;
}

function focusCurrentInput() {
    const input = calculator.querySelector('.calculation-row:last-child .calculation-input');
    if (!input) return;
    input.focus();
    const end = input.value.length;
    input.setSelectionRange(end, end);
}

document.addEventListener('pointerdown', event => {
    if (event.button !== 0 || !(event.target instanceof Element)) return;
    const target = event.target;
    // The calculator itself is a single typing surface: clicks on an older row,
    // its result, or unused space should always return to the newest input.
    // Overlays and the title bar retain their own controls and focus behavior.
    if (target.closest('#titlebar, #settings-page, #update-notice, #support-toast, #currency-status')) return;
    if (!target.closest('.container') && target !== document.body) return;
    event.preventDefault();
    focusCurrentInput();
}, { capture: true });

function insertIntoNewestInput(key) {
    const input = calculator.querySelector('.calculation-row:last-child .calculation-input');
    if (!input) return;
    focusCurrentInput();
    const cursor = input.selectionStart;
    input.setRangeText(key, cursor, cursor, 'end');
    input.dispatchEvent(new Event('input', { bubbles: true }));
}

const SHORTCUT_SEQUENCE_MS = 350;
let lastClearKeyAt = 0;
let lastDeleteKeyAt = 0;

// "cc" / "xx" only count when they can't be part of what's being typed:
// not inside a word ("account", "Exxon") and, for cc, not right after a
// number ("5 cc" is cubic centimetres).
function canStartShortcut(key) {
    const input = document.activeElement?.classList?.contains('calculation-input') ? document.activeElement : null;
    if (!input) return true;
    const before = input.value.slice(0, input.selectionStart);
    if (/[a-z]$/i.test(before)) return false;
    if (key === 'c' && /\d\s*$/.test(before)) return false;
    return true;
}

// Remove the first "c" that was typed before the shortcut was recognised.
function removeShortcutKey(key) {
    const input = document.activeElement?.classList?.contains('calculation-input') ? document.activeElement : null;
    if (!input) return;
    const cursor = input.selectionStart;
    if (cursor > 0 && input.value[cursor - 1].toLowerCase() === key) input.setRangeText('', cursor - 1, cursor, 'end');
}

window.addEventListener('keydown', event => {
    if (event.repeat) return;

    if (event.metaKey || event.ctrlKey || event.altKey || event.shiftKey) {
        lastClearKeyAt = 0;
        lastDeleteKeyAt = 0;
        return;
    }

    const key = event.key.toLowerCase();
    const now = Date.now();

    if (key === 'c') {
        lastDeleteKeyAt = 0;
        if (lastClearKeyAt && now - lastClearKeyAt <= SHORTCUT_SEQUENCE_MS) {
            event.preventDefault();
            lastClearKeyAt = 0;
            removeShortcutKey('c');
            clearCalculator();
        } else {
            lastClearKeyAt = canStartShortcut('c') ? now : 0;
        }
        return;
    }

    if (key === 'x') {
        lastClearKeyAt = 0;
        if (!document.getElementById('settings-page').hidden) {
            lastDeleteKeyAt = 0;
            return;
        }

        const activeInput = document.activeElement?.classList?.contains('calculation-input') && document.activeElement;
        if (!activeInput) {
            lastDeleteKeyAt = 0;
            return;
        }

        if (lastDeleteKeyAt && now - lastDeleteKeyAt <= SHORTCUT_SEQUENCE_MS) {
            event.preventDefault();
            lastDeleteKeyAt = 0;
            deleteRow(activeInput.closest('.calculation-row'));
        } else {
            lastDeleteKeyAt = canStartShortcut('x') ? now : 0;
        }
        return;
    }

    lastClearKeyAt = 0;
    lastDeleteKeyAt = 0;
});

document.addEventListener('keydown', event => {
    if (event.key.toLowerCase() !== 'z' || (!event.ctrlKey && !event.metaKey) || event.shiftKey || event.altKey) return;
    if (restoreClearedSheet()) event.preventDefault();
});

document.addEventListener('keydown', async event => {
    if (event.key.toLowerCase() !== 'c' || (!event.ctrlKey && !event.metaKey)) return;
    if (!document.getElementById('settings-page').hidden) return;

    if (event.shiftKey) {
        event.preventDefault();
        const summary = buildSummary();
        if (!summary) return;
        try {
            await copyToClipboard(summary);
            showCopyToast('Summary copied');
        } catch (error) {
            console.error('Could not copy summary:', error);
        }
        return;
    }

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
    if ((event.ctrlKey || event.metaKey) && (event.key === '-' || event.key === '=' || event.key === '+')) {
        event.preventDefault();
        return;
    }
    const activeElement = document.activeElement;
    if (activeElement?.closest?.('#settings-page') || activeElement === document.getElementById('settings-button')) return;
    if (activeElement?.classList?.contains('calculation-input')) return;

    const newestInput = calculator.querySelector('.calculation-row:last-child .calculation-input');
    if (event.key === 'Backspace' && newestInput && !event.metaKey && !event.ctrlKey && !event.altKey) {
        event.preventDefault();
        const start = newestInput.selectionStart;
        const end = newestInput.selectionEnd;
        if (start !== end) newestInput.setRangeText('', start, end, 'end');
        else if (start > 0) newestInput.setRangeText('', start - 1, start, 'end');
        newestInput.dispatchEvent(new Event('input', { bubbles: true }));
        focusCurrentInput();
        return;
    }
    if (event.key === 'Enter' && newestInput && !event.metaKey && !event.ctrlKey && !event.altKey) {
        event.preventDefault();
        newestInput.closest('.calculation-row').classList.remove('has-placeholder');
        const nextRow = createRow();
        newestInput.closest('.calculation-row').after(nextRow);
        nextRow.querySelector('.calculation-input').focus();
        updateOutputs();
        return;
    }
    if (event.defaultPrevented || event.key.length !== 1 || event.metaKey || event.ctrlKey || event.altKey) return;

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
    await initializeSettings();
    checkForUpdates().catch(error => console.warn('Update check failed:', error));

    await loadLocalUnits();
    await loadCurrencyUnits();

    initializeCalculator();
}

let updateFrame = 0;
let scheduledInput = null;
function scheduleUpdateOutputs(changedInput = null) {
    scheduledInput = changedInput || scheduledInput;
    if (updateFrame) return;
    updateFrame = window.requestAnimationFrame(() => {
        updateFrame = 0;
        const input = scheduledInput;
        scheduledInput = null;
        updateOutputs(input);
    });
}

main();
