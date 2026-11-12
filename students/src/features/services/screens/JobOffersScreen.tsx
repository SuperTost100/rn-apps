import { useTranslation } from 'react-i18next';
import { SafeAreaView, ScrollView, StyleSheet } from 'react-native';

import {
  BottomBarSpacer,
  OverviewList,
  RefreshControl,
  Section,
  Theme,
  useStylesheet,
} from '@polito/lib/ui';

import { useGetJobOffers } from '../../../core/queries/jobOfferHooks';
import { JobOfferListItem } from '../components/JobOfferListItem';

export const JobOffersScreen = () => {
  const jobOffersQuery = useGetJobOffers();
  const { t } = useTranslation();
  const styles = useStylesheet(createStyles);

  return (
    <ScrollView
      contentInsetAdjustmentBehavior="automatic"
      refreshControl={<RefreshControl queries={[jobOffersQuery]} manual />}
    >
      <SafeAreaView>
        <Section style={styles.list}>
          <OverviewList
            queries={jobOffersQuery}
            skeleton={{ count: 4, titleLines: 2, subtitleLines: 2 }}
            emptyState={{
              title: t('states.jobOffers.emptyTitle'),
              text: t('states.jobOffers.emptyText'),
            }}
            errorState={{ title: t('states.jobOffers.failedTitle') }}
          >
            {jobOffersQuery?.data?.map((jobOffer, index) => (
              <JobOfferListItem
                jobOffer={jobOffer}
                key={jobOffer.id}
                index={index}
                totalData={jobOffersQuery.data?.length || 0}
              />
            ))}
          </OverviewList>
        </Section>
        <BottomBarSpacer />
      </SafeAreaView>
    </ScrollView>
  );
};

// The card's own 8 px plus these 8: 16 px under the header
const createStyles = ({ spacing }: Theme) =>
  StyleSheet.create({
    list: { paddingTop: spacing[2] },
  });
