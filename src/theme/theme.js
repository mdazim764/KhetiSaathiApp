const colors = {
  primary: '#388E3C',      // Green for agriculture
  secondary: '#FFA000',    // Warm amber for harvest
  background: '#F5F5F5',   // Light background
  card: '#FFFFFF',         // White card backgrounds
  text: '#263238',         // Dark text for readability
  border: '#E0E0E0',       // Light borders
  notification: '#D32F2F', // Error/notification red
  success: '#43A047',      // Success green
  info: '#1976D2',         // Info blue
  warning: '#FBC02D',      // Warning yellow
};

const fonts = {
  regular: 'Roboto-Regular',
  medium: 'Roboto-Medium',
  bold: 'Roboto-Bold',
  light: 'Roboto-Light',
  sizes: {
    small: 12,
    medium: 14,
    large: 16,
    xlarge: 18,
    xxlarge: 22,
    heading: 24,
  },
};

const spacing = {
  xs: 4,
  s: 8, 
  m: 16,
  l: 24,
  xl: 32,
  xxl: 48,
};

const shadows = {
  small: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1.41,
    elevation: 2,
  },
  medium: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.23,
    shadowRadius: 2.62,
    elevation: 4,
  },
  large: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4.65,
    elevation: 8,
  },
};

export default {
  colors,
  fonts,
  spacing,
  shadows,
};