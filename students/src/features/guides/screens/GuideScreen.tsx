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
        {states.status === 'ready' ? (
          <>
            <Section style={styles.paddingTop}>
              <ScreenTitle title={guide?.title ?? ''} padded />
            </Section>
            <Section>
              <Card padded style={styles.card}>
                <Text>{guide?.intro}</Text>
              </Card>
              <OverviewList indented>
                {guide?.fields.map(field => {
                  return <GuideFieldListItem field={field} key={field.label} />;
                })}
              </OverviewList>
              <Card padded style={styles.card}>
                {guide?.sections.map(section => {
                  return (
                    <GuideSectionListItem
                      section={section}
                      key={section.title}
                    />
                  );
                })}
              </Card>
            </Section>
          </>
        ) : (
          <QueryStateView
            states={states}
            skeleton={
              <SkeletonDetail
                cards={[80, 200]}
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

const createStyles = ({ spacing }: Theme) =>
  StyleSheet.create({
    paddingTop: { paddingTop: spacing[2] },
    card: { paddingHorizontal: spacing[5] },
  });
