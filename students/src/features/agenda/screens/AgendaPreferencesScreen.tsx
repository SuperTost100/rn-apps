import { useTranslation } from 'react-i18next';
import { ScrollView } from 'react-native';

import { faEyeSlash } from '@fortawesome/free-regular-svg-icons';
import { usePreferencesContext } from '@polito/lib/core';
import {
  BottomBarSpacer,
  CourseTile,
  Icon,
  ListItem,
  OverviewList,
  RefreshControl,
  Section,
  SectionHeader,
  SwitchListItem,
  useTheme,
} from '@polito/lib/ui';
import { NativeStackScreenProps } from '@react-navigation/native-stack';

import { useGetCourses } from '~/core/queries/courseHooks.ts';
import { AppPreferences } from '~/core/types/preferences';
import { AgendaStackParamList } from '~/features/agenda/components/AgendaNavigator.tsx';

type Props = NativeStackScreenProps<AgendaStackParamList, 'AgendaPreferences'>;

export const AgendaPreferencesScreen = ({ navigation }: Props) => {
  const { t } = useTranslation();
  const coursesQuery = useGetCourses();
  const { courses: coursesPrefs, updatePreference } =
    usePreferencesContext<AppPreferences>();
  const { spacing, colors } = useTheme();

  const hiddenCount = Object.values(coursesPrefs ?? {}).reduce(
    (sum, prefs) =>
      sum +
      (prefs?.itemsToHideInAgenda?.length ?? 0) +
      (prefs?.singleItemsToHideInAgenda?.length ?? 0),
    0,
  );

  return (
    <>
      <ScrollView
        contentInsetAdjustmentBehavior="automatic"
        contentContainerStyle={{
          paddingVertical: spacing[5],
        }}
        refreshControl={<RefreshControl queries={[coursesQuery]} manual />}
      >
        {coursesQuery.data &&
          (coursesQuery.data.length > 0 ? (
            <Section>
              <SectionHeader title={t('AgendaPreferences.showInAgenda')} />
              <OverviewList indented>
                {coursesQuery.data.map(
                  (course, index) =>
                    coursesPrefs[course.uniqueShortcode] && (
                      <SwitchListItem
                        key={`${course.shortcode}-${course.id}-${index}`}
                        title={course.name}
                        disabled={!coursesPrefs[course.uniqueShortcode]}
                        value={
                          !coursesPrefs[course.uniqueShortcode]
                            .isHiddenInAgenda &&
                          !coursesPrefs[course.uniqueShortcode].isHidden
                        }
                        leadingItem={
                          <CourseTile
                            color={coursesPrefs[course.uniqueShortcode].color}
                            icon={coursesPrefs[course.uniqueShortcode].icon}
                          />
                        }
                        onChange={value => {
                          updatePreference('courses', {
                            ...coursesPrefs,
                            [course.uniqueShortcode]: {
                              ...coursesPrefs[course.uniqueShortcode],
                              isHiddenInAgenda: !value,
                            },
                          });
                        }}
                      />
                    ),
                )}
              </OverviewList>
            </Section>
          ) : (
            <OverviewList emptyStateText={t('coursesScreen.emptyState')} />
          ))}
        <Section>
          <SectionHeader title={t('common.hiddenEvents')} />
          <OverviewList indented>
            <ListItem
              title={t('common.hiddenEvents')}
              subtitle={
                hiddenCount
                  ? t('AgendaPreferences.hiddenCount', { count: hiddenCount })
                  : t('agendaScreen.noHiddenEvents')
              }
              isAction
              onPress={() => {
                navigation.navigate('HiddenEvents');
              }}
              disabled={!hiddenCount}
              leadingItem={
                <Icon
                  icon={faEyeSlash}
                  size={24}
                  color={colors.secondaryText}
                />
              }
            />
          </OverviewList>
        </Section>
      </ScrollView>
      <BottomBarSpacer />
    </>
  );
};
