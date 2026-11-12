/**
 * A grade as the app shows it: "30L" for "30 e lode", or the translation key
 * of a grade that is a word. The server writes the words in either case
 */
export const formatGrade = (grade: string) =>
  grade
    .replace(/ e lode/i, 'L')
    .replace(/^assente$/i, 'grades.absent')
    .replace(/^fallito$/i, 'grades.fail')
    .replace(/^superato$/i, 'grades.pass');

export const formatFinalGrade = (grade?: number | null) =>
  [grade ?? '--', 110].join('/');

export const formatExamOnTime = (
  totalOnTimeExamPoints: number | null,
  maxOnTimeExamPoints: number,
) => (totalOnTimeExamPoints ?? '0') + '/' + maxOnTimeExamPoints;

export const formatThirtiethsGrade = (grade?: number | null) =>
  [grade ?? '--', 30].join('/');
