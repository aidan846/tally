import assert from 'node:assert/strict';
import { parseStockExpression, parseStockReference } from '../src/stocks/query.js';
import { resolveStockData } from '../src/stocks/provider.js';
const now = new Date(2026, 6, 20, 12);

assert.deepEqual(parseStockReference('MSFT', now), { symbol: 'MSFT', field: 'price', date: null });
assert.deepEqual(parseStockReference('msft', now), { symbol: 'MSFT', field: 'price', date: null });
assert.deepEqual(parseStockReference('MsFt Stock', now), { symbol: 'MSFT', field: 'price', date: null });
assert.deepEqual(parseStockReference('nq', now), { symbol: 'NQ', field: 'price', date: null });
assert.deepEqual(parseStockReference('Es Stock', now), { symbol: 'ES', field: 'price', date: null });
assert.deepEqual(parseStockReference('ym', now), { symbol: 'YM', field: 'price', date: null });
assert.deepEqual(parseStockReference('spx', now), { symbol: 'SPX', field: 'price', date: null });
assert.deepEqual(parseStockReference('Dow', now), { symbol: 'DOW', field: 'price', date: null });
assert.deepEqual(parseStockReference('nasdaq', now), { symbol: 'NASDAQ', field: 'price', date: null });
assert.deepEqual(parseStockReference('^DJI', now), { symbol: '^DJI', field: 'price', date: null });
assert.deepEqual(parseStockReference('^gspc', now), { symbol: '^GSPC', field: 'price', date: null });
assert.deepEqual(parseStockReference('^ixic', now), { symbol: '^IXIC', field: 'price', date: null });
assert.deepEqual(parseStockReference('AAPL High Today', now), { symbol: 'AAPL', field: 'high', date: null });
assert.deepEqual(parseStockReference('AAPL Low Today', now), { symbol: 'AAPL', field: 'low', date: null });
assert.deepEqual(parseStockReference('AAPL open price', now), { symbol: 'AAPL', field: 'open', date: null });
assert.deepEqual(parseStockReference('AAPL Close Price', now), { symbol: 'AAPL', field: 'close', date: null });
assert.deepEqual(parseStockReference('MSFT 10 days ago', now), { symbol: 'MSFT', field: 'close', date: '2026-07-10' });
assert.deepEqual(parseStockReference('MSFT on Jan 15, 2019', now), { symbol: 'MSFT', field: 'close', date: '2019-01-15' });
assert.equal(parseStockReference('sqrt 9', now), null);
assert.equal(parseStockExpression('pi', now), null);
assert.deepEqual(parseStockExpression('pi stock', now), {
    source: 'pi stock',
    operator: null,
    operands: [{ symbol: 'PI', field: 'price', date: null }]
});
assert.equal(parseStockExpression('  MSFT  ', now).source, '  MSFT  ');
assert.equal(parseStockExpression('Price', now, new Set(['price'])), null);

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

const expectedAliases = new Map([
    ['NQ', 'NQ%3DF'],
    ['ES', 'ES%3DF'],
    ['YM', 'YM%3DF'],
    ['SPX', '%5EGSPC'],
    ['DOW', '%5EDJI'],
    ['NASDAQ', '%5EIXIC']
]);

for (const [input, encodedSymbol] of expectedAliases) {
    let requestedUrl;
    await resolveStockData(parseStockExpression(input, now), async url => {
        requestedUrl = String(url);
        return fetchMock();
    });
    assert.match(requestedUrl, new RegExp(`/${encodedSymbol}\\?`));
}

assert.deepEqual(
    await resolveStockData(parseStockExpression('MSFT', now), fetchMock),
    { symbol: 'MSFT', value: 420.5, currency: 'USD' }
);
assert.deepEqual(
    await resolveStockData(parseStockExpression('AAPL High Today', now), fetchMock),
    { symbol: 'AAPL', value: 430, currency: 'USD' }
);

console.log('Passed stock query and provider cases.');
