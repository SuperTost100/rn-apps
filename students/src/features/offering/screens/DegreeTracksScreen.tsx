import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ScrollView, StyleSheet, View } from 'react-native';

import { faChevronDown, faChevronUp } from '@fortawesome/free-solid-svg-icons';
import {
  BottomBarSpacer,
  Icon,
  ListItem,
  OverviewList,
  RefreshControl,
  Theme,
  useStylesheet,
  useTheme,
} from '@polito/lib/ui';
import { OfferingCourseOverview } from '@polito/student-api-client';

import { useGetOfferingDegree } from '../../../core/queries/offeringHooks';
import { getTracksCoursesSections } from '../../../utils/offerings';
import { DegreeTrackYear } from '../components/DegreeTrackYear';
import { useDegreeContext } from '../contexts/DegreeContext';

export type OfferingCourseYear = {
  teachingYear: number;
  data: OfferingCourseOverview[];
};

/**
 * The degree's tracks as rows in one card. A track opens in place to show
 * its courses year by year; one track is open at a time.
 */
export const DegreeTracksScreen = () => {
  const { t } = useTranslation();
  const { degreeId, year } = useDegreeContext();
  const degreeQuery = useGetOfferingDegree({ degreeId, year });
  const { colors } = useTheme();
  const styles = useStylesheet(createStyles);
  const [expandedIndex, setExpandedIndex] = useState<number>();
  const sections = useMemo(
    () => getTracksCoursesSections(degreeQuery.data?.tracks),
    [degreeQuery.data?.tracks],
  );

  return (
    <ScrollView
      contentInsetAdjustmentBehavior="automatic"
      refreshControl={<RefreshControl queries={[degreeQuery]} manual />}
      contentContainerStyle={styles.container}
    >
      <OverviewList
        queries={degreeQuery}
        isEmpty={() => sections.length === 0}
        skeleton={{ count: 3 }}
        emptyState={{ title: t('serviceInfo.catalogue.noTracks') }}
        errorState={{ title: t('states.offering.failedDegreeTitle') }}
      >
        {sections.map(({ title, index, data }) => {
          const isExpanded = expandedIndex === index;
          const count = t('serviceInfo.catalogue.courses', {
            count: data.reduce((sum, y) => sum + y.data.length, 0),
          });
          return (
            <View key={index}>
              <ListItem
                title={title}
                multilineTitle
                subtitle={count}
                onPress={() =>
                  setExpandedIndex(prev => (prev === index ? undefined : index))
                }
                accessibilityLabel={`${title}, ${count}`}
                accessibilityState={{ expanded: isExpanded }}
                trailingItem={
                  <Icon
                    icon={isExpanded ? faChevronUp : faChevronDown}
                    size={16}
                    color={colors.secondaryText}
                  />
                }
              />
              {isExpanded && (
                <View style={styles.expanded}>
                  {data.map(item => (
                    <DegreeTrackYear key={item.teachingYear} item={item} />
                  ))}
                </View>
              )}
            </View>
          );
        })}
      </OverviewList>
      <BottomBarSpacer />
    </ScrollView>
  );
};

const createStyles = ({ spacing }: Theme) =>
  StyleSheet.create({
    // The card's own 8 px plus these 8: 16 px under the tab row
    container: {
      paddingTop: spacing[2],
    },
    expanded: {
      paddingBottom: spacing[2],
    },
  });
