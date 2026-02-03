import React from 'react';
import {
  Pressable,
  StyleProp,
  StyleSheet,
  Text,
  TextStyle,
  ViewStyle,
} from 'react-native';

import { colors, radius, spacing } from '../lib/theme/tokens';

type PrimaryButtonProps = {
  label?: string;
  children?: React.ReactNode;
  onPress?: () => void;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
};

export function PrimaryButton({
  label,
  children,
  onPress,
  disabled = false,
  style,
  textStyle,
}: PrimaryButtonProps) {
  const content = children ?? label;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.base,
        disabled ? styles.disabled : styles.enabled,
        pressed && !disabled ? styles.pressed : null,
        style,
      ]}
    >
      <Text
        style={[
          styles.text,
          disabled ? styles.textDisabled : styles.textEnabled,
          textStyle,
        ]}
      >
        {content}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    height: 48,
    paddingHorizontal: spacing.xl,
    borderRadius: radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: spacing.sm,
  },
  enabled: {
    backgroundColor: colors.accent,
    shadowColor: '#000',
    shadowOpacity: 0.12,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  disabled: {
    backgroundColor: colors.neutral400,
  },
  pressed: {
    opacity: 0.9,
  },
  text: {
    fontSize: 16,
    fontWeight: '600',
  },
  textEnabled: {
    color: colors.surface,
  },
  textDisabled: {
    color: colors.textSecondary,
  },
});
