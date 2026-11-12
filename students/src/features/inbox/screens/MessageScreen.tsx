import { useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Alert, ScrollView, StyleSheet, View } from 'react-native';

import { faTrashCan } from '@fortawesome/free-regular-svg-icons';
import { faInbox } from '@fortawesome/free-solid-svg-icons';
import {
  APP_TIMEZONE,
  linkUrls,
  useFeedbackContext,
  usePreferencesContext,
  useQueryStates,
} from '@polito/lib/core';
import {
  BottomBarSpacer,
  Card,
  CtaButton,
  HtmlView,
  RegionStateBlock,
  SkeletonDetail,
  StateBlock,
  Text,
  type Theme,
  useStylesheet,
} from '@polito/lib/ui';
import { MessageType } from '@polito/student-api-client';
import { NativeStackScreenProps } from '@react-navigation/native-stack';

import { useDeleteMessage } from '~/core/queries/studentHooks';
import { AppPreferences } from '~/core/types/preferences';

import { DateTime } from 'luxon';

import { useInbox } from '../../../core/hooks/useInbox';
import { useMarkAsRead } from '../../../core/hooks/useMarkAsRead';
import { TeachingStackParamList } from '../../teaching/components/TeachingNavigator';
import { useSenderName } from '../components/InboxRow';

type Props = NativeStackScreenProps<TeachingStackParamList, 'Message'>;

/**
 * One message: title, sender, date and text, with Delete at the end.
 * Opening it marks it read. Deleting asks first, because the server
 * cannot restore a deleted message.
 */
export const MessageScreen = ({ route, navigation }: Props) => {
  const { id } = route.params;
  const { t } = useTranslation();
  const styles = useStylesheet(createStyles);
  const { language } = usePreferencesContext<AppPreferences>();
  const { setFeedback } = useFeedbackContext();
  const { items, messagesQuery } = useInbox();
  const states = useQueryStates(messagesQuery);
  const markAsRead = useMarkAsRead();
  const senderName = useSenderName();
  const { mutateAsync: deleteMessage, isPending: deleting } =
    useDeleteMessage();

  const message = messagesQuery.data?.find(m => m.id === id);
  const item = items.find(i => i.key === `m${id}`);
  const isUnread = message ? !message.isRead : false;

  useEffect(() => {
    if (isUnread) markAsRead.message(id);
  }, [id, isUnread, markAsRead]);

  const html = useMemo(
    () => (message?.message ? linkUrls(message.message) : ''),
    [message?.message],
  );

  if (states.status === 'loading') {
    return <SkeletonDetail cards={[120]} />;
  }
  if (states.status === 'error') {
    return (
      <RegionStateBlock states={states} style={styles.block} card={true} />
    );
  }
  if (!message) {
    return (
      <StateBlock
        card
        style={styles.block}
        icon={faInbox}
        title={t('inboxScreen.message.deletedTitle')}
        text={t('inboxScreen.message.deletedText')}
        action={{
          label: t('inboxScreen.message.goToInbox'),
          onPress: () => navigation.navigate('Inbox'),
        }}
      />
    );
  }

  const date = DateTime.fromJSDate(message.sentAt, { zone: APP_TIMEZONE })
    .setLocale(language)
    .toFormat('cccc d LLLL yyyy, HH:mm');

  const confirmDelete = () =>
    Alert.alert(
      t('inboxScreen.message.deleteConfirmTitle'),
      t('inboxScreen.message.deleteConfirmText'),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('common.delete'),
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteMessage(id);
              navigation.goBack();
              setFeedback({ text: t('inboxScreen.message.deleted') });
            } catch {
              setFeedback({
                text: t('inboxScreen.message.deleteFailed'),
                isError: true,
              });
            }
          },
        },
      ],
    );

  return (
    <ScrollView contentInsetAdjustmentBehavior="automatic">
      <View style={styles.header}>
        <Text variant="heading" role="heading" style={styles.title}>
          {message.title}
        </Text>
        <Text variant="secondaryText">
          {item ? senderName(item) : t('inboxScreen.senders.university')}
        </Text>
        <Text variant="secondaryText">{date}</Text>
      </View>
      <Card padded style={styles.card}>
        {html ? (
          <HtmlView
            props={{ source: { html }, baseStyle: { padding: 0 } }}
            variant="longProse"
          />
        ) : (
          <Text variant="prose">{t('inboxScreen.message.noText')}</Text>
        )}
      </Card>
      <View style={styles.actions}>
        {message.type === MessageType.Exams && (
          <CtaButton
            absolute={false}
            variant="outlined"
            title={t('inboxScreen.message.openTranscript')}
            action={() => navigation.navigate('Transcript')}
          />
        )}
        <CtaButton
          absolute={false}
          variant="outlined"
          destructive
          icon={faTrashCan}
          loading={deleting}
          title={t('inboxScreen.message.delete')}
          action={confirmDelete}
        />
      </View>
      <BottomBarSpacer />
    </ScrollView>
  );
};

const createStyles = ({ layout, spacing }: Theme) =>
  StyleSheet.create({
    header: {
      paddingHorizontal: layout.gutter,
      paddingTop: spacing[4],
      gap: spacing[1],
    },
    title: {
      marginBottom: spacing[1],
    },
    card: {
      marginHorizontal: layout.gutter,
      marginTop: spacing[4],
    },
    actions: {
      marginTop: spacing[4],
    },
    block: {
      marginHorizontal: layout.gutter,
      marginTop: spacing[4],
    },
  });
