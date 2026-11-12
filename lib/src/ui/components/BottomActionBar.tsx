import { PropsWithChildren } from 'react';
import { StyleSheet, View, ViewProps } from 'react-native';

import { useSafeBottomBarHeight } from '../hooks/useSafeBottomBarHeight';
import { useStylesheet } from '../hooks/useStylesheet';
import { useTheme } from '../hooks/useTheme';
import { Theme } from '../types/Theme';

/**
 * A bar at the bottom of a screen for its main action (New ticket, New
 * booking) or a reply field. It sits in the layout under the scrolling
 * content, directly above the tab bar, so it never covers the last rows.
 * Put it after a ScrollView with flex: 1, inside a view with flex: 1.
 */
export const BottomActionBar = ({
  children,
  style,
  ...rest
}: PropsWithChildren<ViewProps>) => {
  const styles = useStylesheet(createStyles);
  const { spacing } = useTheme();
  // The tab bar floats over the screen: the bar reaches under it
  const bottomBarHeight = useSafeBottomBarHeight();
  return (
    <View
      style={[
        styles.bar,
        { paddingBottom: spacing[3] + bottomBarHeight },
        style,
      ]}
      {...rest}
    >
      {children}
    </View>
  );
};

const createStyles = ({ colors, layout, spacing }: Theme) =>
  StyleSheet.create({
    bar: {
      backgroundColor: colors.surface,
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: colors.divider,
      paddingHorizontal: layout.gutter,
      paddingTop: spacing[3],
    },
  });
