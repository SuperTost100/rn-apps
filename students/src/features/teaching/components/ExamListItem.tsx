import { useTranslation } from 'react-i18next';

import { faCheck } from '@fortawesome/free-solid-svg-icons';
import {
  APP_TIMEZONE,
  isValidDate,
  usePreferencesContext,
} from '@polito/lib/core';
import { ListItem, StatusChip, StatusChipTone } from '@polito/lib/ui';
import { ExamStatusEnum } from '@polito/student-api-client';

import { AppPreferences } from '~/core/types/preferences';

import { DateTime } from 'luxon';

import { Exam } from '../../../core/types/api';
import { CourseIcon } from '../../courses/components/CourseIcon';

interface Props {
  exam: Exam;
  accessible?: boolean;
  /** Read before the row, e.g. its position in the list */
  accessibilityLabel?: string;
}

/** The tone of each exam state: the chip's word says the state, the tone repeats it */
export const EXAM_STATUS_TONE: Record<ExamStatusEnum, StatusChipTone> = {
  [ExamStatusEnum.Booked]: 'success',
  [ExamStatusEnum.RequestAccepted]: 'success',
  [ExamStatusEnum.Available]: 'info',
  [ExamStatusEnum.Requestable]: 'warning',
  [ExamStatusEnum.Requested]: 'warning',
  [ExamStatusEnum.RequestRejected]: 'danger',
  [ExamStatusEnum.Unavailable]: 'neutral',
};

/** "Mon 18 Jan, 09:00", in the app time zone and language */
export const useExamWhen = () => {
  const { t } = useTranslation();
  const { language } = usePreferencesContext<AppPreferences>();
  return (exam: Exam) => {
    if (!exam.examStartsAt || !isValidDate(exam.examStartsAt)) {
      return t('common.dateToBeDefined');
    }
    const start = DateTime.fromJSDate(exam.examStartsAt, {
      zone: APP_TIMEZONE,
    }).setLocale(language);
    return `${start.toFormat('ccc d LLL')}, ${
      exam.isTimeToBeDefined
        ? t('common.timeToBeDefined')
        : start.toFormat('HH:mm')
    }`;
  };
};

/**
 * An exam call: the course tile, the course, when and where, and its state
 * as a chip, which moves under the text at large text
 */
export const ExamListItem = ({ exam, accessibilityLabel, ...rest }: Props) => {
  const { t } = useTranslation();
  const { courses: coursesPreferences } =
    usePreferencesContext<AppPreferences>();
  const examWhen = useExamWhen();
  const coursePreferences = coursesPreferences[exam.uniqueShortcode];
  const rooms = exam.places?.map(place => place.name).join(', ');
  const subtitle = [examWhen(exam), rooms].filter(Boolean).join(' · ');
  const status = t(`teachingScreen.examChip.${exam.status}`);
  const isBooked =
    exam.status === ExamStatusEnum.Booked ||
    exam.status === ExamStatusEnum.RequestAccepted;

  return (
    <ListItem
      linkTo={{ screen: 'Exam', params: { id: exam.id } }}
      title={exam.courseName}
      subtitle={subtitle}
      leadingItem={
        <CourseIcon
          icon={coursePreferences?.icon}
          color={coursePreferences?.color}
          isHidden={coursePreferences?.isHidden}
        />
      }
      chip={
        <StatusChip
          label={status}
          tone={EXAM_STATUS_TONE[exam.status] ?? 'neutral'}
          icon={isBooked ? faCheck : undefined}
        />
      }
      chipLabel={status}
      showChevron={false}
      accessibilityLabel={[
        accessibilityLabel,
        exam.courseName,
        subtitle,
        status,
      ]
        .filter(Boolean)
        .join(', ')}
      {...rest}
    />
  );
};
