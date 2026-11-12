import { Platform, Switch as RNSwitch, SwitchProps } from 'react-native';

import { useTheme } from '../hooks/useTheme';

/**
 * A switch in the theme's colours: the primary track when on, and when off
 * a track whose edge has 3:1 contrast with the surface
 */
export const Switch = ({ children, ...rest }: SwitchProps) => {
  const { colors } = useTheme();
  const on = !!rest.value;
  return (
    <RNSwitch
      trackColor={{
        true: colors.primary,
        // On iOS this colours the edge of the off track, on Android the track
        false: colors.controlBorder,
      }}
      ios_backgroundColor={colors.surfaceSunken}
      thumbColor={Platform.select({
        android: on ? colors.onPrimary : colors.surface,
      })}
      {...rest}
    >
      {children}
    </RNSwitch>
  );
};
