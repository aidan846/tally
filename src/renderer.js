import { initializeSettings, decimalPlaces } from './settings.js';
import { evaluateInput } from './parser.js';

const calculator = document.getElementById('calculator');
let lastFocusedInput = null;

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

        math.createUnit('USD', { aliases: ['$', 'dollar', 'dollars'] }, { override: true });
        math.createUnit('EUR', { aliases: ['€', 'euro', 'euros'] }, { override: true });
        math.createUnit('GBP', { aliases: ['£', 'pound', 'pounds'] }, { override: true });
        math.createUnit('JPY', { aliases: ['¥', 'yen'] }, { override: true });

        for (const currency in rates) {
            if (currency !== 'USD') {
                math.createUnit(currency, {
                    definition: `${1 / rates[currency]} USD`,
                    aliases: [currency.toLowerCase()]
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

function escapeHtml(value) {
    return value.replace(/[&<>"']/g, character => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[character]);
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
}

async function copyToClipboard(value) {
    if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(value);
        return;
    }
    const fallback = document.createElement('textarea');
    fallback.value = value;
    fallback.style.position = 'fixed';
    fallback.style.opacity = '0';
    document.body.append(fallback);
    fallback.select();
    document.execCommand('copy');
    fallback.remove();
}

function attachCopyHandler(output) {
    output.addEventListener('dblclick', async event => {
        const value = output.textContent.trim();
        if (!value) return;

        event.preventDefault();
        try {
            await copyToClipboard(value);
            output.dataset.copyStatus = 'Copied';
            output.classList.remove('copied');
            void output.offsetWidth;
            output.classList.add('copied');
            window.setTimeout(() => output.classList.remove('copied'), 1300);
        } catch (error) {
            console.error('Could not copy result:', error);
        }
    });
}

function updateOutputs() {
    const inputs = [...calculator.querySelectorAll('.calculation-input')];
    const results = evaluateInput(inputs.map(input => input.value).join('\n'), decimalPlaces);
    inputs.forEach((input, index) => {
        const output = input.closest('.calculation-row').querySelector('.calculation-output');
        output.textContent = results[index] || '';
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
            <textarea class="calculation-input" rows="1" placeholder="Type something like: 5 feet to cm"></textarea>
        </div>
        <output class="calculation-output"></output>`;
    const input = row.querySelector('.calculation-input');
    const output = row.querySelector('.calculation-output');
    input.value = value;

    input.addEventListener('input', updateOutputs);
    input.addEventListener('focus', () => { lastFocusedInput = input; });
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
    renderHighlight(input);
    return row;
}

function initializeCalculator() {
    const firstInput = calculator.querySelector('.calculation-input');
    const firstOutput = calculator.querySelector('.calculation-output');
    firstInput.addEventListener('input', updateOutputs);
    firstInput.addEventListener('focus', () => { lastFocusedInput = firstInput; });
    firstInput.addEventListener('keydown', event => {
        if (event.key === 'Enter' && !event.isComposing) {
            event.preventDefault();
            const nextRow = createRow();
            firstInput.parentElement.after(nextRow);
            nextRow.querySelector('.calculation-input').focus();
            updateOutputs();
        }
    });
    resizeInput(firstInput);
    renderHighlight(firstInput);
    attachCopyHandler(firstOutput);
    lastFocusedInput = firstInput;
}

function clearCalculator() {
    calculator.replaceChildren(createRow());
    calculator.querySelector('.calculation-input').focus();
    updateOutputs();
}

function focusCurrentInput() {
    const input = lastFocusedInput?.isConnected
        ? lastFocusedInput
        : calculator.querySelector('.calculation-input');
    if (!input) return;
    input.focus();
    const end = input.value.length;
    input.setSelectionRange(end, end);
}

let recentClearKeys = [];
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

document.addEventListener('keydown', event => {
    if (event.defaultPrevented || event.key.length !== 1 || event.metaKey || event.ctrlKey || event.altKey) return;

    const activeElement = document.activeElement;
    if (activeElement?.closest?.('#settings-panel') || activeElement === document.getElementById('settings-button')) return;
    if (activeElement?.classList?.contains('calculation-input')) return;

    const input = lastFocusedInput?.isConnected ? lastFocusedInput : calculator.querySelector('.calculation-input');
    if (!input) return;

    event.preventDefault();
    focusCurrentInput();
    const end = input.selectionStart;
    input.setRangeText(event.key, end, end, 'end');
    input.dispatchEvent(new Event('input', { bubbles: true }));
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

// This function kicks everything off.
async function main() {
    await loadLocalUnits();
    await loadCurrencyUnits();

    initializeSettings();
    initializeCalculator();
}

main();
