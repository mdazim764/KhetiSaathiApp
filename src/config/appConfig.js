export default {
  appName: 'KhetiSaathi', // App name can be changed here
  appEmoji: '⚡',  // Changed from plant emoji to lightning
  appTagline: 'Smart Farming Technology', // App tagline can be changed here
  version: '2.0.0',
  
  // Any other app-wide configuration can be added here
  dateFormat: 'MMMM D, YYYY',
  timeFormat: 'HH:mm',
  defaultCountry: 'India',
  supportEmail: 'support@khetisaathi.com',
  
  // Feature flags
  features: {
    weatherAlerts: true,
    aiRecommendations: true,
    cropScheduling: true,
    notificationSystem: true,
  },
  
  // API endpoints
  endpoints: {
    serverBase: 'https://khetisaathi-backend.vercel.app',
    weatherApi: 'https://api.weatherapi.com/v1',
  }
};