import {Platform} from 'react-native';
import {
  WEATHER_API_KEY,
  GEMINI_API_KEY,
  SERVER_URL,
  WEATHER_API_BASE,
  NOMINATIM_API_BASE,
  NOTIFICATION_WINDOW_START_HOUR,
  NOTIFICATION_WINDOW_END_HOUR,
  WEATHER_CHECK_INTERVAL,
  BACKGROUND_LOCATION_REFRESH_INTERVAL,
  DAILY_UPDATE_TIME,
} from '@env';

// Fix for Android emulator - replace localhost with 10.0.2.2
const fixAndroidEmulatorUrl = url => {
  if (Platform.OS === 'android' && url && url.includes('localhost')) {
    return url.replace('localhost', '10.0.2.2');
  }
  return url;
};

// Centralized environment configuration with fallbacks
export default {
  // API Keys
  WEATHER_API_KEY: WEATHER_API_KEY || '5c4cd329970e43b4b3870401252903',
  GEMINI_API_KEY: GEMINI_API_KEY || 'AIzaSyCR_5mPYQLoi6YASKzbqGMWsDu0QKFfapE',

  // Endpoints - with Android emulator fix and slash handling
  SERVER_URL: fixAndroidEmulatorUrl(
    SERVER_URL ||
      'https://crop-calendar-backend-git-main-azim-khairdis-projects.vercel.app',
  ).replace(/\/$/, ''),
  WEATHER_API_BASE: WEATHER_API_BASE || 'https://api.weatherapi.com/v1',
  NOMINATIM_API_BASE:
    NOMINATIM_API_BASE || 'https://nominatim.openstreetmap.org',

  // App Configuration
  NOTIFICATION_WINDOW_START_HOUR: Number(NOTIFICATION_WINDOW_START_HOUR) || 6,
  NOTIFICATION_WINDOW_END_HOUR: Number(NOTIFICATION_WINDOW_END_HOUR) || 22,
  WEATHER_CHECK_INTERVAL: Number(WEATHER_CHECK_INTERVAL) || 10800000, // 3 hours in ms
  BACKGROUND_LOCATION_REFRESH_INTERVAL:
    Number(BACKGROUND_LOCATION_REFRESH_INTERVAL) || 14400000, // 4 hours in ms
  DAILY_UPDATE_TIME: DAILY_UPDATE_TIME || '08:00',

  // Function to determine if we're in development
  isDevelopment: () => {
    return process.env.APP_ENV === 'development';
  },

  // Function to determine if we're in production
  isProduction: () => {
    return process.env.APP_ENV === 'production';
  },
};
