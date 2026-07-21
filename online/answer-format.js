export function escapeHtml(value) {
    return value.replace(/[&<>"']/g, character => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[character]);
}

export function formatAnswer(answer) {
    const text = String(answer ?? '');
    if (text === '❌') {
        return '<span class="answer-error-icon" title="Could not evaluate this calculation" aria-label="Could not evaluate this calculation"><svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="8"/><path d="M9 9l6 6m0-6l-6 6"/></svg></span>';
    }

    const currency = text.match(/^(NZ\$|HK\$|A\$|C\$|S\$|R\$|[$€£¥₹₩₽₺₫฿₱₦])([+-]?(?:\d[\d,]*(?:\.\d+)?|\.\d+))$/);
    if (currency) {
        return `<span class="answer-unit">${escapeHtml(currency[1])}</span><span class="answer-number">${escapeHtml(currency[2])}</span>`;
    }

    const valueWithUnit = text.match(/^([+-]?(?:\d[\d,]*(?:\.\d+)?(?:e[+-]?\d+)?|\.\d+)(?:%|°)?)(\s+)(.+)$/i);
    if (valueWithUnit) {
        return `<span class="answer-number">${escapeHtml(valueWithUnit[1])}</span>${escapeHtml(valueWithUnit[2])}<span class="answer-unit">${escapeHtml(valueWithUnit[3])}</span>`;
    }

    return /^[+-]?(?:\d|\.\d)/.test(text)
        ? `<span class="answer-number">${escapeHtml(text)}</span>`
        : escapeHtml(text);
}
