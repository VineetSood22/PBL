import axios from 'axios';

const API_KEY = import.meta.env.VITE_CURRENCY_API_KEY || 'demo_key'; // Use a free currency API key

export const getExchangeRate = async (from, to) => {
  try {
    const response = await axios.get(`https://api.exchangerate-api.com/v4/latest/${from}`);
    return response.data.rates[to];
  } catch (error) {
    console.error('Error fetching exchange rate:', error);
    return null;
  }
};
