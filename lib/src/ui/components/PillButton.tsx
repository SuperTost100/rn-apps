import {
  StyleSheet,
  TouchableOpacity,
  TouchableOpacityProps,
  View,
} from 'react-native';

import { useStylesheet } from '../hooks/useStylesheet';
import { useTheme } from '../hooks/useTheme';
import { Theme } from '../types/Theme';
import { useCountBadgeMetrics } from './Badge';
import { Text } from './Text';

export type PillButtonProps = TouchableOpacityProps & {
  /**
   * primary: filled, as a selected filter chip. neutral: outlined.
   * `selected` overrides it.
   */
  variant?: 'primary' | 'neutral';
  /** A filter chip's state: filled when selected, reported to screen readers */
  selected?: boolean;
  /** A count after the label, in a centred badge */
  count?: number;
};

/**
 * A filter chip: 40 px tall with a 48 px target, fully round
 */
export const PillButton = ({
  children,
  style,
  variant = 'primary',
  selected,
  count,
  accessibilityState,
  ...props
}: PillButtonProps) => {
  const styles = useStylesheet(createStyles);
  const { colors, controls } = useTheme();
  const filled = selected ?? variant === 'primary';
  const slop = (controls.touchTarget - controls.chipHeight) / 2;
  const badge = useCountBadgeMetrics();

  return (
    <TouchableOpacity
      accessibilityRole="button"
      accessibilityState={{
        ...(selected !== undefined ? { selected } : {}),
        disabled: !!props.disabled,
        ...accessibilityState,
      }}
      hitSlop={{ top: slop, bottom: slop }}
      style={[
        styles.container,
        filled ? styles.containerSelected : styles.containerNeutral,
        count !== undefined && styles.withCount,
        style,
      ]}
      activeOpacity={0.7}
      {...props}
    >
      {typeof children === 'string' ? (
        <Text
          variant="label"
          style={{ color: filled ? colors.onSelectedChip : colors.title }}
        >
          {children}
        </Text>
      ) : (
        children
      )}
      {count !== undefined && (
        <View
          style={[
            styles.count,
            {
              minWidth: badge.size,
              height: badge.size,
              paddingHorizontal: badge.paddingHorizontal,
            },
          ]}
        >
          <Text
            weight="bold"
            maxFontSizeMultiplier={badge.maxFontSizeMultiplier}
            style={[badge.textStyle, styles.countText]}
          >
            {count}
          </Text>
        </View>
      )}
    </TouchableOpacity>
  );
};

const createStyles = ({ colors, controls, shapes, spacing }: Theme) =>
  StyleSheet.create({
    container: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: spacing[2],
      minHeight: controls.chipHeight,
      paddingHorizontal: spacing[4],
      borderRadius: shapes.pill,
    },
    containerNeutral: {
      backgroundColor: colors.surface,
      borderColor: colors.controlBorder,
      borderWidth: 1,
    },
    containerSelected: {
      backgroundColor: colors.selectedChip,
    },
    withCount: {
      paddingRight: spacing[2.5],
    },
    count: {
      borderRadius: shapes.pill,
      backgroundColor: colors.badge,
      alignItems: 'center',
      justifyContent: 'center',
    },
    countText: {
      color: colors.onBadge,
      textAlign: 'center',
    },
  });
