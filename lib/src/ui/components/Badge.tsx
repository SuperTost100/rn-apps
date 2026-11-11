import { ViewProps } from 'react-native';

import { IconDefinition } from '@fortawesome/fontawesome-svg-core';

import { useTextScale } from '../hooks/useTextScale';
import { useTheme } from '../hooks/useTheme';
import { Icon } from './Icon';
import { Row } from './Row';
import { Text } from './Text';

type Props = ViewProps & {
  text: string;
  icon?: IconDefinition;
  backgroundColor: string;
  foregroundColor: string;
};

export const Badge = ({
  text,
  icon,
  backgroundColor,
  foregroundColor,
  style,
}: Props) => {
  const { spacing, shapes, fontSizes, fontFamilies } = useTheme();
  const { isLarge } = useTextScale();
  return (
    <Row
      gap={2}
      style={[
        {
          backgroundColor: backgroundColor,
          paddingLeft: spacing[1.5],
          paddingRight: spacing[2],
          paddingVertical: spacing[1],
          borderRadius: shapes.xl,
        },
        isLarge && {
          alignSelf: 'flex-start',
        },
        !icon && {
          paddingRight: spacing[1.5],
        },
        style,
      ]}
    >
      {icon && <Icon icon={icon} size={fontSizes.md} color={foregroundColor} />}
      <Text
        style={{
          color: foregroundColor,
          fontSize: fontSizes.xs,
          fontFamily: fontFamilies.title,
        }}
        weight="medium"
      >
        {text}
      </Text>
    </Row>
  );
};
