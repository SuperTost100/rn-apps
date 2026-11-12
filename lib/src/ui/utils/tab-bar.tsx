import { StyleProp, ViewStyle } from 'react-native';

import { NavigationProp } from '@react-navigation/native';

export const tabBarStyle: ViewStyle = {
  position: 'absolute',
  display: 'flex',
};

// The style the app's tab navigator sets, so showing the bar again restores
// it whole (its height and the Android inset included) instead of replacing
// it with the base style above
let appTabBarStyle: StyleProp<ViewStyle> = tabBarStyle;

/** Called by the app's tab navigator with the style it sets */
export const setAppTabBarStyle = (style: StyleProp<ViewStyle>) => {
  appTabBarStyle = style;
};

export const hideTabBar = (navigation: NavigationProp<any>) => {
  navigation.setOptions({
    tabBarStyle: {
      display: 'none',
    },
  });
};

export const displayTabBar = (navigation: NavigationProp<any>) => {
  navigation.setOptions({
    tabBarStyle: appTabBarStyle,
  });
};
