import { useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { SafeAreaView, ScrollView, StyleSheet } from 'react-native';

import { usePreferencesContext, useQueryStates } from '@polito/lib/core';
import {
  BottomBarSpacer,
  Card,
  OverviewList,
  QueryStateView,
  RefreshControl,
  ScreenTitle,
  Section,
  SectionHeader,
  SkeletonDetail,
  Text,
  Theme,
  useStylesheet,
} from '@polito/lib/ui';
import { NativeStackScreenProps } from '@react-navigation/native-stack';

import { AppPreferences } from '~/core/types/preferences';

import { useGetGuides } from '../../../core/queries/studentHooks';
import { ServiceStackParamList } from '../../services/components/ServicesNavigator';
import { GuideFieldListItem } from '../components/GuideFieldListItem';
import { GuideSectionListItem } from '../components/GuideSectionListItem';

type Props = NativeStackScreenProps<ServiceStackParamList, 'Guide'>;

export const GuideScreen = ({ navigation, route }: Props) => {
  const { id } = route.params;
  const styles = useStylesheet(createStyles);
  const { t } = useTranslation();
  const query = useGetGuides();
  const states = useQueryStates(query, {
    isEmpty: (d: { id: string }[]) => !d.some(g => g.id === id),
  });

  const { emailGuideRead, updatePreference } =
    usePreferencesContext<AppPreferences>();

  const guide = useMemo(() => {
    if (!query.data) return;
    return query.data.find(g => g.id === id);
  }, [id, query.data]);

  useEffect(() => {
    if (!guide) return;

    if (guide.id === 'email' && emailGuideRead !== true) {
      updatePreference('emailGuideRead', true);
    }

    navigation.setOptions({
      headerTitle: guide?.listTitle,
    });
  }, [guide, navigation, emailGuideRead, updatePreference]);

  return (
    <ScrollView
      contentInsetAdjustmentBehavior="automatic"
      refreshControl={<RefreshControl queries={[query]} manual />}
    >
      <SafeAreaView>
        {states.status === 'ready' && guide ? (
          <>
            {guide.title !== guide.listTitle && (
              <ScreenTitle title={guide.title} padded style={styles.title} />
            )}
            <Card padded style={styles.firstCard}>
              <Text variant="longProse">{guide.intro}</Text>
            </Card>
            {guide.fields.length > 0 && (
              <Section style={styles.section}>
                <SectionHeader title={t('serviceInfo.guides.settingsToCopy')} />
                <OverviewList>
                  {guide.fields.map(field => (
                    <GuideFieldListItem field={field} key={field.label} />
                  ))}
                </OverviewList>
              </Section>
            )}
            {guide.sections.map((section, index) => (
              <GuideSectionListItem
                section={section}
                key={`${index}-${section.title}`}
              />
            ))}
          </>
        ) : (
          <QueryStateView
            states={states}
            skeleton={
              <SkeletonDetail
                title={false}
                cards={[80, 160, 120]}
                label={t('states.guides.loadingOne')}
              />
            }
            errorState={{ title: t('states.guides.failedOneTitle') }}
            emptyState={{
              title: t('states.guides.goneTitle'),
              text: t('states.guides.goneText'),
            }}
          >
            {null}
          </QueryStateView>
        )}
        <BottomBarSpacer />
      </SafeAreaView>
    </ScrollView>
  );
};

const createStyles = ({ spacing, layout }: Theme) =>
  StyleSheet.create({
    title: { paddingTop: spacing[4] },
    // 16 px under the header, as every first card
    firstCard: { marginTop: spacing[4] },
    section: { marginTop: layout.sectionGap - spacing[2] },
  });
