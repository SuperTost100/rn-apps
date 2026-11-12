import { TouchableOpacity, TouchableOpacityProps } from 'react-native';

import { Props as FAProps } from '@fortawesome/react-native-fontawesome';

import { useTheme } from '../hooks/useTheme';
import { ActivityIndicator } from './ActivityIndicator';
import { Icon } from './Icon';

type Props = Omit<FAProps, 'style'> &
  TouchableOpacityProps & {
    iconStyle?: FAProps['style'];
    adjustSpacing?: 'left' | 'right';
    loading?: boolean;
    noPadding?: boolean;
    iconPadding?: number;
  };

export const IconButton = ({
  iconStyle,
  loading,
  adjustSpacing,
  iconPadding,
  noPadding = false,
  ...rest
}: Props) => {
  const { spacing, controls, colors } = useTheme();
  const {
    icon,
    height,
    width,
    size,
    color,
    secondaryColor,
    secondaryOpacity,
    mask,
    maskId,
    transform,
    testID,
    ...buttonProps
  } = rest;
  const { style, ...otherButtonProps } = buttonProps;
  const iconProps = {
    icon,
    height,
    width,
    size,
    color,
    secondaryColor,
    secondaryOpacity,
    mask,
    maskId,
    transform,
    testID,
  };
  const padding = iconPadding || (spacing[3] as number);
  const disabled = !!otherButtonProps.disabled || !!loading;
  const iconSize = typeof size === 'number' ? size : controls.iconSize - 8;
  // Without padding the target still reaches 48 px through the hit slop
  const slop = noPadding
    ? Math.max(0, (controls.touchTarget - iconSize) / 2)
    : 0;
  return (
    <TouchableOpacity
      accessibilityRole="button"
      hitSlop={{
        top: slop || undefined,
        bottom: slop || undefined,
        left: adjustSpacing === 'left' ? padding : slop || undefined,
        right: adjustSpacing === 'right' ? padding : slop || undefined,
      }}
      {...otherButtonProps}
      disabled={disabled}
      accessibilityState={{
        disabled,
        busy: !!loading,
        ...otherButtonProps.accessibilityState,
      }}
      style={[
        !noPadding && {
          padding,
          minHeight: controls.touchTarget,
          // With adjustSpacing the icon is pulled to the edge and the
          // padding becomes hit slop, so the width must not grow back
          minWidth: adjustSpacing ? undefined : controls.touchTarget,
          alignItems: 'center',
          justifyContent: 'center',
        },
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={color as string | undefined} />
      ) : (
        <Icon
          style={[
            {
              marginLeft: adjustSpacing === 'left' ? -padding : undefined,
              marginRight: adjustSpacing === 'right' ? -padding : undefined,
              opacity: otherButtonProps.disabled ? 0.5 : undefined,
            },
            iconStyle,
          ]}
          {...iconProps}
          color={color ?? colors.heading}
        />
      )}
    </TouchableOpacity>
  );
};
