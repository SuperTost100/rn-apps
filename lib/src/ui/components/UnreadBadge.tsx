import { useTranslation } from 'react-i18next';
import { TextProps, View } from 'react-native';

import { isNumber } from 'lodash';

import { useTheme } from '../hooks/useTheme';
import { useCountBadgeMetrics } from './Badge';
import { Text } from './Text';
import { VisuallyHidden } from './VisuallyHidden';

interface Props {
  text?: string | number;
  style?: TextProps['style'];
  variant?: 'outlined' | 'filled';
  isNumeric?: boolean;
}

/** The unread dot, when there is no count: always next to bold text */
const DOT_SIZE = 10;

/**
 * An unread count in a round badge, or a dot without one. The number is
 * centred and grows with the text size; the pill keeps its shape.
 */
export const UnreadBadge = ({
  text,
  style,
  variant = 'filled',
  isNumeric = false,
}: Props) => {
  const { t } = useTranslation();
  const { colors, shapes } = useTheme();
  const metrics = useCountBadgeMetrics();
  const isOutlined = variant === 'outlined';
  const isDigit = isNumber(text);
  // 0 and an empty text show the dot, as before
  const hasText = !!text;

  if (!hasText) {
    return (
      <View
        style={[
          {
            width: DOT_SIZE,
            height: DOT_SIZE,
            borderRadius: shapes.pill,
            backgroundColor: colors.badge,
            flexShrink: 0,
          },
          style,
        ]}
      />
    );
  }

  const border = isOutlined
    ? isDigit || isNumeric
      ? colors.badge
      : colors.accentText
    : undefined;

  return (
    <View
      style={[
        {
          minWidth: metrics.size,
          height: metrics.size,
          paddingHorizontal: metrics.paddingHorizontal,
          borderRadius: shapes.pill,
          backgroundColor: isOutlined ? colors.surface : colors.badge,
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
        },
        border !== undefined && { borderColor: border, borderWidth: 2 },
        style,
      ]}
    >
      <Text
        weight="bold"
        maxFontSizeMultiplier={metrics.maxFontSizeMultiplier}
        style={[
          metrics.textStyle,
          {
            color: isOutlined ? colors.accentText : colors.onBadge,
            textAlign: 'center',
            textTransform: 'uppercase',
            fontVariant: ['tabular-nums'],
          },
        ]}
      >
        {text}
        {isDigit && (
          <VisuallyHidden>
            {t('common.newItems', { count: Number(text) })}
          </VisuallyHidden>
        )}
      </Text>
    </View>
  );
};
