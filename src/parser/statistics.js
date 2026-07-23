function numbersFrom(value) {
    const matches = value.match(/[+-]?(?:\d+(?:\.\d*)?|\.\d+)/g);
    return matches ? matches.map(Number) : [];
}

function calculateListOperation(kind, values) {
    if (!values.length) return null;
    switch (kind) {
        case 'sum': return values.reduce((total, value) => total + value, 0);
        case 'product': return values.reduce((total, value) => total * value, 1);
        case 'difference': return values.slice(1).reduce((total, value) => total - value, values[0]);
        case 'quotient': return values.slice(1).reduce((total, value) => total / value, values[0]);
        case 'average':
        case 'avg':
        case 'mean': return values.reduce((total, value) => total + value, 0) / values.length;
        case 'median': {
            const sorted = [...values].sort((left, right) => left - right);
            return sorted.length % 2
                ? sorted[(sorted.length - 1) / 2]
                : (sorted[sorted.length / 2 - 1] + sorted[sorted.length / 2]) / 2;
        }
        case 'mode': {
            const counts = new Map();
            let best = values[0];
            let highestCount = 0;
            for (const value of values) {
                const count = (counts.get(value) || 0) + 1;
                counts.set(value, count);
                if (count > highestCount) {
                    best = value;
                    highestCount = count;
                }
            }
            return best;
        }
        default: return null;
    }
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

    const listMatch = normalized.match(/^(sum|product|quotient|difference|average|avg|mean|median|mode)\s+(?:of\s+)?(.+)$/);
    if (!listMatch) return null;
    const values = numbersFrom(listMatch[2]);
    if (!values.length) return null;
    const result = calculateListOperation(listMatch[1], values);
    return result === null || !Number.isFinite(result) ? null : math.format(result, { notation: 'fixed', precision: decimalPlaces });
}
