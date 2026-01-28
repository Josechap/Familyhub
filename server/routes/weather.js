const express = require('express');
const router = express.Router();
const db = require('../db/database');

// Weather condition to emoji mapping
const weatherEmoji = {
    'Clear': '☀️',
    'Clouds': '☁️',
    'Rain': '🌧️',
    'Drizzle': '🌦️',
    'Thunderstorm': '⛈️',
    'Snow': '❄️',
    'Mist': '🌫️',
    'Fog': '🌫️',
    'Haze': '🌫️',
};

// GET /weather - Fetch current weather
router.get('/', async (req, res) => {
    try {
        // Get API key and location from settings
        const apiKey = db.prepare('SELECT value FROM settings WHERE key = ?').get('weatherApiKey');
        const location = db.prepare('SELECT value FROM settings WHERE key = ?').get('location');

        if (!apiKey?.value || !location?.value) {
            return res.status(400).json({
                error: 'Weather not configured. Please set API key and location in settings.'
            });
        }

        // Fetch weather from OpenWeatherMap
        // Check if location is a zip code (5 digits) or city name
        const loc = location.value.trim();
        const isZipCode = /^\d{5}$/.test(loc);
        const url = isZipCode
            ? `https://api.openweathermap.org/data/2.5/weather?zip=${loc},US&appid=${apiKey.value}&units=imperial`
            : `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(loc)}&appid=${apiKey.value}&units=imperial`;

        const response = await fetch(url);
        if (!response.ok) {
            const errorData = await response.json();
            console.error('Weather API error:', errorData);
            return res.status(response.status).json({
                error: errorData.message || 'Failed to fetch weather'
            });
        }

        const data = await response.json();

        // Format response
        const weather = {
            temp: Math.round(data.main.temp),
            feelsLike: Math.round(data.main.feels_like),
            humidity: data.main.humidity,
            condition: data.weather[0].main,
            description: data.weather[0].description,
            icon: weatherEmoji[data.weather[0].main] || '🌡️',
            windSpeed: Math.round(data.wind.speed),
            location: data.name,
        };

        res.json(weather);
    } catch (error) {
        console.error('Weather fetch error:', error);
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
