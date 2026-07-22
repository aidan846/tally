import assert from 'node:assert/strict';
import { create, all } from 'mathjs';

globalThis.math = create(all);
math.createUnit('USD', { aliases: ['usd'] }, { override: true });
math.createUnit('EUR', { definition: '1.2 USD', aliases: ['eur'] }, { override: true });
math.createUnit('GBP', { definition: '1.25 USD', aliases: ['gbp'] }, { override: true });
math.createUnit('AUD', { definition: '0.6666666667 USD', aliases: ['aud'] }, { override: true });
math.createUnit('INR', { definition: '0.012 USD', aliases: ['inr'] }, { override: true });
const { evaluateInput } = await import('../src/parser.js');

const cases = [
    ['5 + 5', '10.0000'],
    ['6*2', '12.0000'],
    ['20x2', '40.0000'],
    ['20 x 2', '40.0000'],
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
    ['1 square feet to m2', '0.0929 m2'],
    ['1 ft² to m2', '0.0929 m2'],
    ['1 kg/m² to g/m²', '1000.0000 g/m2'],
    ['60mph to km/h', '96.5606 km/h'],
    ['1MB to kb', '8192.0000 kb'],
    ['20 usd to eur', '16.67 EUR'],
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
    ['Mon Jun 29 2026', 'Mon Jul 13 2026'],
    'saved-date arithmetic'
);

assert.match(
    evaluateInput('y = 2 days\ntoday + y', 2)[1],
    /^[A-Z][a-z]{2} /,
    'date plus saved duration'
);

assert.match(evaluateInput('10 days ago\n10 months ago', 2)[0], /^[A-Z][a-z]{2} /, 'days ago');
assert.match(evaluateInput('10 days ago\n10 months ago', 2)[1], /^[A-Z][a-z]{2} /, 'months ago');

const requestedCases = [
    ['$10', '$10.00'],
    ['₹10', '₹10.00'],
    ['$10 gbp', '£8.00'],
    ['$10 + 30gbp', '$47.50'],
    ['$2 * 20gbp', '$50.00'],
    ['300 usd in aud', '450.00 AUD'],
    ['75 is what % of 600', '12.5000%'],
    ['price = 100\ntax = 8.875%\ntax of price', '8.8750'],
    ['price = 100\ntax = 8.875%\ntax times price', '8.8750'],
    ['hours = 10', '10.0000'],
    ['hourly rate = $20', '$20.00'],
    ['hours = 10\nhourly rate = $20\nhours * hourly rate', '$200.00'],
    ['John: 5 feet\njohn + 1 foot', '6.0000 feet'],
    ['10 june + 3 weeks', '1 July'],
    ['10 june + 3 weeks 4 days', '5 July'],
    ['march 20 to june 5', '2 months 2 weeks 2 days'],
    ['weeks between october 21 and december 2', '6 weeks'],
    ['august 3 + 3 workdays', '6 August'],
    ['midpoint between 10 and 20', '15.0000'],
    ['average 1 2 3 4 5', '3.0000'],
    ['mean 1 2 3 4 5', '3.0000'],
    ['median 1 8 3 4 5', '4.0000']
];

for (const [input, expected] of requestedCases) {
    assert.equal(evaluateInput(input, 4).at(-1), expected, input);
}

assert.match(evaluateInput('now + 20 minutes', 2)[0], /^\d{1,2}:\d{2}\s(?:am|pm)$/);
assert.equal(evaluateInput('3:30 am NY to Hamburg', 2)[0], '9:30 am');
assert.equal(evaluateInput('3:30 New York to Hamburg', 2)[0], '9:30 am');
assert.equal(evaluateInput('14:20 New York to Beijing', 2)[0], '2:20 am');

assert.deepEqual(evaluateInput('Price: 40\nPrice', 2), ['40.00', '40.00']);
assert.deepEqual(evaluateInput('Price = 40\nPrice', 2), ['40.00', '40.00']);
assert.equal(evaluateInput('pi', 4)[0], '3.1416');
assert.equal(evaluateInput('pi * 2', 4)[0], '6.2832');
assert.deepEqual(evaluateInput('\n5+5\n\n3*2', 2), ['', '10.00', '', '6.00'], 'blank spacer rows');

const randomResult = Number(evaluateInput('random number between 10 and 20', 2)[0]);
assert.ok(Number.isInteger(randomResult) && randomResult >= 10 && randomResult <= 20);
