# WeatherVerse

A responsive global weather website with a React frontend and Express backend, using real Open-Meteo weather and geocoding APIs.

## Features

- Live weather data
- Search for cities, countries, towns, and villages
- Search suggestions with keyboard support
- Current location support using browser geolocation
- Celsius/Fahrenheit and km/h/mph toggles
- Hourly and 7-day weather forecasts
- Animated weather backgrounds that react to current conditions
- Saved favorite locations
- Responsive mobile-first layout

## Tech stack

- Frontend: React + TypeScript + Vite
- Backend: Node.js + Express + TypeScript
- Data providers: Open-Meteo Geocoding and Forecast APIs

## Quick start

1. Install dependencies:

   ```bash
   cd backend && npm install
   cd ../frontend && npm install
   ```

2. Copy the environment file:

   ```bash
   cp .env.example .env
   ```

3. Start the backend and frontend:

   ```bash
   cd backend && npm run dev
   ```

   In another terminal:

   ```bash
   cd frontend && npm run dev -- --host 0.0.0.0
   ```

4. Open the frontend in a browser:

   http://localhost:5173

## Production build

```bash
cd backend && npm run build
cd ../frontend && npm run build
```

## Environment variables

See [.env.example](.env.example).

## Notes

- The frontend expects the backend at http://localhost:3001.
- Weather is fetched from Open-Meteo, so internet access is required for live data.
