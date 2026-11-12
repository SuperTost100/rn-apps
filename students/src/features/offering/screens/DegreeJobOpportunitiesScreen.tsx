import { useTranslation } from 'react-i18next';
import { Platform, SafeAreaView, ScrollView, StyleSheet } from 'react-native';

import { getHtmlTextContent } from '@polito/lib/core';
import {
  BottomBarSpacer,
  Card,
  QueryStateView,
  RefreshControl,
  Section,
  SkeletonDetail,
  Text,
  Theme,
  useStylesheet,
} from '@polito/lib/ui';

import { useGetOfferingDegree } from '../../../core/queries/offeringHooks';
import { useDegreeContext } from '../contexts/DegreeContext';

export const DegreeJobOpportunitiesScreen = () => {
  const { degreeId, year } = useDegreeContext();
  const { t } = useTranslation();
  const degreeQuery = useGetOfferingDegree({ degreeId, year });
  const styles = useStylesheet(createStyles);
  const degree = degreeQuery?.data;

  return (
    <ScrollView
      contentInsetAdjustmentBehavior="automatic"
      refreshControl={<RefreshControl queries={[degreeQuery]} manual />}
      contentContainerStyle={styles.list}
    >
      <SafeAreaView>
        <QueryStateView
          queries={degreeQuery}
          isEmpty={() => false}
          skeleton={<SkeletonDetail title={false} cards={[240]} />}
          errorState={{ title: t('states.offering.failedDegreeTitle') }}
        >
          <Section>
            <Card padded>
              <Text variant="subHeading" style={styles.subHeading}>
                {degree?.jobOpportunities?.title}
              </Text>
              <Text variant="longProse">
                {getHtmlTextContent(degree?.jobOpportunities?.content ?? '')}
              </Text>
            </Card>
          </Section>
        </QueryStateView>
      </SafeAreaView>
      <BottomBarSpacer />
    </ScrollView>
  );
};

const createStyles = ({ spacing }: Theme) =>
  StyleSheet.create({
    card: {
      marginTop: Platform.select({ android: spacing[4] }),
      paddingHorizontal: spacing[2.5],
      paddingVertical: spacing[2.5],
    },
    list: {
      paddingTop: spacing[2],
    },
    subHeading: {
      marginBottom: spacing[2],
    },
  });
