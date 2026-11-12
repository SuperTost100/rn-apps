import { useTranslation } from 'react-i18next';
import { ScrollView, StyleSheet, View } from 'react-native';

import { faUpload } from '@fortawesome/free-solid-svg-icons';
import { useOfflineDisabled, useQueryStates } from '@polito/lib/core';
import {
  BottomBarSpacer,
  Card,
  CtaButton,
  List,
  QueryStateView,
  RefreshControl,
  Theme,
  useStylesheet,
} from '@polito/lib/ui';
import { MaterialTopTabScreenProps } from '@react-navigation/material-top-tabs';

import { useGetCourseAssignments } from '../../../core/queries/courseHooks';
import { CourseAssignmentListItem } from '../components/CourseAssignmentListItem';
import { useCourseContext } from '../contexts/CourseContext';
import { CourseTabsParamList } from '../navigation/CourseNavigator';

type Props = MaterialTopTabScreenProps<
  CourseTabsParamList,
  'CourseAssignmentsScreen'
>;

/**
 * The files the student handed in for the course, newest first, in a card,
 * and the Upload button under them: in the flow of the page, so it never
 * covers a row
 */
export const CourseAssignmentsScreen = ({ navigation }: Props) => {
  const { t } = useTranslation();
  const styles = useStylesheet(createStyles);
  const courseId = useCourseContext();
  const assignmentsQuery = useGetCourseAssignments(courseId);
  // Uploading and opening a handed-in file need the network
  const isDisabled = useOfflineDisabled();
  const states = useQueryStates(assignmentsQuery);
  const assignments = [...(assignmentsQuery.data ?? [])].sort(
    (a, b) => b.uploadedAt.getTime() - a.uploadedAt.getTime(),
  );
  const canUpload = states.status === 'ready' || states.status === 'empty';

  return (
    <ScrollView
      contentInsetAdjustmentBehavior="automatic"
      refreshControl={<RefreshControl manual queries={[assignmentsQuery]} />}
    >
      <View style={styles.first}>
        <QueryStateView
          states={states}
          skeleton={{
            count: 2,
            leading: 'icon',
            trailing: 'none',
            titleLines: 2,
            subtitleLines: 2,
            label: t('course.assignments.loading'),
          }}
          emptyState={{
            title: t('states.assignments.emptyTitle'),
            text: t('states.assignments.emptyText'),
          }}
          errorState={{ title: t('states.assignments.failedTitle') }}
        >
          <Card>
            <List>
              {assignments.map(assignment => (
                <CourseAssignmentListItem
                  key={assignment.id}
                  item={assignment}
                  disabled={isDisabled}
                />
              ))}
            </List>
          </Card>
        </QueryStateView>
      </View>
      {canUpload && (
        <CtaButton
          absolute={false}
          icon={faUpload}
          title={t('courseAssignmentUploadScreen.title')}
          action={() =>
            navigation.navigate({
              name: 'CourseAssignmentUpload',
              params: { courseId },
            })
          }
          disabled={isDisabled}
          accessibilityHint={
            isDisabled ? t('states.needsConnection') : undefined
          }
          containerStyle={styles.upload}
        />
      )}
      <BottomBarSpacer />
    </ScrollView>
  );
};

const createStyles = ({ layout, spacing }: Theme) =>
  StyleSheet.create({
    // The first card sits 16 px under the tab row (8 here, 8 its own)
    first: {
      marginTop: spacing[2],
    },
    upload: {
      paddingHorizontal: layout.gutter,
      paddingTop: spacing[2],
      paddingBottom: spacing[4],
    },
  });
