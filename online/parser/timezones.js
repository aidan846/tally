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
    'hamburg': 'Europe/Berlin',
    'madrid': 'Europe/Madrid',
    'tokyo': 'Asia/Tokyo',
    'sydney': 'Australia/Sydney',
    'new york': 'America/New_York',
    'ny': 'America/New_York',
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
    const match = line.trim().match(/^(\d{1,2}:\d{2})(?:\s*(am|pm))?\s+(.+?)\s+(?:to|in)\s+(.+)$/i);

    if (!match) return null;

    const [, timeText, meridiem, sourceName, targetName] = match;
    const sourceTimeZone = TIMEZONE_MAP[sourceName.toLowerCase().trim()];
    const targetTimeZone = TIMEZONE_MAP[targetName.toLowerCase().trim()];
    if (!sourceTimeZone || !targetTimeZone) return null;

    try {
        const dateParts = new Intl.DateTimeFormat('en-US', {
            timeZone: sourceTimeZone,
            year: 'numeric', month: 'numeric', day: 'numeric'
        }).formatToParts(new Date());
        const datePart = type => Number(dateParts.find(value => value.type === type).value);
        let [hour, minute] = timeText.split(':').map(Number);
        if (meridiem) {
            if (hour === 12) hour = 0;
            if (meridiem.toLowerCase() === 'pm') hour += 12;
        }
        if (hour > 23 || minute > 59) return null;

        const wallClockUtc = Date.UTC(datePart('year'), datePart('month') - 1, datePart('day'), hour, minute);
        let instant = new Date(wallClockUtc);
        for (let iteration = 0; iteration < 2; iteration += 1) {
            const sourceParts = new Intl.DateTimeFormat('en-US', {
                timeZone: sourceTimeZone,
                year: 'numeric', month: 'numeric', day: 'numeric',
                hour: 'numeric', minute: 'numeric', second: 'numeric', hourCycle: 'h23'
            }).formatToParts(instant);
            const sourcePart = type => Number(sourceParts.find(value => value.type === type).value);
            const representedUtc = Date.UTC(sourcePart('year'), sourcePart('month') - 1, sourcePart('day'), sourcePart('hour'), sourcePart('minute'), sourcePart('second'));
            instant = new Date(instant.getTime() + wallClockUtc - representedUtc);
        }

        return new Intl.DateTimeFormat('en-US', {
            hour: '2-digit',
            minute: '2-digit',
            hour12: true,
            timeZone: targetTimeZone
        }).format(instant).replace(/^0/, '').replace(/\s?(AM|PM)$/, value => ` ${value.trim().toLowerCase()}`);
    } catch (error) {
        console.error('Error during timezone conversion:', error);
        return null;
    }
}
