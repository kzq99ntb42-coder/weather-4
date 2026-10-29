import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { MapContainer, Marker, TileLayer } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import './styles.css';
import type { SearchSuggestion, WeatherData } from './types';

const API_BASE = 'http://localhost:3001';
const MAPBOX_TOKEN = (import.meta.env.VITE_MAPBOX_TOKEN || '').trim();
const MAP_TILE_URL = MAPBOX_TOKEN
  ? `https://api.mapbox.com/styles/v1/mapbox/satellite-streets-v12/tiles/256/{z}/{x}/{y}@2x?access_token=${MAPBOX_TOKEN}`
  : 'https://mt1.google.com/vt/lyrs=s,h&x={x}&y={y}&z={z}';

const LABEL_TILE_URL = MAPBOX_TOKEN ? null : null;

type Unit = 'C' | 'F';
type SpeedUnit = 'km/h' | 'mph';

const liveMapIcon = L.divIcon({
  className: 'map-pin-icon',
  html: '<span></span>',
  iconSize: [18, 18],
  iconAnchor: [9, 18],
  popupAnchor: [0, -18],
});

type WeatherState = {
  weather: WeatherData | null;
  query: string;
  suggestions: SearchSuggestion[];
  isLoading: boolean;
  error: string;
  searchLoading: boolean;
};

const DEFAULT_LOCATION = {
  name: 'Tokyo',
  latitude: 35.6762,
  longitude: 139.6503,
};

const formatNumber = (value: number | undefined, digits = 0) => {
  if (typeof value !== 'number' || Number.isNaN(value)) return '—';
  return new Intl.NumberFormat('en-US', {
    maximumFractionDigits: digits,
    minimumFractionDigits: digits,
  }).format(value);
};

const parseApiLocalDate = (value: string, utcOffsetSeconds = 0) => {
  if (!value) {
    return new Date(NaN);
  }

  const normalized = value.endsWith('Z') ? value : `${value}Z`;
  const timestamp = Date.parse(normalized);
  if (Number.isNaN(timestamp)) {
    return new Date(NaN);
  }

  return new Date(timestamp - (utcOffsetSeconds || 0) * 1000);
};

const formatWeatherDateTime = (value: string | Date, timeZone?: string, utcOffsetSeconds = 0) => {
  const date = value instanceof Date ? value : parseApiLocalDate(value, utcOffsetSeconds);
  if (Number.isNaN(date.getTime())) {
    return '—';
  }

  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: timeZone || undefined,
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });

  return formatter.format(date);
};

const formatLocationTimeOnly = (value: string | Date, timeZone?: string, utcOffsetSeconds = 0) => {
  const date = value instanceof Date ? value : parseApiLocalDate(value, utcOffsetSeconds);
  if (Number.isNaN(date.getTime())) {
    return '—';
  }

  return new Intl.DateTimeFormat('en-US', {
    timeZone: timeZone || undefined,
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
};

const resolveLocationLabel = async (latitude: number, longitude: number, fallback?: string) => {
  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=jsonv2&zoom=10&accept-language=en`,
      {
        headers: {
          'Accept-Language': 'en',
        },
      }
    );

    if (!response.ok) {
      return fallback || 'Current location';
    }

    const payload = await response.json();
    const address = payload?.address || {};
    const cityName = address.city || address.town || address.village || address.municipality || address.county || address.state || 'Current location';
    const countryName = address.country || '';

    if (countryName && cityName !== countryName) {
      return `${cityName}, ${countryName}`;
    }

    return cityName;
  } catch {
    return fallback || 'Current location';
  }
};

const convertTemperature = (value: number, unit: Unit) => {
  if (unit === 'F') {
    return (value * 9) / 5 + 32;
  }
  return value;
};

const convertSpeed = (value: number, speedUnit: SpeedUnit) => {
  if (speedUnit === 'mph') {
    return value * 0.621371;
  }
  return value;
};

const formatTemperature = (value: number, unit: Unit) => `${Math.round(convertTemperature(value, unit))}°`;
const formatSpeed = (value: number, unit: SpeedUnit) => `${Math.round(convertSpeed(value, unit))} ${unit}`;

const getWeatherCardTheme = (weather: WeatherData | null) => {
  if (!weather) return 'sunny';
  return weather.current.theme || 'sunny';
};

const weatherIconMap: Record<string, string> = {
  clear: '☀️',
  sunny: '☀️',
  cloudy: '⛅',
  rainy: '🌧️',
  storm: '⛈️',
  snowy: '❄️',
  foggy: '🌫️',
};

const getDayLabel = (dateValue: string, timeZone?: string, utcOffsetSeconds = 0) =>
  new Intl.DateTimeFormat('en-US', {
    timeZone: timeZone || undefined,
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  }).format(parseApiLocalDate(dateValue, utcOffsetSeconds));

const getHourLabel = (dateValue: string, timeZone?: string, utcOffsetSeconds = 0) =>
  new Intl.DateTimeFormat('en-US', {
    timeZone: timeZone || undefined,
    hour: 'numeric',
  }).format(parseApiLocalDate(dateValue, utcOffsetSeconds));

function App() {
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [query, setQuery] = useState(DEFAULT_LOCATION.name);
  const [suggestions, setSuggestions] = useState<SearchSuggestion[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchLoading, setSearchLoading] = useState(false);
  const [error, setError] = useState('');
  const [unit, setUnit] = useState<Unit>('C');
  const [speedUnit, setSpeedUnit] = useState<SpeedUnit>('km/h');
  const [activeLocation, setActiveLocation] = useState<string>(DEFAULT_LOCATION.name);
  const [lastUpdated, setLastUpdated] = useState<string>('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [liveNow, setLiveNow] = useState(() => new Date());
  const searchRef = useRef<HTMLDivElement | null>(null);

  const theme = useMemo(() => getWeatherCardTheme(weather), [weather]);
  const locationTimeZone = weather?.timezone || 'UTC';
  const locationUtcOffsetSeconds = weather?.utcOffsetSeconds ?? 0;
  const isNight = weather ? !weather.current.isDay : false;

  useEffect(() => {
    if (!weather?.timezone) {
      return;
    }

    const updateClock = () => setLiveNow(new Date());
    updateClock();

    const timerId = window.setInterval(updateClock, 60000);
    return () => window.clearInterval(timerId);
  }, [weather?.timezone]);

  const fetchWeather = useCallback(async (latitude: number, longitude: number, label?: string) => {
    setIsLoading(true);
    setError('');

    try {
      const url = `${API_BASE}/api/weather?latitude=${latitude}&longitude=${longitude}`;
      const response = await fetch(url);

      if (!response.ok) {
        const payload = await response.json().catch(() => ({ error: 'Unable to fetch weather data.' }));
        throw new Error(payload.error || 'Unable to fetch weather data.');
      }

      const data: WeatherData = await response.json();
      setWeather(data);

      const resolvedLabel = label || (await resolveLocationLabel(data.latitude, data.longitude, data.timezone || 'Current location'));
      setActiveLocation(resolvedLabel);
      setLastUpdated(formatLocationTimeOnly(new Date(), data.timezone || 'UTC', data.utcOffsetSeconds ?? 0));
      setQuery(resolvedLabel);
    } catch (loadError) {
      const message = loadError instanceof Error ? loadError.message : 'Unexpected weather error.';
      setError(message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    const initial = DEFAULT_LOCATION;
    fetchWeather(initial.latitude, initial.longitude, initial.name);
  }, [fetchWeather]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    const trimmed = query.trim();
    if (trimmed.length < 2) {
      setSuggestions([]);
      return;
    }

    const timeoutId = window.setTimeout(async () => {
      try {
        setSearchLoading(true);
        const response = await fetch(`${API_BASE}/api/search?q=${encodeURIComponent(trimmed)}`);
        if (!response.ok) {
          throw new Error('Search failed');
        }

        const payload = await response.json();
        setSuggestions(Array.isArray(payload.suggestions) ? payload.suggestions : []);
        setShowSuggestions(true);
      } catch {
        setSuggestions([]);
      } finally {
        setSearchLoading(false);
      }
    }, 250);

    return () => window.clearTimeout(timeoutId);
  }, [query]);

  const handleSearchSubmit = async (value?: string) => {
    const nextLocation = (value ?? query).trim();
    if (!nextLocation) return;

    const selected = suggestions.find(
      (item) => item.name.toLowerCase() === nextLocation.toLowerCase() || item.name.toLowerCase().includes(nextLocation.toLowerCase())
    );

    if (selected) {
      setQuery(selected.name);
      setShowSuggestions(false);
      fetchWeather(selected.latitude, selected.longitude, selected.name);
      return;
    }

    const fallback = suggestions[0];
    if (fallback) {
      setQuery(fallback.name);
      setShowSuggestions(false);
      fetchWeather(fallback.latitude, fallback.longitude, fallback.name);
      return;
    }

    setError('No matching location found. Try a broader city or country name.');
  };

  const handleUseMyLocation = () => {
    if (!navigator.geolocation) {
      setError('Your browser does not support geolocation.');
      return;
    }

    setError('Allow location access to use your current position.');

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const { latitude, longitude } = position.coords;
          const response = await fetch(`${API_BASE}/api/weather?latitude=${latitude}&longitude=${longitude}`);
          if (!response.ok) {
            throw new Error('Could not load weather for your current location.');
          }

          const data: WeatherData = await response.json();
          setWeather(data);

          const resolvedLocation = await resolveLocationLabel(data.latitude, data.longitude, 'My Location');
          setActiveLocation(resolvedLocation);
          setQuery(resolvedLocation);
          setError('');
          setLastUpdated(formatLocationTimeOnly(new Date(), data.timezone || 'UTC', data.utcOffsetSeconds ?? 0));
        } catch (geoError) {
          setError(geoError instanceof Error ? geoError.message : 'Location weather failed.');
        }
      },
      (geoError) => {
        if (geoError.code === 1) {
          setError('Location access was denied. You can still search for a city manually.');
          return;
        }

        setError('Location is unavailable right now. You can still search for a city manually.');
      },
      { enableHighAccuracy: true, timeout: 15000 }
    );
  };

  const activePosition = useMemo(() => {
    if (!weather) {
      return [DEFAULT_LOCATION.latitude, DEFAULT_LOCATION.longitude] as [number, number];
    }

    return [weather.latitude, weather.longitude] as [number, number];
  }, [weather]);

  const refreshWeather = () => {
    if (!weather) {
      fetchWeather(DEFAULT_LOCATION.latitude, DEFAULT_LOCATION.longitude, DEFAULT_LOCATION.name);
      return;
    }

    fetchWeather(weather.latitude, weather.longitude, activeLocation || 'Current location');
  };

  return (
    <div className={`app-shell theme-${theme} ${isNight ? 'night' : 'day'}`}>
      <div className={`weather-scene weather-scene--${theme}`}>
        <div className="sun-glow" />
        <div className="moon-glow" />
        <div className="cloud cloud-one" />
        <div className="cloud cloud-two" />
        <div className="cloud cloud-three" />
        <div className="rain-layer">
          <span />
          <span />
          <span />
          <span />
          <span />
          <span />
          <span />
          <span />
          <span />
          <span />
        </div>
        <div className="snow-layer">
          <span />
          <span />
          <span />
          <span />
          <span />
          <span />
          <span />
          <span />
          <span />
          <span />
        </div>
        <div className="fog-layer fog-one" />
        <div className="fog-layer fog-two" />
        <div className="lightning" />
      </div>

      <div className="app-card">
        <header className="topbar">
          <div className="brand-wrap">
            <span className="brand-mark">W</span>
            <div>
              <p className="eyebrow">WeatherVerse</p>
              <h1>Forecast</h1>
            </div>
          </div>
          <button className="ghost-button" onClick={refreshWeather} type="button">
            Refresh
          </button>
        </header>

        <div className="search-panel" ref={searchRef}>
          <input
            aria-label="Search any location"
            value={query}
            placeholder="Search city, country, town..."
            onChange={(event) => {
              setQuery(event.target.value);
              setShowSuggestions(true);
            }}
            onKeyDown={(event) => {
              if (event.key === 'Enter') {
                event.preventDefault();
                handleSearchSubmit();
              }
              if (event.key === 'Escape') {
                setShowSuggestions(false);
              }
            }}
            onFocus={() => setShowSuggestions(true)}
          />

          <button className="primary-button" type="button" onClick={() => handleSearchSubmit()}>
            Search
          </button>

          <button className="icon-button" type="button" onClick={handleUseMyLocation} aria-label="Use my location">
            📍
          </button>

          {showSuggestions && (searchLoading || suggestions.length > 0) && (
            <div className="suggestions">
              {searchLoading ? (
                <div className="suggestion-loading">Searching locations...</div>
              ) : (
                suggestions.map((suggestion) => (
                  <button
                    type="button"
                    key={suggestion.id}
                    className="suggestion-item"
                    onClick={() => {
                      setQuery(suggestion.name);
                      setShowSuggestions(false);
                      fetchWeather(suggestion.latitude, suggestion.longitude, suggestion.name);
                    }}
                  >
                    <span className="suggestion-flag">{suggestion.flag || '📍'}</span>
                    <span className="suggestion-copy">
                      <strong>{suggestion.name}</strong>
                      <small>{suggestion.admin1 || suggestion.country || 'Location'}</small>
                    </span>
                    <span className="suggestion-country">{suggestion.country || suggestion.countryCode || ''}</span>
                  </button>
                ))
              )}
            </div>
          )}
        </div>

        {error && <div className="error-banner">{error}</div>}

        {isLoading || !weather ? (
          <div className="loading-panel">
            <div className="skeleton hero-skeleton" />
            <div className="skeleton line-skeleton" />
            <div className="skeleton line-skeleton small" />
            <div className="skeleton card-skeleton" />
          </div>
        ) : (
          <>
            <section className="hero-panel">
              <div className="hero-copy">
                <div className="location-row">
                  <span className="location-name">{activeLocation}</span>
                </div>
                <div className="weather-headline">
                  <span className="weather-icon">{weather.current.weatherIcon}</span>
                  <div>
                    <p className="weather-condition">{weather.current.weatherLabel}</p>
                    <span className="local-time">{formatWeatherDateTime(liveNow, locationTimeZone, locationUtcOffsetSeconds)}</span>
                  </div>
                </div>
              </div>

              <div className="temperature-wrap">
                <div className="temp-block">
                  <span className="temperature">{formatTemperature(weather.current.temperature, unit)}</span>
                  <span className="feels-like">Feels like {formatTemperature(weather.current.feelsLike, unit)}</span>
                </div>

                <div className="unit-toggle">
                  <button className={unit === 'C' ? 'active' : ''} type="button" onClick={() => setUnit('C')}>
                    °C
                  </button>
                  <button className={unit === 'F' ? 'active' : ''} type="button" onClick={() => setUnit('F')}>
                    °F
                  </button>
                </div>
              </div>
            </section>

            <section className="stats-grid">
              <div className="stat-card">
                <span>Humidity</span>
                <strong>{weather.current.humidity}%</strong>
              </div>
              <div className="stat-card">
                <span>Wind</span>
                <strong>{formatSpeed(weather.current.windSpeed, speedUnit)}</strong>
              </div>
              <div className="stat-card">
                <span>Pressure</span>
                <strong>{Math.round(weather.current.pressure)} hPa</strong>
              </div>
              <div className="stat-card">
                <span>Visibility</span>
                <strong>{Math.round(weather.current.visibility / 1000)} km</strong>
              </div>
            </section>

            <section className="panel-block">
              <div className="section-header">
                <h2>Hourly forecast</h2>
                <div className="segmented-control">
                  <button className={speedUnit === 'km/h' ? 'active' : ''} type="button" onClick={() => setSpeedUnit('km/h')}>
                    km/h
                  </button>
                  <button className={speedUnit === 'mph' ? 'active' : ''} type="button" onClick={() => setSpeedUnit('mph')}>
                    mph
                  </button>
                </div>
              </div>

              <div className="hourly-row" aria-label="24-hour forecast timeline">
                {weather.hourly.map((hour, index) => {
                  const isNow = index === 0;
                  const displayTemperature = isNow ? weather.current.temperature : hour.temperature;
                  const displayWeatherIcon = isNow ? weather.current.weatherIcon : weatherCodeMapLabel(hour.weatherCode);
                  const displayRainLabel = isNow
                    ? `${weather.current.humidity}% humidity`
                    : `${hour.precipitationProbability}% rain`;

                  return (
                    <div className="hour-card" key={`${hour.time}-${index}`}>
                      <span>{isNow ? 'Now' : getHourLabel(hour.time, locationTimeZone, locationUtcOffsetSeconds)}</span>
                      <strong>{displayWeatherIcon}</strong>
                      <em>{formatTemperature(displayTemperature, unit)}</em>
                      <small>{displayRainLabel}</small>
                    </div>
                  );
                })}
              </div>
            </section>

            <section className="panel-block">
              <div className="section-header">
                <h2>7-day forecast</h2>
              </div>

              <div className="daily-list">
                {weather.daily.map((day) => (
                  <div className="day-row" key={day.date}>
                    <span className="weekday">{getDayLabel(day.date, locationTimeZone, locationUtcOffsetSeconds)}</span>
                    <span className="day-icon">{weatherCodeMapLabel(day.weatherCode)}</span>
                    <div className="bar-track">
                      <span style={{ width: `${Math.min(day.precipitationProb, 100)}%` }} />
                    </div>
                    <div className="day-temp">
                      <strong>{formatTemperature(day.high, unit)}</strong>
                      <span>{formatTemperature(day.low, unit)}</span>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            <section className="two-column">
              <div className="panel-block compact">
                <div className="section-header">
                  <h2>Sunrise & sunset</h2>
                </div>
                <div className="sunrise-block">
                  <div>
                    <span>Sunrise</span>
                    <strong>{weather.daily[0]?.sunrise ? new Date(weather.daily[0].sunrise).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', timeZone: locationTimeZone }) : '—'}</strong>
                  </div>
                  <div>
                    <span>Sunset</span>
                    <strong>{weather.daily[0]?.sunset ? new Date(weather.daily[0].sunset).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', timeZone: locationTimeZone }) : '—'}</strong>
                  </div>
                </div>
              </div>

              <div className="panel-block compact">
                <div className="section-header">
                  <h2>Live map</h2>
                </div>
                <div className="mini-map-copy">
                  <span>{activeLocation}</span>
                  <strong>{formatNumber(weather.latitude, 2)}° / {formatNumber(weather.longitude, 2)}°</strong>
                </div>
              </div>
            </section>

            <section className="panel-block map-panel">
              <div className="section-header">
                <h2>Map view</h2>
                <span className="meta-pill">Updated {lastUpdated || 'Now'}</span>
              </div>
              <div className="map-card" aria-label={`Map for ${activeLocation}`}>
                <MapContainer
                  center={activePosition}
                  zoom={9}
                  scrollWheelZoom={false}
                  zoomSnap={0.5}
                  minZoom={3}
                  maxZoom={18}
                  attributionControl={false}
                  className="map-instance"
                >
                  <TileLayer
                    url={MAP_TILE_URL}
                    maxZoom={19}
                    detectRetina
                  />
                  {LABEL_TILE_URL && (
                    <TileLayer
                      url={LABEL_TILE_URL}
                      maxZoom={20}
                      opacity={1}
                      subdomains="abcd"
                      detectRetina
                    />
                  )}
                  <Marker position={activePosition} icon={liveMapIcon} />
                </MapContainer>
                <div className="map-location-label">{activeLocation}</div>
                <div className="map-coords">
                  Lat {formatNumber(weather.latitude, 2)} · Lon {formatNumber(weather.longitude, 2)}
                </div>
              </div>
            </section>
          </>
        )}
      </div>
    </div>
  );
}

function weatherCodeMapLabel(code: number): string {
  const map: Record<number, string> = {
    0: '☀️',
    1: '🌤️',
    2: '⛅',
    3: '☁️',
    45: '🌫️',
    48: '🌫️',
    51: '🌦️',
    53: '🌦️',
    55: '🌧️',
    56: '🌧️',
    57: '🌧️',
    61: '🌦️',
    63: '🌧️',
    65: '🌧️',
    66: '🌧️',
    67: '🌧️',
    71: '❄️',
    73: '❄️',
    75: '❄️',
    77: '❄️',
    80: '🌦️',
    81: '🌧️',
    82: '⛈️',
    85: '❄️',
    86: '❄️',
    95: '⛈️',
    96: '⛈️',
    99: '⛈️',
  };

  return map[code] || '🌤️';
}

export default App;
