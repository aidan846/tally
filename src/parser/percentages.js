import { preprocessNaturalLanguage } from './preprocess.js';

export function parsePercentageOperations(line, parser, decimalPlaces) {
    const lowerLine = line.toLowerCase().trim();
    let resultValue = null;

    const safeEvaluate = (expr) => {
        try {
            return parser.evaluate(preprocessNaturalLanguage(expr));
        } catch (e) {
            console.error(`Error evaluating percentage part "${expr}":`, e);
            return null;
        }
    };

    const whatPercentMatch = lowerLine.match(/^(.*?)\s+is\s+what\s*%\s+of\s+(.*)$/);
    if (whatPercentMatch) {
        const part = safeEvaluate(whatPercentMatch[1]);
        const whole = safeEvaluate(whatPercentMatch[2]);
        if (part !== null && whole !== null) {
            try {
                const percentage = math.multiply(math.divide(part, whole), 100);
                if (typeof percentage === 'number') return `${math.format(percentage, { notation: 'fixed', precision: decimalPlaces })}%`;
            } catch {}
        }
    }

    let match = lowerLine.match(/^(\d+\.?\d*)\s*%\s+of\s+(.*)$/);
    if (match) {
        const percentage = parseFloat(match[1]) / 100;
        const baseValue = safeEvaluate(match[2]);
        if (baseValue !== null && (typeof baseValue === 'number' || baseValue instanceof math.Unit)) {
            resultValue = math.multiply(baseValue, percentage);
        }
    }

    if (resultValue === null) {
        match = lowerLine.match(/^(\d+\.?\d*)\s*%\s+on\s+(.*)$/);
        if (match) {
            const percentage = parseFloat(match[1]) / 100;
            const baseValue = safeEvaluate(match[2]);
            if (baseValue !== null && (typeof baseValue === 'number' || baseValue instanceof math.Unit)) {
                resultValue = math.add(baseValue, math.multiply(baseValue, percentage));
            }
        }
    }

    if (resultValue === null) {
        match = lowerLine.match(/^(\d+\.?\d*)\s*%\s+off\s+(.*)$/);
        if (match) {
            const percentage = parseFloat(match[1]) / 100;
            const baseValue = safeEvaluate(match[2]);
            if (baseValue !== null && (typeof baseValue === 'number' || baseValue instanceof math.Unit)) {
                resultValue = math.subtract(baseValue, math.multiply(baseValue, percentage));
            }
        }
    }

    if (resultValue === null) {
        match = lowerLine.match(/^(.*?)\s+as\s+a\s*%\s+of\s+(.*)$/);
        if (match) {
            const part = safeEvaluate(match[1]);
            const whole = safeEvaluate(match[2]);
            if (part !== null && whole !== null && (typeof part === 'number' || part instanceof math.Unit) && (typeof whole === 'number' || whole instanceof math.Unit)) {
                try {
                    const ratio = math.divide(part, whole);
                    resultValue = math.multiply(ratio, 100);
                    if (typeof resultValue === 'number') {
                        return `${math.format(resultValue, { notation: 'fixed', precision: decimalPlaces })}%`;
                    }
                } catch {}
            }
        }
    }

    if (resultValue === null) {
        match = lowerLine.match(/^(.*?)\s+as\s+a\s*%\s+on\s+(.*)$/);
        if (match) {
            const newValue = safeEvaluate(match[1]);
            const originalValue = safeEvaluate(match[2]);
            if (newValue !== null && originalValue !== null && (typeof newValue === 'number' || newValue instanceof math.Unit) && (typeof originalValue === 'number' || originalValue instanceof math.Unit)) {
                try {
                    const diff = math.subtract(newValue, originalValue);
                    const ratio = math.divide(diff, originalValue);
                    resultValue = math.multiply(ratio, 100);
                    if (typeof resultValue === 'number') {
                        return `${math.format(resultValue, { notation: 'fixed', precision: decimalPlaces })}%`;
                    }
                } catch {}
            }
        }
    }

    if (resultValue === null) {
        match = lowerLine.match(/^(.*?)\s+as\s+a\s*%\s+off\s+(.*)$/);
        if (match) {
            const newValue = safeEvaluate(match[1]);
            const originalValue = safeEvaluate(match[2]);
            if (newValue !== null && originalValue !== null && (typeof newValue === 'number' || newValue instanceof math.Unit) && (typeof originalValue === 'number' || originalValue instanceof math.Unit)) {
                try {
                    const diff = math.subtract(originalValue, newValue);
                    const ratio = math.divide(diff, originalValue);
                    resultValue = math.multiply(ratio, 100);
                    if (typeof resultValue === 'number') {
                        return `${math.format(resultValue, { notation: 'fixed', precision: decimalPlaces })}%`;
                    }
                } catch {}
            }
        }
    }

    if (resultValue === null) {
        match = lowerLine.match(/^(\d+\.?\d*)\s*%\s+of\s+what\s+is\s+(.*)$/);
        if (match) {
            const percentage = parseFloat(match[1]) / 100;
            const resultIs = safeEvaluate(match[2]);
            if (resultIs !== null && (typeof resultIs === 'number' || resultIs instanceof math.Unit)) {
                resultValue = math.divide(resultIs, percentage);
            }
        }
    }

    if (resultValue === null) {
        match = lowerLine.match(/^(\d+\.?\d*)\s*%\s+on\s+what\s+is\s+(.*)$/);
        if (match) {
            const percentage = parseFloat(match[1]) / 100;
            const resultIs = safeEvaluate(match[2]);
            if (resultIs !== null && (typeof resultIs === 'number' || resultIs instanceof math.Unit)) {
                resultValue = math.divide(resultIs, math.add(1, percentage));
            }
        }
    }

    if (resultValue === null) {
        match = lowerLine.match(/^(\d+\.?\d*)\s*%\s+off\s+what\s+is\s+(.*)$/);
        if (match) {
            const percentage = parseFloat(match[1]) / 100;
            const resultIs = safeEvaluate(match[2]);
            if (resultIs !== null && (typeof resultIs === 'number' || resultIs instanceof math.Unit)) {
                resultValue = math.divide(resultIs, math.subtract(1, percentage));
            }
        }
    }

    if (resultValue !== null && (typeof resultValue === 'number' || resultValue instanceof math.Unit)) {
        return math.format(resultValue, { notation: 'fixed', precision: decimalPlaces });
    }

    return null;
}
