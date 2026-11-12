import {
  ReactElement,
  createContext,
  useContext,
  useEffect,
  useLayoutEffect,
  useState,
} from 'react';
import { useTranslation } from 'react-i18next';
import {
  AccessibilityState,
  StyleProp,
  StyleSheet,
  TextProps,
  TextStyle,
  TouchableHighlight,
  TouchableHighlightProps,
  View,
  ViewStyle,
} from 'react-native';

import { To, resolveLinkTo } from '@polito/lib/core';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { useStylesheet } from '../hooks/useStylesheet';
import { useTextScale } from '../hooks/useTextScale';
import { useTheme } from '../hooks/useTheme';
import { Theme } from '../types/Theme';
import { DisclosureIndicator } from './DisclosureIndicator';
import { Text } from './Text';
import { UnreadBadge } from './UnreadBadge';

/**
 * Set by List around each row, so a row can tell the list whether it has a
 * leading column and the divider above it starts at its text
 */
export const ListRowContext = createContext<
  ((hasLeadingItem: boolean) => void) | undefined
>(undefined);

export interface ListItemProps extends TouchableHighlightProps {
  title: string | ReactElement;
  subtitle?: string | ReactElement;
  subtitleProps?: TextProps;
  /** Centred in a 40 px column before the text */
  leadingItem?: ReactElement;
  /** Centred at the end of the row, before the chevron */
  trailingItem?: ReactElement;
  /**
   * A status chip. It sits in the trailing column and moves under the
   * subtitle at 150% text and above, or when the title would not fit in its
   * lines next to it, so it never squeezes the title
   */
  chip?: ReactElement;
  /** Read after the title and subtitle by screen readers, e.g. the chip's word */
  chipLabel?: string;
  linkTo?: To<any>;
  children?: any;
  containerStyle?: StyleProp<ViewStyle>;
  titleStyle?: StyleProp<TextStyle>;
  subtitleStyle?: StyleProp<TextStyle>;
  /** Shows the chevron: the row opens something */
  isAction?: boolean;
  /** Overrides when the chevron shows. By default: linkTo or isAction without a trailingItem */
  showChevron?: boolean;
  card?: boolean;
  inverted?: boolean;
  titleProps?: TextProps;
  multilineTitle?: boolean;
  unread?: boolean;
  /** Highlights the row and reports it as selected to screen readers */
  selected?: boolean;
  isInVisibleRange?: boolean;
}

/**
 * The list row: one leading column (40 px), the text, and one trailing
 * column, with leading and trailing centred on the row whatever the number of
 * lines. With linkTo or isAction a chevron ends the row on both platforms.
 */
export const ListItem = ({
  title,
  titleStyle,
  subtitle,
  subtitleStyle,
  subtitleProps,
  leadingItem,
  trailingItem,
  chip,
  chipLabel,
  linkTo,
  containerStyle,
  onPress,
  isAction,
  showChevron,
  disabled,
  selected,
  style,
  card,
  children,
  inverted = false,
  multilineTitle = false,
  titleProps,
  unread = false,
  accessibilityLabel,
  accessibilityRole,
  accessibilityState,
  ...rest
}: ListItemProps) => {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const styles = useStylesheet(createStyles);
  const { isLarge } = useTextScale();
  const navigation = useNavigation<NativeStackNavigationProp<any>>();
  const reportLeading = useContext(ListRowContext);
  const hasLeadingItem = !!leadingItem;

  useLayoutEffect(() => {
    reportLeading?.(hasLeadingItem);
  }, [reportLeading, hasLeadingItem]);

  const titleLines = multilineTitle
    ? undefined
    : (titleProps?.numberOfLines ?? (isLarge ? 3 : 2));

  // At 100% the chip moves under the text when the title would otherwise be
  // cut: a hidden copy of the title, as wide as the text column, counts its
  // lines. Once under, it stays there until the title changes.
  const [chipUnder, setChipUnder] = useState(false);
  useEffect(() => setChipUnder(false), [title]);
  const chipBelow = !!chip && (isLarge || !!card || chipUnder);
  const measureTitle =
    !!chip && !chipBelow && typeof title === 'string' && !!titleLines;

  const titleElement =
    typeof title === 'string' ? (
      <View style={styles.titleRow}>
        {unread && <UnreadBadge />}
        <Text
          variant="title"
          weight={unread ? 'bold' : undefined}
          style={[
            styles.title,
            disabled && { color: colors.secondaryText },
            titleStyle,
          ]}
          ellipsizeMode={titleProps?.ellipsizeMode ?? 'tail'}
          keepWords
          {...titleProps}
          numberOfLines={titleLines}
        >
          {title}
        </Text>
      </View>
    ) : (
      title
    );

  const subtitleElement = subtitle ? (
    typeof subtitle === 'string' ? (
      <Text
        variant="secondaryText"
        style={subtitleStyle}
        numberOfLines={isLarge ? 3 : 2}
        ellipsizeMode="tail"
        keepWords
        {...subtitleProps}
      >
        {subtitle}
      </Text>
    ) : (
      subtitle
    )
  ) : null;

  const handlePress = linkTo
    ? () => {
        const resolved = resolveLinkTo(linkTo);
        navigation.navigate(resolved.name as any, resolved.params);
      }
    : onPress;
  const isPressable = !!handlePress;

  const chevron =
    !card && (showChevron ?? (!trailingItem && (!!linkTo || !!isAction)));
  const trailingChip = chip && !chipBelow ? chip : null;
  const trailing =
    !card && (trailingChip || trailingItem || chevron) ? (
      <View style={[styles.trailingSlot, disabled && styles.dimmed]}>
        {trailingChip}
        {trailingItem}
        {chevron && <DisclosureIndicator />}
      </View>
    ) : null;

  // The label screen readers read: the visible text, in order. When a part is
  // an element (a value, a menu, a custom title) the platform reads the
  // row's texts itself, so nothing visible goes missing
  const allPartsAreText =
    typeof title === 'string' &&
    (!subtitle || typeof subtitle === 'string') &&
    !trailingItem &&
    !children &&
    (!chip || !!chipLabel);
  const builtLabel =
    accessibilityLabel ??
    (allPartsAreText
      ? [
          unread ? t('primitives.unread') : undefined,
          title,
          typeof subtitle === 'string' ? subtitle : undefined,
          chipLabel,
        ]
          .filter(Boolean)
          .join(', ')
      : undefined);

  const state: AccessibilityState = {
    ...(disabled ? { disabled: true } : {}),
    ...(selected !== undefined ? { selected } : {}),
    ...accessibilityState,
  };

  return (
    <TouchableHighlight
      underlayColor={colors.touchableHighlight}
      onPress={handlePress}
      style={[selected && { backgroundColor: colors.selectedRow }, style]}
      disabled={disabled}
      accessibilityRole={
        accessibilityRole ?? (isPressable ? 'button' : undefined)
      }
      accessibilityLabel={builtLabel}
      accessibilityState={state}
      {...rest}
    >
      <View
        style={[styles.container, card && styles.cardContainer, containerStyle]}
      >
        {children}
        {leadingItem && (
          <View style={[styles.leadingSlot, disabled && styles.dimmed]}>
            {leadingItem}
          </View>
        )}
        <View
          style={[
            styles.textColumn,
            card && styles.cardTextColumn,
            inverted && styles.inverted,
          ]}
        >
          {measureTitle && (
            <Text
              variant="title"
              weight={unread ? 'bold' : undefined}
              style={[styles.title, titleStyle, styles.measure]}
              onTextLayout={e => {
                if (e.nativeEvent.lines.length > (titleLines ?? 0)) {
                  setChipUnder(true);
                }
              }}
              accessible={false}
              accessibilityElementsHidden
              importantForAccessibility="no-hide-descendants"
            >
              {title}
            </Text>
          )}
          {titleElement}
          {subtitleElement}
          {chipBelow && <View style={styles.chipBelow}>{chip}</View>}
        </View>
        {trailing}
      </View>
    </TouchableHighlight>
  );
};

const createStyles = ({ controls, layout, spacing }: Theme) =>
  StyleSheet.create({
    container: {
      minHeight: controls.rowMinHeight,
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: layout.cardPadding,
      paddingVertical: layout.rowPaddingVertical,
    },
    cardContainer: {
      flexDirection: 'column',
      alignItems: 'stretch',
    },
    textColumn: {
      flex: 1,
      minWidth: 0,
    },
    cardTextColumn: {
      flex: 0,
    },
    inverted: {
      flexDirection: 'column-reverse',
    },
    titleRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing[2],
    },
    title: {
      flexShrink: 1,
      flexGrow: 1,
    },
    leadingSlot: {
      width: controls.leadingSize,
      minHeight: controls.leadingSize,
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: layout.leadingGap,
    },
    trailingSlot: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'flex-end',
      gap: spacing[2],
      marginLeft: layout.leadingGap,
      flexShrink: 0,
      maxWidth: '50%',
    },
    measure: {
      position: 'absolute',
      left: 0,
      right: 0,
      opacity: 0,
    },
    chipBelow: {
      flexDirection: 'row',
      marginTop: spacing[1],
    },
    dimmed: {
      opacity: 0.5,
    },
  });
