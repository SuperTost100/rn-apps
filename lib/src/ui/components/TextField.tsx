import { Ref, useMemo, useState } from 'react';
import {
  StyleSheet,
  TextInput,
  TextInputProps,
  View,
  ViewProps,
} from 'react-native';

import { IconDefinition } from '@fortawesome/fontawesome-svg-core';
import { faCircleExclamation } from '@fortawesome/free-solid-svg-icons';

import { useStylesheet } from '../hooks/useStylesheet';
import { useTextScale } from '../hooks/useTextScale';
import { useTheme } from '../hooks/useTheme';
import { Theme } from '../types/Theme';
import { resolveFontFace } from '../utils/font-face';
import { MAX_COMBINED_TEXT_SCALE } from '../utils/text-scale';
import { Icon } from './Icon';
import { Text } from './Text';

export interface TextFieldProps extends Omit<TextInputProps, 'placeholder'> {
  inputRef?: Ref<TextInput>;
  label: string;
  type?: 'text' | 'password';
  icon?: IconDefinition;
  style?: ViewProps['style'];
  inputStyle?: TextInputProps['style'];
  /**
   * inline (default): a row inside a card, the label as placeholder and a
   * line under the text that marks focus and errors.
   * boxed: the label above a 48 px bordered box.
   */
  variant?: 'inline' | 'boxed';
  /** Help under the field, also read by screen readers */
  hint?: string;
  /** An error under the field: red border and text, read by screen readers */
  error?: string;
  /** Placeholder of a boxed field; inline fields show the label instead */
  placeholder?: string;
}

/**
 * A text input field. The input itself is the accessible element, labelled
 * with `label` (or accessibilityLabel) and described by the hint or error.
 */
export const TextField = ({
  inputRef,
  label,
  type,
  style,
  inputStyle,
  numberOfLines = 1,
  autoCapitalize = 'none',
  variant = 'inline',
  hint,
  error,
  placeholder,
  onFocus,
  onBlur,
  accessibilityHint,
  ...rest
}: TextFieldProps) => {
  const { colors, fontFamilies } = useTheme();
  const { scale } = useTextScale();
  const styles = useStylesheet(createStyles);
  const [focused, setFocused] = useState(false);
  const boxed = variant === 'boxed';
  const disabled = rest.editable === false;

  const textInputProps: TextInputProps = useMemo(() => {
    switch (type) {
      case 'password':
        return {
          autoComplete: 'password',
          secureTextEntry: true,
        };
      default:
        return {};
    }
  }, [type]);

  const borderColor = error
    ? colors.dangerText
    : focused
      ? colors.focus
      : colors.controlBorder;
  const borderWidth = error || focused ? 2 : 1.5;
  const fontFace = resolveFontFace(fontFamilies.body, '400', false);
  const description = [error, hint ?? accessibilityHint]
    .filter(Boolean)
    .join('. ');

  return (
    <View style={[styles.container, disabled && styles.disabled, style]}>
      {boxed && (
        <Text
          variant="label"
          style={styles.label}
          accessibilityElementsHidden
          importantForAccessibility="no"
        >
          {label}
        </Text>
      )}
      <TextInput
        ref={inputRef}
        accessibilityLabel={rest.accessibilityLabel ?? label}
        accessibilityHint={description || undefined}
        accessibilityState={{ disabled }}
        autoCapitalize={autoCapitalize}
        selectionColor={colors.link}
        placeholder={boxed ? placeholder : label}
        placeholderTextColor={colors.secondaryText}
        onFocus={e => {
          setFocused(true);
          onFocus?.(e);
        }}
        onBlur={e => {
          setFocused(false);
          onBlur?.(e);
        }}
        style={[
          styles.input,
          fontFace,
          { fontSize: styles.input.fontSize * scale },
          boxed
            ? [
                styles.boxedInput,
                { borderColor, borderWidth },
                disabled && styles.boxedDisabled,
              ]
            : (focused || error) && {
                borderBottomWidth: 2,
                borderBottomColor: borderColor,
              },
          {
            textAlignVertical: numberOfLines === 1 ? 'center' : 'top',
          },
          inputStyle,
        ]}
        numberOfLines={numberOfLines}
        // The phone's font scale on top of the in-app one stops at 2.0, as in Text
        maxFontSizeMultiplier={Math.max(1, MAX_COMBINED_TEXT_SCALE / scale)}
        {...textInputProps}
        {...rest}
      />
      {(error || hint) && (
        <View
          style={[styles.help, !boxed && styles.inlineHelp]}
          accessibilityElementsHidden
          importantForAccessibility="no-hide-descendants"
        >
          {error && (
            <Icon
              icon={faCircleExclamation}
              size={14}
              color={colors.dangerText}
            />
          )}
          <Text
            variant="secondaryText"
            style={[
              styles.helpText,
              error ? { color: colors.dangerText } : null,
            ]}
          >
            {error ?? hint}
          </Text>
        </View>
      )}
    </View>
  );
};

const createStyles = ({
  colors,
  controls,
  fontSizes,
  layout,
  shapes,
  spacing,
}: Theme) =>
  StyleSheet.create({
    container: {
      paddingVertical: spacing[2],
    },
    disabled: {
      opacity: 0.5,
    },
    label: {
      marginBottom: spacing[1],
    },
    input: {
      fontSize: fontSizes.md,
      color: colors.prose,
      paddingHorizontal: layout.cardPadding,
      paddingVertical: spacing[2],
      borderBottomWidth: 0,
    },
    boxedInput: {
      minHeight: controls.inputHeight,
      borderRadius: shapes.lg,
      backgroundColor: colors.surface,
      paddingVertical: spacing[3],
    },
    boxedDisabled: {
      backgroundColor: colors.disabledBg,
      borderWidth: 0,
    },
    help: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing[1],
      marginTop: spacing[1],
    },
    inlineHelp: {
      paddingHorizontal: layout.cardPadding,
    },
    helpText: {
      flexShrink: 1,
    },
  });
