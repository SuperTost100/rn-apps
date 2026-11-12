import { Pressable, PressableProps, StyleSheet, View } from 'react-native';

import { useStylesheet } from '../hooks/useStylesheet';
import { useTheme } from '../hooks/useTheme';
import { Theme } from '../types/Theme';
import { ActivityIndicator } from './ActivityIndicator';
import { OutlineIcon, OutlineIconName } from './OutlineIcon';

interface Props extends Omit<PressableProps, 'children'> {
  icon: OutlineIconName;
  /** What the button does, read by screen readers */
  accessibilityLabel: string;
  color?: string;
  size?: number;
  loading?: boolean;
}

/**
 * A 48 px button with an outline glyph (attach, send, copy, more). Disabled
 * buttons fade and report their state.
 */
export const OutlineIconButton = ({
  icon,
  color,
  size = 24,
  loading = false,
  disabled,
  style,
  accessibilityState,
  ...rest
}: Props) => {
  const { colors } = useTheme();
  const styles = useStylesheet(createStyles);
  const inactive = !!disabled || loading;
  return (
    <Pressable
      accessibilityRole="button"
      disabled={inactive}
      accessibilityState={{
        disabled: inactive,
        busy: loading,
        ...accessibilityState,
      }}
      hitSlop={4}
      style={state => [
        styles.button,
        state.pressed && { backgroundColor: colors.touchableHighlight },
        typeof style === 'function' ? style(state) : style,
      ]}
      {...rest}
    >
      <View style={!!disabled && styles.disabled}>
        {loading ? (
          <ActivityIndicator />
        ) : (
          <OutlineIcon name={icon} size={size} color={color ?? colors.link} />
        )}
      </View>
    </Pressable>
  );
};

const createStyles = ({ controls, shapes }: Theme) =>
  StyleSheet.create({
    button: {
      minWidth: controls.touchTarget,
      minHeight: controls.touchTarget,
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: shapes.pill,
    },
    disabled: {
      opacity: 0.4,
    },
  });
