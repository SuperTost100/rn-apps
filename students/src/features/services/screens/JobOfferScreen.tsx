import { useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Linking,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import replace from 'react-string-replace';

import { APP_TIMEZONE, sanitizeHtml, useQueryStates } from '@polito/lib/core';
import { useOpenInAppLink } from '@polito/lib/core';
import {
  BottomBarSpacer,
  Card,
  HtmlView,
  KeyValueList,
  ListItem,
  OutlineIcon,
  OverviewList,
  QueryStateView,
  RefreshControl,
  Section,
  SectionHeader,
  SkeletonDetail,
  Text,
  Theme,
  useStylesheet,
  useTheme,
} from '@polito/lib/ui';
import { NativeStackScreenProps } from '@react-navigation/native-stack';

import { DateTime } from 'luxon';

import { useGetJobOffer } from '../../../core/queries/jobOfferHooks';
import { ServiceStackParamList } from '../components/ServicesNavigator';

type Props = NativeStackScreenProps<ServiceStackParamList, 'JobOffer'>;

export const JobOfferScreen = ({ route }: Props) => {
  const { id } = route?.params || {};
  const { t } = useTranslation();
  const useGetJobOfferQuery = useGetJobOffer(id);
  const { data: jobOffer } = useGetJobOfferQuery;
  const states = useQueryStates(useGetJobOfferQuery);
  const styles = useStylesheet(createStyles);
  const openInAppLink = useOpenInAppLink();
  const {
    title,
    location,
    contactInformation,
    companyName,
    contractType,
    endsAtDate,
    freePositions,
    url,
    email,
    companyLocation,
    companyMission,
    description,
    requirements,
    salary,
  } = jobOffer || {};
  const { colors } = useTheme();
  const icon = (name: 'brief' | 'ext' | 'mail') => (
    <OutlineIcon name={name} color={colors.secondaryText} />
  );

  const onPressUrl = (uri: string) => {
    !!uri && openInAppLink(uri);
  };

  const onPressEmail = useCallback(
    (mail: string) => {
      !!mail && openInAppLink(`mailto:${mail}`);
    },
    [openInAppLink],
  );

  const contactInfo = useMemo(() => {
    return replace(
      replace(
        contactInformation ?? '',
        /([a-zA-Z0-9+._-]+@[a-zA-Z0-9._-]+\.[a-zA-Z0-9_-]+)/gi,
        match => (
          <Text variant="link" onPress={() => onPressEmail(match)} key={match}>
            {match}
          </Text>
        ),
      ),
      /([0-9]{10})/,
      match => (
        <Text
          variant="link"
          onPress={() => Linking.openURL(`tel:${match}`)}
          key={match}
        >
          {match}
        </Text>
      ),
    );
  }, [contactInformation, onPressEmail]);
  return (
    <ScrollView
      contentInsetAdjustmentBehavior="automatic"
      refreshControl={<RefreshControl queries={[useGetJobOfferQuery]} manual />}
    >
      <SafeAreaView>
        {states.status === 'ready' && jobOffer ? (
          <>
            <View style={styles.titleBlock}>
              <Text variant="cardTitle" accessibilityRole="header">
                {title}
              </Text>
            </View>
            <OverviewList style={styles.firstCard}>
              <ListItem
                leadingItem={icon('brief')}
                title={companyName ?? ''}
                subtitle={companyLocation || undefined}
                multilineTitle
              />
            </OverviewList>
            <Card padded style={styles.nextCard}>
              <KeyValueList
                items={[
                  {
                    label: t('serviceInfo.jobs.contract'),
                    value: contractType,
                  },
                  { label: t('serviceInfo.jobs.pay'), value: salary },
                  { label: t('serviceInfo.jobs.where'), value: location },
                  {
                    label: t('serviceInfo.jobs.openPositions'),
                    value: freePositions || undefined,
                  },
                  {
                    label: t('serviceInfo.jobs.applyByLabel'),
                    value: endsAtDate
                      ? DateTime.fromJSDate(endsAtDate, {
                          zone: APP_TIMEZONE,
                        }).toFormat('d LLLL yyyy')
                      : undefined,
                  },
                ]}
              />
            </Card>
            {!!description && (
              <Section style={styles.section}>
                <SectionHeader title={t('jobOfferScreen.description')} />
                <Card padded>
                  <HtmlView
                    props={{
                      source: { html: sanitizeHtml(description) },
                      baseStyle: { padding: 0 },
                    }}
                    variant="longProse"
                  />
                </Card>
              </Section>
            )}
            {!!companyMission && (
              <Section style={!description && styles.section}>
                <SectionHeader title={t('jobOfferScreen.companyMission')} />
                <Card padded>
                  <Text variant="longProse">{companyMission}</Text>
                </Card>
              </Section>
            )}
            {!!requirements && (
              <Section
                style={!description && !companyMission && styles.section}
              >
                <SectionHeader title={t('jobOfferScreen.requirements')} />
                <Card padded>
                  <HtmlView
                    props={{
                      source: { html: sanitizeHtml(requirements) },
                      baseStyle: { padding: 0 },
                    }}
                    variant="longProse"
                  />
                </Card>
              </Section>
            )}
            {(!!url || !!email || !!contactInformation) && (
              <Section
                style={
                  !description &&
                  !companyMission &&
                  !requirements &&
                  styles.section
                }
              >
                <SectionHeader title={t('serviceInfo.jobs.howToApply')} />
                {(!!url || !!email) && (
                  <OverviewList>
                    {!!url && (
                      <ListItem
                        leadingItem={icon('ext')}
                        title={url}
                        titleProps={{ numberOfLines: 3 }}
                        subtitle={t('serviceInfo.jobs.website')}
                        accessibilityRole="link"
                        accessibilityLabel={t('serviceInfo.opensInBrowser', {
                          label: `${t('serviceInfo.jobs.website')}, ${url}`,
                        })}
                        onPress={() => onPressUrl(url)}
                        isAction
                      />
                    )}
                    {!!email && (
                      <ListItem
                        leadingItem={icon('mail')}
                        title={email}
                        titleProps={{ numberOfLines: 3 }}
                        subtitle={t('common.email')}
                        accessibilityLabel={t('serviceInfo.person.write', {
                          email,
                        })}
                        onPress={() => onPressEmail(email)}
                        isAction
                      />
                    )}
                  </OverviewList>
                )}
                {!!contactInformation && (
                  <Card padded>
                    <Text variant="longProse">{contactInfo}</Text>
                  </Card>
                )}
              </Section>
            )}
          </>
        ) : (
          <QueryStateView
            states={states}
            skeleton={
              <SkeletonDetail
                cards={[56, 200, 160]}
                label={t('states.jobOffers.loadingOne')}
              />
            }
            errorState={{ title: t('states.jobOffers.failedOneTitle') }}
          >
            {null}
          </QueryStateView>
        )}
        <BottomBarSpacer />
      </SafeAreaView>
    </ScrollView>
  );
};

const createStyles = ({ spacing, layout }: Theme) =>
  StyleSheet.create({
    titleBlock: {
      paddingHorizontal: layout.gutter,
      paddingTop: spacing[4],
    },
    firstCard: {
      marginTop: spacing[4],
    },
    // With the card above: 16 px between the two
    nextCard: {
      marginTop: spacing[2],
    },
    section: {
      marginTop: layout.sectionGap - spacing[2],
    },
  });
