import { useTranslation } from 'react-i18next';
import { SafeAreaView, ScrollView, StyleSheet } from 'react-native';

import { getHtmlTextContent } from '@polito/lib/core';
import {
  BottomBarSpacer,
  Card,
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

/** Where the degree leads: the text the university publishes, in a card */
export const DegreeJobOpportunitiesScreen = () => {
  const { degreeId, year } = useDegreeContext();
  const { t } = useTranslation();
  const degreeQuery = useGetOfferingDegree({ degreeId, year });
  const styles = useStylesheet(createStyles);
  const degree = degreeQuery?.data;
  const content = getHtmlTextContent(degree?.jobOpportunities?.content ?? '');

  return (
    <ScrollView
      contentInsetAdjustmentBehavior="automatic"
      refreshControl={<RefreshControl queries={[degreeQuery]} manual />}
    >
      <SafeAreaView>
        <QueryStateView
          queries={degreeQuery}
          isEmpty={() => !content}
          skeleton={<SkeletonDetail title={false} cards={[240]} />}
          errorState={{ title: t('states.offering.failedDegreeTitle') }}
          emptyState={{ title: t('serviceInfo.catalogue.noJobs') }}
          style={styles.section}
        >
          <Section style={styles.section}>
            {!!degree?.jobOpportunities?.title && (
              <SectionHeader title={degree.jobOpportunities.title} />
            )}
            <Card padded>
              <Text variant="longProse">{content}</Text>
            </Card>
          </Section>
        </QueryStateView>
      </SafeAreaView>
      <BottomBarSpacer />
    </ScrollView>
  );
};

const createStyles = ({ spacing, layout }: Theme) =>
  StyleSheet.create({
    // The section mark 24 px under the tab row
    section: {
      marginTop: layout.sectionGap - spacing[2],
    },
  });
