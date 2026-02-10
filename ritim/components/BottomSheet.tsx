import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Animated,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';

import { colors, radius, spacing } from '@/lib/theme/tokens';

type BottomSheetProps = {
  visible: boolean;
  onClose: () => void;
  onCloseComplete?: () => void;
  title?: string;
  headerRight?: React.ReactNode;
  children?: React.ReactNode;
};

export function BottomSheet({
  visible,
  onClose,
  onCloseComplete,
  title,
  headerRight,
  children,
}: BottomSheetProps) {
  const { height: windowHeight } = useWindowDimensions();
  const hiddenOffset = Math.max(420, windowHeight);
  const [rendered, setRendered] = useState(visible);
  const translateY = useRef(new Animated.Value(hiddenOffset)).current;
  const overlayOpacity = useRef(new Animated.Value(0)).current;

  const openAnimation = useMemo(
    () =>
      Animated.parallel([
        Animated.timing(translateY, {
          toValue: 0,
          duration: 260,
          useNativeDriver: true,
        }),
        Animated.timing(overlayOpacity, {
          toValue: 0.35,
          duration: 220,
          useNativeDriver: true,
        }),
      ]),
    [overlayOpacity, translateY]
  );

  const closeAnimation = useMemo(
    () =>
      Animated.parallel([
        Animated.timing(translateY, {
          toValue: hiddenOffset,
          duration: 220,
          useNativeDriver: true,
        }),
        Animated.timing(overlayOpacity, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
      ]),
    [hiddenOffset, overlayOpacity, translateY]
  );

  useEffect(() => {
    if (!visible && !rendered) {
      translateY.setValue(hiddenOffset);
    }
  }, [hiddenOffset, rendered, translateY, visible]);

  useEffect(() => {
    if (visible) {
      setRendered(true);
      openAnimation.start();
    } else if (rendered) {
      closeAnimation.start(({ finished }) => {
        if (finished) {
          setRendered(false);
          onCloseComplete?.();
        }
      });
    }
  }, [visible, rendered, openAnimation, closeAnimation, onCloseComplete]);

  if (!rendered) {
    return null;
  }

  return (
    <Modal
      transparent
      visible={rendered}
      statusBarTranslucent
      animationType="none"
      onRequestClose={onClose}
    >
      <View style={styles.modalRoot}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose}>
          <Animated.View style={[styles.overlay, { opacity: overlayOpacity }]} />
        </Pressable>
        <Animated.View style={[styles.sheet, { transform: [{ translateY }] }]}>
          <View style={styles.handle} />
          {title || headerRight ? (
            <View style={styles.headerRow}>
              {title ? <Text style={styles.title}>{title}</Text> : <View />}
              {headerRight ? <View style={styles.headerRight}>{headerRight}</View> : null}
            </View>
          ) : null}
          {children}
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalRoot: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  overlay: {
    flex: 1,
    backgroundColor: '#000',
  },
  sheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.lg,
    paddingBottom: spacing.xxl,
    shadowColor: '#111827',
    shadowOpacity: 0.12,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: -6 },
    elevation: 8,
  },
  handle: {
    alignSelf: 'center',
    width: 44,
    height: 5,
    borderRadius: radius.full,
    backgroundColor: colors.dotInactive,
    marginBottom: spacing.md,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  headerRight: {
    alignItems: 'flex-end',
  },
});
