const SYMBOL_TO_CODE = {
    '$': 'USD', '€': 'EUR', '£': 'GBP', '¥': 'JPY', '₹': 'INR', '₩': 'KRW',
    '₽': 'RUB', '₺': 'TRY', '₫': 'VND', '฿': 'THB', '₱': 'PHP', '₦': 'NGN',
    'A$': 'AUD', 'C$': 'CAD', 'NZ$': 'NZD', 'HK$': 'HKD', 'S$': 'SGD', 'R$': 'BRL'
};
const CODE_TO_SYMBOL = Object.fromEntries(Object.entries(SYMBOL_TO_CODE).map(([symbol, code]) => [code, symbol]));
const SYMBOL_PATTERN = /NZ\$|HK\$|A\$|C\$|S\$|R\$|[$€£¥₹₩₽₺₫฿₱₦]/;

function unitCode(value) {
    if (!(value instanceof math.Unit) || value.units?.length !== 1 || value.units[0].power !== 1) return null;
    const name = value.units[0].unit.name;
    return /^[A-Z]{3}$/i.test(name) ? name.toUpperCase() : null;
}

function variablePreference(line, variableStyles) {
    const lowerLine = line.toLowerCase();
    return [...variableStyles.entries()]
        .sort(([left], [right]) => right.length - left.length)
        .find(([name]) => lowerLine.includes(name.replaceAll('_', ' ')))?.[1] || null;
}

export function currencyPreference(line, variableStyles = new Map()) {
    const conversion = line.match(/\b(?:in|to)\s+([a-z]{3})\s*$/i)
        || line.match(/^\s*(?:NZ\$|HK\$|A\$|C\$|S\$|R\$|[$€£¥₹₩₽₺₫฿₱₦])\s*[+-]?(?:\d+(?:\.\d*)?|\.\d+)\s+([a-z]{3})\s*$/i);
    const symbol = line.match(SYMBOL_PATTERN)?.[0] || null;
    if (conversion) {
        const code = conversion[1].toUpperCase();
        return { code, symbol: symbol ? CODE_TO_SYMBOL[code] || null : null };
    }
    if (symbol) return { code: SYMBOL_TO_CODE[symbol], symbol };
    const code = line.match(/(?:^|\s)([a-z]{3})(?=\s|$)/i)?.[1]?.toUpperCase();
    if (code) return { code, symbol: null };
    return variablePreference(line, variableStyles);
}

export function evaluateCurrencyBinary(line, parser, prepareExpression) {
    const match = line.trim().match(/^(.+?)\s+([+*/-])\s+(.+)$/);
    if (!match) return null;

    try {
        const left = parser.evaluate(prepareExpression(match[1]));
        const right = parser.evaluate(prepareExpression(match[3]));
        const leftCode = unitCode(left);
        const rightCode = unitCode(right);
        if (!leftCode || !rightCode) return null;

        const leftNumber = left.toNumber(leftCode);
        const rightNumber = right.toNumber(leftCode);
        const operator = match[2];
        if (operator === '/') return leftNumber / rightNumber;
        const value = operator === '+' ? leftNumber + rightNumber
            : operator === '-' ? leftNumber - rightNumber
            : leftNumber * rightNumber;
        return math.unit(value, leftCode);
    } catch {
        return null;
    }
}

export function formatCurrency(value, line, variableStyles = new Map()) {
    const valueCode = unitCode(value);
    if (!valueCode) return null;

    const preference = currencyPreference(line, variableStyles);
    const code = preference?.code || valueCode;
    let amount;
    try {
        amount = value.toNumber(code);
    } catch {
        return null;
    }
    const formatted = amount.toFixed(2);
    return preference?.symbol ? `${preference.symbol}${formatted}` : `${formatted} ${code}`;
}
