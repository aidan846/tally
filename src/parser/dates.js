const DATE_MONTHS = {
    jan: 0, january: 0, feb: 1, february: 1, mar: 2, march: 2, apr: 3, april: 3,
    may: 4, jun: 5, june: 5, jul: 6, july: 6, aug: 7, august: 7,
    sep: 8, sept: 8, september: 8, oct: 9, october: 9, nov: 10, november: 10,
    dec: 11, december: 11
};

function parseDateLiteral(value, { allowNumeric = true, allowPartialNumeric = false, now = new Date() } = {}) {
    const normalized = value.trim().replace(/,/g, '');
    const named = normalized.match(/^([a-z]+)\s+(\d{1,2})(?:\s+(\d{2}|\d{4}))?$/i)
        || normalized.match(/^(\d{1,2})\s+([a-z]+)(?:\s+(\d{2}|\d{4}))?$/i);
    if (named) {
        const monthFirst = /^[a-z]/i.test(named[1]);
        const month = DATE_MONTHS[(monthFirst ? named[1] : named[2]).toLowerCase()];
        const day = Number(monthFirst ? named[2] : named[1]);
        const year = named[3] ? Number(named[3].length === 2 ? `20${named[3]}` : named[3]) : now.getFullYear();
        const date = new Date(year, month, day, 12);
        return month === undefined || date.getMonth() !== month || date.getDate() !== day ? null : date;
    }

    if (!allowNumeric) return null;
    const numeric = normalized.match(/^(\d{1,2})[/-](\d{1,2})(?:[/-](\d{2}|\d{4}))?$/);
    if (!numeric) return null;
    const month = Number(numeric[1]) - 1;
    const day = Number(numeric[2]);
    if (!numeric[3] && !allowPartialNumeric) return null;
    const year = numeric[3] ? Number(numeric[3].length === 2 ? `20${numeric[3]}` : numeric[3]) : now.getFullYear();
    const date = new Date(year, month, day, 12);
    return date.getMonth() !== month || date.getDate() !== day ? null : date;
}

export function parseStandaloneDate(line, { allowNumeric = false, now = new Date() } = {}) {
    const trimmedLine = line.trim();
    if (/^(today|now|date)$/i.test(trimmedLine)) return new Date(now);
    return parseDateLiteral(trimmedLine, { allowNumeric, now });
}

export function parseDateMath(line) {
    const regex = /(\d+)\s+(days?|weeks?|months?|years?)\s+(from|before)\s+(today|now|(\d{1,2}[\/-]\d{1,2}([\/-]\d{2,4})?|\w+\s+\d{1,2}\s+\d{4}))/i;
    const match = line.match(regex);
    if (!match) return null;

    const [, amountStr, unit, direction, baseDateStr] = match;
    const amount = parseInt(amountStr, 10);
    const baseDate = (baseDateStr.toLowerCase() === 'today' || baseDateStr.toLowerCase() === 'now') ? new Date() : parseDateLiteral(baseDateStr);

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
    const datePattern = '(?:today|now|date|\\d{1,2}[/-]\\d{1,2}(?:[/-]\\d{2,4})?|(?:jan(?:uary)?|feb(?:ruary)?|mar(?:ch)?|apr(?:il)?|may|jun(?:e)?|jul(?:y)?|aug(?:ust)?|sep(?:t(?:ember)?)?|oct(?:ober)?|nov(?:ember)?|dec(?:ember)?)\\s+\\d{1,2}(?:,?\\s+\\d{2,4})?)';
    const unitPattern = '(?:minutes?|mins?|min|hours?|hrs?|hr|days?|d|weeks?|wks?|wk|months?|mos?|mo|years?|yrs?|yr)';
    const trimmedLine = line.trim();
    const agoMatch = trimmedLine.match(new RegExp(`^(\\d+)\\s*(${unitPattern})\\s+ago$`, 'i'));
    const offsetMatch = trimmedLine.match(new RegExp(`^(${datePattern})\\s*(plus|add|minus|subtract|\\+|-)\\s*(\\d+)\\s*(${unitPattern})$`, 'i'));

    const baseDate = agoMatch
        ? new Date()
        : offsetMatch && (/^(today|now|date)$/i.test(offsetMatch[1]) ? new Date() : parseDateLiteral(offsetMatch[1], { allowPartialNumeric: true }));
    if (!baseDate || Number.isNaN(baseDate.getTime())) return null;

    const result = new Date(baseDate.getTime());
    const amount = agoMatch
        ? -Number(agoMatch[1])
        : Number(offsetMatch[3]) * (/^(minus|subtract|-)$/i.test(offsetMatch[2]) ? -1 : 1);
    const unitText = agoMatch ? agoMatch[2] : offsetMatch[4];
    switch (unitText.toLowerCase().replace(/s$/, '')) {
        case 'day': result.setDate(result.getDate() + amount); break;
        case 'd': result.setDate(result.getDate() + amount); break;
        case 'week': result.setDate(result.getDate() + amount * 7); break;
        case 'wk': result.setDate(result.getDate() + amount * 7); break;
        case 'month': result.setMonth(result.getMonth() + amount); break;
        case 'mo': result.setMonth(result.getMonth() + amount); break;
        case 'year': result.setFullYear(result.getFullYear() + amount); break;
        case 'yr': result.setFullYear(result.getFullYear() + amount); break;
        case 'hour': result.setHours(result.getHours() + amount); break;
        case 'hr': result.setHours(result.getHours() + amount); break;
        case 'minute': result.setMinutes(result.getMinutes() + amount); break;
        case 'min': result.setMinutes(result.getMinutes() + amount); break;
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

const MONTHS = {
    jan: 0, january: 0, feb: 1, february: 1, mar: 2, march: 2, apr: 3, april: 3,
    may: 4, jun: 5, june: 5, jul: 6, july: 6, aug: 7, august: 7,
    sep: 8, sept: 8, september: 8, oct: 9, october: 9, nov: 10, november: 10,
    dec: 11, december: 11
};

export function parseDateDifference(line, now = new Date()) {
    const match = line.trim().match(/^(.+?)\s+-\s+(.+)$/);
    if (!match) return null;
    const start = parseDateLiteral(match[1], { allowPartialNumeric: true, now });
    const end = parseDateLiteral(match[2], { allowPartialNumeric: true, now });
    if (!start || !end) return null;
    const days = Math.round(Math.abs(end - start) / 86400000);
    return `${days} day${days === 1 ? '' : 's'}`;
}

function parseLooseDate(value, now) {
    const normalized = value.trim().replace(/,/g, '').toLowerCase();
    if (normalized === 'today' || normalized === 'now') return { date: new Date(now), hasYear: false, isNow: normalized === 'now' };

    const match = normalized.match(/^([a-z]+)\s+(\d{1,2})(?:\s+(\d{4}))?$/)
        || normalized.match(/^(\d{1,2})\s+([a-z]+)(?:\s+(\d{4}))?$/);
    if (!match) return null;

    const monthFirst = /^[a-z]/.test(match[1]);
    const month = MONTHS[monthFirst ? match[1] : match[2]];
    const day = Number(monthFirst ? match[2] : match[1]);
    const yearText = match[3];
    if (month === undefined || day < 1 || day > 31) return null;
    const date = new Date(Number(yearText || now.getFullYear()), month, day, 12);
    if (date.getMonth() !== month || date.getDate() !== day) return null;
    return { date, hasYear: Boolean(yearText), isNow: false };
}

function addWorkdays(date, amount) {
    const direction = Math.sign(amount);
    let remaining = Math.abs(amount);
    while (remaining > 0) {
        date.setDate(date.getDate() + direction);
        if (date.getDay() !== 0 && date.getDay() !== 6) remaining -= 1;
    }
}

function addDurations(date, value) {
    const matches = [...value.matchAll(/(\d+)\s*(workdays?|seconds?|minutes?|hours?|days?|weeks?|months?|years?)/gi)];
    if (!matches.length || matches.map(match => match[0]).join(' ').replace(/\s+/g, ' ').trim() !== value.replace(/\s+/g, ' ').trim()) return false;
    for (const match of matches) {
        const amount = Number(match[1]);
        const unit = match[2].toLowerCase().replace(/s$/, '');
        if (unit === 'workday') addWorkdays(date, amount);
        if (unit === 'second') date.setSeconds(date.getSeconds() + amount);
        if (unit === 'minute') date.setMinutes(date.getMinutes() + amount);
        if (unit === 'hour') date.setHours(date.getHours() + amount);
        if (unit === 'day') date.setDate(date.getDate() + amount);
        if (unit === 'week') date.setDate(date.getDate() + amount * 7);
        if (unit === 'month') date.setMonth(date.getMonth() + amount);
        if (unit === 'year') date.setFullYear(date.getFullYear() + amount);
    }
    return true;
}

function formatLooseDate(date, includeYear) {
    const month = date.toLocaleDateString('en-US', { month: 'long' });
    return `${date.getDate()} ${month}${includeYear ? ` ${date.getFullYear()}` : ''}`;
}

function calendarDifference(start, end) {
    if (end < start) end.setFullYear(end.getFullYear() + 1);
    const cursor = new Date(start);
    let months = 0;
    while (true) {
        const next = new Date(cursor);
        next.setMonth(next.getMonth() + 1);
        if (next > end) break;
        cursor.setTime(next.getTime());
        months += 1;
    }
    const days = Math.round((end - cursor) / 86400000);
    const weeks = Math.floor(days / 7);
    const remainingDays = days % 7;
    const parts = [];
    if (months) parts.push(`${months} month${months === 1 ? '' : 's'}`);
    if (weeks) parts.push(`${weeks} week${weeks === 1 ? '' : 's'}`);
    if (remainingDays || !parts.length) parts.push(`${remainingDays} day${remainingDays === 1 ? '' : 's'}`);
    return parts.join(' ');
}

export function parseCalendarExpression(line, now = new Date()) {
    const normalized = line.trim();
    const weeksBetween = normalized.match(/^weeks?\s+between\s+(.+?)\s+and\s+(.+)$/i);
    if (weeksBetween) {
        const start = parseLooseDate(weeksBetween[1], now);
        const end = parseLooseDate(weeksBetween[2], now);
        if (!start || !end) return null;
        if (end.date < start.date) end.date.setFullYear(end.date.getFullYear() + 1);
        const weeks = Math.round((end.date - start.date) / 604800000);
        return `${weeks} week${weeks === 1 ? '' : 's'}`;
    }

    const range = normalized.match(/^(.+?)\s+to\s+(.+)$/i);
    if (range) {
        const start = parseLooseDate(range[1], now);
        const end = parseLooseDate(range[2], now);
        if (start && end) return calendarDifference(start.date, end.date);
    }

    const addition = normalized.match(/^(.+?)\s*\+\s*(.+)$/);
    if (!addition) return null;
    const base = parseLooseDate(addition[1], now);
    if (!base) return null;
    const result = new Date(base.date);
    if (!addDurations(result, addition[2])) return null;
    if (base.isNow && /(?:seconds?|minutes?|hours?)/i.test(addition[2])) {
        return result.toLocaleTimeString('en-US', {
            hour: 'numeric',
            minute: '2-digit',
            ...(/seconds?/i.test(addition[2]) ? { second: '2-digit' } : {})
        }).replace(/\s?(AM|PM)$/, value => value.toLowerCase());
    }
    return formatLooseDate(result, base.hasYear);
}
