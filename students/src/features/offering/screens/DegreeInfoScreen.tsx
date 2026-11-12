import { useTranslation } from 'react-i18next';
import { SafeAreaView, ScrollView, StyleSheet } from 'react-native';

import { getHtmlTextContent } from '@polito/lib/core';
import {
  BottomBarSpacer,
  Card,
  KeyValueList,
  QueryStateView,
  RefreshControl,
  Section,
  SectionHeader,
  SkeletonDetail,
  Text,
  Theme,
  useStylesheet,
} from '@polito/lib/ui';

import { useGetOfferingDegree } from '../../../core/queries/offeringHooks';
import { useDegreeContext } from '../contexts/DegreeContext';

/** A degree's facts in one card, then its notes and objectives */
export const DegreeInfoScreen = () => {
  const { degreeId, year } = useDegreeContext();
  const { t } = useTranslation();
  const styles = useStylesheet(createStyles);
  const degreeQuery = useGetOfferingDegree({ degreeId, year });
  const degree = degreeQuery?.data;
  const notes = (degree?.notes ?? [])
    .map(note => getHtmlTextContent(note))
    .filter(Boolean);
  const objectives = getHtmlTextContent(degree?.objectives?.content ?? '');

  return (
    <ScrollView
      contentInsetAdjustmentBehavior="automatic"
      refreshControl={<RefreshControl queries={[degreeQuery]} manual />}
    >
      <SafeAreaView>
        <QueryStateView
          queries={degreeQuery}
          isEmpty={() => false}
          skeleton={<SkeletonDetail title={false} cards={[240, 96, 160]} />}
          errorState={{ title: t('states.offering.failedDegreeTitle') }}
        >
          <Card padded style={styles.firstCard}>
            <KeyValueList
              items={[
                { label: t('common.location'), value: degree?.location },
                {
                  label: t('common.department'),
                  value: degree?.department?.name,
                },
                { label: t('common.faculty'), value: degree?.faculty?.name },
                { label: t('common.duration'), value: degree?.duration },
                {
                  label: t('degreeScreen.degreeClass'),
                  value: degree?._class
                    ? [degree._class.name, degree._class.code]
                        .filter(Boolean)
                        .join(' · ')
                    : undefined,
                },
              ]}
            />
          </Card>
          {notes.length > 0 && (
            <Section style={styles.section}>
              <SectionHeader title={t('common.notes')} />
              <Card padded style={styles.prose}>
                {notes.map((note, index) => (
                  <Text key={index} variant="longProse">
                    {note}
                  </Text>
                ))}
              </Card>
            </Section>
          )}
          {!!objectives && (
            <Section style={!notes.length && styles.section}>
              <SectionHeader
                title={degree?.objectives?.title || t('common.objectives')}
              />
              <Card padded>
                <Text variant="longProse">{objectives}</Text>
              </Card>
            </Section>
          )}
        </QueryStateView>
        <BottomBarSpacer />
      </SafeAreaView>
    </ScrollView>
  );
};

const createStyles = ({ spacing, layout }: Theme) =>
  StyleSheet.create({
    // 16 px under the tab row
    firstCard: {
      marginTop: spacing[4],
    },
    section: {
      marginTop: layout.sectionGap - spacing[2],
    },
    prose: {
      gap: spacing[2],
    },
  });
