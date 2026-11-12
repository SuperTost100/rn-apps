import { useTranslation } from 'react-i18next';
import { ScrollView, StyleSheet } from 'react-native';

import {
  BottomBarSpacer,
  ListItem,
  OverviewList,
  QueryStateView,
  RefreshControl,
  Section,
  SectionHeader,
  SkeletonLine,
  SkeletonRegion,
  SkeletonRows,
  Text,
  Theme,
  useStylesheet,
} from '@polito/lib/ui';

import { useGetOffering } from '../../../core/queries/offeringHooks';

/** Two groups while loading: a section title, then degree rows */
const OfferingSkeleton = () => {
  const styles = useStylesheet(createStyles);
  return (
    <SkeletonRegion>
      {[3, 2].map((count, i) => (
        <Section key={i}>
          <SkeletonLine variant="heading" width="55%" style={styles.gutter} />
          <SkeletonRows count={count} subtitle={false} />
        </Section>
      ))}
    </SkeletonRegion>
  );
};

/** The degree groups of one level: a section per class, degrees as rows */
export const Offerings = ({ type }: { type: 'master' | 'bachelor' }) => {
  const offeringQuery = useGetOffering();
  const { data } = offeringQuery;
  const styles = useStylesheet(createStyles);
  const { t } = useTranslation();

  const offerings = data ? data[type] : [];

  return (
    <ScrollView
      contentInsetAdjustmentBehavior="automatic"
      refreshControl={<RefreshControl queries={[offeringQuery]} manual />}
      contentContainerStyle={styles.container}
    >
      <QueryStateView
        queries={offeringQuery}
        isEmpty={() => !offerings?.length}
        skeleton={<OfferingSkeleton />}
        errorState={{ title: t('states.offering.failedTitle') }}
        emptyState={{ title: t('offeringScreen.emptyState') }}
      >
        {offerings?.map(item => (
          <Section key={item.code}>
            <SectionHeader
              title={item?.name || item.code}
              ellipsizeTitle={false}
              accessibilityLabel={
                item.name ? `${item.name}, ${item.code}` : item.code
              }
              trailingItem={
                item.name ? (
                  <Text variant="secondaryText" style={styles.code}>
                    {item.code}
                  </Text>
                ) : undefined
              }
            />
            <OverviewList>
              {item?.degrees.map((degree, index) => (
                <ListItem
                  key={index}
                  title={degree?.name || degree.id}
                  multilineTitle
                  linkTo={{
                    screen: 'Degree',
                    params: {
                      id: degree.id,
                    },
                  }}
                />
              ))}
            </OverviewList>
          </Section>
        ))}
      </QueryStateView>
      <BottomBarSpacer />
    </ScrollView>
  );
};

const createStyles = ({ spacing, layout }: Theme) =>
  StyleSheet.create({
    // 24 px under the tab row to the first section mark
    container: {
      paddingTop: spacing[6],
    },
    gutter: {
      marginHorizontal: layout.gutter,
      marginBottom: spacing[1],
    },
    code: {
      paddingBottom: spacing[0.5],
    },
  });
