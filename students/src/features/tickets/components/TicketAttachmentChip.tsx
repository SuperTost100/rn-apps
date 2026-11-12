import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet } from 'react-native';
import { open } from 'react-native-file-viewer';

import { useFeedbackContext } from '@polito/lib/core';
import { type Theme, useStylesheet } from '@polito/lib/ui';
import { TicketAttachment } from '@polito/student-api-client';

import {
  useGetTicketAttachment,
  useGetTicketReplyAttachment,
} from '../../../core/queries/ticketHooks';
import { AttachmentChip } from './AttachmentChip';

interface TicketAttachmentChipProps {
  attachment: TicketAttachment;
  replyId?: number;
  ticketId: number;
  /** On the student's bubble, in the brand colour */
  onBrand?: boolean;
}

/** A file of a ticket message: tapping it downloads it and opens it */
export const TicketAttachmentChip = ({
  attachment,
  ticketId,
  replyId,
  onBrand = false,
}: TicketAttachmentChipProps) => {
  const { t } = useTranslation();
  const styles = useStylesheet(createStyles);
  const { setFeedback } = useFeedbackContext();
  const [shouldOpen, setShouldOpen] = useState(false);
  const isReply = replyId !== undefined;

  const replyQuery = useGetTicketReplyAttachment(
    { replyId: replyId ?? 0, ticketId, attachmentId: attachment.id },
    attachment.filename,
    isReply && shouldOpen,
  );
  const ticketQuery = useGetTicketAttachment(
    { ticketId, attachmentId: attachment.id },
    attachment.filename,
    !isReply && shouldOpen,
  );
  const query = isReply ? replyQuery : ticketQuery;
  const path = query.data;
  // A retry keeps the error status while it runs
  const failed = query.isError && !query.isFetching;

  useEffect(() => {
    if (!shouldOpen) return;
    if (failed) {
      setShouldOpen(false);
      setFeedback({
        text: t('ticketAttachments.downloadFailed'),
        isError: true,
      });
      return;
    }
    if (!path) return;
    setShouldOpen(false);
    open(path).catch(() =>
      setFeedback({ text: t('ticketAttachments.cannotOpen'), isError: true }),
    );
  }, [shouldOpen, path, failed, setFeedback, t]);

  const loading = shouldOpen && query.isFetching;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={t('ticketAttachments.open', {
        name: attachment.filename,
      })}
      accessibilityState={{ busy: loading }}
      onPress={() => {
        if (failed) query.refetch();
        setShouldOpen(true);
      }}
      style={styles.container}
    >
      <AttachmentChip
        attachment={{
          name: attachment.filename,
          size: attachment.sizeInKiloBytes,
          uri: null,
          type: attachment.mimeType,
        }}
        onBrand={onBrand}
        loading={loading}
      />
    </Pressable>
  );
};

const createStyles = ({ spacing }: Theme) =>
  StyleSheet.create({
    container: {
      marginTop: spacing[3],
    },
  });
