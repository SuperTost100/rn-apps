import { PropsWithChildren, isValidElement } from 'react';
import {
  StyleSheet,
  TouchableHighlight,
  TouchableHighlightProps,
  View,
} from 'react-native';

import { useStylesheet } from '../hooks/useStylesheet';
import { useTheme } from '../hooks/useTheme';
import { Theme } from '../types/Theme';
import { ActivityIndicator } from './ActivityIndicator';
import { Text } from './Text';

export type TextButtonProps = PropsWithChildren<
  TouchableHighlightProps & {
    /** Red label, for actions that cancel or remove something */
    destructive?: boolean;
    /** Shows a spinner before the label and blocks presses */
    loading?: boolean;
  }
>;

/**
 * A button that is only its label: 48 px tall, 12 px to the sides. Its
 * label lines up with the content beside it, the padding sits outside.
 */
export const TextButton = ({
  children,
  style,
  destructive = false,
  loading = false,
  disabled,
  accessibilityState,
  ...rest
}: TextButtonProps) => {
  const { colors } = useTheme();
  const styles = useStylesheet(createStyles);
  const inactive = disabled || loading;
  const color = disabled
    ? colors.secondaryText
    : destructive
      ? colors.dangerText
      : colors.link;
  return (
    <TouchableHighlight
      underlayColor={colors.touchableHighlight}
      style={[styles.button, style]}
      disabled={inactive}
      accessibilityRole="button"
      accessibilityState={{
        disabled: !!inactive,
        busy: loading,
        ...accessibilityState,
      }}
      {...rest}
    >
      <View style={styles.content}>
        {loading && <ActivityIndicator size="small" color={color} />}
        {isValidElement(children) ? (
          children
        ) : (
          <Text variant="label" style={{ color }}>
            {children}
          </Text>
        )}
      </View>
    </TouchableHighlight>
  );
};

const createStyles = ({ controls, shapes, spacing }: Theme) =>
  StyleSheet.create({
    button: {
      minHeight: controls.touchTarget,
      justifyContent: 'center',
      paddingHorizontal: spacing[3],
      marginRight: -spacing[3],
      borderRadius: shapes.md,
    },
    content: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing[2],
    },
  });
