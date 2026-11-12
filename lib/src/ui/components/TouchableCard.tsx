import { PropsWithChildren } from 'react';
import {
  StyleProp,
  TouchableHighlight,
  TouchableHighlightProps,
  ViewProps,
  ViewStyle,
} from 'react-native';

import { useTheme } from '../hooks/useTheme';
import { Card } from './Card';

export type TouchableCardProps = PropsWithChildren<
  ViewProps &
    TouchableHighlightProps & {
      /**
       * Toggles the rounded corners
       */
      rounded?: boolean;
      cardStyle?: StyleProp<ViewStyle>;
    }
>;

export const TouchableCard = ({
  children,
  style,
  cardStyle,
  rounded = true,
  disabled,
  accessibilityState,
  ...rest
}: TouchableCardProps) => {
  const { colors, shapes } = useTheme();

  return (
    <TouchableHighlight
      underlayColor={colors.touchableHighlight}
      style={[rounded && { borderRadius: shapes.lg }, style]}
      disabled={disabled}
      accessibilityRole={rest.onPress ? 'button' : undefined}
      accessibilityState={{ disabled: !!disabled, ...accessibilityState }}
      {...rest}
    >
      <Card
        style={[{ marginVertical: 0 }, disabled && { opacity: 0.5 }, cardStyle]}
        spaced={false}
        rounded
      >
        {children}
      </Card>
    </TouchableHighlight>
  );
};
