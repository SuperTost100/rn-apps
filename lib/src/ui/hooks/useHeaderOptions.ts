import { createElement, useMemo } from 'react';
import { StyleSheet } from 'react-native';

import { NativeStackNavigationOptions } from '@react-navigation/native-stack';

import { AppHeader } from '../components/AppHeader';
import { useTheme } from './useTheme';
import { useTitlesStyles } from './useTitlesStyles';

/**
 * The first screen of a tab: the navy header with the section name as a
 * large title, light status bar content and no shadow. The title grows with
 * the in-app text size and wraps, so the header is drawn in JS. The screen's
 * `headerRight` sits next to the title on the header colour.
 */
export const useTabRootHeaderOptions = (): NativeStackNavigationOptions =>
  useMemo(
    () => ({
      headerShown: true,
      headerLargeTitle: false,
      header: props => createElement(AppHeader, { ...props, variant: 'root' }),
      // The banner and the content start under the header, not under a line
      contentStyle: undefined,
    }),
    [],
  );

/**
 * Every other screen of a stack: a plain surface header with a back arrow,
 * the title of the thing itself on the left and a hairline under it. The
 * header is native, not transparent and has no large title on either
 * platform, so the content and the offline banner start right under it.
 */
export const useInnerHeaderOptions = (): NativeStackNavigationOptions => {
  const { colors } = useTheme();
  return {
    ...useInnerTitleOptions(),
    headerLargeTitle: false,
    headerTransparent: false,
    headerShadowVisible: false,
    headerBackButtonDisplayMode: 'minimal',
    headerStyle: { backgroundColor: colors.surface },
    // The hairline under the header, drawn on the content so it looks the
    // same on both platforms (the native shadow is a blur on Android)
    contentStyle: {
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: colors.divider,
    },
  };
};

/**
 * The title of the inner headers alone, for navigators that draw their own
 * header (the map in Places)
 */
export const useInnerTitleOptions = (): NativeStackNavigationOptions => {
  const theme = useTheme();
  return {
    ...useTitlesStyles(theme, 'inner'),
    headerTitleAlign: 'left',
    headerTintColor: theme.colors.title,
  };
};

/** For screens whose first row is a tab row that draws its own line */
export const withoutHeaderHairline: NativeStackNavigationOptions = {
  contentStyle: undefined,
};
