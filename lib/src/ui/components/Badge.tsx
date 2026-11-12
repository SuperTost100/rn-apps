import { useWindowDimensions } from 'react-native';
import { ViewProps } from 'react-native';

import { IconDefinition } from '@fortawesome/fontawesome-svg-core';

import { useTextScale } from '../hooks/useTextScale';
import { useTheme } from '../hooks/useTheme';
import { MAX_COMBINED_TEXT_SCALE } from '../utils/text-scale';
import { Icon } from './Icon';
import { Row } from './Row';
import { Text } from './Text';

/** The count badge at 100%: 12 px bold on a 20 px line */
const COUNT_FONT = 12;
const COUNT_LINE = 16;
const COUNT_PAD_Y = 2;
/** Larger counts stop growing here, so a badge never turns into a tall pill */
const COUNT_MAX_FONT = 18;

/**
 * Sizes for a count badge from the in-app and the phone's text scale: the
 * number grows with the text up to 18 px and the pill keeps its shape
 * around it. Pass `fontSize`, `lineHeight` and `maxFontSizeMultiplier` to
 * the shared Text, which applies the in-app scale once more.
 */
export const useCountBadgeMetrics = () => {
  const { scale } = useTextScale();
  const { fontScale } = useWindowDimensions();
  const combined = Math.min(scale * fontScale, MAX_COMBINED_TEXT_SCALE);
  const font = Math.min(COUNT_FONT * combined, COUNT_MAX_FONT);
  const line = Math.round((font * COUNT_LINE) / COUNT_FONT);
  const size = line + 2 * COUNT_PAD_Y;
  return {
    /** Height and minimum width of the pill */
    size,
    paddingHorizontal: Math.round(size * 0.3),
    textStyle: { fontSize: font / scale, lineHeight: line / scale },
    maxFontSizeMultiplier: 1,
  };
};

type Props = ViewProps & {
  text: string;
  icon?: IconDefinition;
  backgroundColor: string;
  foregroundColor: string;
};

/**
 * A word, with an optional icon, on a round tinted background. For states
 * prefer StatusChip, which takes a tone instead of colours.
 */
export const Badge = ({
  text,
  icon,
  backgroundColor,
  foregroundColor,
  style,
  ...rest
}: Props) => {
  const { spacing, shapes } = useTheme();
  return (
    <Row
      gap={1}
      align="center"
      style={[
        {
          alignSelf: 'flex-start',
          backgroundColor: backgroundColor,
          paddingHorizontal: spacing[2.5],
          paddingVertical: spacing[0.5],
          borderRadius: shapes.pill,
        },
        style,
      ]}
      {...rest}
    >
      {icon && <Icon icon={icon} size={14} color={foregroundColor} />}
      <Text variant="chip" style={{ color: foregroundColor }} numberOfLines={1}>
        {text}
      </Text>
    </Row>
  );
};
