import { useTranslation } from 'react-i18next';

import { APP_TIMEZONE, usePreferencesContext } from '@polito/lib/core';
import { AgendaRow, CourseTile } from '@polito/lib/ui';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { AppPreferences } from '../../../core/types/preferences';
import { TeachingStackParamList } from '../../teaching/components/TeachingNavigator';
import { CourseLectureEntry } from '../hooks/useCourseNextLectures';

/** The timetable's word for an ordinary lecture, which the row leaves out */
const PLAIN_LECTURE = 'Lezione';

interface Props {
  entry: CourseLectureEntry;
  now: number;
}

/**
 * A coming lecture of the course as an agenda row: time, the course tile,
 * the day, the kind when it is not a plain lecture, and the room. It opens
 * the lecture as the agenda does.
 */
export const CourseLectureRow = ({ entry, now }: Props) => {
  const { t } = useTranslation();
  const { language } = usePreferencesContext<AppPreferences>();
  const navigation =
    useNavigation<NativeStackNavigationProp<TeachingStackParamList>>();
  const { item, kind } = entry;
  const start = item.start.setZone(APP_TIMEZONE).setLocale(language);
  const day = start.toFormat('ccc d LLL');
  const room = item.place?.name;
  const kindLabel = kind && kind !== PLAIN_LECTURE ? kind : undefined;
  const isNow = item.start.toMillis() <= now && now < item.end.toMillis();
  const startTime = item.start.toFormat('HH:mm');
  const endTime = item.end.toFormat('HH:mm');

  return (
    <AgendaRow
      startTime={startTime}
      endTime={endTime}
      leadingItem={<CourseTile color={item.color} icon={item.icon} />}
      title={item.title}
      subtitle={[day, kindLabel, room].filter(Boolean).join(' · ')}
      isNow={isNow}
      nowLabel={t('agendaScreen.now')}
      onPress={() => navigation.navigate('Lecture', { item })}
      accessibilityLabel={[
        kindLabel ? `${kindLabel}: ${item.title}` : item.title,
        start.toFormat('cccc d LLLL'),
        t('agendaScreen.fromTo', { start: startTime, end: endTime }),
        room,
        isNow ? t('agendaScreen.nowState') : undefined,
      ]
        .filter(Boolean)
        .join(', ')}
    />
  );
};
