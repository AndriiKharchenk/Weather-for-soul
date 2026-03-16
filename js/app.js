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

const lastCity = localStorage.getItem('lastCity') || 'Kremenchuk';
loadWeather(lastCity);

const searchBtn = document.getElementById('searchBtn');
const searchInput = document.getElementById('searchInput');

searchBtn.addEventListener('click', () => {
  const city = searchInput.value.trim();
  if (city) {
    loadWeather(city);
  }
});

searchInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') {
    const city = searchInput.value.trim();
    if (city) {
      loadWeather(city);
    }
  }
});

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

const languageSelect = document.getElementById('language');

languageSelect.addEventListener('change', () => {
  currentLang = languageSelect.value;
  const city = localStorage.getItem('lastCity') || 'Kremenchuk';
  loadWeather(city);
});
