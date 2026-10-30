// Line-level rewrites that run before the main parsers. Each one turns a
// friendly way of writing something into syntax the parsers already know.

// "1,234.56" (us) or "1.234,56" (eu) -> "1234.56".
export function normalizeNumberFormat(line, format = 'us') {
    if (format === 'eu') {
        return line
            .replace(/\b\d{1,3}(?:\.\d{3})+(?:,\d+)?\b|\b\d+,\d+\b/g, number => number.replace(/\./g, '').replace(',', '.'))
            .replace(/;/g, ',');
    }
    return line.replace(/\b\d{1,3}(?:,\d{3})+(?:\.\d+)?\b/g, number => number.replace(/,/g, ''));
}

export function isHeading(line) {
    return /^\s*#/.test(line);
}

export function isComment(line) {
    return /^\s*\/\//.test(line);
}

// "5 + 5 // lunch" -> "5 + 5"
export function stripTrailingComment(line) {
    return line.replace(/\s+\/\/.*$/, '');
}

const NUMBER = '(?:\\d+(?:\\.\\d+)?|\\.\\d+)';

// Everyday phrases -> plain expressions.
export function rewritePhrases(text) {
    let line = text.trim();
    const rules = [
        [/^half\s+(?:of\s+)?(.+)$/i, (_, value) => `(${value}) / 2`],
        [/^(?:a|one)\s+third\s+of\s+(.+)$/i, (_, value) => `(${value}) / 3`],
        [/^two\s+thirds\s+of\s+(.+)$/i, (_, value) => `(${value}) * 2 / 3`],
        [/^(?:a|one)\s+quarter\s+of\s+(.+)$/i, (_, value) => `(${value}) / 4`],
        [/^three\s+quarters\s+of\s+(.+)$/i, (_, value) => `(${value}) * 3 / 4`],
        [/^double\s+(.+)$/i, (_, value) => `(${value}) * 2`],
        [/^triple\s+(.+)$/i, (_, value) => `(${value}) * 3`],
        [/^quadruple\s+(.+)$/i, (_, value) => `(${value}) * 4`],
        // "$100 split 3 ways", "$90 split between 3 people"
        [new RegExp(`^(.+?)\\s+split\\s+(?:between\\s+|among\\s+|by\\s+|into\\s+)?(${NUMBER})(?:\\s+(?:ways?|people|persons|friends))?$`, 'i'), (_, value, count) => `(${value}) / ${count}`],
        // "tip 20% on $45", "20% tip on $45"
        [new RegExp(`^tip\\s+(${NUMBER})\\s*%\\s+(?:on|of|for)\\s+(.+)$`, 'i'), (_, percent, value) => `${percent}% of ${value}`],
        [new RegExp(`^(${NUMBER})\\s*%\\s+tip\\s+(?:on|of|for)\\s+(.+)$`, 'i'), (_, percent, value) => `${percent}% of ${value}`],
        // "20 people at $15 each", "3 at 4.50 each"
        [new RegExp(`^(${NUMBER})\\s+(?:[a-z]+\\s+)*?at\\s+(.+?)\\s+(?:each|apiece|per\\s+\\w+)$`, 'i'), (_, count, value) => `${count} * (${value})`]
    ];
    for (const [pattern, replace] of rules) {
        if (pattern.test(line)) {
            line = line.replace(pattern, replace);
            break;
        }
    }
    return line
        .replace(/\bhalf\s+a\s+dozen\b/gi, '6')
        .replace(new RegExp(`\\b(${NUMBER})\\s+dozen\\b`, 'gi'), '($1 * 12)')
        .replace(/\ba\s+dozen\b/gi, '12');
}

// 5'10" -> 5 feet 10 inches (also handles smart quotes macOS may insert).
export function rewriteFeetInches(text) {
    return text
        .replace(new RegExp(`(${NUMBER})\\s*['’′]\\s*(${NUMBER})\\s*(?:"|”|″|''|’’)`, 'g'), '$1 feet $2 inches')
        .replace(new RegExp(`(${NUMBER})\\s*['’′](?!\\s*\\d)`, 'g'), '$1 feet')
        .replace(new RegExp(`(${NUMBER})\\s*(?:"|”|″)`, 'g'), '$1 inches');
}

// "1h30m + 45m" -> "(1 hour + 30 minute) + 45 minute". Only kicks in when an
// hour token is present, so "5m" on its own still means 5 million.
export function rewriteCompactDurations(text) {
    if (!/\b\d+(?:\.\d+)?h(?:\d+m)?\b/i.test(text)) return null;
    return text
        .replace(/\b(\d+(?:\.\d+)?)h(\d+)m\b/gi, '($1 hour + $2 minute)')
        .replace(/\b(\d+(?:\.\d+)?)h\b/gi, '$1 hour')
        .replace(/\b(\d+(?:\.\d+)?)m\b/gi, '$1 minute')
        .replace(/\b(\d+(?:\.\d+)?)s\b/gi, '$1 second');
}

// 2.25 hour -> "2h 15m"
export function formatDuration(value) {
    let seconds = Math.round(Math.abs(value.toNumber('s')));
    const sign = value.toNumber('s') < 0 ? '-' : '';
    const hours = Math.floor(seconds / 3600);
    seconds -= hours * 3600;
    const minutes = Math.floor(seconds / 60);
    seconds -= minutes * 60;
    const parts = [];
    if (hours) parts.push(`${hours}h`);
    if (minutes) parts.push(`${minutes}m`);
    if (seconds || !parts.length) parts.push(`${seconds}s`);
    return sign + parts.join(' ');
}
