import React from 'react';
import {
  Pressable,
  StyleProp,
  StyleSheet,
  Text,
  TextStyle,
  ViewStyle,
} from 'react-native';

import { colors } from '../lib/theme/tokens';

type TextLinkProps = {
  label?: string;
  children?: React.ReactNode;
  onPress?: () => void;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
};

export function TextLink({
  label,
  children,
  onPress,
  disabled = false,
  style,
  textStyle,
}: TextLinkProps) {
  const content = children ?? label;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [style, pressed && !disabled ? styles.pressed : null]}
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
  text: {
    fontSize: 16,
    fontWeight: '500',
  },
  textEnabled: {
    color: colors.textMuted,
  },
  textDisabled: {
    color: colors.neutral400,
  },
  pressed: {
    opacity: 0.6,
  },
});
