import { CourseOverview } from '../../../core/types/api';

export const formatAcademicYear = (year?: string | number) => {
  if (year === undefined || year === null || year === '') return '';
  const value = `${year}`;
  if (value.includes('/')) return value;
  const endYear = Number(value);
  if (Number.isNaN(endYear)) return value;
  return `${endYear - 1}/${value.slice(-2)}`;
};

export const isCourseDetailed = (course: CourseOverview) => {
  if (course.id !== null) return true;
  if (course.previousEditions.some(edition => edition.id !== null)) return true;
  return false;
};

/**
 * The key of the course's preferences: a module's is its parent's code
 * with the module's position after it, as the course header computes it
 */
export const uniqueShortcodeOf = (
  courseId: number,
  courses: CourseOverview[] | undefined,
) => {
  const isEdition = (list: { id: number | string }[]) =>
    list.some(e => +e.id === courseId);
  const course = courses?.find(
    c => c.id === courseId || isEdition(c.previousEditions),
  );
  if (course) return course.uniqueShortcode;
  const parent = courses?.find(c =>
    c.modules?.some(m => m.id === courseId || isEdition(m.previousEditions)),
  );
  const index =
    parent?.modules?.findIndex(
      m => m.id === courseId || isEdition(m.previousEditions),
    ) ?? -1;
  return parent && index >= 0 ? `${parent.uniqueShortcode}${index + 1}` : '';
};
