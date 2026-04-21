// ─── CONFIG ───────────────────────────────────────────────────────────────────
const config = {
  GEO_URL: 'https://geocoding-api.open-meteo.com/v1/search',
  WEATHER_URL: 'https://api.open-meteo.com/v1/forecast',
  REVERSE_GEO_URL: 'https://nominatim.openstreetmap.org/reverse',
  CACHE_TTL: 10 * 60 * 1000,
};

// ─── CACHE ────────────────────────────────────────────────────────────────────
const cache = {
  set(key, data) {
    try {
      localStorage.setItem(key, JSON.stringify({ ts: Date.now(), data }));
    } catch (e) {
      console.warn('Cache set failed:', e);
    }
  },
  get(key) {
    try {
      const raw = localStorage.getItem(key);
      if (!raw) return null;
      const { ts, data } = JSON.parse(raw);
      if (Date.now() - ts > config.CACHE_TTL) {
        localStorage.removeItem(key);
        return null;
      }
      return data;
    } catch {
      return null;
    }
  },
};

// ─── WMO CODES ────────────────────────────────────────────────────────────────
const wmoToDescription = (code, lang = 'uk') => {
  const desc = {
    0: { uk: 'ясно', en: 'clear sky' },
    1: { uk: 'переважно ясно', en: 'mainly clear' },
    2: { uk: 'мінлива хмарність', en: 'partly cloudy' },
    3: { uk: 'хмарно', en: 'overcast' },
    45: { uk: 'туман', en: 'fog' },
    48: { uk: 'туман з інеєм', en: 'icy fog' },
    51: { uk: 'мряка', en: 'light drizzle' },
    53: { uk: 'мряка', en: 'drizzle' },
    55: { uk: 'сильна мряка', en: 'heavy drizzle' },
    61: { uk: 'невеликий дощ', en: 'slight rain' },
    63: { uk: 'дощ', en: 'rain' },
    65: { uk: 'сильний дощ', en: 'heavy rain' },
    66: { uk: 'крижаний дощ', en: 'freezing rain' },
    67: { uk: 'сильний крижаний дощ', en: 'heavy freezing rain' },
    71: { uk: 'невеликий сніг', en: 'slight snow' },
    73: { uk: 'сніг', en: 'snow' },
    75: { uk: 'сильний сніг', en: 'heavy snow' },
    77: { uk: 'снігова крупа', en: 'snow grains' },
    80: { uk: 'невеликий зливовий дощ', en: 'slight showers' },
    81: { uk: 'зливовий дощ', en: 'showers' },
    82: { uk: 'сильний зливовий дощ', en: 'heavy showers' },
    85: { uk: 'снігові зливи', en: 'snow showers' },
    86: { uk: 'сильні снігові зливи', en: 'heavy snow showers' },
    95: { uk: 'гроза', en: 'thunderstorm' },
    96: { uk: 'гроза з градом', en: 'thunderstorm with hail' },
    99: { uk: 'гроза з сильним градом', en: 'thunderstorm with heavy hail' },
  };
  return desc[code]?.[lang] ?? desc[code]?.['en'] ?? 'unknown';
};

const wmoToIconCode = (code, isDay = true) => {
  const d = isDay ? 'd' : 'n';
  if (code === 0) return `01${d}`;
  if (code <= 2) return `02${d}`;
  if (code === 3) return `04${d}`;
  if (code >= 45 && code <= 48) return `50${d}`;
  if (code >= 51 && code <= 55) return `09${d}`;
  if (code >= 61 && code <= 67) return `10${d}`;
  if (code >= 71 && code <= 77) return `13${d}`;
  if (code >= 80 && code <= 82) return `10${d}`;
  if (code >= 85 && code <= 86) return `13${d}`;
  if (code >= 95 && code <= 99) return `11${d}`;
  return `03${d}`;
};

// ─── GEOCODING — город всегда на английском ───────────────────────────────────
const getCityCoords = async (city) => {
  const cacheKey = `geo_${city.toLowerCase()}`;
  const cached = cache.get(cacheKey);
  if (cached) return cached;

  const url = `${config.GEO_URL}?name=${encodeURIComponent(city)}&count=1&language=en`;
  const response = await fetch(url);
  if (!response.ok) throw new Error(`Geocoding error: ${response.status}`);

  const data = await response.json();
  if (!data.results?.length) throw new Error('City not found');

  const { latitude, longitude, name, country, timezone } = data.results[0];
  const result = { lat: latitude, lon: longitude, name, country, timezone };
  cache.set(cacheKey, result);
  return result;
};

// ─── CURRENT WEATHER ──────────────────────────────────────────────────────────
const getCurrentWeather = async (city, lang = 'uk') => {
  const cacheKey = `weather_${city.toLowerCase()}_${lang}`;
  const cached = cache.get(cacheKey);
  if (cached) return cached;

  const { lat, lon, name, country, timezone } = await getCityCoords(city);

  const params = new URLSearchParams({
    latitude: lat,
    longitude: lon,
    current: ['temperature_2m', 'apparent_temperature', 'weathercode', 'windspeed_10m', 'winddirection_10m', 'relativehumidity_2m', 'precipitation', 'surface_pressure', 'is_day'].join(','),
    daily: ['sunrise', 'sunset'].join(','),
    timezone: timezone || 'auto',
    forecast_days: 1,
  });

  const response = await fetch(`${config.WEATHER_URL}?${params}`);
  if (!response.ok) throw new Error(`Weather error: ${response.status}`);

  const raw = await response.json();
  const c = raw.current;
  const isDay = c.is_day === 1;
  const weathercode = c.weathercode;

  const normalized = {
    name,
    country,
    lat,
    lon,
    main: {
      temp: c.temperature_2m,
      feels_like: c.apparent_temperature,
      humidity: c.relativehumidity_2m,
      pressure: Math.round(c.surface_pressure),
    },
    wind: {
      speed: c.windspeed_10m / 3.6,
      deg: c.winddirection_10m,
    },
    weather: [
      {
        id: weathercode,
        description: wmoToDescription(weathercode, lang),
        icon: wmoToIconCode(weathercode, isDay),
      },
    ],
    sys: {
      sunrise: Math.floor(new Date(raw.daily.sunrise[0]).getTime() / 1000),
      sunset: Math.floor(new Date(raw.daily.sunset[0]).getTime() / 1000),
    },
    _wmo: weathercode,
    _isDay: isDay,
  };

  cache.set(cacheKey, normalized);
  return normalized;
};

// ─── FORECAST ─────────────────────────────────────────────────────────────────
const getForecast = async (city, lang = 'uk') => {
  const cacheKey = `forecast_${city.toLowerCase()}_${lang}`;
  const cached = cache.get(cacheKey);
  if (cached) return cached;

  const { lat, lon, timezone } = await getCityCoords(city);

  const params = new URLSearchParams({
    latitude: lat,
    longitude: lon,
    hourly: ['temperature_2m', 'weathercode', 'windspeed_10m'].join(','),
    daily: ['temperature_2m_max', 'temperature_2m_min', 'weathercode'].join(','),
    timezone: timezone || 'auto',
    forecast_days: 6,
  });

  const response = await fetch(`${config.WEATHER_URL}?${params}`);
  if (!response.ok) throw new Error(`Forecast error: ${response.status}`);

  const raw = await response.json();

  const list = raw.hourly.time.map((timeStr, i) => ({
    dt: new Date(timeStr).getTime() / 1000,
    dt_txt: timeStr.replace('T', ' ') + ':00',
    main: { temp: raw.hourly.temperature_2m[i] },
    weather: [
      {
        id: raw.hourly.weathercode[i],
        description: wmoToDescription(raw.hourly.weathercode[i], lang),
        icon: wmoToIconCode(raw.hourly.weathercode[i], true),
      },
    ],
    wind: { speed: raw.hourly.windspeed_10m[i] / 3.6 },
  }));

  const dailyList = raw.daily.time
    .map((dateStr, i) => [
      {
        dt: new Date(`${dateStr}T12:00:00`).getTime() / 1000,
        dt_txt: `${dateStr} 12:00:00`,
        main: { temp: raw.daily.temperature_2m_max[i] },
        weather: [
          {
            id: raw.daily.weathercode[i],
            description: wmoToDescription(raw.daily.weathercode[i], lang),
            icon: wmoToIconCode(raw.daily.weathercode[i], true),
          },
        ],
      },
      {
        dt: new Date(`${dateStr}T00:00:00`).getTime() / 1000,
        dt_txt: `${dateStr} 00:00:00`,
        main: { temp: raw.daily.temperature_2m_min[i] },
        weather: [
          {
            id: raw.daily.weathercode[i],
            description: wmoToDescription(raw.daily.weathercode[i], lang),
            icon: wmoToIconCode(raw.daily.weathercode[i], false),
          },
        ],
      },
    ])
    .flat();

  const now = Date.now() / 1000;
  const futureList = list.filter((item) => item.dt >= now);

  const normalized = { list: [...futureList, ...dailyList] };
  cache.set(cacheKey, normalized);
  return normalized;
};

// ─── REVERSE GEOCODING — всегда английский ────────────────────────────────────
const getCityByCoords = async (lat, lon) => {
  try {
    const cacheKey = `revgeo_${lat.toFixed(2)}_${lon.toFixed(2)}`;
    const cached = cache.get(cacheKey);
    if (cached) return cached;

    const response = await fetch(`${config.REVERSE_GEO_URL}?lat=${lat}&lon=${lon}&format=json&accept-language=en`, { headers: { 'Accept-Language': 'en' } });
    const data = await response.json();
    const city = data.address?.city || data.address?.town || data.address?.village || data.address?.suburb || null;
    if (city) cache.set(cacheKey, city);
    return city;
  } catch (error) {
    console.error('Reverse geocoding error:', error);
    return null;
  }
};
