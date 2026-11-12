import { ReactElement, useMemo } from 'react';
import { StyleSheet, View } from 'react-native';

import {
  faChevronDown,
  faCircleExclamation,
} from '@fortawesome/free-solid-svg-icons';

import { useStylesheet } from '../hooks/useStylesheet';
import { useTheme } from '../hooks/useTheme';
import { Theme } from '../types/Theme';
import { Icon } from './Icon';
import { ListItem } from './ListItem';
import { StatefulMenuView } from './StatefulMenuView';
import { Text } from './Text';

interface DropdownOption {
  id: string;
  title: string;
  image?: string;
  imageColor?: string;
  state?: 'off' | 'on' | 'mixed' | undefined;
}

interface Props {
  options: DropdownOption[];
  onSelectOption?: (id: string) => void;
  value?: string;
  label: string;
  description?: string;
  disabled?: boolean;
  accessibilityLabel?: string;
  hideChevron?: boolean;
  /**
   * row (default): a list row inside a card, the label as its title.
   * boxed: the label above a 48 px bordered box, as a boxed TextField.
   */
  variant?: 'row' | 'boxed';
  /** Boxed: shown in the box while nothing is chosen */
  placeholder?: string;
  /** Boxed: an error under the box, read by screen readers */
  error?: string;
}

export const Select = ({
  options,
  accessibilityLabel,
  onSelectOption,
  value,
  label,
  description,
  disabled,
  hideChevron,
  variant = 'row',
  placeholder,
  error,
}: Props) => {
  const { colors } = useTheme();
  const styles = useStylesheet(createStyles);
  const displayedValue = useMemo(() => {
    return options?.find(opt => opt?.id === value)?.title;
  }, [options, value]);

  // One element for screen readers: the row or the box, named by the label
  // and the chosen value. The menu opens from it.
  const name = accessibilityLabel || label;
  const spokenValue = displayedValue ?? placeholder;
  const menu = (child: ReactElement) => (
    <StatefulMenuView
      style={{ width: '100%' }}
      title={label}
      actions={!disabled ? options : []}
      onPressAction={({ nativeEvent: { event } }) => {
        !disabled && onSelectOption?.(event);
      }}
    >
      {child}
    </StatefulMenuView>
  );

  if (variant === 'boxed') {
    const borderColor = error ? colors.dangerText : colors.controlBorder;
    return (
      <View style={styles.field}>
        <Text
          variant="label"
          style={styles.label}
          accessibilityElementsHidden
          importantForAccessibility="no"
        >
          {label}
        </Text>
        {menu(
          <View
            accessible
            accessibilityRole="button"
            accessibilityLabel={spokenValue ? `${name}: ${spokenValue}` : name}
            accessibilityHint={
              [error, description].filter(Boolean).join('. ') || undefined
            }
            accessibilityState={{ disabled: !!disabled }}
            style={[
              styles.box,
              { borderColor, borderWidth: error ? 2 : 1.5 },
              disabled && styles.boxDisabled,
            ]}
          >
            <Text
              variant="prose"
              numberOfLines={2}
              style={[
                styles.value,
                !displayedValue && { color: colors.secondaryText },
              ]}
            >
              {displayedValue ?? placeholder ?? label}
            </Text>
            {!hideChevron && (
              <Icon
                icon={faChevronDown}
                size={14}
                color={colors.secondaryText}
              />
            )}
          </View>,
        )}
        {error && (
          <View
            style={styles.error}
            accessibilityElementsHidden
            importantForAccessibility="no-hide-descendants"
          >
            <Icon
              icon={faCircleExclamation}
              size={14}
              color={colors.dangerText}
            />
            <Text
              variant="secondaryText"
              style={[styles.errorText, { color: colors.dangerText }]}
            >
              {error}
            </Text>
          </View>
        )}
      </View>
    );
  }

  return (
    <View>
      {menu(
        <ListItem
          isAction
          disabled={disabled}
          title={displayedValue || label}
          subtitle={description}
          accessibilityRole="button"
          accessibilityLabel={
            displayedValue ? `${name}: ${displayedValue}` : name
          }
          accessibilityHint={description || undefined}
          trailingItem={
            hideChevron ? (
              <View />
            ) : (
              <Icon
                icon={faChevronDown}
                size={14}
                color={colors.secondaryText}
              />
            )
          }
        />,
      )}
    </View>
  );
};

const createStyles = ({ colors, controls, layout, shapes, spacing }: Theme) =>
  StyleSheet.create({
    field: {
      paddingVertical: spacing[2],
    },
    label: {
      marginBottom: spacing[1],
    },
    box: {
      minHeight: controls.inputHeight,
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing[2],
      borderRadius: shapes.lg,
      backgroundColor: colors.surface,
      paddingHorizontal: layout.cardPadding,
      paddingVertical: spacing[2],
    },
    boxDisabled: {
      backgroundColor: colors.disabledBg,
      borderWidth: 0,
    },
    value: {
      flex: 1,
    },
    error: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing[1],
      marginTop: spacing[1],
    },
    errorText: {
      flexShrink: 1,
    },
  });
