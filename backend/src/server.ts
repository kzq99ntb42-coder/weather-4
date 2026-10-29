import express from 'express';
import cors from 'cors';
import { config } from './config.js';
import { weatherCodeMap } from './weatherMap.js';
import { validateCoords } from './utils.js';

type SearchResponse = {
  suggestions: {
    id: string;
    name: string;
    admin1?: string;
    country?: string;
    latitude: number;
    longitude: number;
    timezone?: string;
    countryCode?: string;
    flag?: string;
  }[];
};

const app = express();

app.use(cors({ origin: config.frontendUrl, credentials: true }));
app.use(express.json());

const weatherHeaders = {
  Accept: 'application/json',
  'Content-Type': 'application/json',
};

const fetchJson = async <T>(url: string): Promise<T> => {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), config.timeoutMs);

  try {
    const response = await fetch(url, {
      headers: weatherHeaders,
      signal: controller.signal,
    });

    if (!response.ok) {
      throw new Error(`Weather API error: ${response.status}`);
    }

    return (await response.json()) as T;
  } finally {
    clearTimeout(timeout);
  }
};

app.get('/api/health', (_req, res) => {
  res.json({ ok: true, message: 'WeatherVerse backend is running' });
});

app.get('/api/weather', async (req, res) => {
  const { latitude, longitude } = req.query;
  const valid = validateCoords(
    typeof latitude === 'string' ? latitude : undefined,
    typeof longitude === 'string' ? longitude : undefined
  );

  if (!valid.ok) {
    return res.status(400).json({ error: valid.error });
  }

  try {
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${valid.latitude}&longitude=${valid.longitude}&current=temperature_2m,apparent_temperature,relative_humidity_2m,weather_code,wind_speed_10m,wind_direction_10m,pressure_msl,cloud_cover,visibility,is_day&hourly=temperature_2m,precipitation_probability,weather_code,precipitation&daily=weather_code,temperature_2m_max,temperature_2m_min,sunrise,sunset,precipitation_probability_max,precipitation_sum&timezone=auto&forecast_days=7`;
    const weather = await fetchJson<{
      current: any;
      hourly: any;
      daily: any;
      timezone: string;
      latitude: number;
      longitude: number;
      utc_offset_seconds?: number;
    }>(url);

    const currentTimeKey = String(weather.current.time || '').replace(/Z$/, '');
    const hourly = weather.hourly.time
      .map((time: string, index: number) => ({
        time: String(time || '').replace(/Z$/, ''),
        temperature: weather.hourly.temperature_2m[index],
        precipitationProbability: weather.hourly.precipitation_probability[index],
        precipitation: weather.hourly.precipitation[index],
        weatherCode: weather.hourly.weather_code[index],
      }))
      .filter((entry: { time: string }) => entry.time >= currentTimeKey)
      .slice(0, 24);

    const daily = weather.daily.time.slice(0, 7).map((time: string, index: number) => ({
      date: time,
      weatherCode: weather.daily.weather_code[index],
      high: weather.daily.temperature_2m_max[index],
      low: weather.daily.temperature_2m_min[index],
      sunrise: weather.daily.sunrise[index],
      sunset: weather.daily.sunset[index],
      precipitationProb: weather.daily.precipitation_probability_max[index],
      precipitation: weather.daily.precipitation_sum[index],
    }));

    const currentWeatherCode = weather.current.weather_code;
    const currentMeta = weatherCodeMap[currentWeatherCode] ?? {
      label: 'Weather',
      icon: '🌤️',
      theme: 'cloudy',
    };

    res.json({
      latitude: weather.latitude,
      longitude: weather.longitude,
      timezone: weather.timezone,
      utcOffsetSeconds: weather.utc_offset_seconds ?? 0,
      current: {
        temperature: weather.current.temperature_2m,
        feelsLike: weather.current.apparent_temperature,
        humidity: weather.current.relative_humidity_2m,
        windSpeed: weather.current.wind_speed_10m,
        windDirection: weather.current.wind_direction_10m,
        pressure: weather.current.pressure_msl,
        cloudCover: weather.current.cloud_cover,
        visibility: weather.current.visibility,
        weatherCode: weather.current.weather_code,
        weatherLabel: currentMeta.label,
        weatherIcon: currentMeta.icon,
        theme: currentMeta.theme,
        isDay: weather.current.is_day === 1,
        time: weather.current.time,
      },
      hourly,
      daily,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to fetch weather data';
    return res.status(502).json({ error: message });
  }
});

app.get('/api/forecast', async (req, res) => {
  const { latitude, longitude } = req.query;
  const valid = validateCoords(
    typeof latitude === 'string' ? latitude : undefined,
    typeof longitude === 'string' ? longitude : undefined
  );

  if (!valid.ok) {
    return res.status(400).json({ error: valid.error });
  }

  try {
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${valid.latitude}&longitude=${valid.longitude}&current=temperature_2m,apparent_temperature,relative_humidity_2m,weather_code,wind_speed_10m,wind_direction_10m,pressure_msl,cloud_cover,visibility,is_day&hourly=temperature_2m,precipitation_probability,weather_code,precipitation&daily=weather_code,temperature_2m_max,temperature_2m_min,sunrise,sunset,precipitation_probability_max,precipitation_sum&timezone=auto&forecast_days=7`;
    const weather = await fetchJson<any>(url);
    return res.json(weather);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to fetch forecast data';
    return res.status(502).json({ error: message });
  }
});

app.get('/api/search', async (req, res) => {
  const query = typeof req.query.q === 'string' ? req.query.q.trim() : '';

  if (!query || query.length < 2) {
    return res.json({ suggestions: [] } satisfies SearchResponse);
  }

  try {
    const url = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(query)}&count=8&language=en&format=json`;
    const data = await fetchJson<{ results?: Array<any> }>(url);

    const suggestions = (data.results ?? [])
      .filter((item) => item && Number.isFinite(item.latitude) && Number.isFinite(item.longitude))
      .map((item) => ({
        id: `${item.latitude}:${item.longitude}:${item.name}:${item.country || 'unknown'}`,
        name: item.name,
        admin1: item.admin1,
        country: item.country,
        latitude: item.latitude,
        longitude: item.longitude,
        timezone: item.timezone,
        countryCode: item.country_code,
        flag: item.country_code ? `🌍` : undefined,
      }))
      .filter((item, index, arr) => arr.findIndex((entry) => entry.id === item.id) === index);

    return res.json({ suggestions } satisfies SearchResponse);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Search failed';
    return res.status(502).json({ error: message });
  }
});

app.listen(config.port, () => {
  console.log(`WeatherVerse backend running on http://localhost:${config.port}`);
});
