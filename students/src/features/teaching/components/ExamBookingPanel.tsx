import { ReactNode, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Alert, StyleSheet, View } from 'react-native';

import { faCalendar } from '@fortawesome/free-regular-svg-icons';
import {
  faCircleCheck,
  faCircleInfo,
  faCircleXmark,
} from '@fortawesome/free-solid-svg-icons';
import {
  APP_TIMEZONE,
  isValidDate,
  useFeedbackContext,
  useIsOnline,
  usePreferencesContext,
} from '@polito/lib/core';
import {
  Card,
  CtaButton,
  Icon,
  InfoMessage,
  Text,
  TextButton,
  type Theme,
  useStylesheet,
  useTheme,
} from '@polito/lib/ui';
import { ExamStatusEnum } from '@polito/student-api-client';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useQueryClient } from '@tanstack/react-query';

import type { TFunction } from 'i18next';
import { DateTime } from 'luxon';

import { FailureNote } from '../../../core/components/FailureNote';
import {
  EXAMS_QUERY_KEY,
  UNLIMITED_PLACES,
  useBookExam,
  useCancelExamBooking,
} from '../../../core/queries/examHooks';
import { Exam } from '../../../core/types/api';
import { AppPreferences } from '../../../core/types/preferences';
import {
  MutationFailure,
  describeMutationFailure,
} from '../../../utils/mutationFailure';
import { useExamWhen } from './ExamListItem';

interface Props {
  exam: Exam;
  /** "Giulia Ferrandi", when the teacher has loaded */
  teacherName?: string;
  /** A date change request went out from this page */
  dateChangeSent?: boolean;
}

type Action = 'book' | 'cancel';

/** "Sat 16 Jan, 23:59", in the app time zone and language */
const useFormatDeadline = () => {
  const { language } = usePreferencesContext<AppPreferences>();
  return (date?: Date | null) =>
    date && isValidDate(date)
      ? DateTime.fromJSDate(date, { zone: APP_TIMEZONE })
          .setLocale(language)
          .toFormat('ccc d LLL, HH:mm')
      : undefined;
};

/**
 * The booking block of the exam page: places left and the deadline as
 * figures, one primary action, the rarer ones as text links under it.
 * Booking and cancelling change the block in place; a short message
 * confirms it. A failure says so here, after asking the server for the
 * exam's real state.
 */
export const ExamBookingPanel = ({
  exam,
  teacherName,
  dateChangeSent,
}: Props) => {
  const { t } = useTranslation();
  const styles = useStylesheet(createStyles);
  const { colors } = useTheme();
  const isOnline = useIsOnline();
  const { setFeedback } = useFeedbackContext();
  const navigation = useNavigation<NativeStackNavigationProp<any>>();
  const client = useQueryClient();
  const examWhen = useExamWhen();
  const formatDeadline = useFormatDeadline();
  const book = useBookExam(exam.id);
  const cancel = useCancelExamBooking(exam.id);
  const [failure, setFailure] = useState<
    MutationFailure & { action: Action }
  >();

  const busy = book.isPending || cancel.isPending;
  const rooms = exam.places?.map(place => place.name).join(', ');
  const closes = formatDeadline(exam.bookingEndsAt);
  const day =
    exam.examStartsAt && isValidDate(exam.examStartsAt)
      ? DateTime.fromJSDate(exam.examStartsAt, { zone: APP_TIMEZONE })
      : undefined;

  const openAgenda = () => {
    if (!day) return;
    navigation.navigate('AgendaTab', {
      screen: 'Agenda',
      params: { date: day.toISODate(), requestedAt: Date.now() },
      pop: true,
    });
  };

  const confirmBooked = () =>
    setFeedback({
      text: t('examScreen.bookedFeedback', {
        course: exam.courseName,
        day: day ? examWhen(exam) : t('common.dateToBeDefined'),
      }),
      action: day
        ? { label: t('examScreen.viewInAgenda'), onPress: openAgenda }
        : undefined,
    });

  const confirmCancelled = () =>
    setFeedback({ text: t('examScreen.cancelledFeedback') });

  /**
   * After a failure the page shows what the server now says: a booking whose
   * answer was lost may have gone through
   */
  const settle = async (action: Action, error: unknown) => {
    const described = await describeMutationFailure(error);
    await client.refetchQueries({ queryKey: EXAMS_QUERY_KEY });
    const now = client
      .getQueryData<Exam[]>(EXAMS_QUERY_KEY)
      ?.find(e => e.id === exam.id);
    if (action === 'book' && now?.status === ExamStatusEnum.Booked) {
      confirmBooked();
      return;
    }
    if (action === 'cancel' && now?.status === ExamStatusEnum.Available) {
      confirmCancelled();
      return;
    }
    setFailure({ action, ...described });
  };

  const onBook = () => {
    if (exam.question) {
      navigation.navigate('ExamQuestion', { id: exam.id });
      return;
    }
    setFailure(undefined);
    return book
      .mutateAsync({ courseShortcode: exam.courseShortcode })
      .then(confirmBooked, error => settle('book', error));
  };

  const onCancel = () => {
    Alert.alert(
      t('examScreen.cancelTitle', { course: exam.courseName }),
      t('examScreen.cancelText', {
        when: examWhen(exam),
        closes: closes ?? t('common.dateToBeDefined'),
      }),
      [
        { text: t('examScreen.keepBooking'), style: 'cancel' },
        {
          text: t('examScreen.ctaCancel'),
          style: 'destructive',
          onPress: () => {
            setFailure(undefined);
            cancel
              .mutateAsync()
              .then(confirmCancelled, error => settle('cancel', error));
          },
        },
      ],
    );
  };

  const total = exam.bookedCount + exam.availableCount;
  const places =
    exam.availableCount === UNLIMITED_PLACES ? (
      <Fact
        label={t('examScreen.places')}
        value={t('examScreen.noPlaceLimit')}
      />
    ) : (
      <Fact
        label={t('examScreen.placesLeft')}
        value={`${exam.availableCount}`}
        suffix={t('examScreen.placesOf', { total })}
        large
        accessibilityLabel={t('examScreen.placesLabel', {
          left: exam.availableCount,
          total,
        })}
      />
    );
  const facts = (deadlineLabel: string) => (
    <View style={styles.facts}>
      {places}
      {closes && <Fact label={deadlineLabel} value={closes} />}
    </View>
  );

  const dateChangeLink = exam.isReschedulable ? (
    <TextButton
      onPress={() => navigation.navigate('ExamReschedule', { id: exam.id })}
      disabled={!isOnline || busy}
      accessibilityHint={!isOnline ? t('states.needsConnection') : undefined}
      style={styles.link}
    >
      {t('examScreen.requestDifferentDate')}
    </TextButton>
  ) : null;

  const dateChangeNote = dateChangeSent ? (
    <InfoMessage
      icon={faCircleCheck}
      style={{ backgroundColor: colors.successBg }}
    >
      <Text variant="secondaryText" style={{ color: colors.successText }}>
        {[
          teacherName
            ? t('examScreen.dateChangeSent', { teacher: teacherName })
            : t('examScreen.dateChangeSentNoTeacher'),
          exam.status === ExamStatusEnum.Booked
            ? t('examScreen.dateChangeKeepsBooking')
            : undefined,
        ]
          .filter(Boolean)
          .join(' ')}
      </Text>
    </InfoMessage>
  ) : null;

  const failureNote =
    failure &&
    ((failure.action === 'book' && exam.status === ExamStatusEnum.Available) ||
      (failure.action === 'cancel' &&
        exam.status === ExamStatusEnum.Booked)) ? (
      <FailureNote
        title={
          failure.action === 'book'
            ? t('examScreen.bookFailedTitle')
            : t('examScreen.cancelFailedTitle')
        }
        failure={failure}
        lostText={
          failure.action === 'book'
            ? t('examScreen.lostAnswer')
            : t('examScreen.lostCancelAnswer')
        }
      />
    ) : null;

  let content: ReactNode;
  switch (exam.status) {
    case ExamStatusEnum.Available:
      content = (
        <>
          {facts(t('examScreen.bookingClosesOn'))}
          {failureNote}
          <CtaButton
            absolute={false}
            containerStyle={styles.button}
            title={
              isOnline
                ? t('examScreen.ctaBook')
                : t('examScreen.bookNeedsConnection')
            }
            action={onBook}
            loading={book.isPending}
            disabled={!isOnline || cancel.isPending}
          />
          {dateChangeLink && <View style={styles.links}>{dateChangeLink}</View>}
          {dateChangeNote}
        </>
      );
      break;
    case ExamStatusEnum.Booked:
      content = (
        <>
          <StateLine icon={faCircleCheck} color={colors.successText}>
            <Text weight="bold">{t('examScreen.bookedLead')}</Text>
            {` ${[examWhen(exam), rooms].filter(Boolean).join(', ')}.`}
          </StateLine>
          {facts(t('examScreen.canCancelUntil'))}
          {failureNote}
          {day && (
            <CtaButton
              absolute={false}
              containerStyle={styles.button}
              variant="outlined"
              icon={faCalendar}
              title={t('examScreen.viewInAgenda')}
              action={openAgenda}
            />
          )}
          <View style={styles.links}>
            <TextButton
              destructive
              onPress={onCancel}
              loading={cancel.isPending}
              disabled={!isOnline || book.isPending}
              style={styles.link}
            >
              {isOnline
                ? t('examScreen.ctaCancel')
                : t('examScreen.cancelNeedsConnection')}
            </TextButton>
            {dateChangeLink}
          </View>
          {dateChangeNote}
        </>
      );
      break;
    case ExamStatusEnum.Requestable:
      content = (
        <>
          {facts(t('examScreen.requestsCloseOn'))}
          <Text variant="secondaryText">{t('examScreen.onRequestText')}</Text>
          <CtaButton
            absolute={false}
            containerStyle={styles.button}
            title={
              isOnline
                ? t('examScreen.requestPlace')
                : t('examScreen.requestNeedsConnection')
            }
            action={() => navigation.navigate('ExamRequest', { id: exam.id })}
            disabled={!isOnline}
          />
        </>
      );
      break;
    case ExamStatusEnum.Requested:
      content = (
        <>
          <StateLine icon={faCircleCheck} color={colors.successText}>
            {teacherName
              ? t('examScreen.requestedText', { teacher: teacherName })
              : t('examScreen.requestedTextNoTeacher')}
          </StateLine>
          {dateChangeNote}
        </>
      );
      break;
    case ExamStatusEnum.RequestAccepted:
      content = (
        <StateLine icon={faCircleCheck} color={colors.successText}>
          {t('examScreen.requestAcceptedText')}
        </StateLine>
      );
      break;
    case ExamStatusEnum.RequestRejected:
      content = (
        <StateLine icon={faCircleXmark} color={colors.dangerText}>
          {t('examScreen.requestRejectedText')}
        </StateLine>
      );
      break;
    default:
      content = (
        <StateLine icon={faCircleInfo} color={colors.secondaryText}>
          {unavailableText(exam, formatDeadline, t)}
        </StateLine>
      );
  }

  return (
    <Card padded style={styles.card}>
      {content}
    </Card>
  );
};

/** Why an exam can't be booked: the window closed, has not opened, or else */
const unavailableText = (
  exam: Exam,
  formatDeadline: (date?: Date | null) => string | undefined,
  t: TFunction,
) => {
  const now = Date.now();
  if (exam.bookingEndsAt && exam.bookingEndsAt.valueOf() < now) {
    return t('examScreen.closedText', {
      date: formatDeadline(exam.bookingEndsAt),
    });
  }
  if (exam.bookingStartsAt && exam.bookingStartsAt.valueOf() > now) {
    return t('examScreen.opensText', {
      date: formatDeadline(exam.bookingStartsAt),
    });
  }
  // The server's own reason, e.g. no places left, when it gives one
  return exam.feedback || t('examScreen.notOpenText');
};

/** A label over its value; the large one is the page's main figure */
const Fact = ({
  label,
  value,
  suffix,
  large = false,
  accessibilityLabel,
}: {
  label: string;
  value: string;
  suffix?: string;
  large?: boolean;
  accessibilityLabel?: string;
}) => {
  const { colors } = useTheme();
  return (
    <View
      accessible
      accessibilityLabel={accessibilityLabel ?? `${label}: ${value}`}
    >
      <Text variant="secondaryText">{label}</Text>
      {large ? (
        <Text
          variant="display"
          style={{ color: colors.title, fontVariant: ['tabular-nums'] }}
        >
          {value}
          {suffix && (
            <Text variant="title" weight="semibold">
              {` ${suffix}`}
            </Text>
          )}
        </Text>
      ) : (
        <Text variant="title" weight="bold" style={{ color: colors.title }}>
          {value}
        </Text>
      )}
    </View>
  );
};

/** The state in a sentence, after an icon that repeats it */
const StateLine = ({
  icon,
  color,
  children,
}: {
  icon: typeof faCircleCheck;
  color: string;
  children: ReactNode;
}) => {
  const styles = useStylesheet(createStyles);
  return (
    <View style={styles.stateLine}>
      <Icon icon={icon} color={color} size={22} />
      <Text style={styles.stateText}>{children}</Text>
    </View>
  );
};

const createStyles = ({ spacing }: Theme) =>
  StyleSheet.create({
    card: {
      marginTop: spacing[4],
      gap: spacing[4],
    },
    facts: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      justifyContent: 'space-between',
      alignItems: 'flex-end',
      columnGap: spacing[8],
      rowGap: spacing[3],
    },
    button: {
      padding: 0,
    },
    links: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      justifyContent: 'space-between',
      columnGap: spacing[4],
      // The 48 px targets reach into the card's padding, the labels line up
      marginVertical: -spacing[2],
    },
    link: {
      marginLeft: -spacing[3],
      marginRight: -spacing[3],
    },
    stateLine: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing[3],
    },
    stateText: {
      flex: 1,
    },
  });
