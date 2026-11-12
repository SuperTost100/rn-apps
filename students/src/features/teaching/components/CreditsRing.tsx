import { PixelRatio, StyleSheet, View } from 'react-native';
import { Circle, Svg } from 'react-native-svg';

import { Text, useTextScale, useTheme } from '@polito/lib/ui';

interface Props {
  /** Credits acquired: the inner ring */
  acquired: number;
  /** Credits attended: the outer ring */
  attended: number;
  total: number;
  /** Grades are hidden: tracks only, and "--" for the figure */
  hidden?: boolean;
  /** The text alternative, stating both values */
  accessibilityLabel: string;
  /** Under the figure, e.g. "credits" */
  unit: string;
  /** Off inside a control whose label already states both values */
  accessible?: boolean;
}

/** 120 px at 100% text, as 7.5 rem in the mockup */
const BASE_SIZE = 120;
const STROKE = 10;
const OUTER_R = 52;
const INNER_R = 38;

/**
 * The double ring of the transcript: attended credits outside, acquired
 * credits inside, the acquired figure in the middle. It grows with the
 * in-app text size, so the figure inside still fits.
 */
export const CreditsRing = ({
  acquired,
  attended,
  total,
  hidden = false,
  accessibilityLabel,
  unit,
  accessible = true,
}: Props) => {
  const { colors } = useTheme();
  const { scale } = useTextScale();
  const size =
    BASE_SIZE * Math.min(scale * Math.max(PixelRatio.getFontScale(), 1), 2);

  const arc = (r: number, value: number, color: string) => {
    if (hidden || !total || value <= 0) return null;
    const circumference = 2 * Math.PI * r;
    const length = (circumference * Math.min(value, total)) / total;
    return (
      <Circle
        cx={60}
        cy={60}
        r={r}
        fill="none"
        stroke={color}
        strokeWidth={STROKE}
        strokeLinecap="round"
        strokeDasharray={`${length} ${circumference}`}
        // From the top, clockwise
        transform="rotate(-90 60 60)"
      />
    );
  };

  return (
    <View
      style={{ width: size, height: size }}
      accessible={accessible}
      accessibilityRole={accessible ? 'image' : undefined}
      accessibilityLabel={accessible ? accessibilityLabel : undefined}
      importantForAccessibility={accessible ? 'auto' : 'no-hide-descendants'}
    >
      <Svg width={size} height={size} viewBox="0 0 120 120">
        {[OUTER_R, INNER_R].map(r => (
          <Circle
            key={r}
            cx={60}
            cy={60}
            r={r}
            fill="none"
            stroke={colors.ringTrack}
            strokeWidth={STROKE}
          />
        ))}
        {arc(OUTER_R, attended, colors.ringAttended)}
        {arc(INNER_R, acquired, colors.ringFill)}
      </Svg>
      <View
        style={styles.center}
        importantForAccessibility="no-hide-descendants"
        accessibilityElementsHidden
      >
        <Text
          variant="title"
          weight="bold"
          style={[styles.figure, { color: colors.title }]}
        >
          {`${hidden ? '--' : acquired}/${total}`}
        </Text>
        <Text variant="caption" style={styles.unit}>
          {unit}
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  center: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
  },
  figure: {
    fontVariant: ['tabular-nums'],
  },
  unit: {
    textTransform: 'none',
    letterSpacing: 0,
  },
});
