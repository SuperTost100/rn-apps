import * as React from 'react';
import { useEffect, useMemo } from 'react';
import {
  Animated,
  Easing,
  StyleSheet,
  TouchableHighlight,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import useLatestCallback from 'use-latest-callback';

import { useScreenReader } from '../../core/hooks/useScreenReader';
import { Feedback } from '../../core/types/Feedback';
import { useStylesheet } from '../hooks/useStylesheet';
import { useTheme } from '../hooks/useTheme';
import { Theme } from '../types/Theme';
import { Text } from './Text';

export type Props = Feedback & {
  /**
   * Whether the Snackbar is currently visible.
   */
  visible: boolean;
  /**
   * Callback called when Snackbar is dismissed. The `visible` prop needs to be updated when this is called.
   */
  onDismiss?: () => void;
};

const DURATION_TIME = 4000; // 4 seconds
const ANIMATION_TIME = 180; // ease-out, as in the mockup

/**
 * Snackbars provide brief feedback about an operation through a message rendered at the bottom of the container in which it's wrapped.
 */
export const Snackbar = ({
  visible,
  isPersistent = false,
  action,
  onDismiss,
  text,
  ...rest
}: Props) => {
  const styles = useStylesheet(createStyles);
  const { bottom } = useSafeAreaInsets();
  const { isEnabled, announce } = useScreenReader();
  const { colors, elevation } = useTheme();

  const { current: opacity } = React.useRef<Animated.Value>(
    new Animated.Value(0.0),
  );

  const duration = useMemo(() => {
    return isPersistent ? Number.POSITIVE_INFINITY : DURATION_TIME;
  }, [isPersistent]);

  const hideTimeout = React.useRef<NodeJS.Timeout | undefined>(undefined);

  const [hidden, setHidden] = React.useState(!visible);

  useEffect(() => {
    if (isEnabled && visible) announce(text);
  }, [isEnabled, announce, visible, text]);

  const handleOnVisible = useLatestCallback(() => {
    // show
    if (hideTimeout.current) clearTimeout(hideTimeout.current);
    setHidden(false);
    Animated.timing(opacity, {
      toValue: 1,
      duration: ANIMATION_TIME,
      easing: Easing.out(Easing.ease),
      useNativeDriver: true,
    }).start(({ finished }) => {
      if (finished) {
        const isInfinity = duration === Number.POSITIVE_INFINITY;

        if (!isInfinity && onDismiss) {
          hideTimeout.current = setTimeout(
            onDismiss,
            duration,
          ) as unknown as NodeJS.Timeout;
        }
      }
    });
  });

  const handleOnHidden = useLatestCallback(() => {
    // hide
    if (hideTimeout.current) {
      clearTimeout(hideTimeout.current);
    }

    Animated.timing(opacity, {
      toValue: 0,
      duration: ANIMATION_TIME,
      useNativeDriver: true,
    }).start(({ finished }) => {
      if (finished) {
        setHidden(true);
      }
    });
  });

  React.useEffect(() => {
    return () => {
      if (hideTimeout.current) clearTimeout(hideTimeout.current);
    };
  }, []);

  React.useLayoutEffect(() => {
    if (visible) {
      handleOnVisible();
    } else {
      handleOnHidden();
    }
  }, [visible, handleOnVisible, handleOnHidden]);

  if (hidden) {
    return null;
  }

  const {
    label: actionLabel,
    onPress: onPressAction,
    ...actionProps
  } = action || {};

  const wrapperPaddings = {
    paddingBottom: bottom,
  };

  return (
    <View pointerEvents="box-none" style={[styles.wrapper, wrapperPaddings]}>
      <Animated.View
        pointerEvents="box-none"
        accessibilityLiveRegion="polite"
        style={[
          styles.container,
          elevation.overlay,
          {
            opacity: opacity,
            transform: [
              {
                translateY: opacity.interpolate({
                  inputRange: [0, 1],
                  outputRange: [8, 0],
                }),
              },
            ],
          },
        ]}
        {...rest}
      >
        <Text variant="secondaryText" style={styles.content}>
          {text}
        </Text>
        {action && (
          <View style={styles.actionsContainer}>
            <TouchableHighlight
              accessibilityRole="button"
              underlayColor={colors.touchableHighlight}
              onPress={event => {
                onPressAction?.(event);
                onDismiss?.();
              }}
              style={styles.button}
              {...actionProps}
            >
              <Text variant="label" weight="bold" style={styles.buttonLabel}>
                {actionLabel!}
              </Text>
            </TouchableHighlight>
          </View>
        )}
      </Animated.View>
    </View>
  );
};

/**
 * Show the Snackbar for a short duration.
 */
Snackbar.DURATION = DURATION_TIME;
Snackbar.ANIMATION = ANIMATION_TIME;

const createStyles = ({ colors, controls, layout, shapes, spacing }: Theme) =>
  StyleSheet.create({
    wrapper: {
      position: 'absolute',
      bottom: 60,
      width: '100%',
      paddingHorizontal: layout.gutter,
    },
    container: {
      margin: 0,
      flexDirection: 'row',
      flexWrap: 'wrap',
      justifyContent: 'space-between',
      alignItems: 'center',
      columnGap: spacing[3],
      minHeight: controls.touchTarget,
      paddingVertical: spacing[1],
      paddingHorizontal: spacing[4],
      borderRadius: shapes.lg,
      backgroundColor: colors.snackbar,
    },
    content: {
      paddingVertical: spacing[2.5],
      flexGrow: 1,
      flexShrink: 1,
      flexBasis: 180,
      minWidth: 0,
      color: colors.onSnackbar,
    },
    actionsContainer: {
      flexDirection: 'row',
      justifyContent: 'flex-end',
      alignItems: 'center',
      flexShrink: 0,
      marginLeft: 'auto',
      // The label lines up with the snackbar's edge; the padding sits outside
      marginRight: -spacing[3],
    },
    button: {
      minHeight: controls.touchTarget,
      justifyContent: 'center',
      paddingHorizontal: spacing[3],
      borderRadius: shapes.md,
    },
    buttonLabel: {
      color: colors.snackbarAction,
    },
  });
