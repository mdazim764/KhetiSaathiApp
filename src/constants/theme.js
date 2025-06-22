// src/constants/theme.js

import {Dimensions, Platform} from 'react-native';

const {width, height} = Dimensions.get('window');

// Define your color palette
export const COLORS = {
  // Primary Palette (Example: Green tones for agriculture)
  primary: '#4CAF50', // A nice medium green
  primaryDark: '#388E3C', // Darker shade for presses, borders
  primaryLight: '#C8E6C9', // Light shade for backgrounds, highlights // Accent Color (Example: Brown/Orange for earth/harvest)

  accent: '#FF9800', // Orange
  accentDark: '#F57C00', // Greyscale & Utility

  white: '#FFFFFF',
  black: '#000000',
  text: '#333333', // Dark grey for text
  textLight: '#666666', // Lighter grey
  background: '#F5F5F5', // Light grey background for contrast
  surface: '#FFFFFF', // Card backgrounds, inputs
  border: '#E0E0E0', // Borders, dividers
  error: '#D32F2F',
  success: '#4CAF50', // Same as primary in this case
  disabled: '#BDBDBD',
};

// Define font sizes
export const FONT_SIZES = {
  h1: 30,
  h2: 24,
  h3: 20,
  h4: 18,
  body: 16,
  caption: 14,
  small: 12,
};

// Define font weights (use strings as required by React Native)
export const FONT_WEIGHTS = {
  light: '300',
  regular: '400',
  medium: '500', // Often good for buttons/titles
  bold: '700',
};

// Define spacing units
export const SPACING = {
  xs: 4,
  s: 8,
  m: 16, // Common margin/padding
  l: 24,
  xl: 32,
  xxl: 48,
};

// Define border radii
export const BORDERS = {
  radiusSmall: 4,
  radiusMedium: 8,
  radiusLarge: 16,
  radiusRound: 50, // For circular elements
};

// Device dimensions (useful for responsive design)
export const SIZES = {
  width,
  height, // Base sizes
  base: SPACING.s,
  font: FONT_SIZES.body,
  radius: BORDERS.radiusSmall,
  padding: SPACING.m, // Font sizes

  h1: FONT_SIZES.h1,
  h2: FONT_SIZES.h2,
  h3: FONT_SIZES.h3,
  h4: FONT_SIZES.h4,
  body: FONT_SIZES.body,
  caption: FONT_SIZES.caption,
  small: FONT_SIZES.small, // Spacing

  spaceXS: SPACING.xs,
  spaceS: SPACING.s,
  spaceM: SPACING.m,
  spaceL: SPACING.l,
  spaceXL: SPACING.xl,
  spaceXXL: SPACING.xxl,
};

// Platform specific styles (example)
export const PLATFORM = {
  isIOS: Platform.OS === 'ios',
  isAndroid: Platform.OS === 'android', // Add more platform-specific constants if needed
};

// Combine everything into a default export for easy import
const theme = {
  COLORS,
  FONT_SIZES,
  FONT_WEIGHTS,
  SPACING,
  BORDERS,
  SIZES,
  PLATFORM,
};

export default theme;
