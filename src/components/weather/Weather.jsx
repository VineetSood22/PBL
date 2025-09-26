import React, { useState, useEffect } from 'react';
import { getWeather } from '../../Service/WeatherApi.jsx';

const Weather = ({ lat, lng }) => {
  const [weather, setWeather] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchWeather = async () => {
      setLoading(true);
      const data = await getWeather(lat, lng);
      setWeather(data);
      setLoading(false);
    };
    fetchWeather();
  }, [lat, lng]);

  if (loading) return <div>Loading weather...</div>;
  if (!weather) return <div>Weather data not available</div>;

  return (
    <div className="weather-container bg-white p-4 rounded-lg shadow-md">
      <h2 className="text-xl font-semibold mb-2">Weather</h2>
      <p>Temperature: {weather.main.temp}°C</p>
      <p>Condition: {weather.weather[0].description}</p>
      <p>Humidity: {weather.main.humidity}%</p>
    </div>
  );
};

export default Weather;
