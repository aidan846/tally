import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { parseStockExpression, parseStockReference } from '../src/stocks/query.js';

const require = createRequire(import.meta.url);
const { resolveStockData } = require('../src/stocks/provider.cjs');
const now = new Date(2026, 6, 20, 12);

assert.deepEqual(parseStockReference('MSFT', now), { symbol: 'MSFT', field: 'price', date: null });
assert.deepEqual(parseStockReference('AAPL High Today', now), { symbol: 'AAPL', field: 'high', date: null });
assert.deepEqual(parseStockReference('AAPL Low Today', now), { symbol: 'AAPL', field: 'low', date: null });
assert.deepEqual(parseStockReference('AAPL open price', now), { symbol: 'AAPL', field: 'open', date: null });
assert.deepEqual(parseStockReference('AAPL Close Price', now), { symbol: 'AAPL', field: 'close', date: null });
assert.deepEqual(parseStockReference('MSFT 10 days ago', now), { symbol: 'MSFT', field: 'close', date: '2026-07-10' });
assert.deepEqual(parseStockReference('MSFT on Jan 15, 2019', now), { symbol: 'MSFT', field: 'close', date: '2019-01-15' });
assert.equal(parseStockReference('sqrt 9', now), null);
assert.equal(parseStockExpression('  MSFT  ', now).source, '  MSFT  ');

assert.deepEqual(parseStockExpression('MSFT now - MSFT 3 months ago', now), {
    source: 'MSFT now - MSFT 3 months ago',
    operator: 'subtract',
    operands: [
        { symbol: 'MSFT', field: 'price', date: null },
        { symbol: 'MSFT', field: 'close', date: '2026-04-20' }
    ]
});

const fetchMock = async () => ({
    ok: true,
    json: async () => ({
        chart: {
            error: null,
            result: [{
                meta: { currency: 'USD', regularMarketPrice: 420.5 },
                indicators: { quote: [{ open: [410, 415], high: [425, 430], low: [405, 412], close: [418, 422] }] }
            }]
        }
    })
});

assert.deepEqual(
    await resolveStockData(parseStockExpression('MSFT', now), fetchMock),
    { symbol: 'MSFT', value: 420.5, currency: 'USD' }
);
assert.deepEqual(
    await resolveStockData(parseStockExpression('AAPL High Today', now), fetchMock),
    { symbol: 'AAPL', value: 430, currency: 'USD' }
);

console.log('Passed stock query and provider cases.');
