import assert from 'node:assert/strict';
import { formatAnswer } from '../src/answer-format.js';

assert.equal(formatAnswer('£11.16'), '<span class="answer-number">£11.16</span>');
assert.equal(formatAnswer('$-4.25'), '<span class="answer-number">$-4.25</span>');
assert.equal(formatAnswer('A$20.00'), '<span class="answer-number">A$20.00</span>');
assert.equal(formatAnswer('11.16 GBP'), '<span class="answer-number">11.16</span> <span class="answer-unit">GBP</span>');
assert.equal(formatAnswer('24° C (Cloudy)'), '<span class="answer-number">24°</span> <span class="answer-unit">C (Cloudy)</span>');
assert.equal(formatAnswer('<invalid>'), '&lt;invalid&gt;');

console.log('Answer formatting tests passed');
