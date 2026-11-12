import { useTranslation } from 'react-i18next';
import { SafeAreaView, ScrollView } from 'react-native';

import {
  BottomBarSpacer,
  OverviewList,
  RefreshControl,
  Section,
} from '@polito/lib/ui';

import { useGetJobOffers } from '../../../core/queries/jobOfferHooks';
import { JobOfferListItem } from '../components/JobOfferListItem';

export const JobOffersScreen = () => {
  const jobOffersQuery = useGetJobOffers();
  const { t } = useTranslation();

  return (
    <ScrollView
      contentInsetAdjustmentBehavior="automatic"
      refreshControl={<RefreshControl queries={[jobOffersQuery]} manual />}
    >
      <SafeAreaView>
        <Section>
          <OverviewList
            queries={jobOffersQuery}
            skeleton={{ count: 6, subtitleLines: 2 }}
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
