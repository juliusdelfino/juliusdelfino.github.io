/**
 * Weather Dashboard tool.
 * Provides a city-based weather search using the Open-Meteo API with current
 * conditions and a 5-hour forecast strip.
 * @module tool-weather
 */

/** Human-readable labels for WMO weather-interpretation codes. */
const WEATHER_LABELS = {
  0: 'Clear sky', 1: 'Mainly clear', 2: 'Partly cloudy', 3: 'Overcast',
  45: 'Foggy', 48: 'Depositing rime fog',
  51: 'Light drizzle', 53: 'Moderate drizzle', 55: 'Dense drizzle',
  61: 'Slight rain', 63: 'Moderate rain', 65: 'Heavy rain',
  71: 'Slight snow', 73: 'Moderate snow', 75: 'Heavy snow',
  80: 'Slight rain showers', 81: 'Moderate rain showers', 82: 'Violent rain showers',
  95: 'Thunderstorm', 96: 'Thunderstorm with slight hail', 99: 'Thunderstorm with heavy hail'
};

/**
 * Return the human-readable label for a WMO weather code.
 * @param {number} code - WMO weather-interpretation code.
 * @returns {string} Descriptive label or "Unknown".
 */
function weatherLabel(code) {
  return WEATHER_LABELS[code] || 'Unknown';
}

/**
 * Returns the HTML string for the Weather Dashboard tool panel.
 * @returns {string} HTML markup.
 */
export function createWeatherTool() {
  return `
<div id="weather-tool">
  <div style="display:flex;gap:8px;margin-bottom:16px">
    <input type="text" id="weather-input" placeholder="Enter city name" style="flex:1;padding:8px 12px;border:1px solid rgba(255,255,255,0.2);border-radius:8px;background:rgba(255,255,255,0.08);color:inherit;font-size:1rem" />
    <button id="weather-btn" style="padding:8px 18px;border:none;border-radius:8px;background:rgba(99,102,241,0.7);color:#fff;cursor:pointer;font-size:1rem">Search</button>
  </div>
  <div id="weather-loading" style="display:none;text-align:center;padding:24px;opacity:0.7">Loading...</div>
  <div id="weather-error" style="display:none;text-align:center;padding:24px;color:#f87171"></div>
  <div id="weather-result" style="display:none">
    <div style="text-align:center;margin-bottom:12px">
      <div id="weather-city" style="font-size:1.4rem;font-weight:600"></div>
      <div id="weather-temp" style="font-size:2.4rem;font-weight:700;margin:4px 0"></div>
      <div id="weather-condition" style="opacity:0.8"></div>
      <div id="weather-wind" style="opacity:0.7;font-size:0.9rem;margin-top:4px"></div>
    </div>
    <div id="weather-hourly" style="display:flex;gap:8px;justify-content:center;margin-top:16px;overflow-x:auto"></div>
  </div>
</div>`;
}

/**
 * Attach event listeners for the Weather Dashboard.
 * Must be called after the tool HTML has been inserted into the DOM.
 */
export function initWeather() {
  const input = document.getElementById('weather-input');
  const btn = document.getElementById('weather-btn');
  if (!input || !btn) return;

  const loading = document.getElementById('weather-loading');
  const error = document.getElementById('weather-error');
  const result = document.getElementById('weather-result');

  async function search() {
    const city = input.value.trim();
    if (!city) return;

    loading.style.display = '';
    error.style.display = 'none';
    result.style.display = 'none';

    try {
      const geoRes = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(city)}&count=1`);
      const geoData = await geoRes.json();
      if (!geoData.results || geoData.results.length === 0) throw new Error('City not found');

      const { latitude, longitude, name } = geoData.results[0];
      const wxRes = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current_weather=true&hourly=temperature_2m,weathercode&timezone=auto`);
      const wxData = await wxRes.json();
      const cw = wxData.current_weather;

      document.getElementById('weather-city').textContent = name;
      document.getElementById('weather-temp').textContent = `${cw.temperature}\u00B0C`;
      document.getElementById('weather-condition').textContent = weatherLabel(cw.weathercode);
      document.getElementById('weather-wind').textContent = `Wind: ${cw.windspeed} km/h`;

      const hourlyContainer = document.getElementById('weather-hourly');
      hourlyContainer.innerHTML = '';
      const times = wxData.hourly.time;
      const temps = wxData.hourly.temperature_2m;
      const codes = wxData.hourly.weathercode;

      // Find the current hour index
      const nowISO = cw.time;
      let startIdx = times.findIndex(t => t >= nowISO);
      if (startIdx < 0) startIdx = 0;

      for (let i = startIdx; i < startIdx + 5 && i < times.length; i++) {
        const hour = new Date(times[i]).getHours().toString().padStart(2, '0') + ':00';
        hourlyContainer.innerHTML += `
          <div style="text-align:center;padding:8px 10px;border-radius:8px;background:rgba(255,255,255,0.06);min-width:58px">
            <div style="font-size:0.8rem;opacity:0.7">${hour}</div>
            <div style="font-size:1.1rem;font-weight:600;margin:4px 0">${temps[i]}\u00B0</div>
            <div style="font-size:0.7rem;opacity:0.6">${weatherLabel(codes[i])}</div>
          </div>`;
      }

      loading.style.display = 'none';
      result.style.display = '';
    } catch (err) {
      loading.style.display = 'none';
      error.style.display = '';
      error.textContent = err.message || 'Failed to fetch weather data';
    }
  }

  btn.addEventListener('click', search);
  input.addEventListener('keydown', (e) => { if (e.key === 'Enter') search(); });
}
