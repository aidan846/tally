// Geometry commands are intentionally data-driven: the parameter order in this
// registry is both the documented positional order and the parser's fallback.
const multiply = (...values) => values.reduce((total, value) => math.multiply(total, value));
const power = (value, exponent) => math.pow(value, exponent);

export const shapes = {
    cylinder: { params: ['r', 'h'], volume: (r, h) => multiply(Math.PI, power(r, 2), h), surfaceArea: (r, h) => multiply(2 * Math.PI, r, math.add(r, h)) },
    cone: { params: ['r', 'h'], volume: (r, h) => multiply(1 / 3 * Math.PI, power(r, 2), h) },
    sphere: { params: ['r'], volume: r => multiply(4 / 3 * Math.PI, power(r, 3)), surfaceArea: r => multiply(4 * Math.PI, power(r, 2)) },
    pyramid: { params: ['b', 'h'], volume: (b, h) => multiply(1 / 3, b, h) },
    prism: { params: ['b', 'h'], volume: (b, h) => multiply(b, h) },
    cube: { params: ['s'], volume: s => power(s, 3), surfaceArea: s => multiply(6, power(s, 2)) },
    torus: { params: ['R', 'r'], volume: (R, r) => multiply(2 * Math.PI ** 2, R, power(r, 2)) },
    circle: { params: ['r'], area: r => multiply(Math.PI, power(r, 2)), circumference: r => multiply(2 * Math.PI, r) }
};

export const shapeAliases = {
    cyl: 'cylinder', cylinder: 'cylinder', cone: 'cone', sph: 'sphere', sphere: 'sphere',
    pyr: 'pyramid', pyramid: 'pyramid', pr: 'prism', prism: 'prism', cu: 'cube', cube: 'cube',
    tor: 'torus', torus: 'torus', cir: 'circle', circle: 'circle'
};

const GEOMETRY_PATTERN = /^(volume|vol|surface\s?area|sa|area|circumference)\s+(\w+)\s+(.+)$/i;
const GHOST_PATTERN = /^(volume|vol|surface\s?area|sa|area|circumference)\s+(\w+)\s+$/i;
const UNIT_SUFFIX = /^(mm|cm|dm|km|m|in|ft|yd|mi|nmi|mm2|cm2|m2|km2|in2|ft2|yd2|mi2|mm3|cm3|m3|in3|ft3|yd3)$/i;

function normalizeParams(parsed) {
    const out = { ...parsed };
    if (out.d !== undefined && out.r === undefined) out.r = math.divide(out.d, 2);
    delete out.d;
    return out;
}

function parseValue(number, unit) {
    if (!unit) return Number(number);
    try {
        return math.evaluate(`${number} ${unit}`);
    } catch {
        return Number.NaN;
    }
}

function parseLabeledParams(str) {
    const params = {};
    const pattern = /([a-zA-Z]+)\s*[=:]?\s*(-?\d+(?:\.\d+)?)([a-zA-Z]+(?:\^?[23])?)?/g;
    for (const match of str.matchAll(pattern)) {
        const key = match[1] === 'R' ? 'R' : match[1].toLowerCase();
        const unit = match[3] && UNIT_SUFFIX.test(match[3]) ? match[3] : '';
        params[key] = parseValue(match[2], unit);
    }
    return params;
}

function parseParams(shapeKey, str) {
    const labeled = parseLabeledParams(str);
    if (Object.keys(labeled).length) return normalizeParams(labeled);
    const nums = (str.match(/-?\d+(?:\.\d+)?/g) || []).map(Number);
    return normalizeParams(Object.fromEntries(shapes[shapeKey].params.map((param, index) => [param, nums[index]])));
}

export function getGhostHint(text) {
    const match = text.match(GHOST_PATTERN);
    const shapeKey = match && shapeAliases[match[2].toLowerCase()];
    const operation = match && { volume: 'volume', vol: 'volume', 'surface area': 'surfaceArea', sa: 'surfaceArea', area: 'area', circumference: 'circumference' }[match[1].toLowerCase().replace(/\s+/, ' ')];
    const shape = shapes[shapeKey];
    return shape?.[operation] ? shape.params.join(' ') : '';
}

export function tryParseGeometry(input) {
    const match = input.trim().match(GEOMETRY_PATTERN);
    if (!match) return null;
    const shapeKey = shapeAliases[match[2].toLowerCase()];
    const operation = { volume: 'volume', vol: 'volume', 'surface area': 'surfaceArea', sa: 'surfaceArea', area: 'area', circumference: 'circumference' }[match[1].toLowerCase().replace(/\s+/, ' ')];
    const shape = shapes[shapeKey];
    if (!shape || !shape[operation]) return null;

    const conversion = match[3].match(/\s+(?:to|as)\s+(.+)$/i);
    const params = parseParams(shapeKey, conversion ? match[3].slice(0, conversion.index) : match[3]);
    const args = shape.params.map(param => params[param]);
    if (args.some(value => value === undefined || (typeof value === 'number' && Number.isNaN(value)))) return null;

    try {
        const result = shape[operation](...args);
        return conversion ? math.to(result, conversion[1].trim()) : result;
    } catch {
        return null;
    }
}
