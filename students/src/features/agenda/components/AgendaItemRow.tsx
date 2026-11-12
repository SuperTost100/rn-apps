import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';

import { faDoorOpen, faHourglassHalf } from '@fortawesome/free-solid-svg-icons';
import { APP_TIMEZONE } from '@polito/lib/core';
import {
  AgendaRow,
  CourseTile,
  Icon,
  StatusChipTone,
  Theme,
  useStylesheet,
  useTheme,
} from '@polito/lib/ui';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { AgendaItem } from '../types/AgendaItem';
import {
  AgendaEntry,
  isAllDay,
  placeOf,
  typeLabelOf,
} from '../utils/agendaItems';
import { isNow, isPast } from '../utils/agendaLogic';
import { AgendaStackParamList } from './AgendaNavigator';

const TONES: Record<AgendaItem['type'], StatusChipTone> = {
  lecture: 'neutral',
  exam: 'warning',
  booking: 'success',
  deadline: 'neutral',
};

/** The tile of a booking or a deadline: a glyph on a neutral tile */
export const NeutralTile = ({ type }: { type: 'booking' | 'deadline' }) => {
  const styles = useStylesheet(createStyles);
  const { colors } = useTheme();
  return (
    <View
      style={styles.tile}
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
    >
      <Icon
        icon={type === 'booking' ? faDoorOpen : faHourglassHalf}
        size={20}
        color={colors.neutralChipText}
      />
    </View>
  );
};

export const ItemTile = ({ item }: { item: AgendaItem }) =>
  item.type === 'lecture' || item.type === 'exam' ? (
    <CourseTile color={item.color} icon={item.icon} />
  ) : (
    <NeutralTile type={item.type} />
  );

/** Opens the detail screen of an agenda item */
export const useOpenItem = () => {
  const navigation =
    useNavigation<NativeStackNavigationProp<AgendaStackParamList>>();
  return (item: AgendaItem) => {
    switch (item.type) {
      case 'lecture':
        return navigation.navigate('Lecture', { item });
      case 'exam':
        return navigation.navigate('Exam', { id: item.id });
      case 'booking':
        return navigation.navigate('Booking', { id: item.id });
      case 'deadline':
        return navigation.navigate('Deadline', { item });
    }
  };
};

/** The times of an item as screen readers say them */
export const useItemLabel = () => {
  const { t, i18n } = useTranslation();
  return (entry: AgendaEntry, now: number, withDay = false) => {
    const { item } = entry;
    const type = typeLabelOf(item, t);
    const end = item.end.isValid ? item.end.toFormat('HH:mm') : undefined;
    const when =
      item.type === 'exam' && item.isTimeToBeDefined
        ? t('agendaScreen.timeToBeDefined')
        : entry.allDay
          ? t('agendaScreen.allDay')
          : end
            ? t('agendaScreen.fromTo', {
                start: item.start.toFormat('HH:mm'),
                end,
              })
            : item.start.toFormat('HH:mm');
    return [
      type ? `${type}: ${item.title}` : item.title,
      withDay
        ? item.start
            .setZone(APP_TIMEZONE)
            .setLocale(i18n.language)
            .toFormat('cccc d LLLL')
        : undefined,
      when,
      placeOf(item),
      isNow(entry, now) ? t('agendaScreen.nowState') : undefined,
      isPast(entry, now, APP_TIMEZONE) ? t('agendaScreen.ended') : undefined,
    ]
      .filter(Boolean)
      .join(', ');
  };
};

interface Props {
  entry: AgendaEntry;
  now: number;
}

/** One agenda item as a compact row: time, tile, title, room, type */
export const AgendaItemRow = ({ entry, now }: Props) => {
  const { t } = useTranslation();
  const openItem = useOpenItem();
  const label = useItemLabel();
  const { item } = entry;
  const allDay = isAllDay(item);
  return (
    <AgendaRow
      startTime={allDay ? undefined : item.start.toFormat('HH:mm')}
      endTime={
        allDay || !item.end.isValid || item.end.equals(item.start)
          ? undefined
          : item.end.toFormat('HH:mm')
      }
      allDayLabel={
        item.type === 'exam'
          ? t('agendaScreen.timeToBeDefinedShort')
          : t('agendaScreen.allDay')
      }
      leadingItem={<ItemTile item={item} />}
      title={item.title}
      subtitle={placeOf(item)}
      typeLabel={typeLabelOf(item, t)}
      typeTone={TONES[item.type]}
      isNow={isNow(entry, now)}
      nowLabel={t('agendaScreen.now')}
      isPast={isPast(entry, now, APP_TIMEZONE)}
      onPress={() => openItem(item)}
      accessibilityLabel={label(entry, now)}
    />
  );
};

const createStyles = ({ colors, controls, shapes }: Theme) =>
  StyleSheet.create({
    tile: {
      width: controls.courseTileSize,
      height: controls.courseTileSize,
      borderRadius: shapes.md,
      backgroundColor: colors.neutralChipBg,
      alignItems: 'center',
      justifyContent: 'center',
    },
  });
