import { Platform, Switch as RNSwitch, SwitchProps } from 'react-native';

import { useTheme } from '../hooks/useTheme';

/**
 * A switch in the theme's colours, as in the mockup: on, the primary track
 * with an onPrimary thumb; off, the sunken track with a thumb (Android) or
 * an edge (iOS) that has 3:1 contrast with the surface
 */
export const Switch = ({ children, ...rest }: SwitchProps) => {
  const { colors } = useTheme();
  const on = !!rest.value;
  return (
    <RNSwitch
      trackColor={{
        true: colors.primary,
        // iOS draws this as the edge of the off track: 3:1 on the surface.
        // Android fills the off track with it, and the thumb carries the 3:1.
        false: Platform.select({
          ios: colors.controlBorder,
          default: colors.surfaceSunken,
        }),
      }}
      ios_backgroundColor={colors.surfaceSunken}
      thumbColor={Platform.select({
        android: on ? colors.onPrimary : colors.controlBorder,
      })}
      {...rest}
    >
      {children}
    </RNSwitch>
  );
};
