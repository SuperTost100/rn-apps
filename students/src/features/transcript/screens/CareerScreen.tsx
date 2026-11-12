import { useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { PixelRatio, ScrollView, StyleSheet, View } from 'react-native';

import { useQueryStates } from '@polito/lib/core';
import {
  BottomBarSpacer,
  BottomModal,
  Card,
  QueryStateView,
  RefreshControl,
  Section,
  SectionHeader,
  SkeletonBox,
  SkeletonLine,
  SkeletonRegion,
  Text,
  TextButton,
  type Theme,
  useBottomModal,
  useStylesheet,
  useTextScale,
  useTheme,
} from '@polito/lib/ui';

import { isNil } from 'lodash';

import {
  useGetGrades,
  useGetStudent,
} from '../../../core/queries/studentHooks';
import { CreditsRing } from '../../teaching/components/CreditsRing';
import { CareerScreenModal } from '../components/CareerScreenModal';
import { useGradeMask } from '../components/HideGradesButton';

/**
 * The career in figures: credits with the double ring, this academic year,
 * the averages with how they are computed, and the on-time exam points
 */
export const CareerScreen = () => {
  const { t } = useTranslation();
  const styles = useStylesheet(createStyles);
  const { colors } = useTheme();
  const { isLarge } = useTextScale();
  const { hidden } = useGradeMask();
  const studentQuery = useGetStudent();
  const gradesQuery = useGetGrades();
  const states = useQueryStates(studentQuery);
  const {
    enrollmentCredits,
    enrollmentAttendedCredits,
    enrollmentAcquiredCredits,
    totalAttendedCredits,
    totalAcquiredCredits,
    totalCredits,
    averageGrade,
    estimatedFinalGrade,
    mastersAdmissionAverageGrade,
    excludedCreditsNumber,
    isFinalGradePurged,
    totalOnTimeExamPoints,
    maxOnTimeExamPoints,
  } = studentQuery.data ?? {};

  const {
    open: showBottomModal,
    modal: bottomModal,
    close: closeBottomModal,
  } = useBottomModal();

  const [scrollOffset, setScrollOffset] = useState<number>(0);
  const scrollViewRef = useRef<ScrollView | null>(null);
  const onPressAverageEvent = () => {
    showBottomModal(
      <CareerScreenModal
        title={t('transcriptMetricsScreen.averages')}
        itemList={[
          {
            title: t('transcriptMetricsScreen.weightedAverage'),
            content: {
              description: t(
                'transcriptMetricsScreen.weightedAverageDescription.description',
              ),
              formula: t(
                'transcriptMetricsScreen.weightedAverageDescription.formula',
              ),
            },
            dot: true,
          },
          isFinalGradePurged
            ? {
                title: t('transcriptMetricsScreen.averageLabel'),
                content: {
                  description: t(
                    'transcriptMetricsScreen.finalAverageLabelDescription.description',
                    {
                      excludedCreditsNumber: excludedCreditsNumber,
                    },
                  ),
                  formula: t(
                    'transcriptMetricsScreen.finalAverageLabelDescription.formula',
                    {
                      excludedCreditsNumber: excludedCreditsNumber,
                    },
                  ),
                },
                dot: true,
              }
            : {
                title: t('transcriptMetricsScreen.averageLabel'),
                content: {
                  description: t(
                    'transcriptMetricsScreen.weightedAverageLabelDescription.description',
                  ),
                  formula: t(
                    'transcriptMetricsScreen.weightedAverageLabelDescription.formula',
                  ),
                },
                dot: true,
              },
          mastersAdmissionAverageGrade
            ? {
                title: t('transcriptMetricsScreen.masterAdmissionAverage'),
                content: {
                  description: t(
                    'transcriptMetricsScreen.masterAdmissionAverageLabelDescription.description',
                  ),
                  formula: t(
                    'transcriptMetricsScreen.masterAdmissionAverageLabelDescription.formula',
                  ),
                },
                dot: true,
              }
            : { title: '', content: { description: '' }, dot: false },
          {
            content: {
              description: t('transcriptMetricsScreen.laude'),
            },
            dot: false,
          },
          {
            title: t('transcriptMetricsScreen.NB'),
            content: {
              description: t('transcriptMetricsScreen.NBDescription'),
            },
            dot: false,
          },
        ]}
        onDismiss={closeBottomModal}
        scrollViewRef={scrollViewRef}
        setScrollOffset={setScrollOffset}
      />,
    );
  };

  const onPressPointEvent = () => {
    showBottomModal(
      <CareerScreenModal
        title={t('transcriptMetricsScreen.pointTitle')}
        itemList={[
          {
            title: t('transcriptMetricsScreen.onTimeScores'),
            content: {
              description: t('transcriptMetricsScreen.pointModal'),
            },
            dot: false,
          },
        ]}
        onDismiss={closeBottomModal}
      />,
    );
  };

  const total = totalCredits ?? 0;
  const acquired = totalAcquiredCredits ?? 0;
  const attended = totalAttendedCredits ?? 0;

  return (
    <>
      <BottomModal
        dismissable
        {...bottomModal}
        scrollOffset={scrollOffset}
        scrollViewRef={scrollViewRef}
      />
      <ScrollView
        contentInsetAdjustmentBehavior="automatic"
        contentContainerStyle={styles.container}
        refreshControl={
          <RefreshControl queries={[studentQuery, gradesQuery]} manual />
        }
      >
        {states.status === 'ready' ? (
          <>
            <Card style={styles.creditsCard}>
              <View style={[styles.credits, isLarge && styles.creditsLarge]}>
                <View style={styles.figures}>
                  <Figure
                    label={t('transcriptMetricsScreen.acquiredCreditsLabel')}
                    value={totalAcquiredCredits}
                    total={totalCredits}
                    hidden={hidden}
                  />
                  <Figure
                    label={t('transcriptMetricsScreen.attendedCreditsLabel')}
                    value={totalAttendedCredits}
                    total={totalCredits}
                    hidden={hidden}
                  />
                </View>
                {total > 0 && (
                  <View style={styles.ringBox}>
                    <CreditsRing
                      acquired={acquired}
                      attended={attended}
                      total={total}
                      hidden={hidden}
                      unit={t('teachingScreen.ringCredits')}
                      accessibilityLabel={
                        hidden
                          ? t('teachingScreen.creditsRingHiddenLabel')
                          : t('transcriptMetricsScreen.ringLabel', {
                              acquired,
                              attended,
                              total,
                            })
                      }
                    />
                    {/* The ring's label already says what the legend says */}
                    <View
                      style={styles.legend}
                      importantForAccessibility="no-hide-descendants"
                      accessibilityElementsHidden
                    >
                      <LegendRow
                        color={colors.ringAttended}
                        label={t('transcriptMetricsScreen.ringLegendAttended')}
                        value={hidden ? '--' : `${attended}`}
                      />
                      <LegendRow
                        color={colors.ringFill}
                        label={t('transcriptMetricsScreen.ringLegendAcquired')}
                        value={hidden ? '--' : `${acquired}`}
                      />
                    </View>
                  </View>
                )}
              </View>
            </Card>

            <Section style={styles.section}>
              <SectionHeader title={t('transcriptMetricsScreen.thisYear')} />
              <Card padded style={styles.yearCard}>
                <Figure
                  label={t('transcriptMetricsScreen.acquiredCreditsLabel')}
                  value={enrollmentAcquiredCredits}
                  total={enrollmentCredits}
                  hidden={hidden}
                />
                <Figure
                  label={t('transcriptMetricsScreen.attendedCreditsLabel')}
                  value={enrollmentAttendedCredits}
                  total={enrollmentCredits}
                  hidden={hidden}
                />
              </Card>
            </Section>

            <Section>
              <SectionHeader
                title={t('transcriptMetricsScreen.averages')}
                trailingItem={
                  <TextButton
                    onPress={onPressAverageEvent}
                    style={styles.headerLink}
                  >
                    {t('transcriptMetricsScreen.howComputed')}
                  </TextButton>
                }
              />
              <Card padded style={styles.averagesCard}>
                <Figure
                  label={t('transcriptMetricsScreen.weightedAverage')}
                  value={averageGrade}
                  total={30}
                  hidden={hidden}
                />
                <Figure
                  label={t('teachingScreen.finalAverage')}
                  value={estimatedFinalGrade}
                  total={110}
                  hidden={hidden}
                />
                {!!mastersAdmissionAverageGrade && (
                  <Figure
                    label={t('transcriptMetricsScreen.masterAdmissionAverage')}
                    value={mastersAdmissionAverageGrade}
                    total={30}
                    hidden={hidden}
                  />
                )}
              </Card>
            </Section>

            {!isNil(totalOnTimeExamPoints) && !isNil(maxOnTimeExamPoints) && (
              <Section>
                <SectionHeader
                  title={t('transcriptMetricsScreen.pointTitle')}
                  trailingItem={
                    <TextButton
                      onPress={onPressPointEvent}
                      style={styles.headerLink}
                    >
                      {t('transcriptMetricsScreen.whatTheyAre')}
                    </TextButton>
                  }
                />
                <Card padded>
                  <Figure
                    label={t('transcriptMetricsScreen.onTimeScores')}
                    value={totalOnTimeExamPoints ?? 0}
                    total={maxOnTimeExamPoints}
                    hidden={hidden}
                  />
                </Card>
              </Section>
            )}
          </>
        ) : (
          <QueryStateView
            states={states}
            skeleton={<CareerSkeleton />}
            errorState={{ title: t('states.career.failedTitle') }}
          >
            {null}
          </QueryStateView>
        )}
        <BottomBarSpacer />
      </ScrollView>
    </>
  );
};

/** A figure over its scale, 57/180, with its meaning in the label */
const Figure = ({
  label,
  value,
  total,
  hidden,
}: {
  label: string;
  value?: number | null;
  total?: number | null;
  hidden: boolean;
}) => {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const shown = hidden || isNil(value) ? '--' : `${value}`;
  return (
    <View
      accessible
      accessibilityLabel={t('transcriptMetricsScreen.figureLabel', {
        label,
        value: hidden ? t('transcriptMetricsScreen.hiddenValue') : shown,
        total: total ?? '--',
      })}
    >
      <Text variant="secondaryText">{label}</Text>
      <Text
        variant="number"
        style={{ color: colors.title, fontVariant: ['tabular-nums'] }}
      >
        {shown}
        <Text variant="secondaryText" weight="semibold">
          {` /${total ?? '--'}`}
        </Text>
      </Text>
    </View>
  );
};

const LegendRow = ({
  color,
  label,
  value,
}: {
  color: string;
  label: string;
  value: string;
}) => {
  const styles = useStylesheet(createStyles);
  const { colors } = useTheme();
  return (
    <View style={styles.legendRow}>
      <View style={[styles.legendMark, { backgroundColor: color }]} />
      <Text variant="secondaryText">{label}</Text>
      <Text
        variant="secondaryText"
        weight="bold"
        style={{ color: colors.title }}
      >
        {value}
      </Text>
    </View>
  );
};

/** The screen while the career loads: the same cards, at the same heights */
const CareerSkeleton = () => {
  const { t } = useTranslation();
  const styles = useStylesheet(createStyles);
  const { layout } = useTheme();
  const { scale, isLarge } = useTextScale();
  const k = Math.min(scale * Math.max(PixelRatio.getFontScale(), 1), 2);
  // A figure is a label line (20) and a number line (32)
  const figure = 52 * k;
  const ring = 120 * k + 8 + 40 * k;
  const creditsHeight =
    (isLarge ? figure * 2 + 12 + 16 + ring : Math.max(figure * 2 + 12, ring)) +
    layout.cardPadding * 2;
  const header = (
    <View style={styles.skeletonHeader}>
      <SkeletonBox width={32} height={4} />
      <SkeletonLine variant="heading" width="50%" />
    </View>
  );
  return (
    <SkeletonRegion label={t('states.career.loading')}>
      <Card style={[styles.creditsCard, { minHeight: creditsHeight }]} />
      <View style={styles.section}>
        {header}
        <Card
          style={{
            minHeight:
              (isLarge ? figure * 2 + 12 : figure) + layout.cardPadding * 2,
          }}
        />
      </View>
      {header}
      <Card style={{ minHeight: figure * 3 + 32 + layout.cardPadding * 2 }} />
    </SkeletonRegion>
  );
};

const createStyles = ({ layout, spacing }: Theme) =>
  StyleSheet.create({
    container: {
      paddingTop: spacing[2],
    },
    creditsCard: {
      marginTop: spacing[4],
    },
    credits: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing[4],
      padding: layout.cardPadding,
    },
    creditsLarge: {
      flexDirection: 'column',
      alignItems: 'stretch',
    },
    figures: {
      flexGrow: 1,
      flexShrink: 1,
      gap: spacing[3],
    },
    ringBox: {
      alignItems: 'center',
      alignSelf: 'center',
      gap: spacing[2],
    },
    legend: {
      gap: spacing[1],
    },
    legendRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing[2],
    },
    legendMark: {
      width: 12,
      height: 4,
      borderRadius: 2,
    },
    section: {
      marginTop: spacing[6],
    },
    yearCard: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      columnGap: spacing[8],
      rowGap: spacing[3],
    },
    averagesCard: {
      gap: spacing[4],
    },
    headerLink: {
      marginBottom: -spacing[3],
    },
    skeletonHeader: {
      gap: spacing[2],
      paddingHorizontal: layout.gutter,
      paddingTop: spacing[2],
      paddingBottom: spacing[3],
    },
  });
