export type WeatherCodeMap = {
  [key: number]: {
    label: string;
    icon: string;
    theme: string;
  };
};

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

export interface WeatherApiResponse {
  current: {
    temperature_2m: number;
    apparent_temperature: number;
    relative_humidity_2m: number;
    weather_code: number;
    wind_speed_10m: number;
    wind_direction_10m: number;
    pressure_msl: number;
    cloud_cover: number;
    visibility: number;
    is_day: number;
    time: string;
  };
  hourly: {
    time: string[];
    temperature_2m: number[];
    precipitation_probability: number[];
    weather_code: number[];
    precipitation: number[];
  };
  daily: {
    time: string[];
    weather_code: number[];
    temperature_2m_max: number[];
    temperature_2m_min: number[];
    sunrise: string[];
    sunset: string[];
    precipitation_probability_max: number[];
    precipitation_sum: number[];
  };
  timezone: string;
  timezone_abbreviation: string;
  latitude: number;
  longitude: number;
  generationtime_ms: number;
}
