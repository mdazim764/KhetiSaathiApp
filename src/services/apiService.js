import { API_BASE_URL } from '@env';

const apiService = {
  // Schedule generation
  generateSchedule: async (data) => {
    try {
      const response = await fetch(`${API_BASE_URL}/generate-schedule`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });
      return await response.json();
    } catch (error) {
      console.error('Error generating schedule:', error);
      throw error;
    }
  },

  // Farming assistant
  getFarmingAdvice: async (query, userLocation, cropInfo) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/farming-assistant`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ query, userLocation, cropInfo }),
      });
      return await response.json();
    } catch (error) {
      console.error('Error getting farming advice:', error);
      throw error;
    }
  },

  // Market prediction
  getMarketPrediction: async (crop, state, district, harvestDate) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/market-prediction`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ crop, state, district, harvestDate }),
      });
      return await response.json();
    } catch (error) {
      console.error('Error getting market prediction:', error);
      throw error;
    }
  },

  // Weather data
  getWeatherForecast: async (district, state) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/weather/${district}/${state}`);
      return await response.json();
    } catch (error) {
      console.error('Error getting weather forecast:', error);
      throw error;
    }
  }
};

export default apiService;