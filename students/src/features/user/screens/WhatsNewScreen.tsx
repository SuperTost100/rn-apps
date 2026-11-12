import { useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { ScrollView, StyleSheet, View } from 'react-native';

import { useScreenReader } from '@polito/lib/core';
import {
  BottomBarSpacer,
  OverviewList,
  RefreshControl,
  Theme,
  useStylesheet,
} from '@polito/lib/ui';
import { NativeStackScreenProps } from '@react-navigation/native-stack';

import {
  getAppInfoAnnouncements,
  getWhatsNewArchiveAnnouncements,
  useGetAnnouncements,
} from '../../../core/queries/announcementHooks';
import { UserStackParamList } from '../components/UserNavigator';
import { WhatsNewListItem } from '../components/WhatsNewListItem';

type Props = NativeStackScreenProps<
  UserStackParamList,
  'WhatsNew' | 'RecentCommunications'
>;

const SCREEN_CONFIG = {
  WhatsNew: {
    getAnnouncements: getWhatsNewArchiveAnnouncements,
    loadingKey: 'appInfoScreen.whatsNewLoading',
    emptyKey: 'appInfoScreen.whatsNewEmpty',
    loadedKey: 'appInfoScreen.whatsNewListLoaded',
    listLabelKey: 'appInfoScreen.whatsNewListLabel',
  },
  RecentCommunications: {
    getAnnouncements: getAppInfoAnnouncements,
    loadingKey: 'appInfoScreen.recentCommunicationsLoading',
    emptyKey: 'appInfoScreen.recentCommunicationsEmpty',
    loadedKey: 'appInfoScreen.recentCommunicationsListLoaded',
    listLabelKey: 'appInfoScreen.recentCommunicationsListCount',
  },
} as const;

export const WhatsNewScreen = ({ route }: Props) => {
  const config = SCREEN_CONFIG[route.name];
  const { t } = useTranslation();
  const styles = useStylesheet(createStyles);
  const { isEnabled, announce } = useScreenReader();
  const announcementsQuery = useGetAnnouncements();

  const announcements = useMemo(
    () => config.getAnnouncements(announcementsQuery.data),
    [announcementsQuery.data, config],
  );

  useEffect(() => {
    if (!isEnabled) return;

    if (announcementsQuery.isLoading) {
      announce(t(config.loadingKey));
      return;
    }

    if (!announcementsQuery.data) return;

    announce(
      announcements.length === 0 ? t(config.emptyKey) : t(config.loadedKey),
    );
  }, [
    announcements.length,
    announcementsQuery.data,
    announcementsQuery.isLoading,
    announce,
    config,
    isEnabled,
    t,
  ]);

  return (
    <ScrollView
      contentInsetAdjustmentBehavior="automatic"
      refreshControl={<RefreshControl queries={[announcementsQuery]} manual />}
    >
      <View
        style={styles.list}
        accessibilityRole="list"
        accessibilityLabel={
          announcementsQuery.isLoading
            ? t(config.loadingKey)
            : t(config.listLabelKey, {
                count: announcements.length,
              })
        }
      >
        <OverviewList
          queries={announcementsQuery}
          isEmpty={() => announcements.length === 0}
          skeleton={{ count: 3, titleLines: 2, trailing: 'none' }}
          emptyState={{ title: t(config.emptyKey) }}
          indented={false}
        >
          {announcements.map((announcement, index) => (
            <WhatsNewListItem
              key={announcement.id}
              announcement={announcement}
              index={index}
              totalData={announcements.length}
            />
          ))}
        </OverviewList>
      </View>
      <BottomBarSpacer />
    </ScrollView>
  );
};

const createStyles = ({ spacing }: Theme) =>
  StyleSheet.create({
    list: {
      marginTop: spacing[2],
    },
  });
