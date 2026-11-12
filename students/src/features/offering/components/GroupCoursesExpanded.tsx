import { useTranslation } from 'react-i18next';

import { List, ListItem, useTheme } from '@polito/lib/ui';
import { OfferingCourseOverview } from '@polito/student-api-client';

import { useDegreeContext } from '../contexts/DegreeContext';

interface Props {
  courses: OfferingCourseOverview[];
  disabled?: boolean;
  /** How far the rows sit from the card's edge, in px past its padding */
  indent?: number;
}

/**
 * Courses of a track as rows with their credits. Each opens the catalogue
 * course page for the edition chosen on the degree.
 */
export const GroupCoursesExpanded = ({
  courses,
  disabled,
  indent = 0,
}: Props) => {
  const { year } = useDegreeContext();
  const { t } = useTranslation();
  const { layout } = useTheme();

  return (
    <List indented={false}>
      {courses.map((course, index) => (
        <ListItem
          key={`${course.shortcode}-${index}`}
          title={course.name}
          multilineTitle
          subtitle={t('serviceInfo.catalogue.credits', { count: course.cfu })}
          containerStyle={{ paddingLeft: layout.cardPadding + indent }}
          linkTo={{
            screen: 'DegreeCourse',
            params: {
              courseShortcode: course.shortcode,
              year,
            },
          }}
          disabled={disabled}
        />
      ))}
    </List>
  );
};
