function dateKey(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

function parseDateReference(value, now) {
    const agoMatch = value.match(/^(\d+)\s+(day|week|month|year)s?\s+ago$/i);
    if (agoMatch) {
        const date = new Date(now);
        const amount = Number(agoMatch[1]);
        const unit = agoMatch[2].toLowerCase();
        if (unit === 'day') date.setDate(date.getDate() - amount);
        if (unit === 'week') date.setDate(date.getDate() - amount * 7);
        if (unit === 'month') date.setMonth(date.getMonth() - amount);
        if (unit === 'year') date.setFullYear(date.getFullYear() - amount);
        return dateKey(date);
    }

    const onMatch = value.match(/^on\s+(.+)$/i);
    if (!onMatch) return null;
    const date = new Date(onMatch[1]);
    return Number.isNaN(date.getTime()) ? null : dateKey(date);
}

export function parseStockReference(value, now = new Date()) {
    const match = value.trim().match(/^([A-Z][A-Z0-9.-]{0,9})(?:\s+(.+))?$/);
    if (!match) return null;

    const symbol = match[1];
    const detail = (match[2] || '').trim();
    const normalized = detail.toLowerCase();

    if (!detail || normalized === 'now') return { symbol, field: 'price', date: null };
    if (normalized === 'high today') return { symbol, field: 'high', date: null };
    if (normalized === 'low today') return { symbol, field: 'low', date: null };
    if (normalized === 'open' || normalized === 'open price') return { symbol, field: 'open', date: null };
    if (normalized === 'close' || normalized === 'close price' || normalized === 'closing price') return { symbol, field: 'close', date: null };

    const date = parseDateReference(detail, now);
    return date ? { symbol, field: 'close', date } : null;
}

export function parseStockExpression(value, now = new Date()) {
    const source = value;
    const expression = value.trim();
    if (!expression) return null;

    const difference = expression.match(/^(.*?)\s+-\s+(.*?)$/);
    if (difference) {
        const left = parseStockReference(difference[1], now);
        const right = parseStockReference(difference[2], now);
        return left && right ? { source, operator: 'subtract', operands: [left, right] } : null;
    }

    const reference = parseStockReference(expression, now);
    return reference ? { source, operator: null, operands: [reference] } : null;
}
