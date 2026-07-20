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

export function parseCurrentTimeAndDate(line) {
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

export function parseTimeZoneConversion(line) {
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

