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



const searchBtn = document.getElementById('searchBtn');
const searchInput = document.getElementById('searchInput');
const suggestionsBox = document.getElementById('suggestions');

searchInput.addEventListener('input', async (e) => {
  const query = e.target.value.trim();
  if (query.length >= 3) {
    const cities = await getCitySuggestions(query);
    renderSuggestions(cities);
  } else {
    suggestionsBox.style.display = 'none';
  }
});

// Клик мимо подсказок
document.addEventListener('click', (e) => {
  if (suggestionsBox && !suggestionsBox.contains(e.target) && e.target !== searchInput) {
    suggestionsBox.style.display = 'none';
  }
});

// Клик по лупе
searchBtn.addEventListener('click', () => {
  const city = searchInput.value.trim();
  if (city) loadWeather(city);
});

// Enter в инпуте
searchInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') {
    const city = searchInput.value.trim();
    if (city) loadWeather(city);
    suggestionsBox.style.display = 'none'; // Закрываем при поиске
  }
});

// --- 3. ОСТАЛЬНЫЕ ФУНКЦИИ И КНОПКИ ---

const renderSuggestions = (cities) => {
  suggestionsBox.innerHTML = '';
  if (!cities || cities.length === 0) {
    suggestionsBox.style.display = 'none';
    return;
  }

  cities.forEach((city) => {
    const div = document.createElement('div');
    div.className = 'suggestions__item';
    const cityName = city.local_names?.[currentLang] || city.name;
    div.textContent = `${city.name}${city.state ? ', ' + city.state : ''} [${city.country}]`;

    div.addEventListener('click', () => {
      searchInput.value = city.name;
      suggestionsBox.style.display = 'none';
      loadWeather(city.name);
    });

    suggestionsBox.appendChild(div);
  });

  suggestionsBox.style.display = 'flex';
};





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
