import { ReactElement } from 'react';
import { useTranslation } from 'react-i18next';
import {
  StyleProp,
  StyleSheet,
  TextProps,
  TextStyle,
  TouchableOpacityProps,
  View,
} from 'react-native';

import { Props as FAProps } from '@fortawesome/react-native-fontawesome';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { To } from '../../core/utils/resolveLinkTo';
import { useStylesheet } from '../hooks/useStylesheet';
import { useTextScale } from '../hooks/useTextScale';
import { Theme } from '../types/Theme';
import { IconButton } from './IconButton';
import { Separator } from './Separator';
import { Text } from './Text';
import { TextButton } from './TextButton';

interface Props {
  title: string;
  titleStyle?: StyleProp<TextStyle>;
  subtitle?: string;
  subtitleStyle?: StyleProp<TextStyle>;
  ellipsizeTitle?: boolean;
  linkToMoreCount?: number;
  separator?: boolean;
  accessible?: boolean;
  accessibilityLabel?: string | undefined;
  linkTo?: To<any>;
  trailingItem?: ReactElement;
  trailingIcon?: Pick<FAProps, 'size' | 'icon' | 'color'> &
    TouchableOpacityProps & {
      iconStyle?: FAProps['style'];
    };
}

/**
 * A section title with an optional link to a related screen
 */
export const SectionHeader = ({
  title,
  titleStyle,
  subtitle,
  subtitleStyle,
  ellipsizeTitle = true,
  accessibilityLabel = undefined,
  linkTo,
  accessible = true,
  linkToMoreCount,
  separator = true,
  trailingItem,
  trailingIcon,
}: Props) => {
  const styles = useStylesheet(createStyles);
  const { t } = useTranslation();
  const navigation = useNavigation<NativeStackNavigationProp<any>>();
  const { isLarge } = useTextScale();
  // At large text the title wraps instead of losing its end
  const ellipsis: Partial<TextProps> = ellipsizeTitle
    ? {
        numberOfLines: isLarge ? 3 : 1,
        ellipsizeMode: 'tail',
      }
    : {};

  const goToLink = () => {
    if (!linkTo) return;
    if (typeof linkTo === 'string') {
      navigation.navigate(linkTo as any);
    } else {
      navigation.navigate(linkTo.screen as any, linkTo.params);
    }
  };

  const linkLabel = linkTo
    ? t('sectionHeader.cta') +
      ((linkToMoreCount ?? 0) > 0
        ? ' ' + t('sectionHeader.ctaMoreSuffix', { count: linkToMoreCount })
        : '')
    : undefined;

  // A trailing icon is a button of its own: grouping it into the header
  // would hide it from screen readers, so the title alone is the header
  const groupTitle = accessible && !trailingIcon;

  return (
    <View style={styles.container}>
      <View
        style={[styles.titleContainer, isLarge && styles.titleContainerLarge]}
        accessible={groupTitle}
        accessibilityRole={groupTitle ? 'header' : undefined}
        accessibilityLabel={groupTitle ? accessibilityLabel : undefined}
      >
        {separator && <Separator />}
        <View style={styles.innerTitleContainer}>
          <Text
            variant="heading"
            style={[styles.title, titleStyle]}
            accessibilityRole={groupTitle ? undefined : 'header'}
            accessibilityLabel={groupTitle ? undefined : accessibilityLabel}
            keepWords
            {...ellipsis}
          >
            {title}
          </Text>
          {trailingIcon && (
            <IconButton
              {...{
                size: isLarge ? 24 : 16,
                ...trailingIcon,
              }}
            />
          )}
        </View>
        {subtitle && (
          <Text variant="secondaryText" style={subtitleStyle} {...ellipsis}>
            {subtitle}
          </Text>
        )}
      </View>
      {trailingItem}
      {linkLabel && (
        <TextButton
          onPress={goToLink}
          accessibilityLabel={linkLabel}
          style={styles.link}
        >
          {linkLabel}
        </TextButton>
      )}
    </View>
  );
};

const createStyles = ({ spacing, colors, layout }: Theme) =>
  StyleSheet.create({
    container: {
      flexDirection: 'row',
      alignItems: 'flex-end',
      flexWrap: 'wrap',
      columnGap: spacing[3],
      paddingHorizontal: layout.gutter,
      // 12 to the card below, with the card's own 8
      marginBottom: spacing[1],
    },
    title: {
      color: colors.heading,
      flexShrink: 1,
    },
    // A third keeps a short title and a long link ("How they are
    // computed") on one line; a longer link wraps under the title
    titleContainer: {
      flex: 1,
      minWidth: '33%',
    },
    // At large text a third is narrower than one long word, which would
    // break mid-word: the link moves under the title sooner
    titleContainerLarge: {
      minWidth: '66%',
    },
    // The 48 px target reaches past the title line, so the label sits on it
    link: {
      marginBottom: -spacing[3],
    },
    innerTitleContainer: {
      alignItems: 'center',
      flexDirection: 'row',
      gap: spacing[1],
    },
  });
