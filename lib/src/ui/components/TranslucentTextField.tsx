import { Platform, StyleSheet, ViewStyle } from 'react-native';

import { IconDefinition } from '@fortawesome/fontawesome-svg-core';
import { faTimesCircle } from '@fortawesome/free-solid-svg-icons';

import { useStylesheet } from '../hooks/useStylesheet';
import { Theme } from '../types/Theme';
import { ActivityIndicator } from './ActivityIndicator';
import { Icon } from './Icon';
import { IconButton } from './IconButton';
import { Row } from './Row';
import { TextField, TextFieldProps } from './TextField';

export interface TranslucentTextFieldProps extends TextFieldProps {
  leadingIcon?: IconDefinition;
  isClearable?: boolean;
  onClear?: () => void;
  onClearLabel?: string;
  containerStyle?: ViewStyle;
  isLoading?: boolean;
}

export const TranslucentTextField = ({
  containerStyle,
  style,
  inputStyle,
  leadingIcon,
  isClearable,
  onClear,
  onClearLabel,
  isLoading,
  ...props
}: TranslucentTextFieldProps) => {
  const styles = useStylesheet(createStyles);
  return (
    <Row
      style={[styles.container, containerStyle]}
      align="center"
      gap={3}
      mh={3}
      ph={4}
    >
      {isLoading ? (
        <ActivityIndicator />
      ) : (
        leadingIcon && (
          <Icon icon={leadingIcon} size={20} color={styles.icon.color} />
        )
      )}
      <TextField
        clearButtonMode="never"
        {...props}
        style={[styles.textField, style]}
        inputStyle={[styles.input, inputStyle]}
      />
      {isClearable && (
        <IconButton
          noPadding
          onPress={onClear}
          icon={faTimesCircle}
          color={styles.icon.color}
          accessibilityRole="button"
          accessibilityLabel={onClearLabel}
        />
      )}
    </Row>
  );
};

// The sunken search field: 48 px, the card radius, a 20 px icon
const createStyles = ({ colors, controls, shapes, spacing }: Theme) =>
  StyleSheet.create({
    container: {
      backgroundColor: colors.surfaceSunken,
      borderRadius: shapes.lg,
      minHeight: controls.inputHeight,
    },
    textField: {
      flex: 1,
      paddingVertical: 0,
    },
    icon: {
      color: colors.secondaryText,
    },
    input: {
      margin: 0,
      paddingLeft: 0,
      paddingRight: spacing[2],
      borderBottomWidth: 0,
      paddingVertical: spacing[Platform.OS === 'ios' ? 2 : 1],
    },
  });
