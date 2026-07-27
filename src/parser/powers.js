const UNIT_PATTERN = '(?:mm|cm|dm|km|m|in|ft|yd|mi|nmi|millimeters?|millimetres?|centimeters?|centimetres?|meters?|metres?|kilometers?|kilometres?|inches?|feet|foot|yards?|miles?)';

function formatPower(value, exponent, unit, decimalPlaces) {
    try {
        const base = unit ? math.evaluate(`${value} ${unit}`) : Number(value);
        const result = math.pow(base, exponent);
        return math.format(result, { notation: 'fixed', precision: decimalPlaces }).replace(/\^([23])\b/g, '$1');
    } catch {
        return null;
    }
}

export function parsePowerShorthand(line, decimalPlaces) {
    const words = line.trim().match(new RegExp(`^(-?(?:\\d+(?:\\.\\d+)?|\\.\\d+))\\s*(${UNIT_PATTERN})?\\s+(squared|sq|cubed|cu)$`, 'i'));
    if (words) return formatPower(words[1], /^(?:squared|sq)$/i.test(words[3]) ? 2 : 3, words[2], decimalPlaces);

    const compact = line.trim().match(new RegExp(`^(-?(?:\\d+(?:\\.\\d+)?|\\.\\d+))\\s*(${UNIT_PATTERN})([23])$`, 'i'));
    return compact ? formatPower(compact[1], Number(compact[3]), compact[2], decimalPlaces) : null;
}
