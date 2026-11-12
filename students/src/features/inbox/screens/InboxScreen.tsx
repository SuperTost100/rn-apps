import { useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Alert, ScrollView, StyleSheet, View } from 'react-native';

import { faTriangleExclamation } from '@fortawesome/free-solid-svg-icons';
import {
  useFeedbackContext,
  useQueryStates,
  useScreenReader,
} from '@polito/lib/core';
import {
  BottomBarSpacer,
  Icon,
  OverviewList,
  PillButton,
  RefreshControl,
  RegionStateBlock,
  SkeletonLine,
  SkeletonRows,
  Text,
  TextButton,
  type Theme,
  useStylesheet,
  useTheme,
} from '@polito/lib/ui';
import { useNavigation } from '@react-navigation/native';
import {
  NativeStackNavigationProp,
  NativeStackScreenProps,
} from '@react-navigation/native-stack';

import { useInbox, useInboxActions } from '../../../core/hooks/useInbox';
import { RootParamList } from '../../../core/types/navigation';
import { TeachingStackParamList } from '../../teaching/components/TeachingNavigator';
import { InboxRow } from '../components/InboxRow';
import {
  INBOX_FILTERS,
  InboxFilter,
  InboxItem,
  groupInboxItems,
  matchesFilter,
} from '../inboxItems';

type Props = NativeStackScreenProps<TeachingStackParamList, 'Inbox'>;

/** Up to this many items are marked read without asking first */
const MARK_ALL_WITHOUT_ASKING = 5;

const COURSE_TABS = {
  notices: 'CourseNoticesScreen',
  files: 'CourseFilesScreen',
  lectures: 'CourseLecturesScreen',
} as const;

/**
 * Course announcements, new files and lectures, messages from the
 * university and ticket replies, newest first, with filters by origin.
 * Unread urgent messages are pinned on top until they are read.
 */
export const InboxScreen = ({ navigation }: Props) => {
  const { t } = useTranslation();
  const styles = useStylesheet(createStyles);
  const { colors } = useTheme();
  const rootNavigation =
    useNavigation<NativeStackNavigationProp<RootParamList>>();
  const { setFeedback } = useFeedbackContext();
  const { announce } = useScreenReader();
  const {
    items,
    counts,
    notificationsQuery,
    messagesQuery,
    ticketsQuery,
    coursesQuery,
  } = useInbox();
  const { markItemRead, markAllRead } = useInboxActions();
  const [filter, setFilter] = useState<InboxFilter>('all');
  const [progress, setProgress] = useState<{ done: number; total: number }>();

  // The notification list only refreshes on a push otherwise
  const refetchNotifications = notificationsQuery.refetch;
  useEffect(() => {
    refetchNotifications();
  }, [refetchNotifications]);

  const states = useQueryStates([notificationsQuery, messagesQuery], {
    isEmpty: () => items.length === 0,
  });

  const shown = useMemo(
    () => items.filter(i => matchesFilter(i, filter)),
    [items, filter],
  );
  const groups = useMemo(() => groupInboxItems(shown, Date.now()), [shown]);
  const unread = counts[filter];

  const open = (item: InboxItem) => {
    if (item.unread) markItemRead(item);
    const { target } = item;
    switch (target.type) {
      case 'course':
        navigation.navigate('Course', {
          id: target.courseId,
          ...(target.tab ? { screen: COURSE_TABS[target.tab] } : {}),
        });
        break;
      case 'message':
        navigation.navigate('Message', { id: target.messageId });
        break;
      case 'ticket':
        rootNavigation.navigate('ServicesTab', {
          screen: 'Ticket',
          params: { id: target.ticketId },
          initial: false,
        });
        break;
      case 'news':
        rootNavigation.navigate('ServicesTab', {
          screen: 'NewsItem',
          params: { id: target.newsId },
          initial: false,
        });
        break;
      default:
        // Nothing to open: reading the row is all there is
        break;
    }
  };

  const runMarkAll = async (toMark: InboxItem[]) => {
    setProgress({ done: 0, total: toMark.length });
    const succeeded = await markAllRead(toMark, done =>
      setProgress({ done, total: toMark.length }),
    );
    setProgress(undefined);
    const text =
      succeeded === toMark.length
        ? t('inboxScreen.markAllDone', { count: succeeded })
        : t('inboxScreen.markAllPartial', {
            done: succeeded,
            total: toMark.length,
          });
    setFeedback({ text, isError: succeeded < toMark.length });
    announce(text);
  };

  const onMarkAll = () => {
    const toMark = shown.filter(i => i.unread);
    if (!toMark.length || progress) return;
    // The server has no call to mark items unread again, so there is no
    // Undo: a long list asks first instead
    if (toMark.length <= MARK_ALL_WITHOUT_ASKING) {
      runMarkAll(toMark);
      return;
    }
    Alert.alert(
      t('inboxScreen.markAllConfirmTitle', { count: toMark.length }),
      t('inboxScreen.markAllConfirmText'),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('inboxScreen.markAllConfirm'),
          onPress: () => runMarkAll(toMark),
        },
      ],
    );
  };

  const loading = states.status === 'loading';
  let body;
  if (loading) {
    // Shaped like the loaded list: a day label over a card of rows
    body = (
      <>
        <View style={styles.groupLabel}>
          <SkeletonLine variant="secondaryText" width={72} />
        </View>
        <SkeletonRows
          count={5}
          leading="avatar"
          trailing="value"
          titleLines={2}
          label={t('inboxScreen.loading')}
          style={styles.skeleton}
        />
      </>
    );
  } else if (states.status === 'error') {
    body = (
      <RegionStateBlock
        states={states}
        style={styles.firstCard}
        errorState={{
          title: t('inboxScreen.failedTitle'),
          text: t('inboxScreen.failedText'),
        }}
      />
    );
  } else if (!shown.length) {
    body = (
      <RegionStateBlock
        style={styles.firstCard}
        states={{ ...states, status: 'empty' }}
        emptyState={{
          title:
            filter === 'all'
              ? t('inboxScreen.emptyTitle')
              : t('inboxScreen.emptyFilterTitle'),
          text: t('inboxScreen.emptyText'),
          action:
            filter === 'all'
              ? undefined
              : {
                  label: t('inboxScreen.showAll'),
                  onPress: () => setFilter('all'),
                },
        }}
      />
    );
  } else {
    body = groups.map(group => (
      <View key={group.id}>
        <View style={styles.groupLabel}>
          {group.id === 'pinned' && (
            <Icon
              icon={faTriangleExclamation}
              size={14}
              color={colors.dangerText}
            />
          )}
          <Text
            variant="secondaryText"
            weight="semibold"
            role="heading"
            style={group.id === 'pinned' && { color: colors.dangerText }}
          >
            {t(`inboxScreen.groups.${group.id}`)}
          </Text>
        </View>
        <OverviewList indented style={styles.group}>
          {group.items.map(item => (
            <InboxRow key={item.key} item={item} onPress={open} />
          ))}
        </OverviewList>
      </View>
    ));
  }

  // An empty inbox has nothing to filter or mark
  const showTools = states.status !== 'error' && (loading || items.length > 0);

  return (
    <ScrollView
      contentInsetAdjustmentBehavior="automatic"
      refreshControl={
        <RefreshControl
          queries={[
            notificationsQuery,
            messagesQuery,
            ticketsQuery,
            coursesQuery,
          ]}
          manual
        />
      }
    >
      {showTools && (
        <>
          <FilterChips
            filter={filter}
            counts={loading ? undefined : counts}
            onChange={setFilter}
          />
          <View style={styles.statusRow}>
            {loading ? (
              <SkeletonLine width={96} />
            ) : (
              <Text
                variant="title"
                weight="semibold"
                style={styles.statusText}
                accessibilityLiveRegion="polite"
              >
                {progress
                  ? t('inboxScreen.markAllProgress', progress)
                  : unread
                    ? t('inboxScreen.unreadCount', { count: unread })
                    : t('inboxScreen.allRead')}
              </Text>
            )}
            <TextButton
              onPress={onMarkAll}
              disabled={loading || !unread}
              loading={!!progress}
              style={styles.markAll}
            >
              {t('inboxScreen.markAll')}
            </TextButton>
          </View>
        </>
      )}
      {body}
      <BottomBarSpacer />
    </ScrollView>
  );
};

interface FilterChipsProps {
  filter: InboxFilter;
  counts?: Record<InboxFilter, number>;
  onChange: (filter: InboxFilter) => void;
}

/**
 * All, Courses, University, Tickets, each with its unread count. The row
 * scrolls sideways at large text and keeps the selected chip in view.
 */
const FilterChips = ({ filter, counts, onChange }: FilterChipsProps) => {
  const { t } = useTranslation();
  const styles = useStylesheet(createStyles);
  const { layout } = useTheme();
  const scrollRef = useRef<ScrollView>(null);
  const positions = useRef<Partial<Record<InboxFilter, number>>>({});

  useEffect(() => {
    const x = positions.current[filter];
    if (x !== undefined) {
      scrollRef.current?.scrollTo({
        x: Math.max(0, x - layout.gutter),
        animated: true,
      });
    }
  }, [filter, layout.gutter]);

  return (
    <ScrollView
      ref={scrollRef}
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.chips}
      accessibilityLabel={t('inboxScreen.filtersLabel')}
    >
      {INBOX_FILTERS.map(f => {
        const label = t(`inboxScreen.filters.${f}`);
        const count = counts?.[f] || undefined;
        return (
          <PillButton
            key={f}
            selected={filter === f}
            count={count}
            onPress={() => onChange(f)}
            onLayout={e => {
              positions.current[f] = e.nativeEvent.layout.x;
            }}
            accessibilityLabel={
              count ? t('inboxScreen.filterUnread', { label, count }) : label
            }
          >
            {label}
          </PillButton>
        );
      })}
    </ScrollView>
  );
};

const createStyles = ({ layout, spacing }: Theme) =>
  StyleSheet.create({
    chips: {
      gap: spacing[2],
      paddingHorizontal: layout.gutter,
      paddingTop: spacing[4],
      paddingBottom: spacing[1],
    },
    statusRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      alignItems: 'center',
      justifyContent: 'space-between',
      columnGap: spacing[3],
      minHeight: 52,
      paddingLeft: layout.gutter,
      paddingRight: layout.gutter - spacing[3],
      paddingTop: spacing[1],
    },
    statusText: {
      flexShrink: 1,
    },
    markAll: {
      marginLeft: 'auto',
    },
    groupLabel: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing[2],
      paddingHorizontal: layout.gutter,
      paddingTop: spacing[6],
      paddingBottom: spacing[2],
    },
    group: {
      marginVertical: 0,
    },
    skeleton: {
      marginHorizontal: layout.gutter,
    },
    firstCard: {
      marginTop: spacing[4],
      marginHorizontal: layout.gutter,
    },
  });
