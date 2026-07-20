const BASE_URL = 'https://query1.finance.yahoo.com/v8/finance/chart';
const cache = new Map();

function validateReference(reference) {
  if (!reference || !/^[A-Z][A-Z0-9.-]{0,9}$/.test(reference.symbol)) throw new Error('Invalid stock symbol');
  if (!['price', 'open', 'high', 'low', 'close'].includes(reference.field)) throw new Error('Invalid stock field');
  if (reference.date !== null && !/^\d{4}-\d{2}-\d{2}$/.test(reference.date)) throw new Error('Invalid stock date');
}

function dateRange(dateKey) {
  const target = new Date(`${dateKey}T12:00:00Z`);
  const start = new Date(target);
  const end = new Date(target);
  start.setUTCDate(start.getUTCDate() - 7);
  end.setUTCDate(end.getUTCDate() + 1);
  return {
    period1: Math.floor(start.getTime() / 1000),
    period2: Math.floor(end.getTime() / 1000)
  };
}

async function loadChart(reference, fetchImpl) {
  const params = new URLSearchParams({ interval: '1d', events: 'history' });
  if (reference.date) {
    const range = dateRange(reference.date);
    params.set('period1', String(range.period1));
    params.set('period2', String(range.period2));
  } else {
    params.set('range', '5d');
  }

  const response = await fetchImpl(`${BASE_URL}/${encodeURIComponent(reference.symbol)}?${params}`, {
    headers: { 'User-Agent': 'Tally/1.0' },
    signal: AbortSignal.timeout(10000)
  });
  if (!response.ok) throw new Error(`Stock request failed: ${response.status}`);

  const data = await response.json();
  const chart = data?.chart;
  if (chart?.error) throw new Error(chart.error.description || 'Stock request failed');
  const result = chart?.result?.[0];
  if (!result) throw new Error('Stock data unavailable');
  return result;
}

function latestValue(result, field) {
  const values = result.indicators?.quote?.[0]?.[field] || [];
  for (let index = values.length - 1; index >= 0; index -= 1) {
    if (Number.isFinite(values[index])) return values[index];
  }
  return null;
}

async function lookup(reference, fetchImpl) {
  validateReference(reference);
  const cacheKey = JSON.stringify(reference);
  const cached = cache.get(cacheKey);
  if (cached && cached.expiresAt > Date.now()) return cached.value;

  const chart = await loadChart(reference, fetchImpl);
  const value = reference.field === 'price' && Number.isFinite(chart.meta?.regularMarketPrice)
    ? chart.meta.regularMarketPrice
    : latestValue(chart, reference.field);
  if (!Number.isFinite(value)) throw new Error('Stock price unavailable');

  const result = {
    symbol: reference.symbol,
    value,
    currency: chart.meta?.currency || 'USD'
  };
  cache.set(cacheKey, { value: result, expiresAt: Date.now() + (reference.date ? 3600000 : 15000) });
  return result;
}

async function resolveStockData(query, fetchImpl = fetch) {
  if (!query || !Array.isArray(query.operands) || query.operands.length < 1 || query.operands.length > 2) {
    throw new Error('Invalid stock query');
  }

  const values = await Promise.all(query.operands.map(reference => lookup(reference, fetchImpl)));
  if (query.operator === null && values.length === 1) return values[0];
  if (query.operator !== 'subtract' || values.length !== 2) throw new Error('Invalid stock operation');
  if (values[0].currency !== values[1].currency) throw new Error('Stock currencies do not match');

  return {
    symbol: `${values[0].symbol}-${values[1].symbol}`,
    value: values[0].value - values[1].value,
    currency: values[0].currency
  };
}

module.exports = { getStockData: resolveStockData, resolveStockData };
