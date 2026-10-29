const weatherData = {
  "San Francisco": {
    city: "San Francisco",
    condition: "Partly Cloudy",
    icon: "⛅",
    tempC: 23,
    highC: 25,
    lowC: 17,
    sunrise: "6:28 AM",
    wind: 12,
    humidity: 63,
    rain: 14,
    date: "Tue, 12 Sep",
    hourly: [
      { time: "Now", icon: "⛅", tempC: 23 },
      { time: "1PM", icon: "🌤️", tempC: 24 },
      { time: "2PM", icon: "⛅", tempC: 25 },
      { time: "3PM", icon: "🌤️", tempC: 25 },
      { time: "4PM", icon: "🌦️", tempC: 23 },
      { time: "5PM", icon: "🌧️", tempC: 21 }
    ],
    daily: [
      { day: "Tue", icon: "⛅", highC: 25, lowC: 17, level: 69 },
      { day: "Wed", icon: "🌤️", highC: 26, lowC: 18, level: 73 },
      { day: "Thu", icon: "🌦️", highC: 23, lowC: 16, level: 55 },
      { day: "Fri", icon: "🌧️", highC: 21, lowC: 15, level: 44 },
      { day: "Sat", icon: "☀️", highC: 27, lowC: 18, level: 78 },
      { day: "Sun", icon: "⛅", highC: 24, lowC: 17, level: 62 }
    ]
  },
  "New York": {
    city: "New York",
    condition: "Sunny",
    icon: "☀️",
    tempC: 28,
    highC: 30,
    lowC: 22,
    sunrise: "6:42 AM",
    wind: 16,
    humidity: 52,
    rain: 8,
    date: "Tue, 12 Sep",
    hourly: [
      { time: "Now", icon: "☀️", tempC: 28 },
      { time: "1PM", icon: "🌤️", tempC: 29 },
      { time: "2PM", icon: "☀️", tempC: 30 },
      { time: "3PM", icon: "☀️", tempC: 31 },
      { time: "4PM", icon: "🌤️", tempC: 29 },
      { time: "5PM", icon: "⛅", tempC: 27 }
    ],
    daily: [
      { day: "Tue", icon: "☀️", highC: 30, lowC: 22, level: 81 },
      { day: "Wed", icon: "🌤️", highC: 31, lowC: 23, level: 79 },
      { day: "Thu", icon: "☀️", highC: 32, lowC: 24, level: 84 },
      { day: "Fri", icon: "⛅", highC: 29, lowC: 22, level: 72 },
      { day: "Sat", icon: "🌦️", highC: 27, lowC: 21, level: 58 },
      { day: "Sun", icon: "🌧️", highC: 25, lowC: 20, level: 47 }
    ]
  },
  Tokyo: {
    city: "Tokyo",
    condition: "Rain Showers",
    icon: "🌧️",
    tempC: 21,
    highC: 24,
    lowC: 19,
    sunrise: "4:53 AM",
    wind: 14,
    humidity: 81,
    rain: 64,
    date: "Tue, 12 Sep",
    hourly: [
      { time: "Now", icon: "🌧️", tempC: 21 },
      { time: "1PM", icon: "🌦️", tempC: 22 },
      { time: "2PM", icon: "🌧️", tempC: 21 },
      { time: "3PM", icon: "🌦️", tempC: 20 },
      { time: "4PM", icon: "🌧️", tempC: 19 },
      { time: "5PM", icon: "🌧️", tempC: 18 }
    ],
    daily: [
      { day: "Tue", icon: "🌧️", highC: 24, lowC: 19, level: 64 },
      { day: "Wed", icon: "🌦️", highC: 23, lowC: 18, level: 58 },
      { day: "Thu", icon: "🌧️", highC: 22, lowC: 18, level: 66 },
      { day: "Fri", icon: "☀️", highC: 25, lowC: 19, level: 76 },
      { day: "Sat", icon: "🌤️", highC: 27, lowC: 20, level: 81 },
      { day: "Sun", icon: "☀️", highC: 28, lowC: 21, level: 84 }
    ]
  },
  Paris: {
    city: "Paris",
    condition: "Cloudy",
    icon: "☁️",
    tempC: 19,
    highC: 21,
    lowC: 14,
    sunrise: "7:16 AM",
    wind: 9,
    humidity: 71,
    rain: 28,
    date: "Tue, 12 Sep",
    hourly: [
      { time: "Now", icon: "☁️", tempC: 19 },
      { time: "1PM", icon: "🌤️", tempC: 20 },
      { time: "2PM", icon: "☁️", tempC: 20 },
      { time: "3PM", icon: "⛅", tempC: 19 },
      { time: "4PM", icon: "☁️", tempC: 18 },
      { time: "5PM", icon: "🌧️", tempC: 17 }
    ],
    daily: [
      { day: "Tue", icon: "☁️", highC: 21, lowC: 14, level: 56 },
      { day: "Wed", icon: "🌦️", highC: 20, lowC: 13, level: 49 },
      { day: "Thu", icon: "☁️", highC: 19, lowC: 12, level: 52 },
      { day: "Fri", icon: "🌧️", highC: 18, lowC: 11, level: 41 },
      { day: "Sat", icon: "🌤️", highC: 22, lowC: 13, level: 71 },
      { day: "Sun", icon: "☀️", highC: 24, lowC: 15, level: 82 }
    ]
  }
};

let currentCity = "San Francisco";
let unit = "C";

const tempValue = document.getElementById("tempValue");
const highTemp = document.getElementById("highTemp");
const lowTemp = document.getElementById("lowTemp");
const locationName = document.getElementById("locationName");
const weatherCondition = document.getElementById("weatherCondition");
const hourlyForecast = document.getElementById("hourlyForecast");
const dailyForecast = document.getElementById("dailyForecast");
const citySearch = document.getElementById("citySearch");
const sunriseValue = document.getElementById("sunriseValue");
const windValue = document.getElementById("windValue");
const humidityValue = document.getElementById("humidityValue");
const rainValue = document.getElementById("rainValue");

function convertTemp(valueC) {
  return unit === "C" ? valueC : (valueC * 9) / 5 + 32;
}

function formatTemp(valueC) {
  const converted = convertTemp(valueC);
  return `${Math.round(converted)}°`;
}

function renderHourly(data) {
  hourlyForecast.innerHTML = data.hourly
    .map(
      (item) => `
        <div class="hour-card">
          <span class="time">${item.time}</span>
          <span class="icon">${item.icon}</span>
          <span class="temp">${formatTemp(item.tempC)}</span>
        </div>
      `
    )
    .join("");
}

function renderDaily(data) {
  dailyForecast.innerHTML = data.daily
    .map(
      (day) => `
        <div class="forecast-item">
          <span class="forecast-day">${day.day}</span>
          <span class="forecast-icon">${day.icon}</span>
          <div class="forecast-bar" style="--level:${day.level}%">
            <span></span>
          </div>
          <span class="forecast-temp">${formatTemp(day.highC)} / ${formatTemp(day.lowC)}</span>
        </div>
      `
    )
    .join("");
}

function renderWeather() {
  const data = weatherData[currentCity];
  if (!data) return;

  tempValue.textContent = formatTemp(data.tempC);
  highTemp.textContent = formatTemp(data.highC);
  lowTemp.textContent = formatTemp(data.lowC);
  locationName.textContent = data.city;
  weatherCondition.textContent = data.condition;
  sunriseValue.textContent = data.sunrise;
  windValue.textContent = `${data.wind} km/h`;
  humidityValue.textContent = `${data.humidity}%`;
  rainValue.textContent = `${data.rain}%`;

  const app = document.querySelector(".weather-app");
  const conditions = data.condition.toLowerCase();

  if (conditions.includes("sun") || conditions.includes("clear")) {
    app.style.background = "linear-gradient(180deg, rgba(66, 111, 182, 0.95), rgba(8, 20, 35, 0.96))";
  } else if (conditions.includes("rain") || conditions.includes("cloud")) {
    app.style.background = "linear-gradient(180deg, rgba(43, 67, 94, 0.96), rgba(11, 21, 31, 0.98))";
  } else {
    app.style.background = "linear-gradient(180deg, rgba(29, 73, 122, 0.96), rgba(8, 17, 31, 0.96))";
  }

  renderHourly(data);
  renderDaily(data);
}

function setUnit(nextUnit) {
  unit = nextUnit;
  document.querySelectorAll(".unit").forEach((button) => {
    button.classList.toggle("active", button.dataset.unit === nextUnit);
  });
  renderWeather();
}

citySearch.addEventListener("keydown", (event) => {
  if (event.key !== "Enter") return;

  const input = citySearch.value.trim();
  const match = Object.keys(weatherData).find(
    (city) => city.toLowerCase() === input.toLowerCase()
  );

  if (match) {
    currentCity = match;
    renderWeather();
  } else if (input) {
    citySearch.value = currentCity;
  }
});

citySearch.addEventListener("focus", () => {
  citySearch.select();
});

document.querySelectorAll(".unit").forEach((button) => {
  button.addEventListener("click", () => setUnit(button.dataset.unit));
});

renderWeather();
