if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('/service-worker.js').then((reg) => {
    reg.addEventListener('updatefound', () => {
      const newWorker = reg.installing;
      newWorker.addEventListener('statechange', () => {
        if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
          window.location.reload();
        }
      });
    });
  });
}

let currentUnit = 'C';
let currentWeatherData = null;
let currentForecastData = null;
let currentLang = 'uk';

// --- Инициализация переменных интерфейса ---
const searchBtn = document.getElementById('searchBtn');
const searchInput = document.getElementById('searchInput');
const searchHint = document.getElementById('searchHint'); // ДОБАВИЛИ ЭТУ СТРОКУ

const loadWeather = async (city) => {
  const weatherData = await getCurrentWeather(city, currentLang);
  const forecastData = await getForecast(city, currentLang);
  localStorage.setItem('lastCity', city);

  currentWeatherData = weatherData;
  currentForecastData = forecastData;

  renderCurrentWeather(weatherData);
  renderAdvice(weatherData);
  renderForecast(forecastData);
  renderHourly(forecastData);
  renderCityDate(weatherData);
  setBackground(weatherData);
  renderTranslations();

  const preloader = document.getElementById('preloader');
  setTimeout(() => {
    preloader.classList.add('hidden');
    setTimeout(() => (preloader.style.display = 'none'), 500);
  }, 2000);
};

const initApp = async () => {
  const savedCity = localStorage.getItem('lastCity');
  if (!savedCity && navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        const city = await getCityByCoords(latitude, longitude);
        loadWeather(city || 'Kremenchuk');
      },
      () => {
        loadWeather('Kremenchuk');
      }
    );
  } else {
    loadWeather(savedCity || 'Kremenchuk');
  }
};

initApp();

// --- Логика ПРИЗРАЧНОЙ подсказки ---
searchInput.addEventListener('input', async (e) => {
  const query = e.target.value;

  if (query.length >= 3) {
    const cities = await getCitySuggestions(query.trim());

    if (cities && cities.length > 0) {
      const topCity = cities[0].local_names?.[currentLang] || cities[0].name;

      if (topCity.toLowerCase().startsWith(query.toLowerCase())) {
        const hintSuffix = topCity.substring(query.length);
        searchHint.textContent = query + hintSuffix;
      } else {
        searchHint.textContent = '';
      }
    } else {
      searchHint.textContent = '';
    }
  } else {
    searchHint.textContent = '';
  }
});

// Заполнение по нажатию Enter или Tab
searchInput.addEventListener('keydown', (e) => {
  if ((e.key === 'Enter' || e.key === 'Tab') && searchHint.textContent) {
    if (searchInput.value.toLowerCase() !== searchHint.textContent.toLowerCase()) {
      e.preventDefault();
      searchInput.value = searchHint.textContent;
      searchHint.textContent = '';
      loadWeather(searchInput.value);
    }
  } else if (e.key === 'Enter' && !searchHint.textContent) {
    // Если подсказки нет, просто ищем то, что введено
    const city = searchInput.value.trim();
    if (city) loadWeather(city);
  }
});

// Клик по лупе
searchBtn.addEventListener('click', () => {
  const city = searchInput.value.trim();
  if (city) loadWeather(city);
});

// --- Переключение единиц измерения ---
const toFahrenheit = (celsius) => Math.round((celsius * 9) / 5 + 32);
const celsiusBtn = document.getElementById('celsiusBtn');
const farenheitBtn = document.getElementById('farenheitBtn');

celsiusBtn.addEventListener('click', () => {
  currentUnit = 'C';
  celsiusBtn.classList.add('active');
  farenheitBtn.classList.remove('active');
  renderCurrentWeather(currentWeatherData);
  renderForecast(currentForecastData);
  renderHourly(currentForecastData);
});

farenheitBtn.addEventListener('click', () => {
  currentUnit = 'F';
  farenheitBtn.classList.add('active');
  celsiusBtn.classList.remove('active');
  renderCurrentWeather(currentWeatherData);
  renderForecast(currentForecastData);
  renderHourly(currentForecastData);
});

// --- Переключение языка ---
const languageSelect = document.getElementById('language');
languageSelect.addEventListener('change', () => {
  currentLang = languageSelect.value;
  const city = localStorage.getItem('lastCity') || 'Kremenchuk';
  loadWeather(city);
});
