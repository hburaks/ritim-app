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
  size?: number;
  gap?: number;
  activeColor?: string;
  inactiveColor?: string;
  highlightIndex?: number;
  highlightColor?: string;
  pressablePadding?: number;
};

const DOT_COUNT = 7;

export function DotRow({
  activeIndex = 0,
  filled,
  onChange,
  style,
  size = 12,
  gap = spacing.sm,
  activeColor = colors.accent,
  inactiveColor = colors.neutral300,
  highlightIndex,
  highlightColor,
  pressablePadding = spacing.xs,
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
    <View style={[styles.row, { gap }, style]}>
      {dots.map((_, index) => {
        const isActive = index === activeIndex;
        const isFilled = filled ? Boolean(filled[index]) : isActive;
        const isHighlighted = highlightIndex === index;
        const outlineColor =
          isHighlighted && !isFilled && highlightColor
            ? highlightColor
            : inactiveColor;
        return (
          <Pressable
            key={index}
            onPress={() => onChange?.(index)}
            hitSlop={6}
            style={[styles.pressable, { padding: pressablePadding }]}
          >
            <Animated.View
              style={[
                styles.dot,
                {
                  width: size,
                  height: size,
                  borderRadius: size / 2,
                },
                isFilled
                  ? { backgroundColor: activeColor, borderColor: activeColor }
                  : { backgroundColor: 'transparent', borderColor: outlineColor },
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
  },
  pressable: {
  },
  dot: {
    borderWidth: 2,
  },
});
