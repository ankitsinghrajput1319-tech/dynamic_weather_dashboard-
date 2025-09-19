// ===== WEATHER DASHBOARD CONFIGURATION =====
const CONFIG = {
    API_KEY: 'ce9fc02bb8e885f88eabaa0033872d01', // Replace with your OpenWeatherMap API key
    BASE_URL: 'https://api.openweathermap.org/data/2.5',
    UNITS: 'metric',
    LANG: 'en'
};

// ===== WEATHER ICONS MAPPING =====
const WEATHER_ICONS = {
    '01d': '☀️', '01n': '🌙', '02d': '⛅', '02n': '☁️',
    '03d': '☁️', '03n': '☁️', '04d': '☁️', '04n': '☁️',
    '09d': '🌧️', '09n': '🌧️', '10d': '🌦️', '10n': '🌧️',
    '11d': '⛈️', '11n': '⛈️', '13d': '❄️', '13n': '❄️',
    '50d': '🌫️', '50n': '🌫️'
};

// ===== GLOBAL VARIABLES =====
let weatherMap = null;
let currentWeatherData = null;
let userLocation = null;

// ===== DOM ELEMENTS =====
const elements = {
    cityInput: document.getElementById('cityInput'),
    loadingEl: document.getElementById('loading'),
    errorEl: document.getElementById('error'),
    weatherMainEl: document.getElementById('weatherMain'),
    mapCardEl: document.getElementById('mapCard'),
    metricsCardEl: document.getElementById('metricsCard'),
    forecastSectionEl: document.getElementById('forecastSection')
};

// ===== INITIALIZATION =====
document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
    setupEventListeners();
});

function initializeApp() {
    // Add entrance animations
    setTimeout(() => {
        document.querySelector('.header').classList.add('animate-fade-in');
        document.querySelector('.search-section').classList.add('animate-slide-in');
    }, 100);

    // Try to get user's location
    getCurrentLocation();
}

function setupEventListeners() {
    // Search input enter key
    elements.cityInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            searchWeather();
        }
    });

    // Add input focus effects
    elements.cityInput.addEventListener('focus', function() {
        this.parentElement.style.transform = 'scale(1.02)';
    });

    elements.cityInput.addEventListener('blur', function() {
        this.parentElement.style.transform = 'scale(1)';
    });
}

// ===== LOADING AND ERROR HANDLING =====
function showLoading() {
    elements.loadingEl.classList.remove('hidden');
    elements.errorEl.classList.add('hidden');
    hideWeatherData();
}

function hideLoading() {
    elements.loadingEl.classList.add('hidden');
}

function showError(message) {
    elements.errorEl.textContent = message;
    elements.errorEl.classList.remove('hidden');
    hideLoading();
    hideWeatherData();
}

function hideWeatherData() {
    elements.weatherMainEl.classList.add('hidden');
    elements.mapCardEl.classList.add('hidden');
    elements.metricsCardEl.classList.add('hidden');
    elements.forecastSectionEl.classList.add('hidden');
}

function showWeatherData() {
    // Show with staggered animations
    setTimeout(() => elements.weatherMainEl.classList.remove('hidden'), 100);
    setTimeout(() => elements.mapCardEl.classList.remove('hidden'), 200);
    setTimeout(() => elements.metricsCardEl.classList.remove('hidden'), 300);
    setTimeout(() => elements.forecastSectionEl.classList.remove('hidden'), 400);

    // Add animation classes
    elements.weatherMainEl.classList.add('animate-fade-in');
    elements.mapCardEl.classList.add('animate-slide-in');
    elements.metricsCardEl.classList.add('animate-fade-in');
}

// ===== GEOLOCATION =====
function getCurrentLocation() {
    if (navigator.geolocation) {
        showLoading();
        navigator.geolocation.getCurrentPosition(
            position => {
                userLocation = {
                    lat: position.coords.latitude,
                    lon: position.coords.longitude
                };
                getWeatherByCoords(userLocation.lat, userLocation.lon);
            },
            error => {
                hideLoading();
                console.log('Geolocation error:', error);
                showError('Unable to access location. Please search for a city manually.');
            },
            { timeout: 10000, enableHighAccuracy: true }
        );
    } else {
        showError('Geolocation is not supported by this browser.');
    }
}

// ===== WEATHER API CALLS =====
async function searchWeather() {
    const city = elements.cityInput.value.trim();
    if (!city) {
        showError('Please enter a distinguished location name.');
        return;
    }

    showLoading();
    try {
        await getWeatherByCity(city);
    } catch (error) {
        showError('Unable to find the specified location. Please verify and try again.');
    }
}

async function getWeatherByCity(city) {
    try {
        const currentResponse = await fetch(
            `${CONFIG.BASE_URL}/weather?q=${city}&appid=${CONFIG.API_KEY}&units=${CONFIG.UNITS}&lang=${CONFIG.LANG}`
        );
        
        if (!currentResponse.ok) {
            throw new Error(`HTTP error! status: ${currentResponse.status}`);
        }

        const currentData = await currentResponse.json();
        userLocation = { lat: currentData.coord.lat, lon: currentData.coord.lon };
        
        await fetchAllWeatherData(currentData);
        
    } catch (error) {
        console.error('Weather API Error:', error);
        throw error;
    }
}

async function getWeatherByCoords(lat, lon) {
    try {
        const currentResponse = await fetch(
            `${CONFIG.BASE_URL}/weather?lat=${lat}&lon=${lon}&appid=${CONFIG.API_KEY}&units=${CONFIG.UNITS}&lang=${CONFIG.LANG}`
        );

        if (!currentResponse.ok) {
            throw new Error(`HTTP error! status: ${currentResponse.status}`);
        }

        const currentData = await currentResponse.json();
        await fetchAllWeatherData(currentData);
        
    } catch (error) {
        console.error('Weather API Error:', error);
        showError('Unable to retrieve weather data. Please try again.');
    }
}

async function fetchAllWeatherData(currentData) {
    try {
        const lat = currentData.coord.lat;
        const lon = currentData.coord.lon;

        // Fetch forecast data
        const forecastResponse = await fetch(
            `${CONFIG.BASE_URL}/forecast?lat=${lat}&lon=${lon}&appid=${CONFIG.API_KEY}&units=${CONFIG.UNITS}&lang=${CONFIG.LANG}`
        );

        if (!forecastResponse.ok) {
            throw new Error('Forecast data unavailable');
        }

        const forecastData = await forecastResponse.json();
        
        // Store current weather data globally
        currentWeatherData = currentData;
        
        // Display all weather information
        displayCurrentWeather(currentData);
        displayForecast(forecastData);
        displayAdvancedMetrics(currentData);
        initializeMap(lat, lon, currentData);
        
        hideLoading();
        showWeatherData();
        
    } catch (error) {
        console.error('Error fetching weather data:', error);
        showError('Unable to retrieve complete weather information.');
    }
}

// ===== WEATHER DISPLAY FUNCTIONS =====
function displayCurrentWeather(data) {
    const {
        name, sys: { country, sunrise, sunset },
        coord: { lat, lon },
        main: { temp, feels_like, humidity, pressure },
        weather: [{ description, icon }],
        wind: { speed },
        visibility
    } = data;

    // Location and date
    document.getElementById('locationName').textContent = `${name}, ${country}`;
    document.getElementById('currentDate').textContent = formatCurrentDate();
    document.getElementById('coordinates').textContent = `${lat.toFixed(2)}°, ${lon.toFixed(2)}°`;

    // Main weather display
    document.getElementById('temperature').textContent = Math.round(temp);
    document.getElementById('weatherIcon').textContent = WEATHER_ICONS[icon] || '☀️';
    document.getElementById('weatherDescription').textContent = capitalizeWords(description);

    // Premium metrics
    document.getElementById('feelsLike').textContent = `${Math.round(feels_like)}°C`;
    document.getElementById('humidity').textContent = `${humidity}%`;
    document.getElementById('windSpeed').textContent = `${speed} m/s`;
    document.getElementById('pressure').textContent = `${pressure} hPa`;

    // Advanced metrics
    document.getElementById('visibility').textContent = `${(visibility / 1000).toFixed(1)} km`;
    document.getElementById('sunrise').textContent = formatTime(sunrise);
    document.getElementById('sunset').textContent = formatTime(sunset);

    // Calculate and display comfort index
    calculateComfortIndex(temp, humidity, speed);
}

function displayForecast(data) {
    const forecastGrid = document.getElementById('forecastGrid');
    forecastGrid.innerHTML = '';

    // Group forecasts by day
    const dailyForecasts = processForecastData(data.list);

    dailyForecasts.slice(0, 7).forEach((forecast, index) => {
        const forecastCard = createForecastCard(forecast, index);
        forecastGrid.appendChild(forecastCard);
    });
}

function displayAdvancedMetrics(data) {
    // Additional metrics are already displayed in displayCurrentWeather
    // This function can be extended for more advanced calculations
    
    // Animate the metrics cards
    setTimeout(() => {
        document.querySelectorAll('.metric-item').forEach((item, index) => {
            setTimeout(() => {
                item.style.animation = 'slideInRight 0.5s ease-out forwards';
            }, index * 100);
        });
    }, 500);
}

// ===== MAP INITIALIZATION =====
function initializeMap(lat, lon, weatherData) {
    const mapContainer = document.getElementById('weatherMap');
    
    // Clear existing map
    if (weatherMap) {
        weatherMap.remove();
    }

    // Initialize new map
    weatherMap = L.map('weatherMap').setView([lat, lon], 10);

    // Add tile layer (streets by default)
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors',
        className: 'map-tiles'
    }).addTo(weatherMap);

    // Add weather marker
    const marker = L.marker([lat, lon]).addTo(weatherMap);
    
    const popupContent = `
        <div class="weather-popup">
            <h3>${weatherData.name}</h3>
            <div class="popup-weather">
                <span class="popup-temp">${Math.round(weatherData.main.temp)}°C</span>
                <span class="popup-icon">${WEATHER_ICONS[weatherData.weather[0].icon]}</span>
            </div>
            <p>${capitalizeWords(weatherData.weather[0].description)}</p>
        </div>
    `;
    
    marker.bindPopup(popupContent).openPopup();

    // Add weather overlay (simulate weather patterns)
    addWeatherOverlay(lat, lon);
}

function addWeatherOverlay(lat, lon) {
    // Simulate weather patterns with colored circles
    const weatherIntensity = Math.random();
    const circleColor = weatherIntensity > 0.5 ? '#ff4444' : '#4444ff';
    const circleOpacity = 0.3;

    L.circle([lat, lon], {
        color: circleColor,
        fillColor: circleColor,
        fillOpacity: circleOpacity,
        radius: 5000
    }).addTo(weatherMap);

    // Add additional pattern points
    for (let i = 0; i < 5; i++) {
        const offsetLat = lat + (Math.random() - 0.5) * 0.1;
        const offsetLon = lon + (Math.random() - 0.5) * 0.1;
        const intensity = Math.random();
        
        L.circle([offsetLat, offsetLon], {
            color: intensity > 0.5 ? '#ff6666' : '#6666ff',
            fillColor: intensity > 0.5 ? '#ff6666' : '#6666ff',
            fillOpacity: 0.2,
            radius: 2000
        }).addTo(weatherMap);
    }
}

function toggleMapLayer(layer) {
    // Update button states
    document.querySelectorAll('.map-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    event.target.classList.add('active');

    // Switch map layer
    if (weatherMap) {
        weatherMap.eachLayer(layer => {
            if (layer instanceof L.TileLayer) {
                weatherMap.removeLayer(layer);
            }
        });

        let tileUrl;
        if (layer === 'satellite') {
            tileUrl = 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}';
        } else {
            tileUrl = 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
        }

        L.tileLayer(tileUrl, {
            attribution: layer === 'satellite' ? '© Esri' : '© OpenStreetMap contributors',
            className: 'map-tiles'
        }).addTo(weatherMap);
    }
}

// ===== UTILITY FUNCTIONS =====
function formatCurrentDate() {
    const now = new Date();
    const options = {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    };
    return now.toLocaleDateString('en-US', options);
}

function formatTime(timestamp) {
    const date = new Date(timestamp * 1000);
    return date.toLocaleTimeString('en-US', { 
        hour: '2-digit', 
        minute: '2-digit',
        hour12: false 
    });
}

function capitalizeWords(str) {
    return str.split(' ').map(word => 
        word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
    ).join(' ');
}

function processForecastData(forecastList) {
    const dailyForecasts = {};
    
    forecastList.forEach(item => {
        const date = new Date(item.dt * 1000);
        const dateString = date.toDateString();
        
        if (!dailyForecasts[dateString]) {
            dailyForecasts[dateString] = {
                date: date,
                temps: [],
                weather: item.weather[0],
                details: item
            };
        }
        
        dailyForecasts[dateString].temps.push(item.main.temp);
    });

    return Object.values(dailyForecasts).map(day => ({
        date: day.date,
        weather: day.weather,
        tempMax: Math.max(...day.temps),
        tempMin: Math.min(...day.temps),
        details: day.details
    }));
}

function createForecastCard(forecast, index) {
    const card = document.createElement('div');
    card.className = 'forecast-card';
    card.style.animationDelay = `${index * 0.1}s`;

    const dayName = forecast.date.toLocaleDateString('en-US', { weekday: 'short' });
    const monthDay = forecast.date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

    card.innerHTML = `
        <div class="forecast-day">${dayName}</div>
        <div class="forecast-date">${monthDay}</div>
        <div class="forecast-icon">${WEATHER_ICONS[forecast.weather.icon] || '☀️'}</div>
        <div class="forecast-desc">${capitalizeWords(forecast.weather.description)}</div>
        <div class="forecast-temps">
            <span class="forecast-high">${Math.round(forecast.tempMax)}°</span>
            <span class="forecast-low">${Math.round(forecast.tempMin)}°</span>
        </div>
        <div class="forecast-details">
            <div class="forecast-detail-item">
                <span class="forecast-detail-label">Humidity</span>
                <span class="forecast-detail-value">${forecast.details.main.humidity}%</span>
            </div>
            <div class="forecast-detail-item">
                <span class="forecast-detail-label">Wind</span>
                <span class="forecast-detail-value">${forecast.details.wind.speed} m/s</span>
            </div>
        </div>
    `;

    return card;
}

function calculateComfortIndex(temp, humidity, windSpeed) {
    // Simplified comfort index calculation
    let comfort = 50; // Base comfort level
    
    // Temperature comfort (optimal around 20-25°C)
    if (temp >= 18 && temp <= 26) {
        comfort += 30;
    } else if (temp >= 15 && temp <= 30) {
        comfort += 15;
    } else {
        comfort -= Math.abs(temp - 22) * 2;
    }
    
    // Humidity comfort (optimal around 40-60%)
    if (humidity >= 40 && humidity <= 60) {
        comfort += 15;
    } else {
        comfort -= Math.abs(humidity - 50) * 0.3;
    }
    
    // Wind comfort (light breeze is pleasant)
    if (windSpeed >= 1 && windSpeed <= 5) {
        comfort += 5;
    } else if (windSpeed > 10) {
        comfort -= windSpeed;
    }

    // Ensure comfort is between 0 and 100
    comfort = Math.max(0, Math.min(100, comfort));

    // Update comfort display
    document.getElementById('comfortLevel').style.width = `${comfort}%`;
    
    let comfortText;
    if (comfort >= 80) comfortText = 'Exceptional';
    else if (comfort >= 65) comfortText = 'Comfortable';
    else if (comfort >= 50) comfortText = 'Moderate';
    else if (comfort >= 35) comfortText = 'Uncomfortable';
    else comfortText = 'Poor';

    document.getElementById('comfortText').textContent = comfortText;
}

// ===== REFRESH FUNCTIONALITY =====
function refreshWeather() {
    if (userLocation) {
        // Add rotation animation to refresh button
        const refreshBtn = document.querySelector('.refresh-btn');
        refreshBtn.style.animation = 'spin 1s linear';
        
        setTimeout(() => {
            refreshBtn.style.animation = '';
            getWeatherByCoords(userLocation.lat, userLocation.lon);
        }, 1000);
    } else if (elements.cityInput.value.trim()) {
        searchWeather();
    } else {
        getCurrentLocation();
    }
}

// ===== ERROR HANDLING FOR API KEY =====
function checkApiKey() {
    if (CONFIG.API_KEY === 'YOUR_API_KEY_HERE') {
        showError('Please configure your OpenWeatherMap API key in the script.js file.');
        return false;
    }
    return true;
}

// Override the original functions to include API key check
const originalGetWeatherByCity = getWeatherByCity;
const originalGetWeatherByCoords = getWeatherByCoords;

getWeatherByCity = async function(city) {
    if (!checkApiKey()) return;
    return originalGetWeatherByCity(city);
};

getWeatherByCoords = async function(lat, lon) {
    if (!checkApiKey()) return;
    return originalGetWeatherByCoords(lat, lon);
};

// ===== KEYBOARD SHORTCUTS =====
document.addEventListener('keydown', function(e) {
    // Ctrl/Cmd + K for quick search focus
    if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        elements.cityInput.focus();
        elements.cityInput.select();
    }
    
    // Escape to clear search
    if (e.key === 'Escape') {
        elements.cityInput.blur();
        elements.cityInput.value = '';
    }
});

// ===== PERFORMANCE OPTIMIZATION =====
// Debounce function for search input
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// Add search suggestions (optional enhancement)
const debouncedSearch = debounce(() => {
    const query = elements.cityInput.value.trim();
    if (query.length > 2) {
        // Could add city suggestions here
        console.log('Searching for:', query);
    }
}, 300);

elements.cityInput.addEventListener('input', debouncedSearch);