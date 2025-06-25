// src/constants/theme.js

import {Dimensions, Platform} from 'react-native';

const {width, height} = Dimensions.get('window');

// Completely new color palette
export const COLORS = {
  // Primary Palette (Tech-focused dark theme)
  primary: '#5B3FE8', // Deep purple instead of green
  primaryDark: '#4930B8',
  primaryLight: '#7D64FF',

  // Accent Colors
  accent: '#FF5BB0', // Bright pink instead of orange
  accentDark: '#E0439A',
  secondary: '#20D9D2', // Bright teal as secondary color

  // Base colors
  white: '#FFFFFF',
  black: '#000000',

  // UI Colors
  text: '#E9ECEF', // Light gray for text on dark background
  textLight: '#A0B1D9', // Light blue for secondary text
  background: '#121D3E', // Very dark blue background
  surface: '#1C2A4E', // Slightly lighter dark blue
  border: '#273559', // Dark blue borders with hint of light
  error: '#FF4646', // Bright red for errors
  success: '#2DC56E', // Bright green for success
  disabled: '#38425D', // Muted dark blue for disabled elements
};

// Larger font sizes for better readability on dark theme
export const FONT_SIZES = {
  h1: 34,
  h2: 28,
  h3: 24,
  h4: 20,
  body: 16,
  caption: 14,
  small: 12,
};

// More distinctive font weights
export const FONT_WEIGHTS = {
  light: '300',
  regular: '400',
  medium: '600',
  bold: '800', // Extra bold for headers
};

// Different spacing rhythm
export const SPACING = {
  xs: 6,
  s: 12,
  m: 18,
  l: 28,
  xl: 38,
  xxl: 54,
};

// More rounded corners
export const BORDERS = {
  radiusSmall: 8,
  radiusMedium: 14,
  radiusLarge: 20,
  radiusRound: 100, // Fully rounded
};

// Export as before
export const SIZES = {width, height, base: SPACING.s, font: FONT_SIZES.body};
export const PLATFORM = {isIOS: Platform.OS === 'ios', isAndroid: Platform.OS === 'android'};

const theme = {COLORS, FONT_SIZES, FONT_WEIGHTS, SPACING, BORDERS, SIZES, PLATFORM};
export default theme;
