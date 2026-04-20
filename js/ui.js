// ─── TRANSLATIONS ─────────────────────────────────────────────────────────────
const translations = {
  uk: {
    advice: 'Порада на день:',
    wind_speed: 'Швидкість вітру',
    wind_direction: 'Направлення вітру',
    feels_like: 'Відчувається як:',
    humidity: 'Вологість:',
    pressure: 'Тиск:',
    sunrise: 'Схід',
    sunset: 'Захід',
    placeholder: 'Введіть своє місто',
  },
  en: {
    advice: 'Tip of the day:',
    wind_speed: 'Wind speed',
    wind_direction: 'Wind direction',
    feels_like: 'Feels like:',
    humidity: 'Humidity:',
    pressure: 'Pressure:',
    sunrise: 'Sunrise',
    sunset: 'Sunset',
    placeholder: 'Enter your city',
  },
};

const renderTranslations = () => {
  const t = translations[currentLang];
  if (!t) return;

  const adviceTitle = document.querySelector('.advice__box-title');
  if (adviceTitle) adviceTitle.innerHTML = t.advice;

  const searchInputEl = document.querySelector('#searchInput');
  if (searchInputEl) searchInputEl.placeholder = t.placeholder;

  const labels = document.querySelectorAll('.stats__label');
  const keys = ['wind_speed', 'wind_direction', 'feels_like', 'humidity', 'pressure'];
  labels.forEach((label, i) => {
    if (keys[i]) label.innerText = t[keys[i]];
  });

  const sunriseElem = document.querySelector('[data-sunrise]');
  const sunsetElem = document.querySelector('[data-sunset]');

  if (currentWeatherData) {
    if (sunriseElem) sunriseElem.innerText = `${t.sunrise}: ${formatTime(currentWeatherData.sys.sunrise)}`;
    if (sunsetElem) sunsetElem.innerText = `${t.sunset}: ${formatTime(currentWeatherData.sys.sunset)}`;
    renderCityDate(currentWeatherData);
  }
};

// ─── WEATHER ICONS ────────────────────────────────────────────────────────────
const getWeatherIcon = (iconCode) => {
  const icons = {
    '01d': 'clear-day',
    '01n': 'clear-night',
    '02d': 'partly-cloudy-day',
    '02n': 'partly-cloudy-night',
    '03d': 'cloudy',
    '03n': 'cloudy',
    '04d': 'overcast-day',
    '04n': 'overcast-night',
    '09d': 'drizzle',
    '09n': 'drizzle',
    '10d': 'rain',
    '10n': 'rain',
    '11d': 'thunderstorms-day',
    '11n': 'thunderstorms-night',
    '13d': 'snow',
    '13n': 'snow',
    '50d': 'fog-day',
    '50n': 'fog-night',
  };
  const name = icons[iconCode] || 'cloudy';
  return `https://cdn.jsdelivr.net/gh/basmilius/weather-icons@dev/production/fill/svg/${name}.svg`;
};

// ─── RENDER CURRENT WEATHER ───────────────────────────────────────────────────
const renderCurrentWeather = (data) => {
  const unit = currentUnit === 'F' ? '°F' : '°C';

  const dataTemp = document.querySelector('[data-current-temp]');
  if (dataTemp) {
    const temp = currentUnit === 'F' ? toFahrenheit(data.main.temp) : Math.round(data.main.temp);
    dataTemp.innerHTML = `${temp}${unit}`;
  }

  const dataDescription = document.querySelector('[data-current-description]');
  if (dataDescription) dataDescription.innerHTML = data.weather[0].description;

  const currentIcon = document.querySelector('[data-current-icon]');
  if (currentIcon) currentIcon.src = getWeatherIcon(data.weather[0].icon);

  const dataWindSpeed = document.querySelector('[data-wind-speed]');
  if (dataWindSpeed) dataWindSpeed.innerHTML = `${Math.round(data.wind.speed)} m/s`;

  const dataWindDirection = document.querySelector('[data-wind-direction]');
  if (dataWindDirection) dataWindDirection.innerHTML = getWindDirection(data.wind.deg);

  const dataFeelsLike = document.querySelector('[data-feels-like]');
  if (dataFeelsLike) {
    const feelsLike = currentUnit === 'F' ? toFahrenheit(data.main.feels_like) : Math.round(data.main.feels_like);
    dataFeelsLike.innerHTML = `${feelsLike}${unit}`;
  }

  const dataHumidity = document.querySelector('[data-humidity]');
  if (dataHumidity) dataHumidity.innerHTML = `${data.main.humidity}%`;

  const dataPressure = document.querySelector('[data-pressure]');
  if (dataPressure) dataPressure.innerHTML = `${data.main.pressure} hPa`;
};

// ─── WIND DIRECTION ───────────────────────────────────────────────────────────
const getWindDirection = (deg) => {
  if (deg === undefined || deg === null) return '—';
  const directions = {
    uk: ['Пн', 'Пн-Сх', 'Сх', 'Пд-Сх', 'Пд', 'Пд-Зх', 'Зх', 'Пн-Зх'],
    en: ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'],
  };
  const currentDirections = directions[currentLang] || directions.uk;
  return currentDirections[Math.round(deg / 45) % 8];
};

// ─── FORMAT TIME ──────────────────────────────────────────────────────────────
const formatTime = (timestamp) => {
  const date = new Date(timestamp * 1000);
  const hours = date.getHours();
  const minutes = String(date.getMinutes()).padStart(2, '0');
  return `${hours}:${minutes}`;
};

// ─── RENDER ADVICE ────────────────────────────────────────────────────────────
const renderAdvice = (data) => {
  const adviceText = document.querySelector('[data-advice-text]');
  if (!adviceText) return;
  const category = getTipsCategory(data);
  const tip = getRandomTip(category);
  adviceText.innerHTML = currentLang === 'en' ? tip.en : tip.uk;
};

// ─── FORMAT DATE ──────────────────────────────────────────────────────────────
const formatDate = (dtTxt) => {
  // Поддерживает оба формата: '2024-04-20 12:00:00' и '2024-04-20T12:00:00'
  const dateStr = dtTxt.replace(' ', 'T');
  const date = new Date(dateStr);
  const locale = currentLang === 'en' ? 'en-GB' : 'uk-UA';
  const weekday = date.toLocaleDateString(locale, { weekday: 'short' });
  const formatted = date.toLocaleDateString(locale);
  return { weekday, formatted };
};

// ─── RENDER FORECAST ──────────────────────────────────────────────────────────
const renderForecast = (data) => {
  const dailyForecasts = data.list.filter((item) => item.dt_txt.includes('12:00:00'));
  const nightForecast = data.list.filter((item) => item.dt_txt.includes('00:00:00'));

  const container = document.querySelector('[data-forecast-container]');
  if (!container) return;
  container.innerHTML = '';

  dailyForecasts.forEach((day, index) => {
    const { weekday, formatted } = formatDate(day.dt_txt);
    const card = document.createElement('div');
    card.className = 'forecast__card';

    const dayTemp = currentUnit === 'F' ? toFahrenheit(day.main.temp) : Math.round(day.main.temp);
    const unit = currentUnit === 'F' ? '°F' : '°C';
    const nightTemp = nightForecast[index] ? (currentUnit === 'F' ? toFahrenheit(nightForecast[index].main.temp) : Math.round(nightForecast[index].main.temp)) : '--';

    card.innerHTML = `
      <h3 class="forecast__day">${weekday}</h3>
      <data class="forecast__date">${formatted}</data>
      <img class="forecast__icon" src="${getWeatherIcon(day.weather[0].icon)}" alt="${day.weather[0].description}" />
      <p class="forecast__temp-range">${dayTemp}${unit} / ${nightTemp}${unit}</p>
    `;
    container.appendChild(card);
  });
};

// ─── RENDER HOURLY ────────────────────────────────────────────────────────────
const renderHourly = (data) => {
  // Берём только из hourly (не из daily-эмуляции)
  // Отфильтруем элементы у которых dt_txt НЕ содержит '12:00:00' и '00:00:00'
  const hourlyData = data.list.filter((item) => !item.dt_txt.includes('12:00:00') && !item.dt_txt.includes('00:00:00')).slice(0, 10);

  const container = document.querySelector('[data-hourly-container]');
  if (!container) return;
  container.innerHTML = '';

  hourlyData.forEach((item) => {
    const card = document.createElement('div');
    card.className = 'hourly__card';
    const temp = currentUnit === 'F' ? toFahrenheit(item.main.temp) : Math.round(item.main.temp);
    const unit = currentUnit === 'F' ? '°F' : '°C';

    card.innerHTML = `
      <span class="hourly__time">${item.dt_txt.slice(11, 16)}</span>
      <img class="hourly__icon" src="${getWeatherIcon(item.weather[0].icon)}" alt="weather icon" />
      <span class="hourly__temp">${temp}${unit}</span>
    `;
    container.appendChild(card);
  });
};

// ─── RENDER CITY DATE ─────────────────────────────────────────────────────────
const renderCityDate = (data) => {
  const cityName = document.querySelector('[data-city-date]');
  if (!cityName) return;
  const today = new Date();
  const locale = currentLang === 'en' ? 'en-GB' : 'uk-UA';
  const formattedDate = today.toLocaleDateString(locale, { day: 'numeric', month: 'long', year: 'numeric' });
  cityName.innerHTML = `${data.name}, ${formattedDate}`;
};

// ─── SET BACKGROUND ───────────────────────────────────────────────────────────
const setBackground = (data) => {
  const month = new Date().getMonth();
  let season;
  if (month >= 2 && month <= 4) season = 'spring';
  else if (month >= 5 && month <= 7) season = 'summer';
  else if (month >= 8 && month <= 10) season = 'autumn';
  else season = 'winter';

  const isMobile = window.innerWidth <= 850;
  const imagePath = isMobile ? `images/${season}/${season}-mobile.webp` : `images/${season}/${season}.webp`;

  document.querySelector('.bg').style.backgroundImage = `url(${imagePath})`;
  document.querySelector('.advice__box').style.backgroundImage = `linear-gradient(rgba(0,0,0,0.3), rgba(0,0,0,0.3)), url(${imagePath})`;

  document.body.classList.remove('effect-rain', 'effect-snow', 'effect-storm');

  // WMO codes для эффектов
  const code = data._wmo ?? data.weather[0].id;
  if (code >= 95) document.body.classList.add('effect-storm');
  else if ((code >= 71 && code <= 77) || code === 85 || code === 86) document.body.classList.add('effect-snow');
};
