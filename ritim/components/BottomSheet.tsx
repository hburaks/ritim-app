import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Animated,
  Modal,
  Pressable,
  StyleSheet,
  Text,
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

const SHEET_HEIGHT = 360;

export function BottomSheet({
  visible,
  onClose,
  onCloseComplete,
  title,
  headerRight,
  children,
}: BottomSheetProps) {
  const [rendered, setRendered] = useState(visible);
  const translateY = useRef(new Animated.Value(SHEET_HEIGHT)).current;
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
          toValue: SHEET_HEIGHT,
          duration: 220,
          useNativeDriver: true,
        }),
        Animated.timing(overlayOpacity, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
      ]),
    [overlayOpacity, translateY]
  );

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
    backgroundColor: colors.surfaceElevated,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.lg,
    paddingBottom: spacing.xxl,
    shadowColor: '#000',
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
    backgroundColor: colors.neutral400,
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
