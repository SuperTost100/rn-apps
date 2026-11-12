import { useTranslation } from 'react-i18next';
import { SafeAreaView, ScrollView } from 'react-native';

import {
  BottomBarSpacer,
  OverviewList,
  RefreshControl,
  Section,
} from '@polito/lib/ui';

import { useGetNews } from '../../../core/queries/newsHooks';
import { NewsListItem } from '../components/NewsListItem';

export const NewsScreen = () => {
  const newsQuery = useGetNews();
  const { t } = useTranslation();

  return (
    <ScrollView
      contentInsetAdjustmentBehavior="automatic"
      refreshControl={<RefreshControl queries={[newsQuery]} manual />}
    >
      <SafeAreaView>
        <Section>
          <OverviewList
            queries={newsQuery}
            skeleton={{ count: 6, subtitleLines: 2 }}
            emptyState={{
              title: t('states.news.emptyTitle'),
              text: t('states.news.emptyText'),
            }}
            errorState={{ title: t('states.news.failedTitle') }}
          >
            {newsQuery?.data?.map((newsItem, index) => (
              <NewsListItem
                newsItem={newsItem}
                key={newsItem.id}
                index={index}
                totalData={newsQuery?.data?.length || 0}
              />
            ))}
          </OverviewList>
        </Section>
        <BottomBarSpacer />
      </SafeAreaView>
    </ScrollView>
  );
};
