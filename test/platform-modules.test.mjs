import assert from 'node:assert/strict';

import area from '../src/units/area.js';
import data from '../src/units/data.js';
import length from '../src/units/length.js';
import mass from '../src/units/mass.js';
import speed from '../src/units/speed.js';
import temperature from '../src/units/temperature.js';
import time from '../src/units/time.js';
import volume from '../src/units/volume.js';
import { resolveStockData } from '../src/stocks/provider.js';
import { getWeatherData } from '../src/weather/provider.js';
import { compareVersions, isNewerVersion } from '../src/version.js';
import { highlightExpression } from '../src/syntax-highlight.js';

const unitDefinitions = [area, data, length, mass, speed, temperature, time, volume];

for (const definition of unitDefinitions) {
  assert.equal(typeof definition.name, 'string');
  assert.equal(typeof definition.baseUnit, 'string');
  assert.ok(Object.keys(definition.units).length > 0, `${definition.name} should define units`);
}

assert.equal(typeof resolveStockData, 'function');
assert.equal(typeof getWeatherData, 'function');
assert.equal(compareVersions('2.0.0', '1.1.4'), 1);
assert.equal(compareVersions('v1.1.3', '1.1.4'), -1);
assert.equal(compareVersions('1.1.4', '1.1.4'), 0);
assert.equal(isNewerVersion('1.1.3', '1.1.4'), false);
assert.equal(isNewerVersion('2.0.1', '2.0.0'), true);
const basicExpression = highlightExpression('5 + 4 / 2 * 3 - 1');
assert.doesNotMatch(basicExpression, /token-connector[^>]*>[+\-*/]/);
assert.match(highlightExpression('5 feet to cm'), /token-connector[^>]*>to</);
assert.match(highlightExpression('product 10 and 2'), /token-connector[^>]*>product</);
assert.match(highlightExpression('mean 1 2 3'), /token-connector[^>]*>mean</);
assert.match(highlightExpression('mode 1 2 2'), /token-connector[^>]*>mode</);
assert.match(highlightExpression('MSFT 10 days ago', { stockSymbols: ['MSFT'] }), /token-stock[^>]*>MSFT</);
assert.match(highlightExpression('MSFT 10 days ago', { stockSymbols: ['MSFT'] }), /token-unit[^>]*>days</);
assert.match(highlightExpression('MSFT 10 days ago', { stockSymbols: ['MSFT'] }), /token-unit[^>]*>ago</);

console.log('Platform ES module imports passed.');
