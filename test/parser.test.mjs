import assert from 'node:assert/strict';
import { create, all } from 'mathjs';

// parser.js uses the browser build's global `math`. Provide the equivalent
// Math.js instance here so the same parsing logic can be exercised in CI.
globalThis.math = create(all);
const { evaluateInput } = await import('../src/parser.js');

const cases = [
    ['5 + 5', '10.0000'],
    ['6*2', '12.0000'],
    ['5 times 3', '15.0000'],
    ['5 and 2', '7.0000'],
    ['5 minus 4', '1.0000'],
    ['5 add 2', '7.0000'],
    ['6 F to C', '-14.4444 c'],
    ['6 deg f to c', '-14.4444 c'],
    ['6F to C', '-14.4444 c'],
    ['5K to F', '-450.6700 f'],
    ['5ft to cm', '152.4000 cm'],
    ['5 ft in cm', '152.4000 cm'],
    ['5 mile to cm', '804672.0000 cm'],
    ['5 feet to mi', '0.0009 mi'],
    ['5lb to kg', '2.2680 kg'],
    ['5 lb to kg', '2.2680 kg'],
    ['4 gram to lb', '0.0088 lb'],
    ['4g to pound', '0.0088 lb'],
    ['2 hours to min', '120.0000 min'],
    ['1 gallon as ml', '3785.4118 ml'],
    ['1 square foot to cm²', '929.0304 cm2'],
    ['60mph to km/h', '96.5606 km/h'],
    ['1MB to kb', '8192.0000 kb'],
    ['14.7psi to atm', '1.0003 atm'],
    ['1 atmosphere to kPa', '101.3250 kpa'],
    ['06/29/2026 - 20 days', 'Tue Jun 09 2026'],
    ['06/29/2026 plus 20 days', 'Sun Jul 19 2026'],
    ['06/29/2026 minus 1 year', 'Sun Jun 29 2025']
];

for (const [input, expected] of cases) {
    assert.equal(evaluateInput(input, 4)[0], expected, input);
}

console.log(`Passed ${cases.length} calculator and conversion cases.`);
