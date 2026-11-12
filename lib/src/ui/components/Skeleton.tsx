import {
  PropsWithChildren,
  ReactNode,
  createContext,
  useContext,
  useEffect,
} from 'react';
import { useTranslation } from 'react-i18next';
import {
  DimensionValue,
  PixelRatio,
  StyleProp,
  View,
  ViewStyle,
} from 'react-native';
import Animated, {
  SharedValue,
  cancelAnimation,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';

import { useTextScale } from '../hooks/useTextScale';
import { useTheme } from '../hooks/useTheme';
import { Card } from './Card';
import { IndentedDivider } from './IndentedDivider';

/** The opacity every block of one region pulses with, together */
const PulseContext = createContext<SharedValue<number> | undefined>(undefined);

/** One slow fade, 1.4 s there and back, as in the mockup. No shimmer */
const PULSE_MS = 700;
const PULSE_LOW = 0.55;

/**
 * Line boxes grow with the text, as the real text does: the in-app scale
 * times the phone's font scale, capped at 2 like Text
 */
const useLineScale = () => {
  const { scale } = useTextScale();
  return Math.min(scale * PixelRatio.getFontScale(), 2);
};

interface SkeletonBoxProps {
  width?: DimensionValue;
  height: number;
  /** Default: the small radius (4) */
  radius?: number;
  round?: boolean;
  style?: StyleProp<ViewStyle>;
  /** On the navy header the blocks use the header's sunken colour */
  onHeader?: boolean;
}

/** One grey block */
export const SkeletonBox = ({
  width = '100%',
  height,
  radius,
  round,
  style,
  onHeader,
}: SkeletonBoxProps) => {
  const { colors, shapes } = useTheme();
  const pulse = useContext(PulseContext);
  const animatedStyle = useAnimatedStyle(() => ({
    opacity: pulse ? pulse.value : 1,
  }));
  return (
    <Animated.View
      style={[
        {
          width,
          height,
          borderRadius: round ? height / 2 : (radius ?? shapes.sm),
          backgroundColor: onHeader ? colors.headerSunken : colors.skeleton,
        },
        animatedStyle,
        style,
      ]}
    />
  );
};

interface SkeletonLineProps {
  /** The text variant whose line this stands for */
  variant?: 'title' | 'secondaryText' | 'heading' | 'caption' | 'prose';
  width?: DimensionValue;
  style?: StyleProp<ViewStyle>;
  onHeader?: boolean;
}

/** Line height and bar height of each variant, at 100% */
const LINE: Record<
  NonNullable<SkeletonLineProps['variant']>,
  [number, number]
> = {
  heading: [24, 16],
  title: [24, 16],
  prose: [24, 14],
  secondaryText: [20, 12],
  caption: [16, 10],
};

/** A bar standing for one line of text, in a box as tall as the line */
export const SkeletonLine = ({
  variant = 'title',
  width = '70%',
  style,
  onHeader,
}: SkeletonLineProps) => {
  const k = useLineScale();
  const [line, bar] = LINE[variant];
  return (
    <View
      style={[{ height: line * k, justifyContent: 'center', width }, style]}
    >
      <SkeletonBox height={bar * k} onHeader={onHeader} />
    </View>
  );
};

interface SkeletonRegionProps {
  /** Read once by screen readers instead of the blocks. Default: "Loading" */
  label?: string;
  style?: StyleProp<ViewStyle>;
}

/**
 * Wraps the blocks of one loading region: screen readers find one
 * "Loading" element and none of the blocks, and the blocks pulse together
 * unless the phone asks for reduced motion
 */
export const SkeletonRegion = ({
  label,
  style,
  children,
}: PropsWithChildren<SkeletonRegionProps>) => {
  const { t } = useTranslation();
  const reduceMotion = useReducedMotion();
  const pulse = useSharedValue(1);
  useEffect(() => {
    if (reduceMotion) {
      pulse.value = 1;
      return;
    }
    pulse.value = withRepeat(
      withTiming(PULSE_LOW, { duration: PULSE_MS }),
      -1,
      true,
    );
    return () => cancelAnimation(pulse);
  }, [pulse, reduceMotion]);

  return (
    <PulseContext.Provider value={pulse}>
      <View
        accessible={true}
        accessibilityRole="progressbar"
        accessibilityLabel={label ?? t('states.loading')}
        accessibilityState={{ busy: true }}
        style={style}
      >
        <View
          importantForAccessibility="no-hide-descendants"
          accessibilityElementsHidden={true}
        >
          {children}
        </View>
      </View>
    </PulseContext.Provider>
  );
};

export interface SkeletonRowsProps {
  /** Number of rows. Default 3 */
  count?: number;
  /** What the real rows have before the text. Default: none */
  leading?: 'none' | 'icon' | 'tile' | 'avatar';
  /** What the real rows have at the end. Default: chevron */
  trailing?: 'none' | 'chevron' | 'chip' | 'value';
  /** The real rows have a subtitle. Default: true */
  subtitle?: boolean;
  /** Two subtitle lines, for rows whose subtitle usually wraps */
  subtitleLines?: 1 | 2;
  /** Draw the rows inside a card, as OverviewList does. Default: true */
  card?: boolean;
  label?: string;
  style?: StyleProp<ViewStyle>;
}

const TITLE_WIDTHS: DimensionValue[] = [
  '72%',
  '56%',
  '84%',
  '64%',
  '76%',
  '50%',
];
const SUB_WIDTHS: DimensionValue[] = ['44%', '56%', '36%', '52%', '30%', '48%'];

/** Placeholder rows with the size and columns of ListItem rows */
export const SkeletonRows = ({
  count = 3,
  leading = 'none',
  trailing = 'chevron',
  subtitle = true,
  subtitleLines = 1,
  card = true,
  label,
  style,
}: SkeletonRowsProps) => {
  const { controls, layout, shapes } = useTheme();
  const textColumn =
    layout.cardPadding + controls.leadingSize + layout.leadingGap;

  const leadingBlock: Record<string, ReactNode> = {
    none: null,
    icon: <SkeletonBox width={24} height={24} />,
    tile: (
      <SkeletonBox
        width={controls.courseTileSize}
        height={controls.courseTileSize}
        radius={shapes.md}
      />
    ),
    avatar: <SkeletonBox width={40} height={40} round />,
  };
  const trailingBlock: Record<string, ReactNode> = {
    none: null,
    chevron: <SkeletonBox width={12} height={20} />,
    chip: <SkeletonBox width={72} height={24} round />,
    value: <SkeletonBox width={40} height={20} />,
  };

  const rows = Array.from({ length: count }, (_, i) => (
    <View key={i}>
      {i > 0 && (
        <IndentedDivider
          indent={leading === 'none' ? layout.cardPadding : textColumn}
        />
      )}
      <View
        style={{
          minHeight: controls.rowMinHeight,
          flexDirection: 'row',
          alignItems: 'center',
          paddingHorizontal: layout.cardPadding,
          paddingVertical: layout.rowPaddingVertical,
        }}
      >
        {leading !== 'none' && (
          <View
            style={{
              width: controls.leadingSize,
              alignItems: 'center',
              justifyContent: 'center',
              marginRight: layout.leadingGap,
            }}
          >
            {leadingBlock[leading]}
          </View>
        )}
        <View style={{ flex: 1 }}>
          <SkeletonLine width={TITLE_WIDTHS[i % 6]} />
          {subtitle && (
            <SkeletonLine variant="secondaryText" width={SUB_WIDTHS[i % 6]} />
          )}
          {subtitle && subtitleLines === 2 && (
            <SkeletonLine variant="secondaryText" width="28%" />
          )}
        </View>
        {trailing !== 'none' && (
          <View style={{ marginLeft: layout.leadingGap }}>
            {trailingBlock[trailing]}
          </View>
        )}
      </View>
    </View>
  ));

  return (
    <SkeletonRegion label={label} style={style}>
      {card ? <Card>{rows}</Card> : rows}
    </SkeletonRegion>
  );
};

interface SkeletonCardProps {
  /** The height of the real card, so nothing moves when it arrives */
  height: number;
  /** Text lines drawn inside, from the top */
  lines?: SkeletonLineProps['variant'][];
  label?: string;
  style?: StyleProp<ViewStyle>;
}

/** A card-shaped block, for content that is not a list */
export const SkeletonCard = ({
  height,
  lines = [],
  label,
  style,
}: SkeletonCardProps) => {
  const { layout, spacing } = useTheme();
  return (
    <SkeletonRegion label={label}>
      <Card
        style={[
          { minHeight: height, padding: layout.cardPadding, gap: spacing[1] },
          style,
        ]}
      >
        {lines.map((variant, i) => (
          <SkeletonLine
            key={i}
            variant={variant}
            width={TITLE_WIDTHS[(i + 2) % 6]}
          />
        ))}
      </Card>
    </SkeletonRegion>
  );
};
