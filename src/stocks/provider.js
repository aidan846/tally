const BASE_URL = 'https://query1.finance.yahoo.com/v8/finance/chart';
const SYMBOL_ALIASES = {
  NQ: 'NQ=F',
  ES: 'ES=F',
  YM: 'YM=F',
  SPX: '^GSPC',
  '^SPX': '^GSPC',
  DOW: '^DJI',
  '^DOW': '^DJI',
  NASDAQ: '^IXIC',
  '^NASDAQ': '^IXIC'
};
const CRYPTO_ALIASES = { BTC: 'BTC-USD', ETH: 'ETH-USD', SOL: 'SOL-USD' };
const cache = new Map();

function validateReference(reference) {
  if (!reference || !/^\^?[A-Z][A-Z0-9.-]{0,9}$/.test(reference.symbol)) throw new Error('Invalid stock symbol');
  if (reference.assetType && !['stock', 'crypto'].includes(reference.assetType)) throw new Error('Invalid asset type');
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
  const symbol = reference.assetType === 'crypto'
    ? CRYPTO_ALIASES[reference.symbol] || reference.symbol
    : SYMBOL_ALIASES[reference.symbol] || reference.symbol;
  const params = new URLSearchParams({ interval: '1d', events: 'history' });
  if (reference.date) {
    const range = dateRange(reference.date);
    params.set('period1', String(range.period1));
    params.set('period2', String(range.period2));
  } else {
    params.set('range', '5d');
  }

  const response = await fetchImpl(`${BASE_URL}/${encodeURIComponent(symbol)}?${params}`, {
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

function isReference(operand) {
  return operand && typeof operand.symbol === 'string';
}

function isNumericOperand(operand) {
  return operand && Number.isFinite(operand.value) && (operand.currency === null || operand.currency === 'USD');
}

async function resolveStockData(query, fetchImpl = fetch) {
  if (!query || !Array.isArray(query.operands) || query.operands.length < 1 || query.operands.length > 2) {
    throw new Error('Invalid stock query');
  }

  const values = await Promise.all(query.operands.map(operand => isReference(operand) ? lookup(operand, fetchImpl) : operand));
  if (query.operator === null && values.length === 1 && isReference(query.operands[0])) return values[0];
  if (!['add', 'subtract', 'multiply', 'divide'].includes(query.operator) || values.length !== 2) throw new Error('Invalid stock operation');
  if (!values.every(value => isReference(value) || isNumericOperand(value))) throw new Error('Invalid stock operand');
  if (query.operator === 'divide' && values[1].value === 0) throw new Error('Cannot divide by zero');

  const currencies = values.map(value => value.currency).filter(Boolean);
  if (currencies.length === 2 && currencies[0] !== currencies[1]) throw new Error('Stock currencies do not match');
  const currency = currencies[0] || 'USD';
  const value = {
    add: values[0].value + values[1].value,
    subtract: values[0].value - values[1].value,
    multiply: values[0].value * values[1].value,
    divide: values[0].value / values[1].value
  }[query.operator];

  return {
    symbol: query.operands.filter(isReference).map(reference => reference.symbol).join(` ${query.operator} `),
    value,
    currency
  };
}

export { resolveStockData as getStockData, resolveStockData };
