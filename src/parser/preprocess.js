export function preprocessNaturalLanguage(line) {
    let expr = line.toLowerCase().trim();

    expr = expr.replace(/(\d(?:\.\d+)?)\s*x\s*(?=[+-]?(?:\d|\.\d))/gi, '$1 * ');

    const squaredUnits = '(?:millimeters?|millimetres?|centimeters?|centimetres?|meters?|metres?|kilometers?|kilometres?|inches?|feet|foot|yards?|miles?)';
    const cubedUnits = '(?:millimeters?|millimetres?|centimeters?|centimetres?|meters?|metres?|kilometers?|kilometres?|inches?|feet|foot|yards?|miles?)';
    const compactUnitSymbol = unit => {
        const normalized = unit.toLowerCase().replace(/s$/, '').replace(/metre$/, 'meter');
        return { millimeter: 'mm', centimeter: 'cm', decimeter: 'dm', meter: 'm', kilometer: 'km', inch: 'in', foot: 'ft', feet: 'ft', yard: 'yd', mile: 'mi' }[normalized] || normalized;
    };
    expr = expr.replace(new RegExp(`\\bsquare\\s+(${squaredUnits})\\b`, 'gi'), (_, unit) => `${compactUnitSymbol(unit)}2`);
    expr = expr.replace(new RegExp(`\\bcubic\\s+(${cubedUnits})\\b`, 'gi'), (_, unit) => `${compactUnitSymbol(unit)}3`);
    expr = expr.replace(/(mm|cm|dm|km|m|in|ft|yd|mi)\s*\^\s*([23])\b/gi, '$1$2');
    expr = expr.replace(/(mm|cm|dm|km|m|in|ft|yd|mi)\s*([²³])/gi, (_, unit, power) => `${unit}${power === '²' ? '2' : '3'}`);

    expr = expr.replace(/^(what is|what's|calculate|compute|tell me|what is the)\s*/, '');

    expr = expr.replace(/^((?:nz\$|hk\$|a\$|c\$|s\$|r\$|[$€£¥₹₩₽₺₫฿₱₦])\s*[+-]?(?:\d+(?:\.\d*)?|\.\d+))\s+([a-z]{3})$/i, '$1 to $2');

    expr = expr.replace(/(nz\$|hk\$|a\$|c\$|s\$|r\$|[$€£¥₹₩₽₺₫฿₱₦])\s*([+-]?(?:\d+(?:\.\d*)?|\.\d+))/gi, (match, symbol, number) => {
        const symbolMap = {
            '$': 'USD', '€': 'EUR', '£': 'GBP', '¥': 'JPY', '₹': 'INR', '₩': 'KRW',
            '₽': 'RUB', '₺': 'TRY', '₫': 'VND', '฿': 'THB', '₱': 'PHP', '₦': 'NGN',
            'a$': 'AUD', 'c$': 'CAD', 'nz$': 'NZD', 'hk$': 'HKD', 's$': 'SGD', 'r$': 'BRL'
        };
        return `${number} ${symbolMap[symbol.toLowerCase()] || symbolMap[symbol] || ''}`.trim();
    });


    expr = expr.replace(/(\d+\.?\d*)\s*k\b/g, '$1*1000');
    expr = expr.replace(/(\d+\.?\d*)\s*m\b/g, '$1*1000000');
    expr = expr.replace(/(\d+\.?\d*)\s*(?:million|millions|mil|mils)\b/g, '$1*1000000');
    expr = expr.replace(/(\d+\.?\d*)\s*(?:billion|billions|bil|bils)\b/g, '$1*1000000000');
    expr = expr.replace(/(\d+\.?\d*)\s*(?:trillion|trillions|tril|trils)\b/g, '$1*1000000000000');
    expr = expr.replace(/(\d+\.?\d*)\s*(?:quadrillion|quadrillions|quadril|quadrils)\b/g, '$1*1000000000000000');
    expr = expr.replace(/(\d+\.?\d*)\s*(?:quintillion|quintillions|quintil|quintils)\b/g, '$1*1000000000000000000');

    expr = expr.replace(/\b(sqrt|abs|ceil|floor|round|sign|exp|log10|log|ln|sin|cos|tan|asin|acos|atan)\s*([+-]?(?:\d+(?:\.\d*)?|\.\d+))\b/gi, '$1($2)');

    expr = expr.replace(/\bsubtract\s+(.+?)\s+from\s+(.+?)\b/gi, (_, a, b) => `(${b.trim()} - ${a.trim()})`);
    expr = expr.replace(/\bsum of\s+(.+?)\s+and\s+(.+?)\b/gi, (_, a, b) => `(${a.trim()} + ${b.trim()})`);
    expr = expr.replace(/\bproduct of\s+(.+?)\s+and\s+(.+?)\b/gi, (_, a, b) => `(${a.trim()} * ${b.trim()})`);
    expr = expr.replace(/\bdifference between\s+(.+?)\s+and\s+(.+?)\b/gi, (_, a, b) => `(${a.trim()} - ${b.trim()})`);
    expr = expr.replace(/\bquotient of\s+(.+?)\s+and\s+(.+?)\b/gi, (_, a, b) => `(${a.trim()} / ${b.trim()})`);


    expr = expr.replace(/\b(?:plus|add)\b/g, ' + ');
    expr = expr.replace(/\b(?:and|with)\b/g, ' + ');
    expr = expr.replace(/\b(?:minus|subtract|without)\b/g, ' - ');
    expr = expr.replace(/\b(?:times|multiplied by|multiply by|mul)\b/g, ' * ');
    expr = expr.replace(/\b(?:divided by|divide by|divide)\b/g, ' / ');
    expr = expr.replace(/\sxor\s/g, ' xor ');
    expr = expr.replace(/\|/g, ' | ');
    expr = expr.replace(/\smod\s/g, ' % ');

    expr = expr.replace(/(\d|\))\s*\(/g, '$1*(');

    expr = expr.replace(/(\d+(?:\.\d+)?)\s*%\s+of\s+/g, '($1 / 100) * ');

    expr = expr.replace(/\s(in|into|as)\s/g, ' to ');

    expr = expr.replace(/\bpi\b/g, 'pi');
    expr = expr.replace(/\be\b/g, 'e');

    return expr;
}
