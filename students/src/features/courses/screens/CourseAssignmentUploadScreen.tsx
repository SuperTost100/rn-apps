import { useTranslation } from 'react-i18next';
import { ScrollView, StyleSheet } from 'react-native';
import { openCamera } from 'react-native-image-crop-picker';

import { faCamera, faFolderOpen } from '@fortawesome/free-solid-svg-icons';
import { useFeedbackContext } from '@polito/lib/core';
import { pdfSizes } from '@polito/lib/features/courses';
import {
  Card,
  Icon,
  List,
  ListItem,
  Text,
  Theme,
  useStylesheet,
  useTheme,
} from '@polito/lib/ui';
import {
  errorCodes,
  isErrorWithCode,
  keepLocalCopy,
  pick,
} from '@react-native-documents/picker';
import { NativeStackScreenProps } from '@react-navigation/native-stack';

import { TeachingStackParamList } from '../../teaching/components/TeachingNavigator';
import { useCameraErrorHandler } from '../hooks/useCameraErrorHandler';
import { Assignment } from '../types/Assignment';

type Props = NativeStackScreenProps<
  TeachingStackParamList,
  'CourseAssignmentUpload'
>;

/**
 * The first step of an upload: pick a file from the phone or the cloud, or
 * scan pages into a PDF with the camera. A file that cannot be read or a
 * camera without permission says so instead of failing in silence.
 */
export const CourseAssignmentUploadScreen = ({ navigation, route }: Props) => {
  const { courseId } = route.params;
  const { t } = useTranslation();
  const { colors, controls } = useTheme();
  const styles = useStylesheet(createStyles);
  const { setFeedback } = useFeedbackContext();
  const onCameraError = useCameraErrorHandler();

  const handlePickedFile = (file: Assignment) => {
    navigation.navigate('CourseAssignmentUploadConfirmation', {
      courseId,
      file,
    });
  };

  const pickFile = async () => {
    try {
      const [response] = await pick();
      const [localCopy] = await keepLocalCopy({
        files: [{ uri: response.uri, fileName: response.name || '' }],
        destination: 'cachesDirectory',
      });
      if (localCopy.status !== 'success') {
        throw new Error(localCopy.copyError ?? 'File copy failed');
      }
      handlePickedFile({
        uri: localCopy.localUri,
        name: response.name || '',
        size: response.size || 0,
        type: response.type || '',
      });
    } catch (e) {
      if (isErrorWithCode(e) && e.code === errorCodes.OPERATION_CANCELED) {
        return;
      }
      console.error(e);
      setFeedback({
        text: t('course.upload.pickFailed'),
        isError: true,
      });
    }
  };

  const scan = async () => {
    try {
      const image = await openCamera({
        ...pdfSizes,
        mediaType: 'photo',
        cropping: true,
        freeStyleCropEnabled: true,
      });
      navigation.navigate('CourseAssignmentPdfCreation', {
        courseId,
        firstImageUri: image.path,
      });
    } catch (e) {
      onCameraError(e);
    }
  };

  const iconProps = { size: controls.iconSize, color: colors.secondaryText };

  return (
    <ScrollView contentInsetAdjustmentBehavior="automatic">
      <Text variant="secondaryText" style={styles.intro}>
        {t('course.upload.intro')}
      </Text>
      <Card>
        <List>
          <ListItem
            isAction
            title={t('courseAssignmentUploadScreen.ctaUploadFile')}
            subtitle={t('courseAssignmentUploadScreen.ctaUploadFileSubtitle')}
            leadingItem={<Icon icon={faFolderOpen} {...iconProps} />}
            onPress={pickFile}
          />
          <ListItem
            isAction
            title={t('courseAssignmentUploadScreen.ctaCreatePDF')}
            subtitle={t('courseAssignmentUploadScreen.ctaCreatePDFSubtitle')}
            leadingItem={<Icon icon={faCamera} {...iconProps} />}
            onPress={scan}
          />
        </List>
      </Card>
    </ScrollView>
  );
};

const createStyles = ({ layout, spacing }: Theme) =>
  StyleSheet.create({
    intro: {
      paddingHorizontal: layout.gutter,
      paddingTop: spacing[4],
      paddingBottom: spacing[1],
    },
  });
