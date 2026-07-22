const GEOCODING_URL = 'https://geocoding-api.open-meteo.com/v1/search';
const WEATHER_URL = 'https://api.open-meteo.com/v1/forecast';
const FAHRENHEIT_COUNTRIES = new Set(['US', 'BS', 'BZ', 'KY', 'FM', 'MH', 'PW']);
const STATE_NAMES = {
  AL: 'Alabama', AK: 'Alaska', AZ: 'Arizona', AR: 'Arkansas', CA: 'California', CO: 'Colorado', CT: 'Connecticut', DE: 'Delaware', FL: 'Florida', GA: 'Georgia', HI: 'Hawaii', ID: 'Idaho', IL: 'Illinois', IN: 'Indiana', IA: 'Iowa', KS: 'Kansas', KY: 'Kentucky', LA: 'Louisiana', ME: 'Maine', MD: 'Maryland', MA: 'Massachusetts', MI: 'Michigan', MN: 'Minnesota', MS: 'Mississippi', MO: 'Missouri', MT: 'Montana', NE: 'Nebraska', NV: 'Nevada', NH: 'New Hampshire', NJ: 'New Jersey', NM: 'New Mexico', NY: 'New York', NC: 'North Carolina', ND: 'North Dakota', OH: 'Ohio', OK: 'Oklahoma', OR: 'Oregon', PA: 'Pennsylvania', RI: 'Rhode Island', SC: 'South Carolina', SD: 'South Dakota', TN: 'Tennessee', TX: 'Texas', UT: 'Utah', VT: 'Vermont', VA: 'Virginia', WA: 'Washington', WV: 'West Virginia', WI: 'Wisconsin', WY: 'Wyoming', DC: 'District of Columbia'
};
const CONDITIONS = {
  0: 'Clear', 1: 'Mostly clear', 2: 'Partly cloudy', 3: 'Cloudy', 45: 'Foggy', 48: 'Foggy',
  51: 'Light drizzle', 53: 'Drizzle', 55: 'Heavy drizzle', 56: 'Freezing drizzle', 57: 'Freezing drizzle',
  61: 'Light rain', 63: 'Rain', 65: 'Heavy rain', 66: 'Freezing rain', 67: 'Freezing rain',
  71: 'Light snow', 73: 'Snow', 75: 'Heavy snow', 77: 'Snow grains', 80: 'Light showers',
  81: 'Showers', 82: 'Heavy showers', 85: 'Snow showers', 86: 'Heavy snow showers',
  95: 'Thunderstorms', 96: 'Thunderstorms with hail', 99: 'Thunderstorms with hail'
};
const cache = new Map();

async function requestJson(url, fetchImpl) {
  const response = await fetchImpl(url, { signal: AbortSignal.timeout(10000) });
  if (!response.ok) throw new Error(`Weather request failed: ${response.status}`);
  const data = await response.json();
  if (data?.error) throw new Error(data.reason || 'Weather request failed');
  return data;
}

function splitLocation(value) {
  const match = value.trim().match(/^(.*?)(?:,?\s+)([A-Z]{2})$/i);
  const state = match && STATE_NAMES[match[2].toUpperCase()];
  return state ? { name: match[1].trim(), state } : { name: value.trim(), state: null };
}

async function geocode(value, fetchImpl) {
  const location = splitLocation(value);
  const params = new URLSearchParams({ name: location.name, count: '10', language: 'en', format: 'json' });
  const data = await requestJson(`${GEOCODING_URL}?${params}`, fetchImpl);
  const matches = data.results || [];
  const result = location.state
    ? matches.find(item => item.country_code === 'US' && item.admin1 === location.state)
    : matches[0];
  if (!result) throw new Error('Location not found');
  return {
    latitude: result.latitude,
    longitude: result.longitude,
    countryCode: result.country_code,
    name: result.name
  };
}

function validateCoordinates(coordinates) {
  const latitude = Number(coordinates?.latitude);
  const longitude = Number(coordinates?.longitude);
  if (!Number.isFinite(latitude) || latitude < -90 || latitude > 90 || !Number.isFinite(longitude) || longitude < -180 || longitude > 180) {
    throw new Error('Invalid location coordinates');
  }
  return { latitude, longitude };
}

async function getWeatherData(query, fetchImpl = fetch) {
  if (!query || (typeof query.location !== 'string' && !query.coordinates)) throw new Error('Invalid weather query');
  const cacheKey = JSON.stringify(query);
  const cached = cache.get(cacheKey);
  if (cached && cached.expiresAt > Date.now()) return cached.value;

  let location;
  let useFahrenheit;
  if (query.coordinates) {
    location = { ...validateCoordinates(query.coordinates), name: 'Current location' };
    useFahrenheit = FAHRENHEIT_COUNTRIES.has(String(query.region || '').toUpperCase());
  } else {
    location = await geocode(query.location, fetchImpl);
    useFahrenheit = FAHRENHEIT_COUNTRIES.has(location.countryCode);
  }

  const params = new URLSearchParams({
    latitude: String(location.latitude),
    longitude: String(location.longitude),
    current: 'temperature_2m,weather_code',
    temperature_unit: useFahrenheit ? 'fahrenheit' : 'celsius'
  });
  const data = await requestJson(`${WEATHER_URL}?${params}`, fetchImpl);
  const temperature = data.current?.temperature_2m;
  const weatherCode = data.current?.weather_code;
  if (!Number.isFinite(temperature) || !Number.isFinite(weatherCode)) throw new Error('Current weather unavailable');

  const result = {
    temperature: Math.round(temperature),
    unit: useFahrenheit ? 'F' : 'C',
    condition: CONDITIONS[weatherCode] || 'Current conditions',
    location: location.name
  };
  cache.set(cacheKey, { value: result, expiresAt: Date.now() + 600000 });
  return result;
}

export { getWeatherData };
