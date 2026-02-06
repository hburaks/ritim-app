import React, { useEffect, useMemo, useRef } from 'react';
import {
  Animated,
  Pressable,
  StyleProp,
  StyleSheet,
  View,
  ViewStyle,
} from 'react-native';

import { colors, spacing } from '@/lib/theme/tokens';

type DotRowProps = {
  activeIndex?: number;
  filled?: boolean[];
  onChange?: (index: number) => void;
  style?: StyleProp<ViewStyle>;
};

const DOT_COUNT = 7;

export function DotRow({
  activeIndex = 0,
  filled,
  onChange,
  style,
}: DotRowProps) {
  const scales = useRef(
    Array.from({ length: DOT_COUNT }, () => new Animated.Value(1))
  ).current;

  const dots = useMemo(() => Array.from({ length: DOT_COUNT }), []);

  useEffect(() => {
    if (activeIndex < 0 || activeIndex >= DOT_COUNT) {
      return;
    }

    Animated.sequence([
      Animated.timing(scales[activeIndex], {
        toValue: 1.25,
        duration: 140,
        useNativeDriver: true,
      }),
      Animated.timing(scales[activeIndex], {
        toValue: 1,
        duration: 180,
        useNativeDriver: true,
      }),
    ]).start();
  }, [activeIndex, scales]);

  return (
    <View style={[styles.row, style]}>
      {dots.map((_, index) => {
        const isActive = index === activeIndex;
        const isFilled = filled ? Boolean(filled[index]) : isActive;
        return (
          <Pressable
            key={index}
            onPress={() => onChange?.(index)}
            hitSlop={6}
            style={styles.pressable}
          >
            <Animated.View
              style={[
                styles.dot,
                isFilled ? styles.dotActive : styles.dotInactive,
                { transform: [{ scale: scales[index] }] },
              ]}
            />
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  pressable: {
    padding: spacing.xs,
  },
  dot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    borderWidth: 2,
  },
  dotActive: {
    backgroundColor: colors.accent,
    borderColor: colors.accent,
  },
  dotInactive: {
    backgroundColor: 'transparent',
    borderColor: colors.neutral300,
  },
});
