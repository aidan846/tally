import assert from 'node:assert/strict';
import { create, all } from 'mathjs';

globalThis.math = create(all);
math.createUnit('USD', { aliases: ['usd'] }, { override: true });
math.createUnit('EUR', { definition: '1.2 USD', aliases: ['eur'] }, { override: true });
const { evaluateInput } = await import('../src/parser.js');

const cases = [
    ['5 + 5', '10.0000'],
    ['6*2', '12.0000'],
    ['5 times 3', '15.0000'],
    ['5 and 2', '7.0000'],
    ['5 minus 4', '1.0000'],
    ['5 add 2', '7.0000'],
    ['1000', '1000.0000'],
    ['1999', '1999.0000'],
    ['-5', '-5.0000'],
    ['sqrt4', '2.0000'],
    ['sqrt 9', '3.0000'],
    ['abs-4', '4.0000'],
    ['10 mil', '10000000.0000'],
    ['10 million to billion', '0.0100 billion'],
    ['3 tril to bil', '3000.0000 billion'],
    ['(15% of 240) + 18', '54.0000'],
    ['sin(pi / 2)', '1.0000'],
    ['1200000 scientific', '1.2000e+6'],
    ['6 F to C', '-14.4444 c'],
    ['6 deg f to c', '-14.4444 c'],
    ['6F to C', '-14.4444 c'],
    ['5K to F', '-450.6700 f'],
    ['5ft to cm', '152.4000 cm'],
    ['5 ft in cm', '152.4000 cm'],
    ['5 mile to cm', '804672.0000 cm'],
    ['5 feet to mi', '0.0009 mi'],
    ['5 feet in', '60.0000 in'],
    ['5lb to kg', '2.2680 kg'],
    ['5 lb to kg', '2.2680 kg'],
    ['4 gram to lb', '0.0088 lb'],
    ['4g to pound', '0.0088 lb'],
    ['2 hours to min', '120.0000 min'],
    ['1 gallon as ml', '3785.4118 ml'],
    ['1 square foot to cm²', '929.0304 cm2'],
    ['1 ft^2 to in2', '144.0000 in2'],
    ['1 ft3 to l', '28.3168 l'],
    ['1 ft^3 to in^3', '1728.0000 in3'],
    ['60mph to km/h', '96.5606 km/h'],
    ['1MB to kb', '8192.0000 kb'],
    ['20 usd to eur', '16.6667 eur'],
    ['14.7psi to atm', '1.0003 atm'],
    ['1 atmosphere to kPa', '101.3250 kpa'],
    ['06/29/2026 - 20 days', 'Tue Jun 09 2026'],
    ['06/29/2026 plus 20 days', 'Sun Jul 19 2026'],
    ['06/29/2026 minus 1 year', 'Sun Jun 29 2025']
    ,['06/29/2026 - 10', 'Fri Jun 19 2026']
    ,['06/29/2026 - 1 yr', 'Sun Jun 29 2025']
];

for (const [input, expected] of cases) {
    assert.equal(evaluateInput(input, 4)[0], expected, input);
}

console.log(`Passed ${cases.length} calculator and conversion cases.`);

assert.deepEqual(
    evaluateInput('trip = 06/29/2026\ntrip + 2 weeks', 2),
    ['trip: Mon Jun 29 2026', 'Mon Jul 13 2026'],
    'saved-date arithmetic'
);

assert.match(
    evaluateInput('y = 2 days\ntoday + y', 2)[1],
    /^[A-Z][a-z]{2} /,
    'date plus saved duration'
);

assert.match(evaluateInput('10 days ago\n10 months ago', 2)[0], /^[A-Z][a-z]{2} /, 'days ago');
assert.match(evaluateInput('10 days ago\n10 months ago', 2)[1], /^[A-Z][a-z]{2} /, 'months ago');
