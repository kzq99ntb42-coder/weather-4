export type WeatherTheme = 'sunny' | 'cloudy' | 'rainy' | 'storm' | 'snowy' | 'foggy';

export interface SearchSuggestion {
  id: string;
  name: string;
  admin1?: string;
  country?: string;
  latitude: number;
  longitude: number;
  timezone?: string;
  countryCode?: string;
  flag?: string;
}

export interface HourlyForecastItem {
  time: string;
  temperature: number;
  precipitationProbability: number;
  precipitation: number;
  weatherCode: number;
}

export interface DailyForecastItem {
  date: string;
  weatherCode: number;
  high: number;
  low: number;
  sunrise: string;
  sunset: string;
  precipitationProb: number;
  precipitation: number;
}

export interface WeatherData {
  latitude: number;
  longitude: number;
  timezone: string;
  utcOffsetSeconds?: number;
  current: {
    temperature: number;
    feelsLike: number;
    humidity: number;
    windSpeed: number;
    windDirection: number;
    pressure: number;
    cloudCover: number;
    visibility: number;
    weatherCode: number;
    weatherLabel: string;
    weatherIcon: string;
    theme: WeatherTheme;
    isDay: boolean;
    time: string;
  };
  hourly: HourlyForecastItem[];
  daily: DailyForecastItem[];
}
