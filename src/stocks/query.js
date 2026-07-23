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

const CRYPTO_SYMBOLS = new Set(['BTC', 'ETH', 'SOL']);

function parseNumericOperand(value) {
    const trimmed = value.trim();
    const match = trimmed.match(/^\$?([+-]?(?:\d+(?:\.\d+)?|\.\d+))(?:\s*(USD))?$/i);
    if (!match) return null;
    return { value: Number(match[1]), currency: trimmed.startsWith('$') || match[2] ? 'USD' : null };
}

export function parseStockReference(value, now = new Date()) {
    const match = value.trim().match(/^(\^?[a-z][a-z0-9.-]{0,9})(?:\s+(.+))?$/i);
    if (!match) return null;

    const symbol = match[1].toUpperCase();
    const detail = (match[2] || '').trim();
    const normalized = detail.toLowerCase();

    const asset = CRYPTO_SYMBOLS.has(symbol) && normalized !== 'stock' ? { assetType: 'crypto' } : {};
    if (!detail || normalized === 'now' || normalized === 'stock') return { symbol, field: 'price', date: null, ...asset };
    if (normalized === 'high today') return { symbol, field: 'high', date: null, ...asset };
    if (normalized === 'low today') return { symbol, field: 'low', date: null, ...asset };
    if (normalized === 'open' || normalized === 'open price') return { symbol, field: 'open', date: null, ...asset };
    if (normalized === 'close' || normalized === 'close price' || normalized === 'closing price') return { symbol, field: 'close', date: null, ...asset };

    const date = parseDateReference(detail, now);
    return date ? { symbol, field: 'close', date, ...asset } : null;
}

export function parseStockExpression(value, now = new Date(), knownVariables = new Set()) {
    const source = value;
    const expression = value.trim();
    if (!expression) return null;

    // `pi` is a built-in math constant. Require the explicit `pi stock` form
    // before treating the ticker as a stock query.
    if (/^pi$/i.test(expression)) return null;

    if (knownVariables.has(expression.toLowerCase())) return null;

    const operation = expression.match(/^(.*?)\s*([+\-*/])\s*(.*?)$/);
    if (operation) {
        const [, leftText, operator, rightText] = operation;
        const left = parseStockReference(leftText, now) || parseNumericOperand(leftText);
        const right = parseStockReference(rightText, now) || parseNumericOperand(rightText);
        if (!left || !right || (!left.symbol && !right.symbol)) return null;
        return {
            source,
            operator: { '+': 'add', '-': 'subtract', '*': 'multiply', '/': 'divide' }[operator],
            operands: [left, right]
        };
    }

    if (/^(?:sum|total|average|avg|mean|median|date|today|time|now|weather|temperature|temp|random|sqrt|abs|ceil|floor|round)$/i.test(expression)) return null;
    const reference = parseStockReference(expression, now);
    return reference ? { source, operator: null, operands: [reference] } : null;
}
