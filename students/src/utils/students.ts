import { StudentCareer } from '@polito/student-api-client';

export const getStudentEnrollmentYear = (student?: StudentCareer) => {
  if (!student) return '...';
  return `${student.firstEnrollmentYear - 1}/${student.firstEnrollmentYear}`;
};

const SMALL_WORDS = new Set([
  'a',
  'al',
  'and',
  'con',
  'da',
  'dei',
  'del',
  'della',
  'delle',
  'di',
  'e',
  'ed',
  'for',
  'gli',
  'il',
  'in',
  'la',
  'le',
  'lo',
  'nel',
  'nella',
  'of',
  'per',
  'the',
]);

/**
 * A degree name the API sends in capitals ("INGEGNERIA INFORMATICA (COMPUTER
 * ENGINEERING)") written as a title: each word capitalised, short joining
 * words and elided articles ("dell'") in lower case, except at the start.
 */
export const degreeNameAsTitle = (name: string) =>
  name
    .toLowerCase()
    .split(/(\s+|\(|\)|-)/)
    .map((word, index) => {
      if (!word.trim() || /^[()-]$/.test(word)) return word;
      const elided = word.match(/^([a-z]+')(.*)$/);
      if (elided && index > 0) {
        return (
          elided[1] + elided[2].charAt(0).toUpperCase() + elided[2].slice(1)
        );
      }
      if (index > 0 && SMALL_WORDS.has(word)) return word;
      return word.charAt(0).toUpperCase() + word.slice(1);
    })
    .join('');
