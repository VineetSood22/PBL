import axios from 'axios';

const API_KEY = import.meta.env.VITE_WEATHER_API_KEY || 'demo_key'; // Use a free weather API key

export const getWeather = async (lat, lng) => {
  try {
    const response = await axios.get(`https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lng}&appid=${API_KEY}&units=metric`);
    return response.data;
  } catch (error) {
    console.error('Error fetching weather:', error);
    return null;
  }
};
