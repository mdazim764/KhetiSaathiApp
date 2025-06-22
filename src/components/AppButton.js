// src/components/AppButton.js

import React from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  View, // Import View for potential icon layout
  Platform, // Import Platform for shadows
} from 'react-native';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons'; // Changed import

// Import theme constants
import theme from '../constants/theme';
const {COLORS, FONT_SIZES, FONT_WEIGHTS, SPACING, BORDERS} = theme;

const AppButton = ({
  title,
  onPress,
  style, // Custom style overrides for the button container
  textStyle, // Custom style overrides for the text
  iconName, // Optional icon name from MaterialIcons
  variant = 'primary', // 'primary' or 'secondary', add more as needed
  disabled = false, // Optional disabled state
  ...props // Pass other TouchableOpacity props
}) => {
  // Base styles for all variants
  const buttonBaseStyles = [
    styles.buttonBase,
    disabled && styles.disabledButton, // Apply disabled style if needed
    style, // Apply custom container styles last
  ];

  const textBaseStyles = [
    styles.textBase,
    disabled && styles.disabledText, // Apply disabled text style if needed
    textStyle, // Apply custom text styles last
  ];

  // Variant-specific styles
  if (!disabled) {
    if (variant === 'primary') {
      buttonBaseStyles.push(styles.primaryButton);
      textBaseStyles.push(styles.primaryText);
    } else if (variant === 'secondary') {
      buttonBaseStyles.push(styles.secondaryButton);
      textBaseStyles.push(styles.secondaryText);
    }
    // Add more variants like 'danger', 'success' if needed
    // else if (variant === 'danger') {
    //   buttonBaseStyles.push(styles.dangerButton);
    //   textBaseStyles.push(styles.dangerText);
    // }
  }

  const iconColor = disabled
    ? COLORS.disabled // Disabled icon color
    : variant === 'primary'
    ? COLORS.white // Primary icon color
    : COLORS.primary; // Secondary (or other variants) icon color

  return (
    <TouchableOpacity
      style={buttonBaseStyles}
      onPress={onPress}
      activeOpacity={disabled ? 1 : 0.7} // No opacity change if disabled
      disabled={disabled}
      {...props}>
      {/* Optional Icon */}
      {iconName && (
        <MaterialIcons // Direct use of MaterialIcons
          name={iconName}
          size={FONT_SIZES.body * 1.2} // Slightly larger icon
          color={iconColor}
          style={styles.icon}
        />
      )}
      <Text style={textBaseStyles}>{title}</Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  buttonBase: {
    flexDirection: 'row', // Layout icon and text
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.m, // Use theme spacing
    paddingHorizontal: SPACING.l,
    borderRadius: BORDERS.radiusMedium, // Use theme border radius
    marginVertical: SPACING.s, // Default vertical margin
    width: '90%', // Default width (can be overridden by style prop)
    minHeight: 50, // Good touch target size
    alignSelf: 'center', // Center button by default if width is less than 100%
  },
  primaryButton: {
    backgroundColor: COLORS.primary, // Use theme primary color
    // Platform-specific shadows
    ...Platform.select({
      ios: {
        shadowColor: COLORS.black,
        shadowOffset: {width: 0, height: 2},
        shadowOpacity: 0.2,
        shadowRadius: 3,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  secondaryButton: {
    backgroundColor: COLORS.surface, // Use surface color (white)
    borderWidth: 1,
    borderColor: COLORS.primary, // Use primary color for border
  },
  // Add styles for other variants if needed (e.g., danger)
  // dangerButton: {
  //   backgroundColor: COLORS.error,
  // },
  textBase: {
    fontSize: FONT_SIZES.body, // Use theme font size
    fontWeight: FONT_WEIGHTS.medium, // Medium weight for buttons
    textAlign: 'center',
  },
  primaryText: {
    color: COLORS.white, // White text on primary button
  },
  secondaryText: {
    color: COLORS.primary, // Primary color text on secondary button
  },
  // dangerText: {
  //   color: COLORS.white,
  // },
  icon: {
    marginRight: SPACING.s, // Space between icon and text
  },
  // Disabled styles
  disabledButton: {
    backgroundColor: COLORS.disabled, // Use disabled background color
    borderColor: COLORS.disabled, // Ensure border matches if secondary variant
    ...Platform.select({
      // Remove elevation/shadow when disabled
      ios: {shadowOpacity: 0},
      android: {elevation: 0},
    }),
  },
  disabledText: {
    color: COLORS.textLight, // Use a lighter text color for disabled state
  },
});

export default AppButton;
