import { useCallback, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  NativeScrollEvent,
  NativeSyntheticEvent,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
  useWindowDimensions,
} from 'react-native';

import {
  IS_IOS,
  dateFormatter,
  useAccessibility,
  useScreenReader,
} from '@polito/lib/core';
import {
  CarouselDots,
  OutlineIcon,
  Text,
  Theme,
  useStylesheet,
  useTheme,
} from '@polito/lib/ui';
import { Announcement } from '@polito/student-api-client';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

interface Props {
  announcements: Announcement[];
}

interface CardProps {
  announcement: Announcement;
  index: number;
  total: number;
}

const formatAnnouncementDate = dateFormatter('d MMMM yyyy');

const Card = ({ announcement, index, total }: CardProps) => {
  const { t } = useTranslation();
  const styles = useStylesheet(createCardStyles);
  const { colors } = useTheme();
  const { accessibilityListLabel } = useAccessibility();
  const navigation =
    useNavigation<NativeStackNavigationProp<{ NewOverlay: { id: string } }>>();

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={[
        formatAnnouncementDate(announcement.date),
        announcement.title,
        accessibilityListLabel(index, total),
      ]
        .filter(Boolean)
        .join(', ')}
      accessibilityHint={t('appInfoScreen.openNewsHint')}
      onPress={() => navigation.navigate('NewOverlay', { id: announcement.id })}
      style={({ pressed }) => [styles.card, pressed && styles.pressed]}
    >
      <View style={styles.text}>
        <Text variant="secondaryText">
          {formatAnnouncementDate(announcement.date)}
        </Text>
        <Text variant="title" numberOfLines={3}>
          {announcement.title}
        </Text>
      </View>
      <View
        style={styles.icon}
        accessible={false}
        importantForAccessibility="no-hide-descendants"
        accessibilityElementsHidden={IS_IOS}
      >
        <OutlineIcon name="megaphone" color={colors.secondaryText} />
      </View>
    </Pressable>
  );
};

export const WhatsNewCard = ({ announcements }: Props) => {
  const { t } = useTranslation();
  const { isEnabled, announce } = useScreenReader();
  const { width: pageWidth } = useWindowDimensions();
  const { spacing } = useTheme();
  const styles = useStylesheet(createStyles);
  const [index, setIndex] = useState(0);

  const onScrollEnd = useCallback(
    (event: NativeSyntheticEvent<NativeScrollEvent>) => {
      const nextIndex = Math.round(
        event.nativeEvent.contentOffset.x / pageWidth,
      );
      const clamped = Math.max(
        0,
        Math.min(nextIndex, announcements.length - 1),
      );
      setIndex(clamped);
      if (isEnabled) {
        announce(
          t('common.elementCount', {
            count: clamped + 1,
            total: announcements.length,
          }),
        );
      }
    },
    [announce, announcements.length, isEnabled, pageWidth, t],
  );

  return (
    <View
      style={styles.container}
      accessibilityRole="list"
      accessibilityLabel={t('appInfoScreen.whatsNewListLabel', {
        count: announcements.length,
      })}
    >
      <ScrollView
        horizontal
        pagingEnabled
        nestedScrollEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={onScrollEnd}
      >
        {announcements.map((announcement, cardIndex) => (
          <View
            key={announcement.id}
            style={{
              width: pageWidth,
              paddingHorizontal: spacing[4],
            }}
          >
            <Card
              announcement={announcement}
              index={cardIndex}
              total={announcements.length}
            />
          </View>
        ))}
      </ScrollView>
      {announcements.length > 1 && (
        <View
          style={styles.dots}
          accessible={false}
          importantForAccessibility="no-hide-descendants"
          accessibilityElementsHidden={IS_IOS}
        >
          <CarouselDots
            carouselLength={announcements.length}
            carouselIndex={index}
            gap={10}
          />
        </View>
      )}
    </View>
  );
};

// A card of the redesign: the surface, its elevation in light and a hairline
// in dark, the card radius
const createCardStyles = ({ colors, elevation, shapes, spacing }: Theme) =>
  StyleSheet.create({
    card: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.surface,
      borderRadius: shapes.lg,
      gap: spacing[3],
      paddingHorizontal: spacing[4],
      paddingVertical: spacing[4],
      marginVertical: spacing[2],
      ...elevation.card,
      borderWidth: colors.cardBorder === 'transparent' ? 0 : 1,
      borderColor: colors.cardBorder,
    },
    pressed: {
      opacity: 0.7,
    },
    text: {
      flex: 1,
      gap: spacing[1],
    },
    icon: {
      alignItems: 'center',
      justifyContent: 'center',
    },
  });

const createStyles = ({ spacing }: Theme) =>
  StyleSheet.create({
    container: {},
    dots: {
      alignItems: 'center',
      marginTop: spacing[3],
    },
  });
