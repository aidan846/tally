const parser = math.parser();

let previousResults = [];

const UNIT_FAMILIES = {
    temperature: {
        units: {
            c: { aliases: ['c', '°c', 'deg c', 'degree c', 'degrees c', 'celsius', 'degree celsius', 'degrees celsius'], toBase: value => value + 273.15, fromBase: value => value - 273.15 },
            f: { aliases: ['f', '°f', 'deg f', 'degree f', 'degrees f', 'fahrenheit', 'degree fahrenheit', 'degrees fahrenheit'], toBase: value => (value - 32) * 5 / 9 + 273.15, fromBase: value => (value - 273.15) * 9 / 5 + 32 },
            k: { aliases: ['k', '°k', 'kelvin', 'kelvins'], toBase: value => value, fromBase: value => value }
        }
    },
    length: { base: 'm', units: {
        mm: { factor: 0.001, aliases: ['mm', 'millimeter', 'millimeters'] }, cm: { factor: 0.01, aliases: ['cm', 'centimeter', 'centimeters'] },
        dm: { factor: 0.1, aliases: ['dm', 'decimeter', 'decimeters'] }, m: { factor: 1, aliases: ['m', 'meter', 'meters', 'metre', 'metres'] },
        km: { factor: 1000, aliases: ['km', 'kilometer', 'kilometers', 'kilometre', 'kilometres'] }, in: { factor: 0.0254, aliases: ['in', 'inch', 'inches'] },
        ft: { factor: 0.3048, aliases: ['ft', 'foot', 'feet'] }, yd: { factor: 0.9144, aliases: ['yd', 'yard', 'yards'] },
        mi: { factor: 1609.344, aliases: ['mi', 'mile', 'miles'] }, nmi: { factor: 1852, aliases: ['nmi', 'nautical mile', 'nautical miles'] }
    } },
    mass: { base: 'g', units: {
        mg: { factor: 0.001, aliases: ['mg', 'milligram', 'milligrams'] }, g: { factor: 1, aliases: ['g', 'gram', 'grams'] },
        kg: { factor: 1000, aliases: ['kg', 'kilogram', 'kilograms'] }, t: { factor: 1e6, aliases: ['t', 'tonne', 'tonnes', 'metric ton', 'metric tons'] },
        oz: { factor: 28.349523125, aliases: ['oz', 'ounce', 'ounces'] }, lb: { factor: 453.59237, aliases: ['lb', 'lbs', 'pound', 'pounds'] },
        st: { factor: 6350.29318, aliases: ['st', 'stone', 'stones'] }, ton: { factor: 907184.74, aliases: ['ton', 'tons', 'short ton', 'short tons'] }
    } },
    time: { base: 's', units: {
        ns: { factor: 1e-9, aliases: ['ns', 'nanosecond', 'nanoseconds'] }, ms: { factor: 1e-3, aliases: ['ms', 'millisecond', 'milliseconds'] },
        s: { factor: 1, aliases: ['s', 'sec', 'secs', 'second', 'seconds'] }, min: { factor: 60, aliases: ['min', 'mins', 'minute', 'minutes'] },
        hr: { factor: 3600, aliases: ['hr', 'hrs', 'hour', 'hours'] }, day: { factor: 86400, aliases: ['day', 'days'] }, week: { factor: 604800, aliases: ['week', 'weeks'] }, yr: { factor: 31536000, aliases: ['yr', 'yrs', 'year', 'years'] }
    } },
    volume: { base: 'l', units: {
        ml: { factor: 0.001, aliases: ['ml', 'milliliter', 'milliliters', 'millilitre', 'millilitres'] }, l: { factor: 1, aliases: ['l', 'liter', 'liters', 'litre', 'litres'] },
        cl: { factor: 0.01, aliases: ['cl', 'centiliter', 'centiliters'] }, dl: { factor: 0.1, aliases: ['dl', 'deciliter', 'deciliters'] }, kl: { factor: 1000, aliases: ['kl', 'kiloliter', 'kiloliters'] },
        tsp: { factor: 0.00492892159375, aliases: ['tsp', 'teaspoon', 'teaspoons'] }, tbsp: { factor: 0.01478676478125, aliases: ['tbsp', 'tablespoon', 'tablespoons'] }, cup: { factor: 0.2365882365, aliases: ['cup', 'cups'] },
        pt: { factor: 0.473176473, aliases: ['pt', 'pint', 'pints'] }, qt: { factor: 0.946352946, aliases: ['qt', 'quart', 'quarts'] }, gal: { factor: 3.785411784, aliases: ['gal', 'gallon', 'gallons'] },
        mm3: { factor: 1e-6, aliases: ['mm3', 'mm³', 'mm^3', 'cubic millimeter', 'cubic millimeters'] }, cm3: { factor: 0.001, aliases: ['cm3', 'cm³', 'cm^3', 'cubic centimeter', 'cubic centimeters'] },
        m3: { factor: 1000, aliases: ['m3', 'm³', 'm^3', 'cubic meter', 'cubic meters', 'cubic metre', 'cubic metres'] }, in3: { factor: 0.016387064, aliases: ['in3', 'in³', 'in^3', 'cubic inch', 'cubic inches'] },
        ft3: { factor: 28.316846592, aliases: ['ft3', 'ft³', 'ft^3', 'cubic foot', 'cubic feet'] }, yd3: { factor: 764.554857984, aliases: ['yd3', 'yd³', 'yd^3', 'cubic yard', 'cubic yards'] }
    } },
    area: { base: 'm2', units: {
        mm2: { factor: 1e-6, aliases: ['mm2', 'mm²', 'mm^2', 'square millimeter', 'square millimeters'] }, cm2: { factor: 1e-4, aliases: ['cm2', 'cm²', 'cm^2', 'square centimeter', 'square centimeters'] },
        m2: { factor: 1, aliases: ['m2', 'm²', 'm^2', 'square meter', 'square meters', 'square metre', 'square metres'] }, km2: { factor: 1e6, aliases: ['km2', 'km²', 'km^2', 'square kilometer', 'square kilometers', 'square kilometre', 'square kilometres'] },
        in2: { factor: 0.00064516, aliases: ['in2', 'in²', 'in^2', 'square inch', 'square inches'] }, ft2: { factor: 0.09290304, aliases: ['ft2', 'ft²', 'ft^2', 'square foot', 'square feet'] },
        yd2: { factor: 0.83612736, aliases: ['yd2', 'yd²', 'yd^2', 'square yard', 'square yards'] }, mi2: { factor: 2589988.110336, aliases: ['mi2', 'mi²', 'mi^2', 'square mile', 'square miles'] },
        ac: { factor: 4046.8564224, aliases: ['ac', 'acre', 'acres'] }, ha: { factor: 10000, aliases: ['ha', 'hectare', 'hectares'] }
    } },
    speed: { base: 'm/s', units: {
        'm/s': { factor: 1, aliases: ['m/s', 'mps', 'meter per second', 'meters per second', 'metre per second', 'metres per second'] },
        'km/h': { factor: 1 / 3.6, aliases: ['km/h', 'kph', 'kilometer per hour', 'kilometers per hour', 'kilometre per hour', 'kilometres per hour'] },
        mph: { factor: 0.44704, aliases: ['mph', 'mile per hour', 'miles per hour'] }, knot: { factor: 0.5144444444444445, aliases: ['knot', 'knots', 'kt', 'kts'] }
    } },
    pressure: { base: 'pa', units: {
        pa: { factor: 1, aliases: ['pa', 'pascal', 'pascals'] }, hpa: { factor: 100, aliases: ['hpa', 'hectopascal', 'hectopascals'] },
        kpa: { factor: 1000, aliases: ['kpa', 'kilopascal', 'kilopascals'] }, mpa: { factor: 1e6, aliases: ['mpa', 'megapascal', 'megapascals'] },
        bar: { factor: 100000, aliases: ['bar', 'bars'] }, mbar: { factor: 100, aliases: ['mbar', 'millibar', 'millibars'] },
        atm: { factor: 101325, aliases: ['atm', 'atmosphere', 'atmospheres', 'standard atmosphere', 'standard atmospheres'] },
        psi: { factor: 6894.757293168, aliases: ['psi', 'pound per square inch', 'pounds per square inch'] },
        torr: { factor: 133.3223684211, aliases: ['torr', 'mmhg', 'mm hg', 'millimeter of mercury', 'millimeters of mercury'] }
    } },
    magnitude: { base: 'one', units: {
        thousand: { factor: 1e3, aliases: ['thousand', 'thousands'] },
        million: { factor: 1e6, aliases: ['million', 'millions', 'mil', 'mils'] },
        billion: { factor: 1e9, aliases: ['billion', 'billions', 'bil', 'bils'] },
        trillion: { factor: 1e12, aliases: ['trillion', 'trillions', 'tril', 'trils'] },
        quadrillion: { factor: 1e15, aliases: ['quadrillion', 'quadrillions', 'quadril', 'quadrils'] },
        quintillion: { factor: 1e18, aliases: ['quintillion', 'quintillions', 'quintil', 'quintils'] }
    } },
    data: { base: 'bit', units: {
        bit: { factor: 1, aliases: ['bit', 'bits', 'b'] }, B: { factor: 8, aliases: ['B', 'byte', 'bytes'] },
        kb: { factor: 1024, aliases: ['kb', 'kilobit', 'kilobits'] }, kB: { factor: 8192, aliases: ['kB', 'kilobyte', 'kilobytes'] },
        mb: { factor: 1048576, aliases: ['mb', 'megabit', 'megabits'] }, MB: { factor: 8388608, aliases: ['MB', 'megabyte', 'megabytes'] },
        gb: { factor: 1073741824, aliases: ['gb', 'gigabit', 'gigabits'] }, gB: { factor: 8589934592, aliases: ['gB', 'gigabyte', 'gigabytes'] },
        tb: { factor: 1099511627776, aliases: ['tb', 'terabit', 'terabits'] }, tB: { factor: 8796093022208, aliases: ['tB', 'terabyte', 'terabytes'] }
    } }
};

function normalizeUnitName(name) {
    return name.toLowerCase().trim().replace(/[.]/g, '').replace(/\b(?:degrees?|deg)\s*/g, 'deg ').replace(/\s+/g, ' ');
}

function findUnit(name) {
    const exact = name.trim().replace(/\s+/g, ' ');
    const normalized = normalizeUnitName(name);
    for (const [familyName, family] of Object.entries(UNIT_FAMILIES)) {
        for (const [symbol, unit] of Object.entries(family.units)) {
            if (unit.aliases.includes(exact)) return { familyName, family, symbol, unit };
        }
    }
    for (const [familyName, family] of Object.entries(UNIT_FAMILIES)) {
        for (const [symbol, unit] of Object.entries(family.units)) {
            if (unit.aliases.some(alias => normalizeUnitName(alias) === normalized)) return { familyName, family, symbol, unit };
        }
    }
    return null;
}

function parseUnitConversion(line, decimalPlaces) {
    let match = line.trim().match(/^([+-]?(?:\d+(?:\.\d*)?|\.\d+)(?:e[+-]?\d+)?)\s*(.*?)\s+(?:to|in|into|as)\s+(.*?)\s*$/i);
    if (!match) {
        const inchesMatch = line.trim().match(/^([+-]?(?:\d+(?:\.\d*)?|\.\d+)(?:e[+-]?\d+)?)\s*(.*?)\s+in\s*$/i);
        if (inchesMatch) match = [inchesMatch[0], inchesMatch[1], inchesMatch[2], 'in'];
    }
    if (!match) return null;

    const value = Number(match[1]);
    const source = findUnit(match[2]);
    const target = findUnit(match[3]);
    if (!Number.isFinite(value) || !source || !target || source.familyName !== target.familyName) return null;

    const baseValue = source.unit.toBase ? source.unit.toBase(value) : value * source.unit.factor;
    const converted = target.unit.fromBase ? target.unit.fromBase(baseValue) : baseValue / target.unit.factor;
    return `${math.format(converted, { notation: 'fixed', precision: decimalPlaces })} ${target.symbol}`;
}

const TIMEZONE_MAP = {
    'pst': 'America/Los_Angeles',
    'pdt': 'America/Los_Angeles',
    'est': 'America/New_York',
    'edt': 'America/New_York',
    'cst': 'America/Chicago',
    'cdt': 'America/Chicago',
    'mst': 'America/Denver',
    'mdt': 'America/Denver',
    'hkt': 'Asia/Hong_Kong',
    'gmt': 'Etc/GMT',
    'utc': 'Etc/UTC',
    'london': 'Europe/London',
    'paris': 'Europe/Paris',
    'berlin': 'Europe/Berlin',
    'madrid': 'Europe/Madrid',
    'tokyo': 'Asia/Tokyo',
    'sydney': 'Australia/Sydney',
    'new york': 'America/New_York',
    'los angeles': 'America/Los_Angeles',
    'chicago': 'America/Chicago',
    'denver': 'America/Denver',
    'dubai': 'Asia/Dubai',
    'moscow': 'Europe/Moscow',
    'beijing': 'Asia/Shanghai',
    'singapore': 'Asia/Singapore',
    '': Intl.DateTimeFormat().resolvedOptions().timeZone
};

let currentPPI = 96;

function defineCssUnits() {
    math.createUnit('px', { definition: `${(0.0254 / currentPPI)} m` }, { override: true });
}

defineCssUnits()

function preprocessNaturalLanguage(line) {
    let expr = line.toLowerCase().trim();

    expr = expr.replace(/^(what is|what's|calculate|compute|tell me|what is the)\s*/, '');

    expr = expr.replace(/([$€£¥])\s*(\d+\.?\d*)/g, (match, symbol, number) => {
        const symbolMap = { '$': 'USD', '€': 'EUR', '£': 'GBP', '¥': 'JPY' };
        return `${number} ${symbolMap[symbol] || ''}`.trim();
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

function parseStandaloneDate(line) {
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

function parseDateMath(line) {
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

function parseDateOffset(line) {
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

function parseVariableDateArithmetic(line, parser) {
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

function parseDateDurationVariableArithmetic(line, parser) {
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

function parseCurrentTimeAndDate(line) {
    const lowerLine = line.toLowerCase().trim();
    let timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;

    const formatDateTime = (date, options) => {
        try {
            return date.toLocaleString('en-US', { ...options, timeZone: timeZone });
        } catch (e) {
            console.error("Error formatting date/time with timezone:", e);
            return date.toLocaleString('en-US', options);
        }
    };

    const tzPrefixMatch = /^(.*?)\s+(time|date|now)$/.exec(lowerLine);
    if (tzPrefixMatch) {
        const location = tzPrefixMatch[1].trim();
        const matchedCommand = tzPrefixMatch[2];
        const foundTzKey = Object.keys(TIMEZONE_MAP).find(key => location.includes(key));
        if (foundTzKey) {
            timeZone = TIMEZONE_MAP[foundTzKey];
        } else {
            const directTz = Object.values(TIMEZONE_MAP).find(tz => tz.toLowerCase().includes(location.replace(/\s/g, '_')));
            if (directTz) {
                timeZone = directTz;
            }
        }

        if (matchedCommand === 'date') {
            return formatDateTime(new Date(), { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' });
        } else if (matchedCommand === 'time') {
            return formatDateTime(new Date(), { hour: '2-digit', minute: '2-digit', hour12: true });
        } else if (matchedCommand === 'now') {
            return formatDateTime(new Date(), { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit', hour12: true });
        }
    }

    const tzSuffixMatch = /^(time|date|now)\s+in\s+(.*)$/.exec(lowerLine);
    if (tzSuffixMatch) {
        const matchedCommand = tzSuffixMatch[1];
        const location = tzSuffixMatch[2].trim();
        const foundTzKey = Object.keys(TIMEZONE_MAP).find(key => location.includes(key));
        if (foundTzKey) {
            timeZone = TIMEZONE_MAP[foundTzKey];
        } else {
            const directTz = Object.values(TIMEZONE_MAP).find(tz => tz.toLowerCase().includes(location.replace(/\s/g, '_')));
            if (directTz) {
                timeZone = directTz;
            }
        }

        if (matchedCommand === 'date') {
            return formatDateTime(new Date(), { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' });
        } else if (matchedCommand === 'time') {
            return formatDateTime(new Date(), { hour: '2-digit', minute: '2-digit', hour12: true });
        } else if (matchedCommand === 'now') {
            return formatDateTime(new Date(), { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit', hour12: true });
        }
    }

    if (lowerLine === 'date' || lowerLine === 'today') {
        return new Date().toLocaleDateString('en-US', { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' });
    } else if (lowerLine === 'time') {
        return new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
    } else if (lowerLine === 'now') {
        return new Date().toLocaleString('en-US', { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit', hour12: true });
    }

    return null;
}

function parseTimeZoneConversion(line) {
    const lowerLine = line.toLowerCase().trim();
    const regex = /^(\d{1,2}(:\d{2})?\s*(?:am|pm)?)\s+([a-z\/_]+)\s+in\s+([a-z\/_]+)$/i;
    const match = lowerLine.match(regex);

    if (!match) return null;

    const [, timeStr, , sourceTzAbbr, targetTzAbbr] = match;

    const sourceTimeZone = TIMEZONE_MAP[sourceTzAbbr.toLowerCase()];
    const targetTimeZone = TIMEZONE_MAP[targetTzAbbr.toLowerCase()];

    if (!sourceTimeZone || !targetTimeZone) {
        return null;
    }

    try {
        const nowInSourceTz = new Date().toLocaleString('en-US', { timeZone: sourceTimeZone, year: 'numeric', month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false });
        const [datePart, timePart] = nowInSourceTz.split(', ');
        const [month, day, year] = datePart.split('/').map(Number);

        const combinedDateTimeStr = `${month}/${day}/${year} ${timeStr}`;
        const parsedDate = new Date(combinedDateTimeStr);

        if (isNaN(parsedDate.getTime())) {
            console.warn(`Could not parse time string for conversion: ${timeStr}`);
            return null;
        }

        const formatter = new Intl.DateTimeFormat('en-US', {
            hour: '2-digit',
            minute: '2-digit',
            hour12: true,
            timeZone: targetTimeZone
        });

        return formatter.format(parsedDate);

    } catch (error) {
        console.error("Error during timezone conversion:", error);
        return null;
    }
}

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

function parsePercentageOperations(line, parser, decimalPlaces) {
    const lowerLine = line.toLowerCase().trim();
    let resultValue = null;

    const safeEvaluate = (expr) => {
        try {
            return parser.evaluate(preprocessNaturalLanguage(expr));
        } catch (e) {
            console.error(`Error evaluating percentage part "${expr}":`, e);
            return null;
        }
    };

    let match = lowerLine.match(/^(\d+\.?\d*)\s*%\s+of\s+(.*)$/);
    if (match) {
        const percentage = parseFloat(match[1]) / 100;
        const baseValue = safeEvaluate(match[2]);
        if (baseValue !== null && (typeof baseValue === 'number' || baseValue instanceof math.Unit)) {
            resultValue = math.multiply(baseValue, percentage);
        }
    }

    if (resultValue === null) {
        match = lowerLine.match(/^(\d+\.?\d*)\s*%\s+on\s+(.*)$/);
        if (match) {
            const percentage = parseFloat(match[1]) / 100;
            const baseValue = safeEvaluate(match[2]);
            if (baseValue !== null && (typeof baseValue === 'number' || baseValue instanceof math.Unit)) {
                resultValue = math.add(baseValue, math.multiply(baseValue, percentage));
            }
        }
    }

    if (resultValue === null) {
        match = lowerLine.match(/^(\d+\.?\d*)\s*%\s+off\s+(.*)$/);
        if (match) {
            const percentage = parseFloat(match[1]) / 100;
            const baseValue = safeEvaluate(match[2]);
            if (baseValue !== null && (typeof baseValue === 'number' || baseValue instanceof math.Unit)) {
                resultValue = math.subtract(baseValue, math.multiply(baseValue, percentage));
            }
        }
    }

    if (resultValue === null) {
        match = lowerLine.match(/^(.*?)\s+as\s+a\s*%\s+of\s+(.*)$/);
        if (match) {
            const part = safeEvaluate(match[1]);
            const whole = safeEvaluate(match[2]);
            if (part !== null && whole !== null && (typeof part === 'number' || part instanceof math.Unit) && (typeof whole === 'number' || whole instanceof math.Unit)) {
                try {
                    const ratio = math.divide(part, whole);
                    resultValue = math.multiply(ratio, 100);
                    if (typeof resultValue === 'number') {
                        return `${math.format(resultValue, { notation: 'fixed', precision: decimalPlaces })}%`;
                    }
                } catch {}
            }
        }
    }

    if (resultValue === null) {
        match = lowerLine.match(/^(.*?)\s+as\s+a\s*%\s+on\s+(.*)$/);
        if (match) {
            const newValue = safeEvaluate(match[1]);
            const originalValue = safeEvaluate(match[2]);
            if (newValue !== null && originalValue !== null && (typeof newValue === 'number' || newValue instanceof math.Unit) && (typeof originalValue === 'number' || originalValue instanceof math.Unit)) {
                try {
                    const diff = math.subtract(newValue, originalValue);
                    const ratio = math.divide(diff, originalValue);
                    resultValue = math.multiply(ratio, 100);
                    if (typeof resultValue === 'number') {
                        return `${math.format(resultValue, { notation: 'fixed', precision: decimalPlaces })}%`;
                    }
                } catch {}
            }
        }
    }

    if (resultValue === null) {
        match = lowerLine.match(/^(.*?)\s+as\s+a\s*%\s+off\s+(.*)$/);
        if (match) {
            const newValue = safeEvaluate(match[1]);
            const originalValue = safeEvaluate(match[2]);
            if (newValue !== null && originalValue !== null && (typeof newValue === 'number' || newValue instanceof math.Unit) && (typeof originalValue === 'number' || originalValue instanceof math.Unit)) {
                try {
                    const diff = math.subtract(originalValue, newValue);
                    const ratio = math.divide(diff, originalValue);
                    resultValue = math.multiply(ratio, 100);
                    if (typeof resultValue === 'number') {
                        return `${math.format(resultValue, { notation: 'fixed', precision: decimalPlaces })}%`;
                    }
                } catch {}
            }
        }
    }

    if (resultValue === null) {
        match = lowerLine.match(/^(\d+\.?\d*)\s*%\s+of\s+what\s+is\s+(.*)$/);
        if (match) {
            const percentage = parseFloat(match[1]) / 100;
            const resultIs = safeEvaluate(match[2]);
            if (resultIs !== null && (typeof resultIs === 'number' || resultIs instanceof math.Unit)) {
                resultValue = math.divide(resultIs, percentage);
            }
        }
    }

    if (resultValue === null) {
        match = lowerLine.match(/^(\d+\.?\d*)\s*%\s+on\s+what\s+is\s+(.*)$/);
        if (match) {
            const percentage = parseFloat(match[1]) / 100;
            const resultIs = safeEvaluate(match[2]);
            if (resultIs !== null && (typeof resultIs === 'number' || resultIs instanceof math.Unit)) {
                resultValue = math.divide(resultIs, math.add(1, percentage));
            }
        }
    }

    if (resultValue === null) {
        match = lowerLine.match(/^(\d+\.?\d*)\s*%\s+off\s+what\s+is\s+(.*)$/);
        if (match) {
            const percentage = parseFloat(match[1]) / 100;
            const resultIs = safeEvaluate(match[2]);
            if (resultIs !== null && (typeof resultIs === 'number' || resultIs instanceof math.Unit)) {
                resultValue = math.divide(resultIs, math.subtract(1, percentage));
            }
        }
    }

    if (resultValue !== null && (typeof resultValue === 'number' || resultValue instanceof math.Unit)) {
        return math.format(resultValue, { notation: 'fixed', precision: decimalPlaces });
    }

    return null;
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
