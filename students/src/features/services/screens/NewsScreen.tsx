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

import { useGetNews } from '../../../core/queries/newsHooks';
import { NewsListItem } from '../components/NewsListItem';

export const NewsScreen = () => {
  const newsQuery = useGetNews();
  const { t } = useTranslation();
  const styles = useStylesheet(createStyles);

  return (
    <ScrollView
      contentInsetAdjustmentBehavior="automatic"
      refreshControl={<RefreshControl queries={[newsQuery]} manual />}
    >
      <SafeAreaView>
        <Section style={styles.list}>
          <OverviewList
            queries={newsQuery}
            skeleton={{ count: 5, leading: 'tile', subtitleLines: 2 }}
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

// The card's own 8 px plus these 8: 16 px under the header
const createStyles = ({ spacing }: Theme) =>
  StyleSheet.create({
    list: { paddingTop: spacing[2] },
  });
