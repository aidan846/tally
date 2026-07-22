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

function parseUnitTerm(term) {
    let value = term.trim().replace(/\s+/g, ' ');
    const exponentMatch = value.match(/(?:\^?([23])|([²³]))$/);
    const exponent = exponentMatch ? Number(exponentMatch[1] || (exponentMatch[2] === '²' ? 2 : 3)) : 1;
    if (exponentMatch) value = value.slice(0, exponentMatch.index).trim();
    const unit = findUnit(value);
    if (!unit || !unit.unit.factor) return null;
    return { ...unit, exponent };
}

function parseCompoundUnit(value) {
    const normalized = value.trim().replace(/[²³]/g, match => match === '²' ? '2' : '3').replace(/\^([23])/g, '$1');
    if (!/[/*]/.test(normalized)) return null;
    const [numeratorText, ...denominators] = normalized.split('/');
    const terms = [];
    for (const term of numeratorText.split('*')) terms.push({ term, sign: 1 });
    for (const denominator of denominators) {
        for (const term of denominator.split('*')) terms.push({ term, sign: -1 });
    }
    const parsed = terms.map(({ term, sign }) => {
        const unit = parseUnitTerm(term);
        return unit ? { ...unit, sign } : null;
    });
    if (parsed.some(unit => !unit)) return null;
    const dimensions = new Map();
    let factor = 1;
    for (const unit of parsed) {
        const power = unit.sign * unit.exponent;
        dimensions.set(unit.familyName, (dimensions.get(unit.familyName) || 0) + power);
        factor *= unit.unit.factor ** power;
    }
    return {
        dimensions: [...dimensions.entries()].filter(([, power]) => power).sort(),
        factor,
        symbol: parsed.map(unit => `${unit.symbol}${unit.exponent > 1 ? unit.exponent : ''}`).join('/'),
    };
}

export function parseUnitConversion(line, decimalPlaces) {
    line = line
        .replace(/\bsquare\s+(millimeters?|millimetres?)\b/gi, 'mm2')
        .replace(/\bsquare\s+(centimeters?|centimetres?)\b/gi, 'cm2')
        .replace(/\bsquare\s+(meters?|metres?)\b/gi, 'm2')
        .replace(/\bsquare\s+kilometers?\b/gi, 'km2')
        .replace(/\bsquare\s+inches?\b/gi, 'in2')
        .replace(/\bsquare\s+(feet|foot)\b/gi, 'ft2')
        .replace(/\bsquare\s+yards?\b/gi, 'yd2')
        .replace(/\bsquare\s+miles?\b/gi, 'mi2')
        .replace(/\bcubic\s+(millimeters?|millimetres?)\b/gi, 'mm3')
        .replace(/\bcubic\s+(centimeters?|centimetres?)\b/gi, 'cm3')
        .replace(/\bcubic\s+(meters?|metres?)\b/gi, 'm3')
        .replace(/\bcubic\s+inches?\b/gi, 'in3')
        .replace(/\bcubic\s+(feet|foot)\b/gi, 'ft3')
        .replace(/\bcubic\s+yards?\b/gi, 'yd3')
        .replace(/(mm|cm|dm|km|m|in|ft|yd|mi)\s*\^\s*([23])\b/gi, '$1$2')
        .replace(/(mm|cm|dm|km|m|in|ft|yd|mi)\s*([²³])/gi, (_, unit, power) => `${unit}${power === '²' ? '2' : '3'}`);
    let match = line.trim().match(/^([+-]?(?:\d+(?:\.\d*)?|\.\d+)(?:e[+-]?\d+)?)\s*(.*?)\s+(?:to|in|into|as)\s+(.*?)\s*$/i);
    if (!match) {
        const inchesMatch = line.trim().match(/^([+-]?(?:\d+(?:\.\d*)?|\.\d+)(?:e[+-]?\d+)?)\s*(.*?)\s+in\s*$/i);
        if (inchesMatch) match = [inchesMatch[0], inchesMatch[1], inchesMatch[2], 'in'];
    }
    if (!match) return null;

    const value = Number(match[1]);
    const source = findUnit(match[2]);
    const target = findUnit(match[3]);
    const sourceCompound = parseCompoundUnit(match[2]);
    const targetCompound = parseCompoundUnit(match[3]);
    if (sourceCompound && targetCompound) {
        if (JSON.stringify(sourceCompound.dimensions) !== JSON.stringify(targetCompound.dimensions)) return null;
        const converted = value * sourceCompound.factor / targetCompound.factor;
        return `${math.format(converted, { notation: 'fixed', precision: decimalPlaces })} ${targetCompound.symbol}`;
    }
    if (!Number.isFinite(value) || !source || !target || source.familyName !== target.familyName) return null;

    const baseValue = source.unit.toBase ? source.unit.toBase(value) : value * source.unit.factor;
    const converted = target.unit.fromBase ? target.unit.fromBase(baseValue) : baseValue / target.unit.factor;
    return `${math.format(converted, { notation: 'fixed', precision: decimalPlaces })} ${target.symbol}`;
}

