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
    if(!t) return;

  const adviceTitle = document.querySelector('.advice__box-title');
  if (adviceTitle) adviceTitle.innerHTML = t.advice;

  const searchInput = document.querySelector('#searchInput');
  if (searchInput) searchInput.placeholder = t.placeholder;


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

const renderCurrentWeather = (data) => {
  const dataTemp = document.querySelector('[data-current-temp]');
  const temp = currentUnit === 'F' ? toFahrenheit(data.main.temp) : Math.round(data.main.temp);
  const unit = currentUnit === 'F' ? '°F' : '°C';
  dataTemp.innerHTML = `${temp}${unit}`;

  const dataDescription = document.querySelector('[data-current-description]');
  dataDescription.innerHTML = `${data.weather[0].description}`;

  const currentIcon = document.querySelector('[data-current-icon]');
  currentIcon.src = getWeatherIcon(data.weather[0].icon);

  const dataWindSpeed = document.querySelector('[data-wind-speed]');
  dataWindSpeed.innerHTML = `${Math.round(data.wind.speed)} m/s`;

  const dataWindDirection = document.querySelector('[data-wind-direction]');
  dataWindDirection.innerHTML = getWindDirection(data.wind.deg);

  const dataFeelsLike = document.querySelector('[data-feels-like]');
  const feelsLike = currentUnit === 'F' ? toFahrenheit(data.main.feels_like) : Math.round(data.main.feels_like);
  dataFeelsLike.innerHTML = `${feelsLike}${unit}`;

  const dataHumidity = document.querySelector('[data-humidity]');
  dataHumidity.innerHTML = `${data.main.humidity}%`;

  const dataPressure = document.querySelector('[data-pressure]');
  dataPressure.innerHTML = `${data.main.pressure} hPa`;
};

const getWindDirection = (deg) => {
  const directions = {
    uk: ['Пн', 'Пн-Сх', 'Сх', 'Пд-Сх', 'Пд', 'Пд-Зх', 'Зх', 'Пн-Зх'],
    en: ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'],
  };
  const currentDirections = directions[currentLang] || directions.uk;

  return currentDirections[Math.round(deg / 45) % 8];
};

const formatTime = (timestamp) => {
  const date = new Date(timestamp * 1000);
  const hours = date.getHours();
  const minutes = date.getMinutes();

  const currentMinutes = String(minutes).padStart(2, '0');

  return `${hours}:${currentMinutes}`;
};

const renderAdvice = (data) => {
  const adviceText = document.querySelector('[data-advice-text]');
  const category = getTipsCategory(data);
  const tip = getRandomTip(category);
  adviceText.innerHTML = currentLang === 'en' ? tip.en : tip.uk;


};

const formatDate = (dtTxt) => {
  const date = new Date(dtTxt);
  const locale = currentLang === 'en' ? 'en-GB' : 'uk-UA';
  const weekday = date.toLocaleDateString(locale, { weekday: 'short' });
  const formatted = date.toLocaleDateString(locale);

  return { weekday, formatted };
};

const renderForecast = (data) => {
  const dailyForecasts = data.list.filter((item) => item.dt_txt.includes('12:00:00'));
  const nightForecast = data.list.filter((item) => item.dt_txt.includes('00:00:00'));

  const container = document.querySelector('[data-forecast-container]');
  container.innerHTML = '';

  dailyForecasts.forEach((day, index) => {
    const { weekday, formatted } = formatDate(day.dt_txt);
    const card = document.createElement('div');
    card.className = 'forecast__card';

    card.innerHTML = `<h3 class="forecast__day">${weekday}</h3>
  <data class="forecast__date">${formatted}</data>
  <img class="forecast__icon" src="${getWeatherIcon(day.weather[0].icon)}" />
  <p class="forecast__temp-range">
  ${currentUnit === 'F' ? toFahrenheit(day.main.temp) : Math.round(day.main.temp)}${currentUnit === 'F' ? '°F' : '°C'} / 
  ${nightForecast[index] ? (currentUnit === 'F' ? toFahrenheit(nightForecast[index].main.temp) : Math.round(nightForecast[index].main.temp)) : '--'}${currentUnit === 'F' ? '°F' : '°C'}
</p>`;

    container.appendChild(card);
  });
};

const renderHourly = (data) => {
  const hourlyData = data.list.slice(0, 10);

  const container = document.querySelector('[data-hourly-container]');
  container.innerHTML = '';

  hourlyData.forEach((day) => {
    const card = document.createElement('div');
    card.className = 'hourly__card';

    card.innerHTML = `
  <span class="hourly__time">${formatTime(day.dt)}</span>
  <img class="hourly__icon" src="${getWeatherIcon(day.weather[0].icon)}" alt="weather icon" />
  <span class="hourly__temp">${currentUnit === 'F' ? toFahrenheit(day.main.temp) : Math.round(day.main.temp)}${currentUnit === 'F' ? '°F' : '°C'}</span>
   `;

    container.appendChild(card);
  });
};

const renderCityDate = (data) => {
  const cityName = document.querySelector('[data-city-date]');
  const today = new Date();
  const locale = currentLang === 'en' ? 'en-GB' : 'uk-UA';
  const formattedDate = today.toLocaleDateString(locale, { day: 'numeric', month: 'long', year: 'numeric' });
  cityName.innerHTML = `${data.name}, ${formattedDate}`;
};


const setBackground = (data) => {
  const month = new Date().getMonth();
  let season;

  if (month >= 2 && month <= 4) season = 'spring';
  else if (month >= 5 && month <= 7) season = 'summer';
  else if (month >= 8 && month <= 10) season = 'autumn';
  else season = 'winter';

  const weatherId = data.weather[0].id;
  let condition;

  if (weatherId === 800) condition = 'clear';
  else if (weatherId >= 200 && weatherId <= 232) condition = 'storm';
  else if (weatherId >= 500 && weatherId <= 531) condition = 'rain';
  else if (weatherId >= 600 && weatherId <= 622) condition = 'snow';
  else condition = 'clear';

  const imagePath = `images/${season}/${season}-${condition}.webp`;

  document.querySelector('.bg').style.backgroundImage = `url(${imagePath})`;
  document.querySelector('.advice__box').style.backgroundImage = `linear-gradient(rgba(0,0,0,0.4), rgba(0,0,0,0.4)), url(${imagePath})`;
};

const getTipsCategory = (data) => {
  const temp = data.main.temp;
  const weatherId = data.weather[0].id;

  if (weatherId >= 200 && weatherId <= 232) return 'stormy';
  if (weatherId >= 600 && weatherId <= 622) return 'snowy';
  if (weatherId === 741) return 'foggy';

  if (weatherId >= 500 && weatherId <= 531) {
    return temp < 10 ? 'rainy_cold' : 'rainy_warm';
  }

  if (weatherId >= 700 && weatherId <= 781) return 'foggy';

  if (weatherId === 800) {
    if (temp < 0) return 'sunny_winter';
    if (temp < 10) return 'sunny_cold';
    if (temp < 20) return 'sunny_warm';
    return 'sunny_hot';
  }

  if (temp < 10) return 'cloudy_cold';
  return 'cloudy_warm';
};

const getRandomTip = (category) => {
  const categoryTips = tips[category];
  if (!categoryTips) return tips['sunny_warm'][0];
  const randomIndex = Math.floor(Math.random() * categoryTips.length);
  return categoryTips[randomIndex];
};
