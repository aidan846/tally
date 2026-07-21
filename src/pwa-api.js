(function () {
  const WEATHER_URL = 'https://api.open-meteo.com/v1/forecast';
  const GEOCODING_URL = 'https://geocoding-api.open-meteo.com/v1/search';
  const STOCK_URL = 'https://query1.finance.yahoo.com/v8/finance/chart';
  const FAHRENHEIT_COUNTRIES = new Set(['US', 'BS', 'BZ', 'KY', 'FM', 'MH', 'PW']);

  const stockAliases = { NQ: 'NQ=F', ES: 'ES=F', YM: 'YM=F', SPX: '^GSPC', '^SPX': '^GSPC', DOW: '^DJI', '^DOW': '^DJI', NASDAQ: '^IXIC', '^NASDAQ': '^IXIC' };
  const configKey = 'tally-config';
  const readConfig = () => JSON.parse(localStorage.getItem(configKey) || '{}');
  const saveConfig = value => localStorage.setItem(configKey, JSON.stringify(value));
  const request = async url => {
    const response = await fetch(url, { signal: AbortSignal.timeout(10000) });
    if (!response.ok) throw new Error(`Request failed: ${response.status}`);
    return response.json();
  };

  async function weather(query) {
    let latitude;
    let longitude;
    let name = 'Current location';
    let countryCode = '';
    if (query.coordinates) ({ latitude, longitude } = query.coordinates);
    else {
      const data = await request(`${GEOCODING_URL}?${new URLSearchParams({ name: query.location, count: '1', language: 'en', format: 'json' })}`);
      const result = data.results?.[0];
      if (!result) throw new Error('Location not found');
      ({ latitude, longitude, name, country_code: countryCode } = result);
    }
    const fahrenheit = FAHRENHEIT_COUNTRIES.has(String(query.region || countryCode).toUpperCase());
    const data = await request(`${WEATHER_URL}?${new URLSearchParams({ latitude, longitude, current: 'temperature_2m,weather_code', temperature_unit: fahrenheit ? 'fahrenheit' : 'celsius' })}`);
    const conditions = { 0: 'Clear', 1: 'Mostly clear', 2: 'Partly cloudy', 3: 'Cloudy', 45: 'Foggy', 51: 'Drizzle', 61: 'Rain', 63: 'Rain', 71: 'Snow', 73: 'Snow', 80: 'Showers', 95: 'Thunderstorms' };
    return { temperature: Math.round(data.current.temperature_2m), unit: fahrenheit ? 'F' : 'C', condition: conditions[data.current.weather_code] || 'Current conditions', location: name };
  }

  async function stock(query) {
    const references = query.operands;
    const values = await Promise.all(references.map(async reference => {
      const symbol = stockAliases[reference.symbol] || reference.symbol;
      const params = new URLSearchParams({ interval: '1d', range: '5d' });
      const data = await request(`${STOCK_URL}/${encodeURIComponent(symbol)}?${params}`);
      const result = data.chart?.result?.[0];
      const value = result?.meta?.regularMarketPrice;
      if (!Number.isFinite(value)) throw new Error('Stock price unavailable');
      return { symbol: reference.symbol, value, currency: result.meta.currency || 'USD' };
    }));
    if (query.operator === null && values.length === 1) return values[0];
    return { symbol: `${values[0].symbol}-${values[1].symbol}`, value: values[0].value - values[1].value, currency: values[0].currency };
  }

  window.electronAPI = window.electronAPI || {
    platform: 'web',
    getConfig: async () => readConfig(),
    setConfig: async next => { const value = { ...readConfig(), ...next }; saveConfig(value); return value; },
    getUnitDefinitions: async () => fetch('units.json').then(response => response.json()),
    getStockData: stock,
    getWeatherData: weather,
    requestLocationAccess: async () => true,
    showLocationSettings: async () => {},
    copyText: value => navigator.clipboard.writeText(value),
    minimizeWindow: () => {},
    toggleMaximizeWindow: async () => false,
    closeWindow: () => {}
  };
})();
