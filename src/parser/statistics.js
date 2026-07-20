function numbersFrom(value) {
    const matches = value.match(/[+-]?(?:\d+(?:\.\d*)?|\.\d+)/g);
    return matches ? matches.map(Number) : [];
}

export function parseStatistics(line, decimalPlaces, random = Math.random) {
    const normalized = line.trim().toLowerCase();
    if (normalized === 'random number') {
        return math.format(random(), { notation: 'fixed', precision: decimalPlaces });
    }

    const randomMatch = normalized.match(/^random number(?:\s+between)?\s+([+-]?(?:\d+(?:\.\d*)?|\.\d+))\s+(?:and\s+)?([+-]?(?:\d+(?:\.\d*)?|\.\d+))$/);
    if (randomMatch) {
        const minimum = Math.ceil(Math.min(Number(randomMatch[1]), Number(randomMatch[2])));
        const maximum = Math.floor(Math.max(Number(randomMatch[1]), Number(randomMatch[2])));
        return String(Math.floor(random() * (maximum - minimum + 1)) + minimum);
    }

    const midpointMatch = normalized.match(/^midpoint between\s+([+-]?(?:\d+(?:\.\d*)?|\.\d+))\s+and\s+([+-]?(?:\d+(?:\.\d*)?|\.\d+))$/);
    if (midpointMatch) {
        const midpoint = (Number(midpointMatch[1]) + Number(midpointMatch[2])) / 2;
        return math.format(midpoint, { notation: 'fixed', precision: decimalPlaces });
    }

    const listMatch = normalized.match(/^(average|mean|median)\s+(.+)$/);
    if (!listMatch) return null;
    const values = numbersFrom(listMatch[2]);
    if (!values.length) return null;
    values.sort((left, right) => left - right);
    const result = listMatch[1] === 'median'
        ? values.length % 2
            ? values[(values.length - 1) / 2]
            : (values[values.length / 2 - 1] + values[values.length / 2]) / 2
        : values.reduce((sum, value) => sum + value, 0) / values.length;
    return math.format(result, { notation: 'fixed', precision: decimalPlaces });
}
