import { ReactElement } from 'react';
import { View, ViewProps } from 'react-native';

import { useTheme } from '../hooks/useTheme';
import { CardProps } from './Card';
import { Text, TextProps } from './Text';

type Props = ViewProps & {
  title?: string;
  value: string | number | ReactElement;
  color?: string;
  valueStyle?: TextProps['style'];
  valueNumberOfLines?: number;
  /**
   * small (default): the value as a bold title, e.g. a period or a year.
   * number and display: large figures, e.g. averages and credits.
   */
  size?: 'small' | 'number' | 'display';
};

/**
 * A label and its value, e.g. "Period" and "1 - 2027"
 */
export const Metric = ({
  title,
  value,
  color,
  valueStyle,
  valueNumberOfLines,
  size = 'small',
  ...rest
}: CardProps & Props) => {
  const { colors } = useTheme();

  return (
    <View {...rest}>
      {title && (
        <Text variant="secondaryText" accessible={false}>
          {title}
        </Text>
      )}
      {['string', 'number'].includes(typeof value) ? (
        <Text
          accessible={false}
          variant={size === 'small' ? 'title' : size}
          weight={size === 'small' ? 'bold' : undefined}
          numberOfLines={valueNumberOfLines}
          ellipsizeMode={valueNumberOfLines != null ? 'tail' : undefined}
          style={[
            { color: color ?? colors.title, fontVariant: ['tabular-nums'] },
            valueStyle,
          ]}
        >
          {value}
        </Text>
      ) : (
        value
      )}
    </View>
  );
};
