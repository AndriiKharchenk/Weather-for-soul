const getCurrentWeather = async (city, lang = 'uk') => {

  const url = `${config.BASE_URL}/weather?q=${city}&appid=${config.API_KEY}&units=${config.UNITS}&lang=${lang}`;
  const response = await fetch(url);

  if(!response.ok) {
    throw new Error (`Помилка, не хвилюйся, зараз все виправимо: ${response.status}`)
  }

  const data = await response.json();
  return data;

};


const getForecast = async (city, lang = 'uk') => {

  const url = `${config.BASE_URL}/forecast?q=${city}&appid=${config.API_KEY}&units=${config.UNITS}&lang=${lang}`;
  const response = await fetch(url);

  if(!response.ok) {
    throw new Error (`Опа, якийсь баг, зараз виправимо: ${response.status}`)
  }

  const data = await response.json();
  return data;
};