import { useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { Alert, Linking } from 'react-native';
import { openCamera, openPicker } from 'react-native-image-crop-picker';

import { useFeedbackContext } from '@polito/lib/core';
import { pdfSizes } from '@polito/lib/features/courses';
import {
  errorCodes,
  isErrorWithCode,
  pick,
  types,
} from '@react-native-documents/picker';

import { Attachment } from '../../services/types/Attachment';

/** The largest file a ticket or a reply takes, in bytes */
export const MAX_ATTACHMENT_BYTES = 32 * 1000 * 1000;

const FILE_TYPES = [
  types.pdf,
  types.images,
  types.video,
  types.zip,
  types.doc,
  types.docx,
  types.xlsx,
  types.xls,
];

export type AttachmentSource = 'file' | 'image' | 'camera';

const codeOf = (e: unknown) =>
  typeof e === 'object' && e && 'code' in e
    ? String((e as { code: unknown }).code)
    : undefined;

const photoName = (filename: string | null | undefined, mime: string) =>
  filename || `${Date.now()}.${mime.split('/')[1] || 'jpg'}`;

/**
 * Picks one attachment from files, the photo library or the camera. The size
 * limit applies to all three, a closed picker does nothing, a denied
 * permission says where to allow it, and any other failure says so.
 */
export const useAttachmentPicker = (
  onPicked: (attachment: Attachment) => void,
) => {
  const { t } = useTranslation();
  const { setFeedback } = useFeedbackContext();

  const accept = useCallback(
    (attachment: Attachment) => {
      if ((attachment.size ?? 0) > MAX_ATTACHMENT_BYTES) {
        setFeedback({
          text: t('ticketAttachments.tooLarge', { name: attachment.name }),
          isError: true,
        });
        return;
      }
      onPicked(attachment);
    },
    [onPicked, setFeedback, t],
  );

  const explainDenied = useCallback(
    (source: 'image' | 'camera') =>
      Alert.alert(
        t(`ticketAttachments.${source}DeniedTitle`),
        t(`ticketAttachments.${source}DeniedText`),
        [
          { text: t('common.cancel'), style: 'cancel' },
          {
            text: t('ticketAttachments.openSettings'),
            onPress: () => Linking.openSettings(),
          },
        ],
      ),
    [t],
  );

  return useCallback(
    async (source: AttachmentSource) => {
      try {
        if (source === 'file') {
          const [res] = await pick({
            type: FILE_TYPES,
            allowMultiSelection: false,
          });
          if (!res?.uri) return;
          accept({
            uri: res.uri,
            name: res.name ?? t('common.unnamedFile'),
            size: res.size ?? 0,
            type: res.type ?? 'application/octet-stream',
          });
          return;
        }
        const picture =
          source === 'image'
            ? await openPicker({ mediaType: 'photo', multiple: false })
            : await openCamera({
                ...pdfSizes,
                mediaType: 'photo',
                multiple: false,
                cropping: true,
                freeStyleCropEnabled: true,
              });
        accept({
          uri: picture.path,
          name: photoName(picture.filename, picture.mime),
          size: picture.size,
          type: picture.mime,
        });
      } catch (e) {
        const code = codeOf(e);
        if (
          code === 'E_PICKER_CANCELLED' ||
          (isErrorWithCode(e) && e.code === errorCodes.OPERATION_CANCELED)
        ) {
          return;
        }
        if (code === 'E_NO_CAMERA_PERMISSION') {
          explainDenied('camera');
          return;
        }
        if (code === 'E_NO_LIBRARY_PERMISSION') {
          explainDenied('image');
          return;
        }
        console.error('Cannot attach the file', e);
        setFeedback({ text: t('ticketAttachments.failed'), isError: true });
      }
    },
    [accept, explainDenied, setFeedback, t],
  );
};
