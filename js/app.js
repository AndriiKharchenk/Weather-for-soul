if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('/service-worker.js').then((reg) => {
    reg.addEventListener('updatefound', () => {
      const newWorker = reg.installing;
      newWorker.addEventListener('statechange', () => {
        if (newWorker.state === 'activated') {
          window.location.reload();
        }
      });
    });
  });

  navigator.serviceWorker.addEventListener('controllerchange', () => {
    window.location.reload();
  });
}

let currentUnit = 'C';
let currentWeatherData = null;
let currentForecastData = null;
let currentLang = 'uk';

const searchBtn = document.getElementById('searchBtn');
const searchInput = document.getElementById('searchInput');
const celsiusBtn = document.getElementById('celsiusBtn');
const farenheitBtn = document.getElementById('farenheitBtn');
const languageSelect = document.getElementById('language');

const showError = (messageUk, messageEn) => {
  const message = currentLang === 'en' ? messageEn : messageUk;
  const existing = document.getElementById('error-toast');
  if (existing) existing.remove();

  const toast = document.createElement('div');
  toast.id = 'error-toast';
  toast.innerText = message;
  document.body.appendChild(toast);

  setTimeout(() => {
    toast.classList.add('error-toast--hide');
    setTimeout(() => toast.remove(), 400);
  }, 3000);
};

const loadWeather = async (city) => {
  if (!city) return;

  try {
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
  } catch (error) {
    const lastCity = localStorage.getItem('lastCity');
    if (lastCity && lastCity !== city) {
      showError('Місто не знайдено. Спробуй ще раз', 'City not found. Please try again');
    } else {
      showError("Не вдалося завантажити погоду. Перевір з'єднання", 'Could not load weather. Check your connection');
    }
  } finally {
    const preloader = document.getElementById('preloader');
    if (preloader) {
      setTimeout(() => {
        preloader.classList.add('hidden');
        setTimeout(() => (preloader.style.display = 'none'), 500);
      }, 1500);
    }
  }
};

const handleSearch = async () => {
  const city = searchInput.value.trim();
  if (city) {
    searchInput.value = '';
    await loadWeather(city);
  }
};

searchBtn.addEventListener('click', handleSearch);

searchInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') {
    handleSearch();
  }
});

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

const toFahrenheit = (celsius) => Math.round((celsius * 9) / 5 + 32);

celsiusBtn.addEventListener('click', () => {
  currentUnit = 'C';
  celsiusBtn.classList.add('active');
  farenheitBtn.classList.remove('active');
  if (currentWeatherData) renderCurrentWeather(currentWeatherData);
  if (currentForecastData) {
    renderForecast(currentForecastData);
    renderHourly(currentForecastData);
  }
});

farenheitBtn.addEventListener('click', () => {
  currentUnit = 'F';
  farenheitBtn.classList.add('active');
  celsiusBtn.classList.remove('active');
  if (currentWeatherData) renderCurrentWeather(currentWeatherData);
  if (currentForecastData) {
    renderForecast(currentForecastData);
    renderHourly(currentForecastData);
  }
});

languageSelect.addEventListener('change', () => {
  currentLang = languageSelect.value;
  const city = localStorage.getItem('lastCity') || 'Kremenchuk';
  loadWeather(city);
});
