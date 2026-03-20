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

const searchBtn = document.getElementById('searchBtn');
const searchInput = document.getElementById('searchInput');
const celsiusBtn = document.getElementById('celsiusBtn');
const farenheitBtn = document.getElementById('farenheitBtn');
const languageSelect = document.getElementById('language');

const loadWeather = async (city) => {
  if (!city) return;

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
  if (preloader) {
    setTimeout(() => {
      preloader.classList.add('hidden');
      setTimeout(() => (preloader.style.display = 'none'), 500);
    }, 1500);
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
