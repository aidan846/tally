import { parseUnitConversion } from './parser/units.js';
import { preprocessNaturalLanguage } from './parser/preprocess.js';
import {
    parseCalendarExpression,
    parseDateDifference,
    parseDateDurationVariableArithmetic,
    parseDateMath,
    parseDateOffset,
    parseDaysUntil,
    parseStandaloneDate,
    parseVariableDateArithmetic
} from './parser/dates.js';
import { parseCurrentTimeAndDate, parseTimeZoneConversion } from './parser/timezones.js';
import { parsePercentageOperations } from './parser/percentages.js';
import { currencyPreference, evaluateCurrencyBinary, formatCurrency } from './parser/currency.js';
import { parseStatistics } from './parser/statistics.js';
import { tryParseGeometry } from './parser/geometry.js';
import { parsePowerShorthand } from './parser/powers.js';
import {
    formatDuration,
    isComment,
    isHeading,
    normalizeNumberFormat,
    rewriteCompactDurations,
    rewriteFeetInches,
    rewritePhrases,
    stripTrailingComment
} from './parser/extras.js';

const parser = math.parser();
let previousResults = [];
let currentPPI = 96;
let numberFormat = 'us';

// 'us' reads 1,234.56 and 'eu' reads 1.234,56.
export function setNumberFormat(format) {
    numberFormat = format === 'eu' ? 'eu' : 'us';
}

function defineCssUnits() {
    math.createUnit('px', { definition: `${0.0254 / currentPPI} m` }, { override: true });
}

function variableKey(name) {
    return name.trim().toLowerCase().replace(/\s+/g, '_');
}

function replaceVariables(expression, aliases) {
    let result = expression;
    const entries = [...aliases.entries()].sort(([left], [right]) => right.length - left.length);
    for (const [name, key] of entries) {
        const pattern = name.split(/\s+/).map(part => part.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('\\s+');
        result = result.replace(new RegExp(`\\b${pattern}\\b`, 'gi'), key);
    }
    return result;
}

function formatValue(value, line, decimalPlaces, variableStyles) {
    const money = formatCurrency(value, line, variableStyles);
    if (money !== null) return money;
    if (value instanceof Date) return value.toDateString();
    if (typeof value === 'function') return 'Function defined';
    if (typeof value === 'number' && Number.isNaN(value)) return 'Undefined';
    if (typeof value === 'number' && !Number.isFinite(value)) return value > 0 ? '∞' : '-∞';
    if (value && value.isComplex) return 'Not a real number';
    if (/\b(?:sci|scientific)\b/i.test(line) && typeof value === 'number') return value.toExponential(decimalPlaces);
    return math.format(value, { notation: 'fixed', precision: decimalPlaces });
}

function parseAssignment(line, decimalPlaces, aliases, variableStyles, prepareExpression) {
    const match = line.match(/^([a-zA-Z_][a-zA-Z0-9_]*(?:\s+[a-zA-Z_][a-zA-Z0-9_]*)*)\s*[:=]\s*(.+)$/);
    if (!match) return null;

    const name = match[1].trim();
    const key = variableKey(name);
    const valueExpression = match[2].trim();
    aliases.set(name.toLowerCase(), key);

    if (key === 'ppi') {
        try {
            const value = parser.evaluate(prepareExpression(valueExpression));
            if (typeof value === 'number' && value > 0) {
                currentPPI = value;
                defineCssUnits();
                parser.set(key, value);
                return { key, value, output: math.format(value, { notation: 'fixed', precision: decimalPlaces }) };
            }
        } catch (error) {
            console.warn(`Could not set PPI: ${error.message}`);
        }
    }

    const currentTime = parseCurrentTimeAndDate(valueExpression);
    if (currentTime !== null) {
        parser.set(key, currentTime);
        return { key, value: currentTime, output: currentTime };
    }

    const standaloneDate = parseStandaloneDate(valueExpression, { allowNumeric: true });
    if (standaloneDate instanceof Date) {
        parser.set(key, standaloneDate);
        return { key, value: standaloneDate, output: standaloneDate.toDateString() };
    }

    try {
        const value = parser.evaluate(prepareExpression(valueExpression));
        const preference = currencyPreference(valueExpression, variableStyles);
        if (formatCurrency(value, valueExpression, variableStyles) !== null && preference) variableStyles.set(key, preference);
        parser.set(key, value);
        return { key, value, output: formatValue(value, valueExpression, decimalPlaces, variableStyles) };
    } catch (error) {
        console.error(`Error evaluating variable assignment for "${name}" with expression "${valueExpression}":`, error);
        return null;
    }
}

function parseCssScreenUnits(line, decimalPlaces, prepareExpression) {
    const lowerLine = line.toLowerCase().trim();
    const ppiMatch = lowerLine.match(/^ppi\s*[:=]\s*(\d+\.?\d*)$/);
    if (ppiMatch) {
        currentPPI = Number(ppiMatch[1]);
        if (currentPPI > 0) {
            defineCssUnits();
            return `PPI set to ${math.format(currentPPI, { notation: 'fixed', precision: decimalPlaces })}`;
        }
    }

    const emMatch = lowerLine.match(/^em\s*[:=]\s*(.*)$/);
    if (!emMatch) return null;
    try {
        const value = parser.evaluate(prepareExpression(emMatch[1]));
        if (!(value instanceof math.Unit)) return null;
        math.createUnit('em', { definition: value }, { override: true });
        return `EM base set to ${math.format(value, { notation: 'fixed', precision: decimalPlaces })}`;
    } catch (error) {
        console.warn(`Could not set EM base: ${error.message}`);
        return null;
    }
}

const AGGREGATE_PATTERN = /^(sum|total|average|avg|mean)\s*:?$/i;
const CONTINUATION_PATTERN = /^\s*([+\-*/×÷^])\s*(\S.*)$/;

// Turn a stored line result into something that can be added up.
function toNumeric(value) {
    if (typeof value === 'number') return Number.isFinite(value) ? value : null;
    if (value instanceof math.Unit) return value;
    if (typeof value !== 'string') return null;
    const text = value.trim();
    if (/^[+-]?(?:\d+(?:\.\d+)?|\.\d+)$/.test(text)) return Number(text);
    if (/^[+-]?(?:\d+(?:\.\d+)?|\.\d+)\s+[a-z][a-z0-9/]*$/i.test(text)) {
        try { return math.unit(text); } catch { return null; }
    }
    // Currency text such as "$9.00" from the percentage parser.
    if (/^(?:NZ\$|HK\$|A\$|C\$|S\$|R\$|[$€£¥₹₩₽₺₫฿₱₦])\s*[+-]?[\d.]+$/.test(text)) {
        try { return parser.evaluate(preprocessNaturalLanguage(text)); } catch { return null; }
    }
    return null;
}

function unitLike(value, reference) {
    return typeof value === 'number' && reference instanceof math.Unit
        ? math.unit(value, reference.formatUnits())
        : value;
}

// Adds up the numbers in the current block (since the last blank line or heading).
function aggregateBlock(kind, values) {
    const numbers = values.map(toNumeric).filter(value => value !== null);
    if (!numbers.length) return null;
    const reference = numbers.find(value => value instanceof math.Unit);
    let total = null;
    let count = 0;
    for (const value of numbers) {
        try {
            const term = unitLike(value, reference);
            total = total === null ? term : math.add(total, term);
            count += 1;
        } catch {
            // Skip values that can't be combined (e.g. cm alongside USD).
        }
    }
    if (total === null) return null;
    return kind === 'average' ? math.divide(total, count) : total;
}

function applyContinuation(previous, operator, rest, prepareExpression) {
    const op = { '×': '*', '÷': '/' }[operator] || operator;
    const percent = rest.trim().match(/^([+-]?(?:\d+(?:\.\d+)?|\.\d+))\s*%$/);
    if (percent) {
        const rate = Number(percent[1]) / 100;
        if (op === '+') return math.multiply(previous, 1 + rate);
        if (op === '-') return math.multiply(previous, 1 - rate);
        if (op === '*') return math.multiply(previous, rate);
        if (op === '/') return math.divide(previous, rate);
    }
    let right = parser.evaluate(prepareExpression(rest));
    if ((op === '+' || op === '-') && typeof right === 'number') right = unitLike(right, previous);
    if (op === '+') return math.add(previous, right);
    if (op === '-') return math.subtract(previous, right);
    if (op === '*') return math.multiply(previous, right);
    if (op === '/') return math.divide(previous, right);
    return math.pow(previous, right);
}

// After `tax = 8%`, "price + tax" means price plus 8%, not price + 0.08.
function substitutePercentVariables(line, percentVariables) {
    let result = line;
    for (const [name, percent] of percentVariables) {
        const pattern = name.split(/\s+/).map(part => part.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('\\s+');
        result = result.replace(new RegExp(`([+-]|\\bplus|\\bminus)\\s*\\b${pattern}\\b`, 'gi'), `$1 ${percent}`);
    }
    return result;
}

function assignmentParts(line) {
    return line.match(/^(\s*[a-zA-Z_][a-zA-Z0-9_]*(?:\s+[a-zA-Z_][a-zA-Z0-9_]*)*\s*[:=]\s*)(.+)$/);
}

export function evaluateInput(fullInputText, decimalPlaces) {
    const lines = fullInputText.split('\n');
    const results = [];
    const aliases = new Map();
    const variableStyles = new Map();
    const percentVariables = new Map();

    parser.clear();
    previousResults = [];
    defineCssUnits();

    const prepareExpression = expression => preprocessNaturalLanguage(replaceVariables(expression, aliases));

    // A "block" is the run of lines since the last blank line or heading.
    let blockValues = [];
    let blockLines = [];
    let blockLast = null;
    const resetBlock = () => { blockValues = []; blockLines = []; blockLast = null; };

    for (const rawLine of lines) {
        if (!rawLine.trim() || isHeading(rawLine)) {
            results.push('');
            resetBlock();
            continue;
        }
        if (isComment(rawLine)) {
            results.push('');
            continue;
        }

        let line = normalizeNumberFormat(stripTrailingComment(rawLine), numberFormat);
        const assignment = assignmentParts(line);
        const rewrite = text => {
            const phrased = rewriteFeetInches(rewritePhrases(substitutePercentVariables(text, percentVariables)));
            return rewriteCompactDurations(phrased) ?? phrased;
        };
        const durationStyle = rewriteCompactDurations(line) !== null && !/\s(?:to|in|into|as)\s/i.test(line);
        line = assignment ? `${assignment[1]}${rewrite(assignment[2])}` : rewrite(line);

        let result = '';
        let storedValue;
        let excludeFromTotals = false;
        let isContinuation = false;
        try {
            const lowerLine = line.toLowerCase().trim();
            const aggregate = lowerLine.match(AGGREGATE_PATTERN);
            const continuation = !assignment && blockLast !== null ? line.match(CONTINUATION_PATTERN) : null;

            if (aggregate) {
                excludeFromTotals = true;
                const kind = /^(average|avg|mean)$/.test(aggregate[1]) ? 'average' : 'sum';
                storedValue = aggregateBlock(kind, blockValues);
                // Format with the block's own lines so "$" amounts total as "$".
                result = storedValue === null ? 'N/A' : formatValue(storedValue, blockLines.join(' ') || line, decimalPlaces, variableStyles);
                if (storedValue === null) storedValue = undefined;
            } else if (continuation && toNumeric(blockLast.value) !== null) {
                isContinuation = true;
                storedValue = applyContinuation(toNumeric(blockLast.value), continuation[1], continuation[2], prepareExpression);
                result = formatValue(storedValue, `${blockLast.line} ${line}`, decimalPlaces, variableStyles);
            } else {
                const outcome = evaluateLine(line, decimalPlaces, { aliases, variableStyles, percentVariables, prepareExpression });
                ({ result, storedValue } = outcome);
                // A rate like `tax = 8%` isn't an amount, so leave it out of totals.
                if (outcome.isPercent) excludeFromTotals = true;
                if (durationStyle && storedValue instanceof math.Unit && storedValue.equalBase(math.unit('1 s'))) {
                    result = formatDuration(storedValue);
                }
            }
        } catch (error) {
            result = '❌';
            console.error(`Error evaluating line "${rawLine}":`, error);
        }

        results.push(result);
        const hasValue = result !== '❌' && result !== '' && result !== 'Function defined' && result !== 'N/A';
        if (hasValue) {
            const value = storedValue === undefined ? result : storedValue;
            previousResults.push(value);
            if (isContinuation && blockValues.length) blockValues[blockValues.length - 1] = value;
            else if (!excludeFromTotals) blockValues.push(value);
            if (!excludeFromTotals) blockLines.push(line);
            blockLast = { value, line: isContinuation ? `${blockLast.line} ${line}` : line };
        }
    }

    return results;
}

// Tries each parser in order and stops at the first one that understands the line.
function evaluateLine(line, decimalPlaces, { aliases, variableStyles, percentVariables, prepareExpression }) {
    const asDate = date => (date instanceof Date ? { result: date.toDateString(), storedValue: date } : null);
    const asText = text => (text !== null && text !== undefined ? { result: text, storedValue: undefined } : null);

    const statistics = parseStatistics(line, decimalPlaces);
    if (statistics !== null) return { result: statistics, storedValue: Number(statistics) };

    const steps = [
        () => asText(parseCssScreenUnits(line, decimalPlaces, prepareExpression)),
        () => asText(parseTimeZoneConversion(line)),
        () => asText(parseCurrentTimeAndDate(line)),
        () => asText(parseCalendarExpression(line)),
        () => asText(parseDaysUntil(line)),
        () => {
            const assignment = parseAssignment(line, decimalPlaces, aliases, variableStyles, prepareExpression);
            if (!assignment) return null;
            const percent = line.match(/[:=]\s*([+-]?(?:\d+(?:\.\d+)?|\.\d+)\s*%)\s*$/);
            const name = line.match(/^\s*([a-zA-Z_][a-zA-Z0-9_ ]*?)\s*[:=]/)[1].toLowerCase();
            if (percent) {
                percentVariables.set(name, percent[1].replace(/\s+/g, ''));
                const shown = `${math.format(assignment.value * 100, { notation: 'fixed', precision: decimalPlaces })}%`;
                return { result: shown, storedValue: assignment.value, isPercent: true };
            }
            percentVariables.delete(name);
            return { result: assignment.output, storedValue: assignment.value };
        },
        () => asDate(parseDateOffset(line)),
        () => asDate(parseStandaloneDate(line)),
        () => asDate(parseDateMath(line)),
        () => asText(parseDateDifference(line)),
        () => asDate(parseDateDurationVariableArithmetic(line, parser) || parseVariableDateArithmetic(line, parser)),
        () => asText(parsePercentageOperations(line, parser, decimalPlaces)),
        () => asText(parseUnitConversion(line, decimalPlaces)),
        () => {
            const geometry = tryParseGeometry(line);
            if (geometry === null) return null;
            return { result: formatValue(geometry, line, decimalPlaces, variableStyles).replace(/\^([23])\b/g, '$1'), storedValue: geometry };
        },
        () => asText(parsePowerShorthand(line, decimalPlaces))
    ];
    for (const step of steps) {
        const outcome = step();
        if (outcome) return outcome;
    }

    let processedLine = prepareExpression(line).replace(/\b(?:sci|scientific)\b/g, '').trim();
    if (previousResults.length > 0 && processedLine.includes('prev')) {
        const previous = previousResults[previousResults.length - 1];
        if (typeof previous === 'number' || previous instanceof math.Unit) {
            processedLine = processedLine.replace(/\bprev\b/g, `(${math.format(previous, { notation: 'fixed', precision: 10 })})`);
        } else if (previous instanceof Date) {
            processedLine = processedLine.replace(/\bprev\b/g, `"${previous.toISOString()}"`);
        } else {
            processedLine = processedLine.replace(/\bprev\b/g, `"${previous}"`);
        }
    }

    const storedValue = evaluateCurrencyBinary(line, parser, prepareExpression) ?? parser.evaluate(processedLine);
    return { result: formatValue(storedValue, line, decimalPlaces, variableStyles), storedValue };
}
