import { StyleSheet, View, ViewProps, ViewStyle } from 'react-native';

import { IS_IOS } from '../../core/constants';
import { useTheme } from '../hooks/useTheme';

export type CardProps = ViewProps & {
  /**
   * Toggles the rounded corners
   */
  rounded?: boolean;

  /**
   * Toggles the inner spacing
   */
  padded?: boolean;

  /**
   * Toggles the outer spacing
   */
  spaced?: boolean;

  /**
   * Toggles the inner spacing
   */
  gapped?: boolean;

  /**
   * If true, uses a semi-transparent background
   * for use on translucent surfaces
   */
  translucent?: boolean;
};

/**
 * Style keys that place the card among its siblings. They stay on the outer
 * view, which draws the shadow; every other key goes to the inner view, which
 * clips the content to the corners.
 */
const OUTER_KEYS = new Set<string>([
  'margin',
  'marginTop',
  'marginBottom',
  'marginLeft',
  'marginRight',
  'marginStart',
  'marginEnd',
  'marginHorizontal',
  'marginVertical',
  'marginBlock',
  'marginBlockStart',
  'marginBlockEnd',
  'marginInline',
  'marginInlineStart',
  'marginInlineEnd',
  'position',
  'top',
  'bottom',
  'left',
  'right',
  'start',
  'end',
  'inset',
  'zIndex',
  'flex',
  'flexGrow',
  'flexShrink',
  'flexBasis',
  'alignSelf',
  'width',
  'minWidth',
  'maxWidth',
  'height',
  'minHeight',
  'maxHeight',
  'aspectRatio',
  'transform',
  'opacity',
  'display',
  'elevation',
  'shadowColor',
  'shadowOpacity',
  'shadowRadius',
  'shadowOffset',
]);

/** Keys both views need, so the shadow and the clip have the same shape */
const SHARED_KEYS = new Set<string>([
  'backgroundColor',
  'borderRadius',
  'borderTopLeftRadius',
  'borderTopRightRadius',
  'borderBottomLeftRadius',
  'borderBottomRightRadius',
]);

export const splitCardStyle = (style: ViewProps['style']) => {
  const flat = (StyleSheet.flatten(style) ?? {}) as Record<string, unknown>;
  const outer: Record<string, unknown> = {};
  const inner: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(flat)) {
    if (SHARED_KEYS.has(key)) {
      outer[key] = value;
      inner[key] = value;
    } else if (OUTER_KEYS.has(key)) {
      outer[key] = value;
    } else {
      inner[key] = value;
    }
  }
  return { outer: outer as ViewStyle, inner: inner as ViewStyle };
};

/**
 * A surface on the page: the card radius, a soft shadow in light on both
 * platforms, a hairline and no shadow in dark, the 16 px gutter outside and
 * 8 px above and below, so two cards never touch.
 */
export const Card = ({
  children,
  style,
  translucent = false,
  spaced = true,
  rounded = true,
  gapped = false,
  padded = false,
  ...rest
}: CardProps) => {
  const { colors, shapes, spacing, layout, elevation } = useTheme();
  const { outer, inner } = splitCardStyle(style);
  const radius = rounded ? shapes.lg : undefined;
  const backgroundColor =
    IS_IOS && translucent ? colors.translucentSurface : colors.surface;
  const shadow = translucent ? elevation.none : elevation.card;

  return (
    <View
      style={[
        shadow,
        {
          borderRadius: radius,
          backgroundColor,
          marginHorizontal: spaced ? layout.gutter : undefined,
          marginVertical: spacing[2],
        },
        outer,
      ]}
      {...rest}
    >
      <View
        style={[
          {
            borderRadius: radius,
            backgroundColor,
            overflow: 'hidden',
            flexGrow: 1,
            borderWidth: colors.cardBorder === 'transparent' ? 0 : 1,
            borderColor: colors.cardBorder,
          },
          padded && { padding: layout.cardPadding },
          gapped && { flexDirection: 'column', gap: spacing[2] },
          inner,
        ]}
      >
        {children}
      </View>
    </View>
  );
};
