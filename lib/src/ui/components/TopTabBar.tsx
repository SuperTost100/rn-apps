import { Platform, StyleSheet } from 'react-native';

import { MaterialTopTabBarProps } from '@react-navigation/material-top-tabs';

import { useTheme } from '../hooks/useTheme';
import { HeaderAccessory } from './HeaderAccessory';
import { Tab } from './Tab';
import { Tabs } from './Tabs';

/**
 * Underlined text tabs under the header, scrolling sideways with a fade on
 * the side that has more and the selected tab kept in view
 */
export const TopTabBar = ({
  state,
  descriptors,
  navigation,
}: MaterialTopTabBarProps) => {
  const { colors, layout, spacing } = useTheme();
  // The same colour HeaderAccessory draws, so the fade blends into it
  const background = Platform.select({
    ios: colors.headersBackground,
    default: colors.surface,
  });
  return (
    <HeaderAccessory
      style={{
        borderBottomWidth: StyleSheet.hairlineWidth,
        borderBottomColor: colors.divider,
      }}
    >
      <Tabs
        fadeColor={background}
        selectedIndexes={[state.index]}
        contentContainerStyle={{
          // The label of the first tab lines up with the 16 px gutter
          paddingHorizontal: layout.gutter - spacing[3],
          paddingVertical: 0,
          gap: 0,
        }}
      >
        {state.routes.map((route, index) => {
          const { options } = descriptors[route.key];
          const label =
            options.tabBarLabel !== undefined
              ? options.tabBarLabel
              : options.title !== undefined
                ? options.title
                : route.name;

          const isFocused = state.index === index;

          const onPress = () => {
            const event = navigation.emit({
              type: 'tabPress',
              target: route.key,
              canPreventDefault: true,
            });

            if (!isFocused && !event.defaultPrevented) {
              // The `merge: true` option makes sure that the params inside the tab screen are preserved
              navigation.navigate({
                name: route.name,
                merge: true,
                params: {},
              });
            }
          };

          const onLongPress = () => {
            navigation.emit({
              type: 'tabLongPress',
              target: route.key,
            });
          };

          const badgeElement = options.tabBarBadge?.();
          const badgeText =
            badgeElement && 'props' in badgeElement
              ? ((badgeElement as any).props.children as string | number)
              : undefined;

          return (
            <Tab
              key={route.key}
              selected={isFocused}
              accessibilityLabel={options.tabBarAccessibilityLabel}
              testID={route.key}
              onPress={onPress}
              onLongPress={onLongPress}
              badge={badgeText}
            >
              {label as string}
            </Tab>
          );
        })}
      </Tabs>
    </HeaderAccessory>
  );
};
