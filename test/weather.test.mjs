import assert from 'node:assert/strict';
import { parseWeatherQuery } from '../src/weather/query.js';
import { getWeatherData } from '../src/weather/provider.js';

assert.deepEqual(parseWeatherQuery('Weather'), { source: 'Weather', location: null });
assert.deepEqual(parseWeatherQuery('Weather in Charlotte'), { source: 'Weather in Charlotte', location: 'Charlotte' });
assert.deepEqual(parseWeatherQuery('Weather in Charlotte NC'), { source: 'Weather in Charlotte NC', location: 'Charlotte NC' });
assert.deepEqual(parseWeatherQuery('weather in Sydney'), { source: 'weather in Sydney', location: 'Sydney' });
assert.deepEqual(parseWeatherQuery('temperature in charlotte'), { source: 'temperature in charlotte', location: 'charlotte' });
assert.deepEqual(parseWeatherQuery('temp in madrid'), { source: 'temp in madrid', location: 'madrid' });
assert.equal(parseWeatherQuery('temperature'), null);
assert.equal(parseWeatherQuery('weather tomorrow'), null);

const northCarolinaRequests = [];
const northCarolinaFetch = async url => {
    northCarolinaRequests.push(String(url));
    if (String(url).startsWith('https://geocoding-api.open-meteo.com')) {
        return {
            ok: true,
            json: async () => ({
                results: [
                    { name: 'Charlotte', latitude: 33.1, longitude: -80.1, country_code: 'US', admin1: 'South Carolina' },
                    { name: 'Charlotte', latitude: 35.2271, longitude: -80.8431, country_code: 'US', admin1: 'North Carolina' }
                ]
            })
        };
    }
    return { ok: true, json: async () => ({ current: { temperature_2m: 74.6, weather_code: 2 } }) };
};

assert.deepEqual(
    await getWeatherData({ location: 'Charlotte NC' }, northCarolinaFetch),
    { temperature: 75, unit: 'F', condition: 'Partly cloudy', location: 'Charlotte' }
);
assert.match(northCarolinaRequests[0], /name=Charlotte/);
assert.match(northCarolinaRequests[1], /latitude=35\.2271/);
assert.match(northCarolinaRequests[1], /temperature_unit=fahrenheit/);

const sydneyFetch = async url => {
    if (String(url).startsWith('https://geocoding-api.open-meteo.com')) {
        return {
            ok: true,
            json: async () => ({ results: [{ name: 'Sydney', latitude: -33.87, longitude: 151.21, country_code: 'AU' }] })
        };
    }
    assert.match(String(url), /temperature_unit=celsius/);
    return { ok: true, json: async () => ({ current: { temperature_2m: 24.2, weather_code: 3 } }) };
};

assert.deepEqual(
    await getWeatherData({ location: 'Sydney' }, sydneyFetch),
    { temperature: 24, unit: 'C', condition: 'Cloudy', location: 'Sydney' }
);

const coordinateFetch = async url => {
    assert.match(String(url), /temperature_unit=fahrenheit/);
    return { ok: true, json: async () => ({ current: { temperature_2m: 68.4, weather_code: 0 } }) };
};

assert.deepEqual(
    await getWeatherData({ coordinates: { latitude: 35.2, longitude: -80.8 }, region: 'US' }, coordinateFetch),
    { temperature: 68, unit: 'F', condition: 'Clear', location: 'Current location' }
);

console.log('Weather tests passed');
