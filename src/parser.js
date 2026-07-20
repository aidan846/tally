import { parseUnitConversion } from './parser/units.js';
import { preprocessNaturalLanguage } from './parser/preprocess.js';
import {
    parseDateDurationVariableArithmetic,
    parseDateMath,
    parseDateOffset,
    parseStandaloneDate,
    parseVariableDateArithmetic
} from './parser/dates.js';
import { parseCurrentTimeAndDate, parseTimeZoneConversion } from './parser/timezones.js';
import { parsePercentageOperations } from './parser/percentages.js';

const parser = math.parser();

let previousResults = [];

let currentPPI = 96;

function defineCssUnits() {
    math.createUnit('px', { definition: `${(0.0254 / currentPPI)} m` }, { override: true });
}

defineCssUnits()

function parseAssignment(line, parser, decimalPlaces) {
    const assignmentRegex = /^([a-zA-Z_][a-zA-Z0-9_]*)\s*[:=]\s*(.*)$/;
    const match = line.match(assignmentRegex);

    if (!match) return null;

    const originalVariableName = match[1];
    const variableNameForScope = originalVariableName.toLowerCase();
    let valueExpression = match[2].trim();

    let assignedValue;
    let outputString;

    if (variableNameForScope === 'ppi') {
        try {
            const ppiValue = parser.evaluate(preprocessNaturalLanguage(valueExpression));
            if (typeof ppiValue === 'number' && ppiValue > 0) {
                currentPPI = ppiValue;
                defineCssUnits(); 
                assignedValue = ppiValue;
                outputString = `${originalVariableName}: ${math.format(assignedValue, { notation: 'fixed', precision: decimalPlaces })} (Custom PPI set)`;
                parser.set(variableNameForScope, assignedValue);
                return outputString;
            }
        } catch (e) {
            console.warn(`Could not set PPI: ${e.message}`);
        }
    }
    const specialTimeDate = parseCurrentTimeAndDate(valueExpression);
    if (specialTimeDate !== null) {
        assignedValue = specialTimeDate;
        outputString = `${originalVariableName}: ${assignedValue}`;
    } else {
        const standaloneDate = parseStandaloneDate(valueExpression);
        if (standaloneDate instanceof Date) {
            assignedValue = standaloneDate;
            outputString = `${originalVariableName}: ${assignedValue.toDateString()}`;
        } else {
            try {
                const processedValueExpression = preprocessNaturalLanguage(valueExpression);
                assignedValue = parser.evaluate(processedValueExpression);

                if (assignedValue instanceof Date) {
                    outputString = `${originalVariableName}: ${assignedValue.toDateString()}`;
                } else if (typeof assignedValue !== 'function') {
                    outputString = `${originalVariableName}: ${math.format(assignedValue, { notation: 'fixed', precision: decimalPlaces })}`;
                } else {
                    outputString = `${originalVariableName}: Function defined`;
                }

            } catch (error) {
                console.error(`Error evaluating variable assignment for "${originalVariableName}" with expression "${valueExpression}":`, error);
                return null;
            }
        }
    }

    parser.set(variableNameForScope, assignedValue);
    return outputString;
}

function parseCssScreenUnits(line, parser, decimalPlaces) {
    const lowerLine = line.toLowerCase().trim();

    const ppiAssignmentMatch = lowerLine.match(/^ppi\s*[:=]\s*(\d+\.?\d*)$/);
    if (ppiAssignmentMatch) {
        const newPpi = parseFloat(ppiAssignmentMatch[1]);
        if (!isNaN(newPpi) && newPpi > 0) {
            currentPPI = newPpi;
            defineCssUnits();
            return `PPI set to ${math.format(currentPPI, { notation: 'fixed', precision: decimalPlaces })}`;
        }
    }

    const emBaseAssignmentMatch = lowerLine.match(/^em\s*[:=]\s*(.*)$/);
    if (emBaseAssignmentMatch) {
        try {
            const emBaseValue = parser.evaluate(preprocessNaturalLanguage(emBaseAssignmentMatch[1]));
            if (emBaseValue instanceof math.Unit) {
                math.createUnit('em', { definition: emBaseValue }, { override: true });
                return `EM base set to ${math.format(emBaseValue, { notation: 'fixed', precision: decimalPlaces })}`;
            }
        } catch (e) {
            console.warn(`Could not set EM base: ${e.message}`);
        }
    }

    return null;
}

export function evaluateInput(fullInputText, decimalPlaces) {
    const lines = fullInputText.split('\n');
    const results = [];

    parser.clear();

    defineCssUnits();

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        if (!line.trim()) {
            results.push('');
            continue;
        }
        let result = '';
        try {
            const lowerLine = line.toLowerCase().trim();
            if (lowerLine === 'sum' || lowerLine === 'total') {
                const sum = previousResults.reduce((acc, val) => {
                    if (typeof acc === 'string' || typeof val === 'string') return acc;
                    if (val instanceof math.Unit && acc instanceof math.Unit) {
                        try { return math.add(acc, val); } catch (e) { return acc; }
                    }
                    if (typeof val === 'number' && typeof acc === 'number') return acc + val;
                    return acc;
                }, 0);
                result = math.format(sum, { notation: 'fixed', precision: decimalPlaces });
            } else if (lowerLine === 'average' || lowerLine === 'avg') {
                const numbers = previousResults.filter(val => typeof val === 'number' || val instanceof math.Unit);
                if (numbers.length > 0) {
                    const sum = numbers.reduce((acc, val) => {
                        if (val instanceof math.Unit && acc instanceof math.Unit) {
                            try { return math.add(acc, val); } catch (e) { return acc; }
                        }
                        if (typeof val === 'number' && typeof acc === 'number') return acc + val;
                        return acc;
                    }, 0);
                    const avg = math.divide(sum, numbers.length);
                    result = math.format(avg, { notation: 'fixed', precision: decimalPlaces });
                } else {
                    result = 'N/A';
                }
            }
            else {
                const cssUnitResult = parseCssScreenUnits(line, parser, decimalPlaces);
                if (cssUnitResult !== null) {
                    result = cssUnitResult;
                }
                else {
                    const currentTimeDateResult = parseCurrentTimeAndDate(line);
                    if (currentTimeDateResult !== null) {
                        result = currentTimeDateResult;
                    }
                    else {
                        const timeZoneConversionResult = parseTimeZoneConversion(line);
                        if (timeZoneConversionResult !== null) {
                            result = timeZoneConversionResult;
                        }
                        else {
                            const assignmentResult = parseAssignment(line, parser, decimalPlaces);
                            if (assignmentResult !== null) {
                                result = assignmentResult;
                            }
                            else {
                                const dateOffsetResult = parseDateOffset(line);
                                if (dateOffsetResult instanceof Date) {
                                    result = dateOffsetResult.toDateString();
                                }
                                else {
                                    const standaloneDateResult = parseStandaloneDate(line);
                                    if (standaloneDateResult instanceof Date) {
                                        result = standaloneDateResult.toDateString();
                                    }
                                    else {
                                        const dateMathResult = parseDateMath(line);
                                        if (dateMathResult instanceof Date) {
                                            result = dateMathResult.toDateString();
                                        }
                                        else {
                                            const varDateArithmeticResult = parseDateDurationVariableArithmetic(line, parser) || parseVariableDateArithmetic(line, parser);
                                            if (varDateArithmeticResult !== null) {
                                                result = varDateArithmeticResult.toDateString();
                                            }
                                            else {
                                                const percentageResult = parsePercentageOperations(line, parser, decimalPlaces);
                                                if (percentageResult !== null) {
                                                    result = percentageResult;
                                                } else {
                                                    const conversionResult = parseUnitConversion(line, decimalPlaces);
                                                    if (conversionResult !== null) {
                                                        result = conversionResult;
                                                    } else {
                                                    let processedLine = preprocessNaturalLanguage(line);
                                                    processedLine = processedLine.replace(/\b(?:sci|scientific)\b/g, '').trim();

                                                if (previousResults.length > 0 && processedLine.includes('prev')) {
                                                    const lastResult = previousResults[previousResults.length - 1];
                                                    if (typeof lastResult === 'number' || lastResult instanceof math.Unit) {
                                                        processedLine = processedLine.replace(/\bprev\b/g, `(${math.format(lastResult, { notation: 'fixed', precision: 10 })})`);
                                                    } else if (lastResult instanceof Date) {
                                                        processedLine = processedLine.replace(/\bprev\b/g, `"${lastResult.toISOString()}"`);
                                                    } else {
                                                        processedLine = processedLine.replace(/\bprev\b/g, `"${lastResult}"`);
                                                    }
                                                }

                                                    const evalResult = parser.evaluate(processedLine);

                                                        if (typeof evalResult !== 'function') {
                                                    let notation = 'fixed';
                                                    if (line.toLowerCase().includes('sci') || line.toLowerCase().includes('scientific')) {
                                                        notation = 'exponential';
                                                    }
                                                        result = notation === 'exponential' && typeof evalResult === 'number'
                                                            ? evalResult.toExponential(decimalPlaces)
                                                            : math.format(evalResult, { notation, precision: decimalPlaces });
                                                        } else {
                                                            result = 'Function defined';
                                                        }
                                                    }
                                                }
                                            }
                                        }
                                    }
                                }
                            }
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
            const assignmentMatch = line.match(/^([a-zA-Z_][a-zA-Z0-9_]*)\s*[:=]/);
            if (assignmentMatch) {
                const assignedValue = parser.get(assignmentMatch[1].toLowerCase());
                previousResults.push(assignedValue === undefined ? result : assignedValue);
                continue;
            }
            try {
                const originalEval = parser.evaluate(preprocessNaturalLanguage(line));
                if (typeof originalEval !== 'function') {
                    previousResults.push(originalEval);
                }
            } catch (e) {
                previousResults.push(result);
            }
        }
    }
    return results;
}
