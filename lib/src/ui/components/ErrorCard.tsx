import { PropsWithChildren, ReactElement } from 'react';
import { Platform, TextStyle, ViewProps, ViewStyle } from 'react-native';

import { faCircleExclamation } from '@fortawesome/free-solid-svg-icons';

import { useTheme } from '../hooks/useTheme';
import { Card } from './Card';
import { Icon } from './Icon';
import { Row } from './Row';
import { Text } from './Text';

type Props = PropsWithChildren<
  ViewProps & {
    text?: string;
    style?: ViewStyle;
    testStyle?: TextStyle;
    children?: ReactElement;
    spaced?: boolean;
  }
>;

/**
 * An error on a plain card: the alert icon in the danger colour, then the
 * text. No coloured border or bar: the icon and the words carry it.
 */
export const ErrorCard = ({
  text,
  style,
  testStyle,
  children,
  spaced = true,
  ...rest
}: Props) => {
  const { colors, layout, spacing } = useTheme();
  return (
    <Card
      accessible={Platform.select({ android: true, ios: false })}
      rounded
      spaced={spaced}
      translucent={false}
      style={style}
      {...rest}
    >
      {!children ? (
        <Row align="center" gap={3} style={{ padding: layout.cardPadding }}>
          <Icon
            icon={faCircleExclamation}
            size={20}
            color={colors.dangerText}
            style={{ marginVertical: spacing[0.5] }}
          />
          <Text
            variant="secondaryText"
            style={[{ color: colors.prose, flexShrink: 1 }, testStyle]}
          >
            {text && text.charAt(0).toUpperCase() + text.slice(1).toLowerCase()}
          </Text>
        </Row>
      ) : (
        children
      )}
    </Card>
  );
};
