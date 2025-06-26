import React from 'react';
import {Modal, View, Text, TouchableOpacity, StyleSheet} from 'react-native';
import theme from '../constants/theme';
const {COLORS, FONT_SIZES, FONT_WEIGHTS, SPACING, BORDERS} = theme;

const CustomAlert = ({
  visible,
  title,
  message,
  onClose,
  onConfirm,
  confirmText = 'OK',
  cancelText = 'Cancel',
  showCancel = false,
}) => (
  <Modal transparent visible={visible} animationType="fade">
    <View style={styles.overlay}>
      <View style={styles.container}>
        {title ? <Text style={styles.title}>{title}</Text> : null}
        <Text style={styles.message}>{message}</Text>
        <View style={styles.buttonRow}>
          {showCancel && (
            <TouchableOpacity style={styles.button} onPress={onClose}>
              <Text style={styles.cancelText}>{cancelText}</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity style={styles.button} onPress={onConfirm || onClose}>
            <Text style={styles.confirmText}>{confirmText}</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  </Modal>
);

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(10,20,40,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  container: {
    backgroundColor: COLORS.surface,
    borderRadius: BORDERS.radiusLarge,
    padding: SPACING.l,
    width: '80%',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.primary,
  },
  title: {
    color: COLORS.primary,
    fontSize: FONT_SIZES.h4,
    fontWeight: FONT_WEIGHTS.bold,
    marginBottom: SPACING.s,
    textAlign: 'center',
  },
  message: {
    color: COLORS.white,
    fontSize: FONT_SIZES.body,
    marginBottom: SPACING.l,
    textAlign: 'center',
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    width: '100%',
  },
  button: {
    paddingVertical: SPACING.s,
    paddingHorizontal: SPACING.l,
    borderRadius: BORDERS.radiusSmall,
    marginLeft: SPACING.s,
  },
  confirmText: {
    color: COLORS.primary,
    fontWeight: FONT_WEIGHTS.bold,
    fontSize: FONT_SIZES.body,
  },
  cancelText: {
    color: COLORS.textLight,
    fontWeight: FONT_WEIGHTS.medium,
    fontSize: FONT_SIZES.body,
  },
});

export default CustomAlert;