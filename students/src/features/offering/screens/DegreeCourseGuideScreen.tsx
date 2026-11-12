import { useTranslation } from 'react-i18next';
import { SafeAreaView, ScrollView, StyleSheet } from 'react-native';

import { sanitizeHtml } from '@polito/lib/core';
import {
  BottomBarSpacer,
  Card,
  HtmlView,
  QueryStateView,
  RefreshControl,
  Section,
  SectionHeader,
  SkeletonDetail,
  Theme,
  useStylesheet,
} from '@polito/lib/ui';
import { NativeStackScreenProps } from '@react-navigation/native-stack';

import { useGetOfferingCourse } from '../../../core/queries/offeringHooks';
import { ServiceStackParamList } from '../../services/components/ServicesNavigator';

type Props = NativeStackScreenProps<ServiceStackParamList, 'DegreeCourseGuide'>;

/** A catalogue course's guide: each part as a section header and a card */
export const DegreeCourseGuideScreen = ({ route }: Props) => {
  const { courseShortcode, year } = route.params;
  const { t } = useTranslation();
  const courseQuery = useGetOfferingCourse({ courseShortcode, year });
  const guide = courseQuery.data?.guide ?? [];

  const styles = useStylesheet(createStyles);
  return (
    <ScrollView
      contentInsetAdjustmentBehavior="automatic"
      contentContainerStyle={styles.container}
      refreshControl={<RefreshControl queries={[courseQuery]} manual />}
    >
      <SafeAreaView>
        <QueryStateView
          queries={courseQuery}
          isEmpty={() => guide.length === 0}
          skeleton={<SkeletonDetail title={false} cards={[200, 160]} />}
          errorState={{ title: t('states.offering.failedCourseTitle') }}
          emptyState={{ title: t('serviceInfo.catalogue.noGuide') }}
        >
          {guide.map((section, i) => (
            <Section key={i}>
              <SectionHeader title={section.title} ellipsizeTitle={false} />
              <Card padded>
                <HtmlView
                  props={{
                    source: { html: sanitizeHtml(section.content) },
                    baseStyle: styles.html,
                  }}
                  variant="longProse"
                />
              </Card>
            </Section>
          ))}
        </QueryStateView>
      </SafeAreaView>
      <BottomBarSpacer />
    </ScrollView>
  );
};

const createStyles = ({ spacing }: Theme) =>
  StyleSheet.create({
    // The first section mark 24 px under the header
    container: {
      paddingTop: spacing[6],
    },
    html: {
      padding: 0,
    },
  });
