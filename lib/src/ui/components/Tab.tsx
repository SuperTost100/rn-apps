import { PropsWithChildren } from 'react';
import {
  StyleProp,
  StyleSheet,
  TextStyle,
  TouchableHighlight,
  TouchableHighlightProps,
  View,
} from 'react-native';

import { useStylesheet } from '../hooks/useStylesheet';
import { useTheme } from '../hooks/useTheme';
import { Theme } from '../types/Theme';
import { Text } from './Text';
import { UnreadBadge } from './UnreadBadge';

export interface TabProps {
  selected?: boolean;
  textStyle?: StyleProp<TextStyle>;
  badge?: number | string;
}

/** The underline of the selected tab */
const UNDERLINE = 3;

/**
 * An underlined text tab, to be used with Tabs: 48 px tall, the label in
 * the tab colour and, when selected, darker with a 3 px underline. A count
 * sits centred after the label.
 */
export const Tab = ({
  children,
  style,
  selected = false,
  textStyle,
  badge,
  accessibilityState,
  ...rest
}: PropsWithChildren<TouchableHighlightProps & TabProps>) => {
  const { colors } = useTheme();
  const styles = useStylesheet(createStyles);

  return (
    <TouchableHighlight
      accessibilityRole="tab"
      accessible={true}
      accessibilityState={{ selected, ...accessibilityState }}
      underlayColor={colors.touchableHighlight}
      style={[styles.tab, style]}
      {...rest}
    >
      <View style={styles.content}>
        <Text
          variant="label"
          numberOfLines={1}
          style={[
            { color: selected ? colors.onTabSelected : colors.tabText },
            textStyle,
          ]}
        >
          {children}
        </Text>
        {!!badge && <UnreadBadge text={badge} />}
        {selected && <View style={styles.underline} />}
      </View>
    </TouchableHighlight>
  );
};

const createStyles = ({ colors, controls, spacing }: Theme) =>
  StyleSheet.create({
    tab: {
      minHeight: controls.touchTarget,
      justifyContent: 'center',
      paddingHorizontal: spacing[3],
    },
    content: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing[2],
      alignSelf: 'stretch',
      flexGrow: 1,
    },
    underline: {
      position: 'absolute',
      left: -spacing[3],
      right: -spacing[3],
      bottom: 0,
      height: UNDERLINE,
      backgroundColor: colors.tabUnderline,
    },
  });
