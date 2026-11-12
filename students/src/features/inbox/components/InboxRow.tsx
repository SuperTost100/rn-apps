import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';

import { IconDefinition } from '@fortawesome/fontawesome-svg-core';
import {
  faBell,
  faCirclePlay,
  faComment,
  faEnvelope,
  faFile,
  faNewspaper,
} from '@fortawesome/free-regular-svg-icons';
import {
  faBullhorn,
  faCircle,
  faTriangleExclamation,
} from '@fortawesome/free-solid-svg-icons';
import { APP_TIMEZONE, usePreferencesContext } from '@polito/lib/core';
import {
  Icon,
  ListItem,
  Text,
  type Theme,
  useStylesheet,
  useTextScale,
  useTheme,
} from '@polito/lib/ui';

import { AppPreferences } from '~/core/types/preferences';

import { DateTime } from 'luxon';

import { InboxItem, InboxKind } from '../inboxItems';

const KIND_ICONS: Record<InboxKind, IconDefinition> = {
  announcement: faBullhorn,
  files: faFile,
  lecture: faCirclePlay,
  message: faEnvelope,
  ticket: faComment,
  news: faNewspaper,
  other: faBell,
};

/** The words for an item's kind: the row's subtitle and the start of its label */
const useKindLabel = () => {
  const { t } = useTranslation();
  return (item: InboxItem) => {
    if (item.urgent) return t('inboxScreen.kinds.urgent');
    if (item.kind === 'message' && item.messageType) {
      return t(`inboxScreen.messageKinds.${item.messageType}`, {
        defaultValue: t('inboxScreen.kinds.message'),
      });
    }
    return t(`inboxScreen.kinds.${item.kind}`);
  };
};

/** The sender line: the course or teacher's name, or a fixed label */
export const useSenderName = () => {
  const { t } = useTranslation();
  return (item: InboxItem) =>
    item.senderName ??
    t(`inboxScreen.senders.${item.senderLabel ?? 'university'}`);
};

/**
 * When an item arrived: the time for today and yesterday, the weekday this
 * week, the date before. The spoken form says "today at 18:12".
 */
const useWhen = () => {
  const { t } = useTranslation();
  const { language } = usePreferencesContext<AppPreferences>();
  return (sentAt: number) => {
    const at = DateTime.fromMillis(sentAt, { zone: APP_TIMEZONE }).setLocale(
      language,
    );
    const today = DateTime.now().setZone(APP_TIMEZONE).startOf('day');
    const day = at.startOf('day');
    const time = at.toFormat('HH:mm');
    if (day >= today) {
      return { shown: time, spoken: t('inboxScreen.when.today', { time }) };
    }
    if (day >= today.minus({ days: 1 })) {
      return { shown: time, spoken: t('inboxScreen.when.yesterday', { time }) };
    }
    const date = at.toFormat('cccc d LLLL');
    if (day >= today.startOf('week')) {
      return {
        // Non-breaking spaces: "Tue 15:30" and "8 Nov" never split
        shown: `${at.toFormat('ccc')}\u00A0${time}`,
        spoken: t('inboxScreen.when.other', { date, time }),
      };
    }
    return {
      shown: at
        .toFormat(day.year === today.year ? 'd LLL' : 'd LLL yyyy')
        .replace(/ /g, '\u00A0'),
      spoken: t('inboxScreen.when.other', {
        date: at.toFormat(
          day.year === today.year ? 'cccc d LLLL' : 'cccc d LLLL yyyy',
        ),
        time,
      }),
    };
  };
};

interface Props {
  item: InboxItem;
  onPress: (item: InboxItem) => void;
}

/**
 * One inbox row: the kind's icon in a tinted circle, the sender (with the
 * course colour), the title in bold while unread, the kind, and the time and
 * unread dot at the end. Screen readers hear it as one sentence.
 */
export const InboxRow = ({ item, onPress }: Props) => {
  const { t } = useTranslation();
  const styles = useStylesheet(createStyles);
  const { colors } = useTheme();
  const { isLarge } = useTextScale();
  const { courses } = usePreferencesContext<AppPreferences>();
  const kindLabel = useKindLabel()(item);
  const sender = useSenderName()(item);
  const when = useWhen()(item.sentAt);
  const courseColor = item.courseShortcode
    ? courses[item.courseShortcode]?.color
    : undefined;
  const pinned = item.urgent && item.unread;

  const label =
    (item.unread ? t('inboxScreen.unreadPrefix') : '') +
    t('inboxScreen.rowLabel', {
      kind: kindLabel,
      sender,
      title: item.title,
      when: when.spoken,
    });

  // At large text the time joins the kind, so the title keeps the width
  const subtitle = isLarge ? `${kindLabel} · ${when.shown}` : kindLabel;

  return (
    <ListItem
      onPress={() => onPress(item)}
      accessibilityRole="button"
      accessibilityLabel={label}
      style={pinned ? { backgroundColor: colors.dangerBg } : undefined}
      leadingItem={
        <View
          style={[
            styles.kind,
            isLarge && styles.kindLarge,
            item.urgent && styles.kindUrgent,
          ]}
          accessibilityElementsHidden
          importantForAccessibility="no-hide-descendants"
        >
          <Icon
            icon={item.urgent ? faTriangleExclamation : KIND_ICONS[item.kind]}
            size={isLarge ? 16 : 20}
            color={item.urgent ? colors.surface : colors.title}
          />
        </View>
      }
      title={
        <View>
          <View style={styles.sender}>
            {courseColor && (
              <Icon icon={faCircle} size={10} color={courseColor} />
            )}
            <Text
              variant="secondaryText"
              numberOfLines={1}
              style={styles.senderText}
            >
              {sender}
            </Text>
          </View>
          <Text
            variant="title"
            weight={item.unread ? 'bold' : 'normal'}
            numberOfLines={isLarge ? 3 : 2}
          >
            {item.title}
          </Text>
          <Text variant="secondaryText" numberOfLines={isLarge ? 2 : 1}>
            {subtitle}
          </Text>
        </View>
      }
      trailingItem={
        <View style={styles.trailing}>
          {!isLarge && (
            <Text variant="secondaryText" style={styles.time}>
              {when.shown}
            </Text>
          )}
          {/* Dots are glyphs: round views drew square on Android after scrolling */}
          {item.unread ? (
            <Icon icon={faCircle} size={10} color={colors.badge} />
          ) : (
            <View style={styles.dot} />
          )}
        </View>
      }
    />
  );
};

const createStyles = ({ colors, controls, spacing }: Theme) =>
  StyleSheet.create({
    kind: {
      width: controls.leadingSize,
      height: controls.leadingSize,
      borderRadius: controls.leadingSize / 2,
      backgroundColor: colors.surfaceSunken,
      alignItems: 'center',
      justifyContent: 'center',
    },
    // At large text the circle shrinks, as in the mockup, to leave the
    // width to the text
    kindLarge: {
      width: 28,
      height: 28,
      borderRadius: 14,
    },
    kindUrgent: {
      backgroundColor: colors.dangerText,
    },
    sender: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing[2],
    },
    senderText: {
      flexShrink: 1,
    },
    trailing: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing[2],
    },
    time: {
      fontVariant: ['tabular-nums'],
    },
    dot: {
      width: 10,
      height: 10,
      borderRadius: 5,
    },
  });
