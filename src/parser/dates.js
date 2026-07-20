export function parseStandaloneDate(line) {
    const trimmedLine = line.trim();
    const date = new Date(trimmedLine);

    if (isNaN(date.getTime())) {
        return null;
    }

    const hasSeparator = /^(?:\d{1,2}[/-]\d{1,2}(?:[/-]\d{2,4})?|\d{4}[/-]\d{1,2}[/-]\d{1,2})$/.test(trimmedLine);
    const hasMonthName = /\b(?:jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec|january|february|march|april|may|june|july|august|september|october|november|december)\b/i.test(trimmedLine);
    if (!hasSeparator && !hasMonthName && !trimmedLine.toLowerCase().includes('today') && !trimmedLine.toLowerCase().includes('now')) {
        return null;
    }

    return date;
}

export function parseDateMath(line) {
    const regex = /(\d+)\s+(days?|weeks?|months?|years?)\s+(from|before)\s+(today|now|(\d{1,2}[\/-]\d{1,2}([\/-]\d{2,4})?|\w+\s+\d{1,2}\s+\d{4}))/i;
    const match = line.match(regex);
    if (!match) return null;

    const [, amountStr, unit, direction, baseDateStr] = match;
    const amount = parseInt(amountStr, 10);
    const baseDate = (baseDateStr.toLowerCase() === 'today' || baseDateStr.toLowerCase() === 'now') ? new Date() : new Date(baseDateStr);

    if (isNaN(baseDate.getTime())) return null;

    const multiplier = (direction === 'before') ? -1 : 1;
    const newDate = new Date(baseDate.getTime());

    switch (unit.toLowerCase().replace(/s$/, '')) {
        case 'day': newDate.setDate(newDate.getDate() + amount * multiplier); break;
        case 'week': newDate.setDate(newDate.getDate() + 7 * amount * multiplier); break;
        case 'month': newDate.setMonth(newDate.getMonth() + amount * multiplier); break;
        case 'year': newDate.setFullYear(newDate.getFullYear() + amount * multiplier); break;
        default:
            return null;
    }
    return newDate;
}

export function parseDateOffset(line) {
    const datePattern = '(?:today|now|date|\\d{1,2}[/-]\\d{1,2}[/-]\\d{2,4}|(?:jan(?:uary)?|feb(?:ruary)?|mar(?:ch)?|apr(?:il)?|may|jun(?:e)?|jul(?:y)?|aug(?:ust)?|sep(?:t(?:ember)?)?|oct(?:ober)?|nov(?:ember)?|dec(?:ember)?)\\s+\\d{1,2},?\\s+\\d{4})';
    const unitPattern = '(?:days?|d|weeks?|wks?|wk|months?|mos?|mo|years?|yrs?|yr)';
    const trimmedLine = line.trim();
    const agoMatch = trimmedLine.match(new RegExp(`^(\\d+)\\s*(${unitPattern})\\s+ago$`, 'i'));
    const offsetMatch = trimmedLine.match(new RegExp(`^(${datePattern})\\s*(plus|add|minus|subtract|\\+|-)\\s*(\\d+)\\s*(${unitPattern})?$`, 'i'));

    const baseDate = agoMatch
        ? new Date()
        : offsetMatch && (/^(today|now|date)$/i.test(offsetMatch[1]) ? new Date() : new Date(offsetMatch[1]));
    if (!baseDate || Number.isNaN(baseDate.getTime())) return null;

    const result = new Date(baseDate.getTime());
    const amount = agoMatch
        ? -Number(agoMatch[1])
        : Number(offsetMatch[3]) * (/^(minus|subtract|-)$/i.test(offsetMatch[2]) ? -1 : 1);
    const unitText = agoMatch ? agoMatch[2] : (offsetMatch[4] || 'days');
    switch (unitText.toLowerCase().replace(/s$/, '')) {
        case 'day': result.setDate(result.getDate() + amount); break;
        case 'd': result.setDate(result.getDate() + amount); break;
        case 'week': result.setDate(result.getDate() + amount * 7); break;
        case 'wk': result.setDate(result.getDate() + amount * 7); break;
        case 'month': result.setMonth(result.getMonth() + amount); break;
        case 'mo': result.setMonth(result.getMonth() + amount); break;
        case 'year': result.setFullYear(result.getFullYear() + amount); break;
        case 'yr': result.setFullYear(result.getFullYear() + amount); break;
        default: return null;
    }
    return result;
}

export function parseVariableDateArithmetic(line, parser) {
    const regex = /^([a-zA-Z_][a-zA-Z0-9_]*)\s*([+\-])\s*(\d+)\s+(days?|weeks?|months?|years?)$/i;
    const match = line.match(regex);

    if (!match) return null;

    const [, varName, operator, amountStr, unit] = match;
    const variableNameLower = varName.toLowerCase();
    const amount = parseInt(amountStr, 10);
    const multiplier = (operator === '-') ? -1 : 1;

    let baseDate = parser.get(variableNameLower);
    if (!(baseDate instanceof Date)) {
        try { baseDate = parser.evaluate(variableNameLower); } catch (error) { return null; }
    }

    if (!(baseDate instanceof Date)) return null;

    const newDate = new Date(baseDate.getTime());

    switch (unit.toLowerCase().replace(/s$/, '')) {
        case 'day': newDate.setDate(newDate.getDate() + amount * multiplier); break;
        case 'week': newDate.setDate(newDate.getDate() + 7 * amount * multiplier); break;
        case 'month': newDate.setMonth(newDate.getMonth() + amount * multiplier); break;
        case 'year': newDate.setFullYear(newDate.getFullYear() + amount * multiplier); break;
        default: return null;
    }
    return newDate;
}

export function parseDateDurationVariableArithmetic(line, parser) {
    const match = line.trim().match(/^(today|now|date|[a-zA-Z_][a-zA-Z0-9_]*)\s*([+\-])\s*([a-zA-Z_][a-zA-Z0-9_]*)$/i);
    if (!match) return null;

    const [, baseName, operator, durationName] = match;
    let baseDate;
    if (/^(today|now|date)$/i.test(baseName)) {
        baseDate = new Date();
    } else {
        try { baseDate = parser.get(baseName.toLowerCase()) ?? parser.evaluate(baseName.toLowerCase()); } catch (error) { return null; }
    }
    if (!(baseDate instanceof Date)) return null;

    let duration;
    try { duration = parser.get(durationName.toLowerCase()) ?? parser.evaluate(durationName.toLowerCase()); } catch (error) { return null; }
    if (!(duration instanceof math.Unit)) return null;

    const direction = operator === '-' ? -1 : 1;
    const result = new Date(baseDate.getTime());
    const convertDuration = (...units) => {
        for (const unit of units) {
            try { return duration.toNumber(unit); } catch { continue; }
        }
        return Number.NaN;
    };

    const years = convertDuration('yr', 'year');
    if (Number.isFinite(years) && Math.abs(years) >= 1) {
        result.setFullYear(result.getFullYear() + years * direction);
        return result;
    }
    const months = convertDuration('month');
    if (Number.isFinite(months) && Math.abs(months) >= 1) {
        result.setMonth(result.getMonth() + months * direction);
        return result;
    }
    const days = convertDuration('day');
    if (!Number.isFinite(days)) return null;
    result.setDate(result.getDate() + days * direction);
    return result;
}

