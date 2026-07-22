import { escapeHtml } from './answer-format.js';

export function highlightExpression(value, { stockSymbols = [] } = {}) {
    const tokenPattern = /(?:\d+(?:\.\d+)?|\.\d+)|(?<![a-z])(?:km\/h|m\/s|nmi|mm|cm|dm|km|ft|yd|mi|mg|kg|lb|lbs|oz|psi|atm|kpa|hpa|mpa|mph|kph|mps|ml|gal|liters?|grams?|meters?|feet|miles?|pounds?|celsius|fahrenheit|kelvin|weeks?|days?|hours?|minutes?|seconds?|teaspoons?|tablespoons?|cups?|euros?|euro|eur|gbp|usd|jpy|ago|[cfkgm])\b|°[cfk]\b|\b(?:and|or|not|minus|plus|add|times|to|in|into|as|from|before|after|with|without|subtract|divide|multiplied|by|xor|mod|sum|total|average|avg|of)\b|[+\-*/%=]|\b[a-z_][a-z0-9_ ]*(?=\s*[:=])/gi;
    const compactUnitPattern = /(?<![a-z])(?:mm|cm|dm|km|ft|in|yd|mi|mg|kg|lb|oz|ml|gal|[cfkgm])(?:2|3|²|³)(?!\w)/gi;
    const overlaps = (match, candidates) => candidates.some(candidate => match.index < candidate.index + candidate[0].length && candidate.index < match.index + match[0].length);
    const escapeRegExp = text => text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const stockMatches = [];
    for (const symbol of new Set(stockSymbols.filter(Boolean))) {
        const pattern = new RegExp(`(?<![a-z0-9_.-])${escapeRegExp(symbol)}(?![a-z0-9_.-])`, 'gi');
        for (const match of value.matchAll(pattern)) {
            match.isStock = true;
            stockMatches.push(match);
        }
    }
    const compactUnits = [...value.matchAll(compactUnitPattern)].filter(match => !overlaps(match, stockMatches));
    const matches = [
        ...[...value.matchAll(tokenPattern)].filter(match => !overlaps(match, [...stockMatches, ...compactUnits])),
        ...compactUnits,
        ...stockMatches
    ].sort((left, right) => left.index - right.index);
    let html = '';
    let cursor = 0;
    for (const match of matches) {
        html += escapeHtml(value.slice(cursor, match.index));
        const token = match[0];
        const isBasicOperator = /^[+\-*/%=]$/.test(token);
        const assignmentToken = /^\s*[:=]/.test(value.slice(match.index + token.length)) || /^[=:]$/.test(token) && /^\s*[a-z_][a-z0-9_ ]*\s*$/i.test(value.slice(0, match.index));
        const isCompactUnit = /^(?:mm|cm|dm|km|ft|in|yd|mi|mg|kg|lb|oz|ml|gal|[cfkgm])(?:2|3|²|³)$/i.test(token);
        const className = match.isStock ? 'token-stock'
            : isCompactUnit ? 'token-unit'
            : /^(?:\d|\.)/.test(token) ? 'token-number'
            : isBasicOperator ? ''
            : assignmentToken ? 'token-variable'
            : /^(?:km\/h|m\/s|nmi|mm|cm|dm|km|ft|yd|mi|mg|kg|lb|lbs|oz|psi|atm|kpa|hpa|mpa|mph|kph|mps|ml|gal|liters?|grams?|meters?|feet|miles?|pounds?|celsius|fahrenheit|kelvin|weeks?|days?|hours?|minutes?|seconds?|teaspoons?|tablespoons?|cups?|euros?|euro|eur|gbp|usd|jpy|ago|°[cfk]|[cfkgm])$/i.test(token) ? 'token-unit'
            : /^(?:and|or|not|minus|plus|add|times|to|in|into|as|from|before|after|with|without|subtract|divide|multiplied|by|xor|mod|sum|total|average|avg|of)$/i.test(token) ? 'token-connector'
            : '';
        html += className ? `<span class="${className}">${escapeHtml(token)}</span>` : escapeHtml(token);
        cursor = match.index + token.length;
    }
    return html + escapeHtml(value.slice(cursor));
}
