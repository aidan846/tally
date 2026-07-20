export function parseWeatherQuery(value) {
    const source = value;
    const expression = value.trim();
    if (/^weather$/i.test(expression)) return { source, location: null };

    const match = expression.match(/^(?:weather|temperature|temp)\s+in\s+(.+)$/i);
    if (!match) return null;
    const location = match[1].trim();
    return location ? { source, location } : null;
}
