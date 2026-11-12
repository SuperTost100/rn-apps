import { useTranslation } from 'react-i18next';
import { SafeAreaView, ScrollView } from 'react-native';

import { useOfflineDisabled, useQueryStates } from '@polito/lib/core';
import { useAccessibility } from '@polito/lib/core';
import {
  BottomBarSpacer,
  CtaButton,
  List,
  OverviewList,
  QueryStateView,
  RefreshControl,
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

export const CourseAssignmentsScreen = ({ navigation }: Props) => {
  const { t } = useTranslation();
  const courseId = useCourseContext();
  const assignmentsQuery = useGetCourseAssignments(courseId);
  const { accessibilityListLabel } = useAccessibility();
  // Uploading and opening a handed-in file need the network
  const isDisabled = useOfflineDisabled();
  const states = useQueryStates(assignmentsQuery);
  return (
    <>
      <ScrollView
        refreshControl={<RefreshControl manual queries={[assignmentsQuery]} />}
      >
        <SafeAreaView>
          {states.status !== 'ready' && (
            <QueryStateView
              states={states}
              skeleton={{
                count: 3,
                leading: 'icon',
                trailing: 'none',
                card: false,
              }}
              emptyState={{
                title: t('states.assignments.emptyTitle'),
                text: t('states.assignments.emptyText'),
              }}
              errorState={{ title: t('states.assignments.failedTitle') }}
            >
              {null}
            </QueryStateView>
          )}
          {states.status === 'ready' &&
            assignmentsQuery.data &&
            (assignmentsQuery.data.length > 0 ? (
              <List indented>
                {assignmentsQuery.data.map((assignment, index) => (
                  <CourseAssignmentListItem
                    key={assignment.id}
                    item={assignment}
                    accessibilityListLabel={accessibilityListLabel(
                      index,
                      assignmentsQuery.data.length,
                    )}
                    disabled={isDisabled}
                  />
                ))}
              </List>
            ) : (
              <OverviewList
                emptyStateText={t('courseAssignmentsTab.emptyState')}
              />
            ))}
          <BottomBarSpacer />
        </SafeAreaView>
      </ScrollView>
      <CtaButton
        title={t('courseAssignmentUploadScreen.title')}
        action={() =>
          navigation.navigate({
            name: 'CourseAssignmentUpload',
            params: { courseId },
          })
        }
        disabled={isDisabled}
        accessibilityHint={isDisabled ? t('states.needsConnection') : undefined}
      />
    </>
  );
};
