import { useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { Alert, StyleSheet, View } from 'react-native';

import { faThumbsDown, faThumbsUp } from '@fortawesome/free-solid-svg-icons';
import {
  Col,
  IconButton,
  Row,
  Text,
  Theme,
  useStylesheet,
  useTheme,
} from '@polito/lib/ui';

import { useGiveTicketReplyFeedback } from '../../../core/queries/ticketHooks';

interface VirtualOperatorFeedbackBarProps {
  ticketId: number;
  replyId: number;
  onAccepted?: () => void;
  onRejected?: () => void;
}

export const VirtualOperatorFeedbackBar = ({
  ticketId,
  replyId,
  onAccepted,
  onRejected,
}: VirtualOperatorFeedbackBarProps) => {
  const { t } = useTranslation();
  const styles = useStylesheet(createStyles);
  const { colors } = useTheme();
  const { mutateAsync: giveFeedback, isPending } = useGiveTicketReplyFeedback(
    ticketId,
    replyId,
  );

  const handleFeedback = useCallback(
    (positive: boolean) => {
      giveFeedback(positive)
        .then(() => {
          if (positive) {
            onAccepted?.();
          } else {
            onRejected?.();
          }
        })
        .catch(() =>
          Alert.alert(t('common.error'), t('ticketScreen.sendError')),
        );
    },
    [giveFeedback, onAccepted, onRejected, t],
  );

  return (
    <View style={styles.container}>
      <Col gap={1}>
        <Text variant="heading" style={styles.title}>
          {t('ticketScreen.feedbackTitle')}
        </Text>
        <Text variant="secondaryText" style={styles.description}>
          {t('ticketScreen.feedbackDescription')}
        </Text>
      </Col>
      <Row align="center" style={styles.buttonsRow}>
        <Text variant="heading" style={styles.question}>
          {t('ticketScreen.feedbackQuestion')}
        </Text>
        <Row gap={3} style={styles.buttons}>
          <IconButton
            icon={faThumbsDown}
            accessibilityLabel={t('ticketScreen.feedbackNo')}
            onPress={() => handleFeedback(false)}
            disabled={isPending}
            color={colors.dangerText}
            size={20}
            noPadding
            style={styles.thumbsDownButton}
          />
          <IconButton
            icon={faThumbsUp}
            accessibilityLabel={t('ticketScreen.feedbackYes')}
            onPress={() => handleFeedback(true)}
            disabled={isPending}
            color={colors.onPrimary}
            size={20}
            noPadding
            style={styles.thumbsUpButton}
          />
        </Row>
      </Row>
    </View>
  );
};

const createStyles = ({ spacing, colors }: Theme) =>
  StyleSheet.create({
    container: {
      backgroundColor: colors.surfaceSunken,
      paddingHorizontal: spacing[4],
      paddingTop: spacing[2],
      paddingBottom: spacing[4],
      gap: spacing[3],
    },
    title: {
      color: colors.heading,
      fontSize: 14,
      fontWeight: '600',
    },
    description: {
      fontSize: 12,
      lineHeight: 18,
      color: colors.secondaryText,
    },
    question: {
      flex: 1,
      color: colors.heading,
      fontSize: 14,
      fontWeight: '600',
    },
    buttonsRow: {
      gap: spacing[5],
    },
    buttons: {
      justifyContent: 'flex-end',
      gap: spacing[3],
    },
    thumbsDownButton: {
      backgroundColor: colors.dangerBg,
      borderWidth: 1,
      borderColor: colors.dangerText,
      width: 77.5,
      height: 45,
      borderRadius: 12,
      padding: 0,
      alignItems: 'center',
      justifyContent: 'center',
    },
    thumbsUpButton: {
      backgroundColor: colors.primary,
      width: 77.5,
      height: 45,
      borderRadius: 12,
      padding: 0,
      alignItems: 'center',
      justifyContent: 'center',
    },
  });
