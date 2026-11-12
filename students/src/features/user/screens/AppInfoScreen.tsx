import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Linking, ScrollView, StyleSheet, View } from 'react-native';

import { GITHUB_REPOSITORY_URL, getHtmlTextContent } from '@polito/lib/core';
import {
  BottomBarSpacer,
  ListItem,
  OutlineIcon,
  OverviewList,
  QueryStateView,
  RefreshControl,
  SectionHeader,
  Text,
  TextButton,
  Theme,
  useStylesheet,
  useTheme,
} from '@polito/lib/ui';

import { isTestBuild } from '../../../config/testBuild';
import { useVersionText } from '../../../core/hooks/useVersionText';
import {
  getAppInfoAnnouncements,
  getWhatsNewArchiveAnnouncements,
  useGetAnnouncements,
} from '../../../core/queries/announcementHooks';
import { WhatsNewCard } from '../components/WhatsNewCard';

const POLITO_STUDENTS_TOPIC_ID = 1101;
const TECHNICAL_ISSUES_SUBTOPIC_ID = 2001;
const FEEDBACK_SUGGESTIONS_SUBTOPIC_ID = 1721;
const TECHNICAL_ISSUES_LINK = {
  screen: 'CreateTicket',
  params: {
    topicId: POLITO_STUDENTS_TOPIC_ID,
    subtopicId: TECHNICAL_ISSUES_SUBTOPIC_ID,
  },
};
const SUGGESTIONS_LINK = {
  screen: 'CreateTicket',
  params: {
    topicId: POLITO_STUDENTS_TOPIC_ID,
    subtopicId: FEEDBACK_SUGGESTIONS_SUBTOPIC_ID,
  },
};

export const AppInfoScreen = () => {
  const { t } = useTranslation();
  const styles = useStylesheet(createStyles);
  const { colors } = useTheme();
  const versionText = useVersionText();

  const announcementsQuery = useGetAnnouncements();

  const announcements = useMemo(
    () => getWhatsNewArchiveAnnouncements(announcementsQuery.data),
    [announcementsQuery.data],
  );

  const communications = useMemo(
    () => getAppInfoAnnouncements(announcementsQuery.data),
    [announcementsQuery.data],
  );
  const iconColor = colors.secondaryText;

  return (
    <ScrollView
      contentInsetAdjustmentBehavior="automatic"
      refreshControl={<RefreshControl queries={[announcementsQuery]} manual />}
    >
      {isTestBuild && (
        // The licence asks modified versions to say they are not official
        // and to point to the official repository
        <View style={styles.testNotice}>
          <Text variant="secondaryText">{t('testBuild.notice')}</Text>
          <TextButton
            accessibilityRole="link"
            accessibilityHint={t('common.externalLink')}
            onPress={() => Linking.openURL(GITHUB_REPOSITORY_URL)}
            style={styles.repoLink}
          >
            {t('testBuild.officialRepository', {
              url: GITHUB_REPOSITORY_URL.replace('https://', ''),
            })}
          </TextButton>
        </View>
      )}
      <View style={styles.first}>
        <SectionHeader
          title={t('appInfoScreen.whatsNew')}
          linkTo={announcements.length > 0 ? 'WhatsNew' : undefined}
        />
        <QueryStateView
          queries={announcementsQuery}
          isEmpty={() => announcements.length === 0}
          skeleton={{ count: 1, titleLines: 2 }}
          emptyState={{
            title: t('appInfoScreen.whatsNewEmptyTitle'),
            text: t('appInfoScreen.whatsNewEmptyText'),
          }}
        >
          <WhatsNewCard announcements={announcements.slice(0, 4)} />
        </QueryStateView>
      </View>

      {(announcementsQuery.isLoading || communications.length > 0) && (
        <View style={styles.section}>
          <SectionHeader
            title={t('appInfoScreen.recentCommunications')}
            linkTo={
              communications.length > 1 ? 'RecentCommunications' : undefined
            }
          />
          <OverviewList
            queries={announcementsQuery}
            isEmpty={() => false}
            skeleton={{ count: 1, leading: 'icon' }}
          >
            {communications.slice(0, 1).map(communication => {
              const subtitle =
                communication.description?.trim() ||
                getHtmlTextContent(communication.contents ?? '');
              return (
                <ListItem
                  key={communication.id}
                  title={communication.title}
                  subtitle={subtitle}
                  subtitleProps={{ numberOfLines: 2 }}
                  leadingItem={
                    <OutlineIcon name="megaphone" color={iconColor} />
                  }
                  accessibilityHint={t('appInfoScreen.openCommunicationHint')}
                  linkTo={{
                    screen: 'NewOverlay',
                    params: { id: communication.id },
                  }}
                />
              );
            })}
          </OverviewList>
        </View>
      )}

      {/* Tickets from a test build would reach the student office about an
          app it did not publish */}
      {!isTestBuild && (
        <View style={styles.section}>
          <SectionHeader title={t('appInfoScreen.feedback')} />
          <OverviewList>
            <ListItem
              title={t('appInfoScreen.reportProblemTitle')}
              subtitle={t('appInfoScreen.reportProblemSubtitle')}
              leadingItem={<OutlineIcon name="alert" color={iconColor} />}
              accessibilityHint={t('appInfoScreen.reportProblemHint')}
              linkTo={TECHNICAL_ISSUES_LINK}
            />
            <ListItem
              title={t('appInfoScreen.suggestionTitle')}
              subtitle={t('appInfoScreen.suggestionSubtitle')}
              leadingItem={<OutlineIcon name="chat" color={iconColor} />}
              accessibilityHint={t('appInfoScreen.suggestionHint')}
              linkTo={SUGGESTIONS_LINK}
            />
          </OverviewList>
        </View>
      )}

      <View style={styles.section}>
        <SectionHeader title={t('appInfoScreen.about')} />
        <OverviewList>
          <ListItem
            title={t('appInfoScreen.githubTitle')}
            subtitle={t('appInfoScreen.githubSubtitle')}
            leadingItem={<OutlineIcon name="github" color={iconColor} />}
            trailingItem={
              <OutlineIcon name="ext" color={iconColor} size={20} />
            }
            accessibilityRole="link"
            accessibilityHint={t('common.externalLink')}
            onPress={() => Linking.openURL(GITHUB_REPOSITORY_URL)}
          />
        </OverviewList>
      </View>

      <Text variant="secondaryText" style={styles.version}>
        {versionText}
      </Text>
      <BottomBarSpacer />
    </ScrollView>
  );
};

const createStyles = ({ layout, spacing }: Theme) =>
  StyleSheet.create({
    first: {
      marginTop: spacing[4],
    },
    testNotice: {
      paddingHorizontal: layout.gutter,
      marginTop: spacing[4],
    },
    repoLink: {
      alignSelf: 'flex-start',
      marginLeft: -spacing[3],
    },
    section: {
      marginTop: layout.sectionGap,
    },
    version: {
      paddingHorizontal: layout.gutter,
      marginTop: spacing[6],
    },
  });
