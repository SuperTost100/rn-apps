import { useLayoutEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { SafeAreaView, ScrollView, StyleSheet, View } from 'react-native';

import { APP_TIMEZONE, useQueryStates } from '@polito/lib/core';
import { useOpenInAppLink } from '@polito/lib/core';
import {
  BottomBarSpacer,
  Card,
  HtmlView,
  ImageLoader,
  ListItem,
  OutlineIcon,
  OutlineIconName,
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

import { useGetNewsItem } from '../../../core/queries/newsHooks';
import { ServiceStackParamList } from '../components/ServicesNavigator';

type Props = NativeStackScreenProps<ServiceStackParamList, 'NewsItem'>;

const dayWithYear = (date: Date) =>
  DateTime.fromJSDate(date, { zone: APP_TIMEZONE }).toFormat('d LLLL yyyy');

/** "example.org" for a link, so the row says where it leads */
const hostOf = (url: string) => {
  const match = /^[a-z]+:\/\/([^/?#]+)/i.exec(url);
  return match ? match[1].replace(/^www\./, '') : undefined;
};

export const NewsItemScreen = ({ route, navigation }: Props) => {
  const { id } = route?.params || {};
  const { spacing, colors } = useTheme();
  const { t } = useTranslation();
  const useNewsItemQuery = useGetNewsItem(id);
  const { data: newsItem } = useNewsItemQuery;
  const states = useQueryStates(useNewsItemQuery);
  const styles = useStylesheet(createStyles);
  const openInAppLink = useOpenInAppLink();
  const {
    title,
    isEvent,
    eventStartTime,
    eventEndTime,
    createdAt,
    htmlContent,
    location,
  } = newsItem || {};
  const eventStart = eventStartTime
    ? DateTime.fromISO(eventStartTime, { zone: APP_TIMEZONE })
    : undefined;
  const eventEnd = eventEndTime
    ? DateTime.fromISO(eventEndTime, { zone: APP_TIMEZONE })
    : undefined;

  useLayoutEffect(() => {
    if (!newsItem) return;
    navigation.setOptions({
      headerTitle: newsItem.isEvent
        ? t('serviceInfo.news.event')
        : t('serviceInfo.news.news'),
    });
  }, [navigation, newsItem, t]);

  const icon = (name: OutlineIconName, size?: number) => (
    <OutlineIcon name={name} size={size} color={colors.secondaryText} />
  );

  const links = newsItem?.extras.filter(e => ['link', 'file'].includes(e.type));
  const logo = newsItem?.extras.find(
    e => e.type === 'image' && e.description === 'Logo1',
  );

  return (
    <ScrollView
      contentInsetAdjustmentBehavior="automatic"
      refreshControl={<RefreshControl queries={[useNewsItemQuery]} manual />}
    >
      <SafeAreaView>
        {states.status === 'ready' && newsItem ? (
          <>
            <View style={styles.titleBlock}>
              <Text
                variant="cardTitle"
                accessibilityRole="header"
                style={styles.title}
              >
                {title}
              </Text>
              <Text variant="secondaryText">
                {t('serviceInfo.news.published', {
                  date: dayWithYear(createdAt!),
                })}
              </Text>
            </View>
            {isEvent && eventStart && (
              <OverviewList style={styles.firstCard}>
                <ListItem
                  leadingItem={icon('calendar')}
                  title={eventStart.toFormat('cccc d LLLL yyyy')}
                  subtitle={
                    eventEnd
                      ? `${eventStart.toFormat('HH:mm')} - ${eventEnd.toFormat('HH:mm')}`
                      : eventStart.toFormat('HH:mm')
                  }
                />
                {!!location && (
                  <ListItem
                    leadingItem={icon('pin')}
                    title={location}
                    multilineTitle
                    subtitle={t('serviceInfo.news.where')}
                  />
                )}
              </OverviewList>
            )}
            {!!logo && (
              <Card
                accessible
                accessibilityLabel={t('newsScreen.logo')}
                accessibilityRole="image"
                style={styles.firstCard}
              >
                <ImageLoader
                  source={{ uri: logo.url }}
                  imageStyle={{ height: 200 }}
                  containerStyle={{ height: 200, margin: spacing[3] }}
                  resizeMode="cover"
                />
              </Card>
            )}
            {!!htmlContent && (
              <Card padded style={styles.firstCard}>
                <HtmlView
                  props={{
                    source: { html: htmlContent },
                    baseStyle: { padding: 0 },
                  }}
                  variant="longProse"
                />
              </Card>
            )}
            {!!links?.length && (
              <Section style={styles.section}>
                <SectionHeader title={t('serviceInfo.news.attachments')} />
                <OverviewList>
                  {links.map((link, index) => {
                    const isFile = link.type === 'file';
                    const detail = isFile
                      ? link.sizeInKiloBytes
                        ? t('serviceInfo.news.fileSize', {
                            size: link.sizeInKiloBytes,
                          })
                        : t('serviceInfo.news.file')
                      : hostOf(link.url);
                    const name = link.description || link.url;
                    return (
                      <ListItem
                        key={index}
                        leadingItem={icon(isFile ? 'file' : 'ext')}
                        title={name}
                        subtitle={detail}
                        onPress={() => openInAppLink(link.url)}
                        accessibilityRole="link"
                        accessibilityLabel={t('serviceInfo.opensInBrowser', {
                          label: [name, detail].filter(Boolean).join(', '),
                        })}
                        trailingItem={isFile ? icon('download', 20) : undefined}
                        isAction
                      />
                    );
                  })}
                </OverviewList>
              </Section>
            )}
          </>
        ) : (
          <QueryStateView
            states={states}
            skeleton={
              <SkeletonDetail
                cards={[112, 240]}
                label={t('states.news.loadingOne')}
              />
            }
            errorState={{ title: t('states.news.failedOneTitle') }}
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
      gap: spacing[1],
    },
    title: {
      flexShrink: 1,
    },
    // The standard gap between cards: 16 px from the block above
    firstCard: {
      marginTop: spacing[4],
    },
    section: {
      marginTop: layout.sectionGap - spacing[2],
    },
  });
