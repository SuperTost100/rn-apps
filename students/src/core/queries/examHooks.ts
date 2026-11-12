import { APP_TIMEZONE, isValidDate, pluckData } from '@polito/lib/core';
import {
  type Exam as ApiExam,
  type BookExamRequest,
  ExamStatusEnum,
  ExamsApi,
  type RescheduleExamRequest,
} from '@polito/student-api-client';
import {
  QueryClient,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';

import { DateTime } from 'luxon';

import { Exam } from '../types/api';

export const EXAMS_QUERY_KEY = ['exams'];

const useExamsClient = (): ExamsApi => {
  return new ExamsApi();
};

const mapApiExamToExam = (exam: ApiExam): Exam => {
  return {
    ...exam,
    isTimeToBeDefined:
      exam.examStartsAt !== null &&
      DateTime.fromJSDate(exam.examStartsAt, { zone: APP_TIMEZONE }).hour === 0,
    uniqueShortcode: exam.courseShortcode + exam.moduleNumber,
  };
};

export const useGetExams = <T = Exam[]>(select?: (exams: Exam[]) => T) => {
  const examsClient = useExamsClient();

  return useQuery<Exam[], Error, T>({
    queryKey: EXAMS_QUERY_KEY,
    queryFn: () =>
      examsClient
        .getExams()
        .then(pluckData)
        .then(exams =>
          exams
            .map(mapApiExamToExam)
            .sort((a, b) =>
              !a.examStartsAt || !isValidDate(a.examStartsAt)
                ? 1
                : !b.examStartsAt || !isValidDate(b.examStartsAt)
                  ? -1
                  : a.examStartsAt.valueOf() - b.examStartsAt.valueOf(),
            ),
        ),
    select,
  });
};

/**
 * Writes what the server now says about one exam into the cached list, so
 * every screen that reads it (the exam page, the lists, the agenda) changes
 * at once, then fetches the list again to be sure
 */
const updateExamInCache = (
  client: QueryClient,
  examId: number,
  change: (exam: Exam) => Exam,
) => {
  client.setQueryData<Exam[]>(EXAMS_QUERY_KEY, exams =>
    exams?.map(exam => (exam.id === examId ? change(exam) : exam)),
  );
  return client.invalidateQueries({ queryKey: EXAMS_QUERY_KEY });
};

/** availableCount 999 means the call has no limit on places */
export const UNLIMITED_PLACES = 999;

const movePlace = (exam: Exam, booked: 1 | -1) => ({
  bookedCount: exam.bookedCount + booked,
  availableCount:
    exam.availableCount === UNLIMITED_PLACES
      ? exam.availableCount
      : Math.max(exam.availableCount - booked, 0),
});

/**
 * Books an exam, or sends the request for a place on an exam given on
 * request (with requestReason). The screen that books says when it fails,
 * so the app-wide alert stays quiet. Mutations never retry: a second POST
 * after a lost answer could book twice.
 */
export const useBookExam = (examId: number) => {
  const examsClient = useExamsClient();
  const client = useQueryClient();

  return useMutation({
    mutationFn: (dto: BookExamRequest) =>
      examsClient.bookExam({ examId: examId, bookExamRequest: dto }),
    onError() {},
    onSuccess(_, dto) {
      return updateExamInCache(client, examId, exam =>
        dto.requestReason
          ? {
              ...exam,
              status: ExamStatusEnum.Requested,
              requestReason: dto.requestReason,
            }
          : { ...exam, status: ExamStatusEnum.Booked, ...movePlace(exam, 1) },
      );
    },
  });
};

export const useCancelExamBooking = (examId: number) => {
  const examsClient = useExamsClient();
  const client = useQueryClient();

  return useMutation({
    mutationFn: () => examsClient.deleteExamBookingById({ examId: examId }),
    onError() {},
    onSuccess() {
      return updateExamInCache(client, examId, exam => ({
        ...exam,
        status: ExamStatusEnum.Available,
        ...movePlace(exam, -1),
      }));
    },
  });
};

export const useRescheduleRequest = (examId: number) => {
  const examsClient = useExamsClient();
  const client = useQueryClient();

  return useMutation({
    mutationFn: (rescheduleReason: RescheduleExamRequest) =>
      examsClient.rescheduleExam({
        examId: examId,
        rescheduleExamRequest: rescheduleReason,
      }),
    // The form says when it fails
    onError() {},
    onSuccess() {
      return client.invalidateQueries({ queryKey: EXAMS_QUERY_KEY });
    },
  });
};
