import { Fragment, useCallback, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';

import {
  faChevronDown,
  faChevronUp,
  faLayerGroup,
} from '@fortawesome/free-solid-svg-icons';
import { usePreferencesContext } from '@polito/lib/core';
import { useGetPersons } from '@polito/lib/features/people';
import {
  Icon,
  IndentedDivider,
  ListItem,
  Theme,
  UnreadBadge,
  useStylesheet,
  useTextScale,
  useTheme,
} from '@polito/lib/ui';
import { CourseModuleOverview } from '@polito/student-api-client';

import { useNotifications } from '~/core/hooks/useNotifications';
import { AppPreferences } from '~/core/types/preferences';

import { CourseOverview } from '../../../core/types/api';
import { CourseIndicator } from './CourseIndicator';

interface Props {
  course: CourseOverview;
  accessible?: boolean;
  /** Read before the row, e.g. its position in the list */
  accessibilityLabel?: string;
  badge?: number;
  showAllModules?: boolean;
}

/**
 * A course row: its tile, the name on up to two lines, the credits, the
 * unread count and a chevron. At large text the count moves under the
 * text and the chevron goes, so the name keeps the full width.
 * A course split into modules is a row that shows or hides its modules.
 * Following a course or not is set on its settings screen.
 */
export const CourseListItem = ({
  course,
  accessibilityLabel,
  accessible,
  badge,
  showAllModules = false,
}: Props) => {
  const { t } = useTranslation();
  const preferences = usePreferencesContext<AppPreferences>();
  const styles = useStylesheet(createStyles);
  const { colors, controls, layout } = useTheme();
  const { isLarge } = useTextScale();
  const { getUnreadsCountPerCourse } = useNotifications();
  const [expanded, setExpanded] = useState(true);

  const hasModules = !!course.modules?.length;
  const credits =
    course.cfu !== null && course.cfu !== undefined
      ? `${course.cfu} ${t('common.credits').toLowerCase()}`
      : '';
  const subtitle = hasModules
    ? t('teachingScreen.modulesSubtitle', {
        credits: course.cfu,
        count: course.modules!.length,
      })
    : credits +
      (course.enrollmentRole === 'viewer'
        ? ` • ${t('courseListItem.extra')} • ${course.year}`
        : '') +
      (course.isOverBooking ? ` • ${t('courseListItem.overbooking')}` : '');

  const getModuleUniqueShortcode = useCallback(
    (moduleIndex: number) => `${course.shortcode}${moduleIndex + 1}`,
    [course.shortcode],
  );

  const getModuleLink = (module: CourseModuleOverview, moduleIndex: number) =>
    module.id
      ? {
          screen: 'Course',
          params: {
            id: module.id,
            title: course.name,
            uniqueShortcode: getModuleUniqueShortcode(moduleIndex),
          },
        }
      : {
          screen: 'CourseNoAssignment',
          params: {
            uniqueShortcode: getModuleUniqueShortcode(moduleIndex),
            courseName: module.name,
            shortcode: module.shortcode,
            year: module.year,
            parentCourseName: course.name,
          },
        };

  const visibleModules = useMemo(
    () =>
      (course.modules ?? [])
        .map((module, originalIndex) => ({ module, originalIndex }))
        .filter(
          ({ originalIndex }) =>
            showAllModules ||
            !preferences.courses[getModuleUniqueShortcode(originalIndex)]
              ?.isHidden,
        ),
    [
      course.modules,
      showAllModules,
      preferences.courses,
      getModuleUniqueShortcode,
    ],
  );

  const moduleTeacherIds = useMemo(
    () =>
      (course.modules ?? [])
        .map(module => module.teacherId)
        .filter((teacherId): teacherId is number => teacherId !== null),
    [course.modules],
  );
  const { queries: teacherQueries } = useGetPersons(moduleTeacherIds);
  const getTeacherName = (teacherId: number | null) => {
    if (!teacherId) return undefined;
    const person = teacherQueries[moduleTeacherIds.indexOf(teacherId)]?.data;
    return person ? `${person.firstName} ${person.lastName}`.trim() : undefined;
  };

  /** The row of one course or module, with its unread count */
  const row = (props: {
    key?: string;
    title: string;
    subtitle?: string;
    count?: number;
    linkTo: any;
    disabled?: boolean;
    uniqueShortcode: string;
  }) => {
    const unread = props.count
      ? t('navigation.unreadCount', { count: props.count })
      : undefined;
    return (
      <ListItem
        key={props.key}
        accessible={accessible}
        disabled={props.disabled}
        linkTo={props.linkTo}
        title={props.title}
        subtitle={props.subtitle}
        leadingItem={
          <CourseIndicator uniqueShortcode={props.uniqueShortcode} />
        }
        // The count is a chip: it moves under the text at large text
        chip={props.count ? <UnreadBadge text={props.count} /> : undefined}
        showChevron={!isLarge}
        accessibilityLabel={[
          accessibilityLabel,
          props.title,
          props.subtitle,
          unread,
        ]
          .filter(Boolean)
          .join(', ')}
      />
    );
  };

  if (!hasModules) {
    return row({
      title: course.name,
      subtitle,
      count: badge,
      disabled: course.isOverBooking,
      uniqueShortcode: course.uniqueShortcode,
      linkTo:
        course.id !== null
          ? { screen: 'Course', params: { id: course.id } }
          : {
              screen: 'CourseNoAssignment',
              params: {
                uniqueShortcode: course.uniqueShortcode,
                courseName: course.name,
                shortcode: course.shortcode,
                cfu: course.cfu,
                year: course.year,
              },
            },
    });
  }

  if (!visibleModules.length) return null;

  const moduleCount = (module: CourseModuleOverview) =>
    module.id
      ? (getUnreadsCountPerCourse(module.id, module.previousEditions) ?? 0)
      : 0;
  const totalCount = visibleModules.reduce(
    (sum, { module }) => sum + moduleCount(module),
    0,
  );
  const textIndent =
    layout.cardPadding + controls.leadingSize + layout.leadingGap;

  return (
    <View>
      <ListItem
        accessible={accessible}
        title={course.name}
        subtitle={subtitle}
        onPress={() => setExpanded(value => !value)}
        accessibilityRole="button"
        accessibilityState={{ expanded }}
        accessibilityLabel={[accessibilityLabel, course.name, subtitle]
          .filter(Boolean)
          .join(', ')}
        leadingItem={
          <View style={styles.groupTile}>
            <Icon
              icon={faLayerGroup}
              size={20}
              color={colors.neutralChipText}
            />
          </View>
        }
        // Collapsed, the modules' unread count stays visible on the course
        chip={
          !expanded && totalCount ? (
            <UnreadBadge text={totalCount} />
          ) : undefined
        }
        trailingItem={
          <Icon
            icon={expanded ? faChevronUp : faChevronDown}
            size={16}
            color={colors.secondaryText}
          />
        }
        titleProps={{ numberOfLines: isLarge ? 3 : 2 }}
      />
      {expanded &&
        visibleModules.map(({ module, originalIndex }) => (
          <Fragment key={module.id || `module-${originalIndex}`}>
            <IndentedDivider indent={textIndent} />
            {row({
              title: module.name,
              subtitle: getTeacherName(module.teacherId),
              count: moduleCount(module),
              disabled: module.isOverBooking,
              uniqueShortcode: getModuleUniqueShortcode(originalIndex),
              linkTo: getModuleLink(module, originalIndex),
            })}
          </Fragment>
        ))}
    </View>
  );
};

const createStyles = ({ colors, controls, shapes }: Theme) =>
  StyleSheet.create({
    groupTile: {
      width: controls.courseTileSize,
      height: controls.courseTileSize,
      borderRadius: shapes.md,
      backgroundColor: colors.neutralChipBg,
      alignItems: 'center',
      justifyContent: 'center',
    },
  });
