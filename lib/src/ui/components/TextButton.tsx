import { PropsWithChildren } from 'react';
import { TouchableOpacity, TouchableOpacityProps } from 'react-native';

import { useTheme } from '../hooks/useTheme';
import { Text } from './Text';

export const TextButton = ({
  children,
  style,
  ...rest
}: PropsWithChildren<TouchableOpacityProps>) => {
  const { colors, spacing, fontWeights, fontSizes } = useTheme();
  return (
    <TouchableOpacity
      style={[
        {
          padding: spacing[2],
          marginRight: -spacing[2],
        },
        style,
      ]}
      {...rest}
    >
      <Text
        style={{
          color: colors.link,
          fontWeight: fontWeights.semibold,
          fontSize: fontSizes.md,
        }}
      >
        {children}
      </Text>
    </TouchableOpacity>
  );
};
