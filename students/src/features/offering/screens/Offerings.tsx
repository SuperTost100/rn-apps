import { useTranslation } from 'react-i18next';
import { ScrollView, StyleSheet } from 'react-native';

import {
  BottomBarSpacer,
  ListItem,
  OverviewList,
  QueryStateView,
  RefreshControl,
  Section,
  SkeletonDetail,
  Text,
  Theme,
  useStylesheet,
} from '@polito/lib/ui';

import { useGetOffering } from '../../../core/queries/offeringHooks';

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
        isEmpty={() => false}
        skeleton={<SkeletonDetail title={false} cards={[200, 200]} />}
        errorState={{ title: t('states.offering.failedTitle') }}
      >
        {!!offerings && offerings?.length > 0 ? (
          offerings?.map(item => (
            <Section key={item.code} style={styles.section}>
              <Text variant="subHeading" style={styles.offeringClass}>
                {item?.name || item.code}
              </Text>
              <OverviewList>
                {item?.degrees.map((degree, index) => (
                  <ListItem
                    containerStyle={styles.offeringListItem}
                    key={index}
                    title={degree?.name || degree.id}
                    titleProps={{
                      ellipsizeMode: undefined,
                      numberOfLines: undefined,
                    }}
                    accessibilityRole="button"
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
          ))
        ) : (
          <OverviewList emptyStateText={t('offeringScreen.emptyState')} />
        )}
      </QueryStateView>
      <BottomBarSpacer />
    </ScrollView>
  );
};

const createStyles = ({ spacing }: Theme) =>
  StyleSheet.create({
    container: {
      paddingVertical: spacing[5],
    },
    offeringClass: {
      marginHorizontal: spacing[4],
    },
    emptyMessage: {
      marginTop: spacing[4],
    },
    offeringListItem: {
      minHeight: 45,
    },
    section: {
      marginBottom: spacing[2],
    },
  });
