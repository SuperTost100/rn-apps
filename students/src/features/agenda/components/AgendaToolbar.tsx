import { useTranslation } from 'react-i18next';
import { ScrollView, StyleSheet, View } from 'react-native';

import { faArrowsRotate, faCheck } from '@fortawesome/free-solid-svg-icons';
import {
  ActivityIndicator,
  Icon,
  IconButton,
  PillButton,
  Text,
  Theme,
  useStylesheet,
  useTheme,
} from '@polito/lib/ui';

import { AgendaItemType } from '../types/AgendaItem';
import { AgendaTypesFilterState } from '../types/AgendaTypesFilterState';
import { FILTER_TYPES } from '../utils/agendaItems';

interface ChipsProps {
  shown: AgendaTypesFilterState;
  onToggle: (type: AgendaItemType) => void;
}

/** Lectures, Exams, Bookings, Deadlines: each one shows or hides its type */
export const AgendaFilterChips = ({ shown, onToggle }: ChipsProps) => {
  const { t } = useTranslation();
  const styles = useStylesheet(createStyles);
  const { colors } = useTheme();
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.chips}
      accessibilityLabel={t('agendaScreen.filtersLabel')}
    >
      {FILTER_TYPES.map(type => {
        const selected = shown[type];
        return (
          <PillButton
            key={type}
            selected={selected}
            onPress={() => onToggle(type)}
            accessibilityRole="checkbox"
            accessibilityState={{ checked: selected }}
            accessibilityLabel={t(`agendaScreen.filters.${type}`)}
          >
            {selected && (
              <Icon icon={faCheck} size={14} color={colors.onSelectedChip} />
            )}
            <Text
              variant="label"
              style={{
                color: selected ? colors.onSelectedChip : colors.title,
              }}
            >
              {t(`agendaScreen.filters.${type}`)}
            </Text>
          </PillButton>
        );
      })}
    </ScrollView>
  );
};

interface StatusProps {
  title: string;
  /** "09:12", when the data on screen was fetched */
  time?: string;
  isRefreshing: boolean;
  isOffline: boolean;
  onRefresh: () => void;
}

/**
 * "Today, Wed 11 Nov" and, on the right, when the agenda was updated with
 * the refresh button. While refreshing it says so; offline it says when
 * the shown data was saved.
 */
export const AgendaStatusRow = ({
  title,
  time,
  isRefreshing,
  isOffline,
  onRefresh,
}: StatusProps) => {
  const { t } = useTranslation();
  const styles = useStylesheet(createStyles);
  const { colors } = useTheme();
  const status = isRefreshing
    ? t('agendaScreen.updating')
    : time
      ? t(isOffline ? 'agendaScreen.saved' : 'agendaScreen.updated', { time })
      : undefined;
  return (
    <View style={styles.status}>
      <Text
        variant="title"
        weight="semibold"
        accessibilityRole="header"
        style={styles.statusTitle}
      >
        {title}
      </Text>
      <View style={styles.statusRight}>
        {isRefreshing && <ActivityIndicator size="small" />}
        {status && (
          <Text
            variant="secondaryText"
            style={styles.number}
            accessibilityLiveRegion="polite"
          >
            {status}
          </Text>
        )}
        <IconButton
          icon={faArrowsRotate}
          color={colors.link}
          size={20}
          onPress={onRefresh}
          disabled={isRefreshing}
          accessibilityLabel={
            isOffline
              ? t('agendaScreen.refreshOffline')
              : time
                ? t('agendaScreen.refreshLabel', { time })
                : t('agendaScreen.refresh')
          }
          style={styles.refresh}
        />
      </View>
    </View>
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
    status: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      alignItems: 'center',
      justifyContent: 'space-between',
      columnGap: spacing[3],
      minHeight: 52,
      paddingHorizontal: layout.gutter,
      paddingTop: spacing[1],
    },
    statusTitle: {
      flexShrink: 1,
    },
    statusRight: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing[1],
      marginLeft: 'auto',
    },
    number: {
      fontVariant: ['tabular-nums'],
    },
    refresh: {
      marginRight: -spacing[3],
    },
  });
