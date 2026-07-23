export function parseWeatherQuery(value) {
    const source = value;
    const expression = value.trim();
    if (/^weather$/i.test(expression)) return { source, location: null };
    if (/^rain$/i.test(expression)) return { source, location: null, kind: 'rain' };

    const match = expression.match(/^(weather|temperature|temp|rain)\s+in\s+(.+)$/i);
    if (!match) return null;
    const location = match[2].trim();
    return location ? { source, location, ...(match[1].toLowerCase() === 'rain' ? { kind: 'rain' } : {}) } : null;
}
