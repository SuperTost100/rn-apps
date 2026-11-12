import { useEffect, useMemo, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import {
  APP_TIMEZONE,
  linkUrls,
  usePreferencesContext,
  useScreenReader,
} from '@polito/lib/core';
import {
  CtaButton,
  HtmlView,
  StatusChip,
  Text,
  type Theme,
  useHideTabs,
  useStylesheet,
} from '@polito/lib/ui';
import { Message } from '@polito/student-api-client';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useQueryClient } from '@tanstack/react-query';

import { AppPreferences } from '~/core/types/preferences';

import { DateTime } from 'luxon';

import { useMarkAsRead } from '../../../core/hooks/useMarkAsRead';
import { useGetModalMessages } from '../../../core/queries/studentHooks';
import { TeachingStackParamList } from '../../teaching/components/TeachingNavigator';

type Props = NativeStackScreenProps<TeachingStackParamList, 'MessagesModal'>;

const MODAL_QUERY_KEY = ['messages', 'modal'];

/**
 * The only message that interrupts at launch: an unread urgent one, once.
 * Leaving it in any way (Got it, Open the inbox, the close button, back)
 * marks it read on the server, so it does not come back at the next launch.
 */
export const UnreadMessagesModal = ({ navigation }: Props) => {
  const { t } = useTranslation();
  const styles = useStylesheet(createStyles);
  const { bottom } = useSafeAreaInsets();
  const { language } = usePreferencesContext<AppPreferences>();
  const { announce } = useScreenReader();
  const queryClient = useQueryClient();
  const markAsRead = useMarkAsRead();
  const { data: messages } = useGetModalMessages();
  const message = messages?.[0];
  // Kept for the cleanup, which runs after the list may have changed
  const shown = useRef<Message | undefined>(undefined);
  shown.current = message ?? shown.current;

  useEffect(() => {
    if (!message) navigation.goBack();
  }, [message, navigation]);

  useEffect(() => {
    if (message) announce(t('inboxScreen.urgent.announce'));
  }, [announce, message, t]);

  // Leaving marks the message read and takes it off the launch list
  useHideTabs(undefined, () => {
    const m = shown.current;
    if (!m) return;
    markAsRead.message(m.id);
    queryClient.setQueryData<Message[]>(MODAL_QUERY_KEY, prev =>
      prev?.filter(x => x.id !== m.id),
    );
  });

  const html = useMemo(
    () => (message?.message ? linkUrls(message.message) : ''),
    [message?.message],
  );

  if (!message) return null;

  const date = DateTime.fromJSDate(message.sentAt, { zone: APP_TIMEZONE })
    .setLocale(language)
    .toFormat('cccc d LLLL, HH:mm');

  return (
    <>
      <ScrollView
        contentInsetAdjustmentBehavior="automatic"
        contentContainerStyle={styles.content}
      >
        <View style={styles.chip}>
          <StatusChip tone="danger" label={t('inboxScreen.urgent.chip')} />
        </View>
        <Text variant="heading" role="heading">
          {message.title}
        </Text>
        {!!html && (
          <HtmlView
            props={{ source: { html }, baseStyle: { padding: 0 } }}
            variant="longProse"
          />
        )}
        <Text variant="secondaryText">
          {t('inboxScreen.urgent.from', { date })}
        </Text>
      </ScrollView>
      <View style={[styles.actions, { paddingBottom: bottom }]}>
        <CtaButton
          absolute={false}
          title={t('inboxScreen.urgent.gotIt')}
          action={() => navigation.goBack()}
        />
        <CtaButton
          absolute={false}
          variant="outlined"
          title={t('inboxScreen.urgent.openInInbox')}
          action={() => {
            navigation.goBack();
            navigation.navigate('Message', { id: message.id });
          }}
        />
      </View>
    </>
  );
};

const createStyles = ({ layout, spacing }: Theme) =>
  StyleSheet.create({
    content: {
      paddingHorizontal: layout.gutter,
      paddingVertical: spacing[4],
      gap: spacing[3],
    },
    chip: {
      flexDirection: 'row',
    },
    actions: {
      paddingTop: spacing[2],
    },
  });
