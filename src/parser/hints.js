import { getGhostHint as getGeometryHint } from './geometry.js';

// Hints only appear after a complete command prefix, keeping normal typing
// unobstructed while making structured natural-language commands discoverable.
export function getInputHint(text) {
    const geometryHint = getGeometryHint(text);
    if (geometryHint) return geometryHint;

    if (/^(?:midpoint between|random number between)\s+$/i.test(text)) return 'first and second value';
    if (/^weeks between\s+$/i.test(text)) return 'start date and end date';
    if (/^(?:sum|product|difference|quotient|average|avg|mean|median|mode)\s+$/i.test(text)) return 'values';
    if (/^-?(?:\d+(?:\.\d+)?|\.\d+)\s*%\s+(?:off|of)\s+$/i.test(text)) return 'value';
    if (/^-?(?:\d+(?:\.\d+)?|\.\d+)\s+is what\s+%\s+of\s+$/i.test(text)) return 'value';
    if (/^-?(?:\d+(?:\.\d+)?|\.\d+)\s+.+\s+(?:to|into|as)\s+$/i.test(text)) return 'unit';
    if (/^(?:\d{1,2}:\d{2}(?:\s*(?:am|pm))?|time)\s+.+\s+to\s+$/i.test(text)) return 'destination city';
    return '';
}
