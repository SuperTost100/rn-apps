import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';

import { Text, Theme, useStylesheet, useTheme } from '@polito/lib/ui';

import {
  getTracksCoursesGrouped,
  getTracksCoursesWithoutGroup,
} from '../../../utils/offerings';
import { OfferingCourseYear } from '../screens/DegreeTracksScreen';
import { GroupCourses } from './GroupCourses';
import { GroupCoursesExpanded } from './GroupCoursesExpanded';

interface DegreeTrackYearProps {
  item: OfferingCourseYear;
}

/** One year of an open track: its label, its courses, its elective groups */
export const DegreeTrackYear = ({ item }: DegreeTrackYearProps) => {
  const { teachingYear, data: courses } = item;
  const { t } = useTranslation();
  const { layout } = useTheme();
  const styles = useStylesheet(createStyles);
  const firstLevelCourses = getTracksCoursesWithoutGroup(courses);
  const coursesByGroup = useMemo(
    () => getTracksCoursesGrouped(courses),
    [courses],
  );

  const [expandedGroupIndex, setExpandedGroupIndex] = useState<number>();
  return (
    <View>
      <Text variant="label" accessibilityRole="header" style={styles.yearLabel}>
        {t('serviceInfo.catalogue.year', { year: teachingYear })}
      </Text>
      <GroupCoursesExpanded
        courses={firstLevelCourses}
        indent={layout.cardPadding}
      />
      {coursesByGroup.map((group, index) => (
        <GroupCourses
          key={index}
          group={group}
          indent={layout.cardPadding}
          isExpanded={expandedGroupIndex === index}
          toggleExpand={() =>
            setExpandedGroupIndex(prevIndex =>
              prevIndex !== index ? index : undefined,
            )
          }
        />
      ))}
    </View>
  );
};

const createStyles = ({ colors, layout, spacing }: Theme) =>
  StyleSheet.create({
    yearLabel: {
      color: colors.secondaryText,
      paddingLeft: layout.cardPadding * 2,
      paddingRight: layout.cardPadding,
      paddingTop: spacing[3],
      paddingBottom: spacing[1],
    },
  });
