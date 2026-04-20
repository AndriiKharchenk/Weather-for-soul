if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('/service-worker.js').then((reg) => {
    reg.update();
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

// ─── TOAST ────────────────────────────────────────────────────────────────────
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

// ─── SKELETON LOADERS ─────────────────────────────────────────────────────────
const showSkeletons = () => {
  // Скрываем реальный контент
  const contentSections = document.querySelectorAll(
    '[data-current-temp], [data-current-description], [data-current-icon], ' + '[data-wind-speed], [data-wind-direction], [data-feels-like], ' + '[data-humidity], [data-pressure], [data-advice-text], [data-city-date]'
  );
  contentSections.forEach((el) => el.classList.add('skeleton-hidden'));

  // Скелетон для текущей погоды
  const tempEl = document.querySelector('[data-current-temp]');
  if (tempEl && !tempEl.querySelector('.skeleton')) {
    const sk = document.createElement('div');
    sk.className = 'skeleton skeleton--temp';
    tempEl.parentNode.insertBefore(sk, tempEl);
  }

  const descEl = document.querySelector('[data-current-description]');
  if (descEl && !descEl.previousSibling?.classList?.contains('skeleton')) {
    const sk = document.createElement('div');
    sk.className = 'skeleton skeleton--desc';
    descEl.parentNode.insertBefore(sk, descEl);
  }

  // Скелетоны для stats
  document.querySelectorAll('[data-wind-speed], [data-wind-direction], [data-feels-like], [data-humidity], [data-pressure]').forEach((el) => {
    if (!el.previousSibling?.classList?.contains('skeleton')) {
      const sk = document.createElement('div');
      sk.className = 'skeleton skeleton--stat';
      el.parentNode.insertBefore(sk, el);
    }
  });

  // Скелетон для прогноза
  const forecastContainer = document.querySelector('[data-forecast-container]');
  if (forecastContainer) {
    forecastContainer.innerHTML = '';
    for (let i = 0; i < 5; i++) {
      const card = document.createElement('div');
      card.className = 'forecast__card skeleton-card';
      card.innerHTML = `
        <div class="skeleton skeleton--day"></div>
        <div class="skeleton skeleton--date"></div>
        <div class="skeleton skeleton--icon-sm"></div>
        <div class="skeleton skeleton--temp-range"></div>
      `;
      forecastContainer.appendChild(card);
    }
  }

  // Скелетон для hourly
  const hourlyContainer = document.querySelector('[data-hourly-container]');
  if (hourlyContainer) {
    hourlyContainer.innerHTML = '';
    for (let i = 0; i < 8; i++) {
      const card = document.createElement('div');
      card.className = 'hourly__card skeleton-card';
      card.innerHTML = `
        <div class="skeleton skeleton--time"></div>
        <div class="skeleton skeleton--icon-sm"></div>
        <div class="skeleton skeleton--temp-sm"></div>
      `;
      hourlyContainer.appendChild(card);
    }
  }
};

const hideSkeletons = () => {
  // Удаляем все скелетоны
  document.querySelectorAll('.skeleton').forEach((el) => el.remove());
  // Показываем реальный контент
  document.querySelectorAll('.skeleton-hidden').forEach((el) => el.classList.remove('skeleton-hidden'));
};

// ─── MAIN LOAD ────────────────────────────────────────────────────────────────
const loadWeather = async (city) => {
  if (!city) return;

  showSkeletons();

  // Прячем preloader если он ещё виден
  const preloader = document.getElementById('preloader');

  try {
    const weatherData = await getCurrentWeather(city, currentLang);
    const forecastData = await getForecast(city, currentLang);

    localStorage.setItem('lastCity', city);

    currentWeatherData = weatherData;
    currentForecastData = forecastData;

    hideSkeletons();

    renderCurrentWeather(weatherData);
    renderAdvice(weatherData);
    renderForecast(forecastData);
    renderHourly(forecastData);
    renderCityDate(weatherData);
    setBackground(weatherData);
    renderTranslations();
  } catch (error) {
    hideSkeletons();
    const lastCity = localStorage.getItem('lastCity');
    if (lastCity && lastCity !== city) {
      showError('Місто не знайдено. Спробуй ще раз', 'City not found. Please try again');
    } else {
      showError("Не вдалося завантажити погоду. Перевір з'єднання", 'Could not load weather. Check your connection');
    }
  } finally {
    if (preloader) {
      preloader.classList.add('hidden');
      setTimeout(() => (preloader.style.display = 'none'), 500);
    }
  }
};

// ─── SEARCH ───────────────────────────────────────────────────────────────────
const handleSearch = async () => {
  const city = searchInput.value.trim();
  if (city) {
    searchInput.value = '';
    await loadWeather(city);
  }
};

searchBtn.addEventListener('click', handleSearch);

searchInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') handleSearch();
});

// ─── INIT ─────────────────────────────────────────────────────────────────────
const initApp = async () => {
  const savedCity = localStorage.getItem('lastCity');

  if (!savedCity && navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        const city = await getCityByCoords(latitude, longitude);
        loadWeather(city || 'Kremenchuk');
      },
      () => loadWeather('Kremenchuk')
    );
  } else {
    loadWeather(savedCity || 'Kremenchuk');
  }
};

initApp();

// ─── UNITS ────────────────────────────────────────────────────────────────────
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

// ─── TIPS CATEGORY (WMO-совместимая) ──────────────────────────────────────────
// Open-Meteo возвращает WMO weathercode в weather[0].id (через наш нормализатор)
const getTipsCategory = (data) => {
  const temp = data.main.temp;
  const code = data._wmo ?? data.weather[0].id;

  if (code >= 95) return 'stormy';

  if (code >= 71 && code <= 77) {
    return code === 73 || code >= 75 ? 'snowy_heavy' : 'snowy_light';
  }
  if (code === 85 || code === 86) return 'snowy_heavy';

  if (code >= 45 && code <= 48) return 'foggy';

  if ((code >= 51 && code <= 67) || (code >= 80 && code <= 82)) {
    return temp < 10 ? 'rainy_cold' : 'rainy_warm';
  }

  if (code === 0) {
    if (temp < 0) return 'sunny_winter';
    if (temp < 10) return 'sunny_cold';
    if (temp < 20) return 'sunny_warm';
    return 'sunny_hot';
  }

  if (code >= 1 && code <= 3) {
    return temp < 10 ? 'cloudy_cold' : 'cloudy_warm';
  }

  return temp < 10 ? 'sunny_cold' : 'sunny_warm';
};

const getRandomTip = (category) => {
  const categoryTips = tips[category];
  if (!categoryTips) {
    const fallback = tips['sunny_warm'];
    return fallback[Math.floor(Math.random() * fallback.length)];
  }
  return categoryTips[Math.floor(Math.random() * categoryTips.length)];
};

// ─── DONATE ───────────────────────────────────────────────────────────────────
function copyToClipboard() {
  const addr = 'TWVNFAxXpmQo2Snhz6JZpJcHdLqapgPGoE';
  navigator.clipboard.writeText(addr).then(() => {
    alert('The address has been copied');
  });
}

function toggleDonate() {
  const modal = document.getElementById('donateModal');
  modal.style.display = modal.style.display === 'none' ? 'flex' : 'none';
}
