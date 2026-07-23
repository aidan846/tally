import { parseUnitConversion } from './parser/units.js';
import { preprocessNaturalLanguage } from './parser/preprocess.js';
import {
    parseCalendarExpression,
    parseDateDifference,
    parseDateDurationVariableArithmetic,
    parseDateMath,
    parseDateOffset,
    parseStandaloneDate,
    parseVariableDateArithmetic
} from './parser/dates.js';
import { parseCurrentTimeAndDate, parseTimeZoneConversion } from './parser/timezones.js';
import { parsePercentageOperations } from './parser/percentages.js';
import { currencyPreference, evaluateCurrencyBinary, formatCurrency } from './parser/currency.js';
import { parseStatistics } from './parser/statistics.js';

const parser = math.parser();
let previousResults = [];
let currentPPI = 96;

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

function aggregatePrevious(kind, decimalPlaces) {
    const values = previousResults.filter(value => typeof value === 'number' || value instanceof math.Unit);
    if (!values.length) return 'N/A';
    const total = values.reduce((sum, value) => {
        if (sum === null) return value;
        try {
            return math.add(sum, value);
        } catch {
            return sum;
        }
    }, null);
    const result = kind === 'average' ? math.divide(total, values.length) : total;
    return math.format(result, { notation: 'fixed', precision: decimalPlaces });
}

export function evaluateInput(fullInputText, decimalPlaces) {
    const lines = fullInputText.split('\n');
    const results = [];
    const aliases = new Map();
    const variableStyles = new Map();

    parser.clear();
    previousResults = [];
    defineCssUnits();

    const prepareExpression = expression => preprocessNaturalLanguage(replaceVariables(expression, aliases));

    for (const line of lines) {
        if (!line.trim()) {
            results.push('');
            continue;
        }

        let result = '';
        let storedValue;
        try {
            const lowerLine = line.toLowerCase().trim();
            const statistics = parseStatistics(line, decimalPlaces);
            if (statistics !== null) {
                result = statistics;
                storedValue = Number(statistics);
            } else if (lowerLine === 'sum' || lowerLine === 'total') {
                result = aggregatePrevious('sum', decimalPlaces);
            } else if (lowerLine === 'average' || lowerLine === 'avg') {
                result = aggregatePrevious('average', decimalPlaces);
            } else {
                const cssUnits = parseCssScreenUnits(line, decimalPlaces, prepareExpression);
                const timeZone = cssUnits === null ? parseTimeZoneConversion(line) : null;
                const currentTime = cssUnits === null && timeZone === null ? parseCurrentTimeAndDate(line) : null;
                const calendar = cssUnits === null && timeZone === null && currentTime === null ? parseCalendarExpression(line) : null;

                if (cssUnits !== null) {
                    result = cssUnits;
                } else if (timeZone !== null) {
                    result = timeZone;
                } else if (calendar !== null) {
                    result = calendar;
                } else if (currentTime !== null) {
                    result = currentTime;
                } else {
                    const assignment = parseAssignment(line, decimalPlaces, aliases, variableStyles, prepareExpression);
                    if (assignment !== null) {
                        result = assignment.output;
                        storedValue = assignment.value;
                    } else {
                        const dateOffset = parseDateOffset(line);
                        const standaloneDate = parseStandaloneDate(line);
                        const dateMath = parseDateMath(line);
                        const dateDifference = parseDateDifference(line);
                        const variableDate = parseDateDurationVariableArithmetic(line, parser) || parseVariableDateArithmetic(line, parser);
                        const percentage = parsePercentageOperations(line, parser, decimalPlaces);
                        const conversion = parseUnitConversion(line, decimalPlaces);

                        if (dateOffset instanceof Date) {
                            storedValue = dateOffset;
                            result = dateOffset.toDateString();
                        } else if (standaloneDate instanceof Date) {
                            storedValue = standaloneDate;
                            result = standaloneDate.toDateString();
                        } else if (dateMath instanceof Date) {
                            storedValue = dateMath;
                            result = dateMath.toDateString();
                        } else if (dateDifference !== null) {
                            result = dateDifference;
                        } else if (variableDate instanceof Date) {
                            storedValue = variableDate;
                            result = variableDate.toDateString();
                        } else if (percentage !== null) {
                            result = percentage;
                        } else if (conversion !== null) {
                            result = conversion;
                        } else {
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

                            storedValue = evaluateCurrencyBinary(line, parser, prepareExpression) ?? parser.evaluate(processedLine);
                            result = formatValue(storedValue, line, decimalPlaces, variableStyles);
                        }
                    }
                }
            }
        } catch (error) {
            result = '❌';
            console.error(`Error evaluating line "${line}":`, error);
        }

        results.push(result);
        if (result !== '❌' && result !== '' && result !== 'Function defined') {
            previousResults.push(storedValue === undefined ? result : storedValue);
        }
    }

    return results;
}
