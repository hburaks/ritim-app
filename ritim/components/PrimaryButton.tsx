import React from 'react';
import {
  Pressable,
  StyleProp,
  StyleSheet,
  Text,
  TextStyle,
  ViewStyle,
} from 'react-native';

import { colors, radius, spacing } from '@/lib/theme/tokens';

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
    height: 58,
    paddingHorizontal: spacing.lg,
    borderRadius: radius.full,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: spacing.sm,
  },
  enabled: {
    backgroundColor: colors.accentDeep,
    shadowColor: '#111827',
    shadowOpacity: 0.08,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
  disabled: {
    backgroundColor: colors.neutral300,
  },
  pressed: {
    opacity: 0.92,
    transform: [{ translateY: 1 }],
  },
  text: {
    fontSize: 15,
    fontWeight: '700',
  },
  textEnabled: {
    color: colors.surface,
  },
  textDisabled: {
    color: colors.textMuted,
  },
});
