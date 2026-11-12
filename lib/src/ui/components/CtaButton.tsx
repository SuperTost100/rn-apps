import { ReactElement } from 'react';
import {
  Platform,
  StyleSheet,
  TextStyle,
  TouchableHighlight,
  TouchableHighlightProps,
  View,
  ViewStyle,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useFeedbackContext } from '../../core/contexts/FeedbackContext';
import { useSafeBottomBarHeight } from '../hooks/useSafeBottomBarHeight';
import { useStylesheet } from '../hooks/useStylesheet';
import { useTextScale } from '../hooks/useTextScale';
import { useTheme } from '../hooks/useTheme';
import { Theme } from '../types/Theme';
import { shadeColor } from '../utils/colors';
import { ActivityIndicator } from './ActivityIndicator';
import { Icon } from './Icon';
import { IconWithProgress } from './IconWithProgress';
import { Text } from './Text';
import { TextWithLinks } from './TextWithLinks';

interface Props extends TouchableHighlightProps {
  containerStyle?: ViewStyle;
  icon?: any;
  absolute?: boolean;
  title?: string;
  rightExtra?: ReactElement;
  loading?: boolean;
  action: () => unknown | Promise<unknown>;
  /** filled: primary. outlined: secondary, on the surface with a border */
  variant?: 'filled' | 'outlined';
  destructive?: boolean;
  success?: boolean;
  hint?: string;
  textStyle?: TextStyle;
  progress?: number;
}

const HAS_URL = /https?:\/\//;

/**
 * A call-to-action button with in-place loading indicator: 48 px tall, the
 * card radius on both platforms. While loading it keeps its width, hides the
 * label under the spinner and ignores presses.
 *
 * By default it floats above the tab bar (absolute); pass absolute={false}
 * to place it in the flow.
 */
export const CtaButton = ({
  style,
  absolute = true,
  title,
  loading = false,
  disabled,
  destructive = false,
  success = false,
  action,
  icon,
  rightExtra,
  hint,
  containerStyle,
  variant = 'filled',
  textStyle,
  progress,
  accessibilityState,
  ...rest
}: Props) => {
  const { colors, spacing, controls, elevation } = useTheme();
  const styles = useStylesheet(createStyles);
  const { left, right } = useSafeAreaInsets();
  const bottomBarHeight = useSafeBottomBarHeight();
  const { isFeedbackVisible } = useFeedbackContext();
  const { isLarge } = useTextScale();

  const outlined = variant === 'outlined';
  const inactive = !!disabled || loading;

  let background: string;
  let foreground: string;
  let border: string | undefined;
  let underlay: string;
  if (success) {
    // A done state, usually disabled too: it stays green
    background = colors.successBg;
    foreground = colors.successText;
    underlay = background;
  } else if (disabled) {
    background = colors.disabledBg;
    foreground = colors.onDisabled;
    underlay = background;
  } else if (outlined) {
    background = colors.surface;
    foreground = destructive ? colors.dangerText : colors.link;
    border = destructive ? colors.dangerText : colors.controlBorder;
    underlay = colors.selectedRow;
  } else if (destructive) {
    background = colors.dangerSolid;
    foreground = colors.onDangerSolid;
    underlay = shadeColor(colors.dangerSolid, -12);
  } else {
    background = colors.primary;
    foreground = colors.onPrimary;
    underlay = colors.primaryPressed;
  }

  const label = title ? (
    HAS_URL.test(title) ? (
      <TextWithLinks
        style={[styles.title, { color: foreground }, textStyle]}
        baseStyle={{ color: foreground }}
        isCta={true}
      >
        {title}
      </TextWithLinks>
    ) : (
      <Text
        variant="button"
        style={[styles.title, { color: foreground }, textStyle]}
      >
        {title}
      </Text>
    )
  ) : null;

  return (
    <View
      style={[
        styles.container,
        absolute && {
          position: 'absolute',
          width: Platform.select({ android: '100%' }),
          left: Platform.select({ ios: left }),
          right,
          bottom: bottomBarHeight + (isFeedbackVisible ? spacing[20] : 0),
        },
        !!hint && { paddingTop: spacing[3] },
        containerStyle,
      ]}
    >
      {hint && (
        <View
          importantForAccessibility="no-hide-descendants"
          accessibilityElementsHidden={true}
        >
          <Text variant="secondaryText" style={styles.hint}>
            {hint}
          </Text>
        </View>
      )}
      <TouchableHighlight
        accessibilityRole="button"
        underlayColor={underlay}
        disabled={inactive}
        style={[
          styles.button,
          { backgroundColor: background, minHeight: controls.buttonHeight },
          border && { borderColor: border, borderWidth: 1.5 },
          // Floating above the content, a filled button keeps a shadow
          absolute && !outlined && !inactive && elevation.card,
          style,
        ]}
        accessibilityLabel={title}
        accessibilityState={{
          disabled: inactive,
          busy: loading,
          ...accessibilityState,
        }}
        onPress={action}
        {...rest}
      >
        <View>
          <View style={[styles.content, loading && styles.hidden]}>
            {icon &&
              !isLarge &&
              (progress !== undefined ? (
                <IconWithProgress
                  icon={icon}
                  size={controls.iconSize - 4}
                  color={foreground}
                  progress={progress}
                  progressColor={foreground}
                />
              ) : (
                <Icon
                  icon={icon}
                  size={controls.iconSize - 4}
                  color={foreground}
                />
              ))}
            {label}
            {rightExtra && rightExtra}
          </View>
          {loading && (
            <View style={styles.spinner}>
              <ActivityIndicator color={foreground} />
            </View>
          )}
        </View>
      </TouchableHighlight>
    </View>
  );
};

/**
 * A spacer to be added at the bottom of the underlying scrolling container
 * to ensure that the CtaButton won't cover the last elements
 */
export const CtaButtonSpacer = () => {
  const { spacing } = useTheme();
  return <View style={{ height: spacing[20] }} />;
};

const createStyles = ({ shapes, spacing, layout }: Theme) =>
  StyleSheet.create({
    container: {
      padding: layout.gutter,
    },
    button: {
      justifyContent: 'center',
      paddingHorizontal: spacing[5],
      paddingVertical: spacing[3],
      borderRadius: shapes.lg,
    },
    content: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: spacing[2],
    },
    // Keeps the width of the label while the spinner shows
    hidden: {
      opacity: 0,
    },
    spinner: {
      ...StyleSheet.absoluteFillObject,
      alignItems: 'center',
      justifyContent: 'center',
    },
    title: {
      textAlign: 'center',
      flexShrink: 1,
    },
    hint: {
      textAlign: 'center',
      paddingBottom: spacing[2],
    },
  });
