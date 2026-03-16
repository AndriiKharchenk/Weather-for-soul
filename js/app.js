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

// 2. ГЛОБАЛЬНЫЕ ПЕРЕМЕННЫЕ СОСТОЯНИЯ
let currentUnit = 'C';
let currentWeatherData = null;
let currentForecastData = null;
let currentLang = 'uk'; // По умолчанию украинский

// 3. ИНИЦИАЛИЗАЦИЯ ПЕРЕМЕННЫХ ИНТЕРФЕЙСА (Строго в начале!)
const searchBtn = document.getElementById('searchBtn');
const searchInput = document.getElementById('searchInput');
const searchHint = document.getElementById('searchHint');
const celsiusBtn = document.getElementById('celsiusBtn');
const farenheitBtn = document.getElementById('farenheitBtn');
const languageSelect = document.getElementById('language');

// 4. ОСНОВНАЯ ФУНКЦИЯ ЗАГРУЗКИ ПОГОДЫ
const loadWeather = async (city) => {
  const weatherData = await getCurrentWeather(city, currentLang);
  const forecastData = await getForecast(city, currentLang);
  localStorage.setItem('lastCity', city);

  currentWeatherData = weatherData;
  currentForecastData = forecastData;

  // Рендеринг всех блоков
  renderCurrentWeather(weatherData);
  renderAdvice(weatherData);
  renderForecast(forecastData);
  renderHourly(forecastData);
  renderCityDate(weatherData);
  setBackground(weatherData);
  renderTranslations();

  // Прелоадер
  const preloader = document.getElementById('preloader');
  if (preloader) {
    setTimeout(() => {
      preloader.classList.add('hidden');
      setTimeout(() => (preloader.style.display = 'none'), 500);
    }, 1500);
  }
};

// 5. ИНИЦИАЛИЗАЦИЯ ПРИЛОЖЕНИЯ (Геолокация или Кременчуг)
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

// 6. ЛОГИКА «ПРИЗРАЧНОЙ» ПОДСКАЗКИ
searchInput.addEventListener('input', async (e) => {
  const query = e.target.value;

  if (query.length >= 3) {
    const cities = await getCitySuggestions(query.trim());

    if (cities && cities.length > 0) {
      // Ищем локализованное имя (UA/EN) или берем дефолтное
      const cityObj = cities[0];
      const topCity = cityObj.local_names && cityObj.local_names[currentLang] ? cityObj.local_names[currentLang] : cityObj.name;

      // Если ввод совпадает с началом названия города
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

// 7. ОБРАБОТКА КЛАВИШ (Enter и Tab для автозаполнения)
searchInput.addEventListener('keydown', (e) => {
  if ((e.key === 'Enter' || e.key === 'Tab') && searchHint.textContent) {
    // Если есть подсказка — заполняем её
    if (searchInput.value.toLowerCase() !== searchHint.textContent.toLowerCase()) {
      e.preventDefault();
      searchInput.value = searchHint.textContent;
      searchHint.textContent = '';
      loadWeather(searchInput.value);
    }
  } else if (e.key === 'Enter' && !searchHint.textContent) {
    // Если подсказки нет — просто ищем то, что ввели
    const city = searchInput.value.trim();
    if (city) loadWeather(city);
  }
});

// 8. КЛИК ПО КНОПКЕ ПОИСКА (ЛУПА)
searchBtn.addEventListener('click', () => {
  const city = searchInput.value.trim();
  if (city) {
    searchHint.textContent = '';
    loadWeather(city);
  }
});

// 9. ПЕРЕКЛЮЧЕНИЕ ЕДИНИЦ ИЗМЕРЕНИЯ (C / F)
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

// 10. ПЕРЕКЛЮЧЕНИЕ ЯЗЫКА
languageSelect.addEventListener('change', () => {
  currentLang = languageSelect.value;
  const city = localStorage.getItem('lastCity') || 'Kremenchuk';
  loadWeather(city);
});
