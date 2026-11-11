import { DarkTheme, DefaultTheme, Theme } from '@react-navigation/native';

import { Theme as UiTheme } from '../../ui/types/Theme';

export const fromUiTheme = (uiTheme: UiTheme): Theme => {
  const baseTheme = uiTheme.dark ? DarkTheme : DefaultTheme;
  const { colors } = uiTheme;
  return {
    ...baseTheme,
    colors: {
      ...baseTheme.colors,
      primary: colors.primary,
      background: colors.background,
      card: colors.surface,
      text: colors.title,
      notification: colors.badge,
      border: colors.divider,
    },
  };
};
