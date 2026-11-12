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
