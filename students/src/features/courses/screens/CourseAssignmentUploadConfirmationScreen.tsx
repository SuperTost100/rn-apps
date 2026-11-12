import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ScrollView, StyleSheet, View } from 'react-native';
import { Pdf } from 'react-native-pdf-light';

import { faUpload } from '@fortawesome/free-solid-svg-icons';
import { useFeedbackContext } from '@polito/lib/core';
import {
  CtaButton,
  FullWidthPicture,
  Text,
  TextField,
  Theme,
  useStylesheet,
} from '@polito/lib/ui';
import { NativeStackScreenProps } from '@react-navigation/native-stack';

import { useUploadAssignment } from '../../../core/queries/courseHooks';
import { TeachingStackParamList } from '../../teaching/components/TeachingNavigator';
import { formatSize } from '../utils/fileTree';

type Props = NativeStackScreenProps<
  TeachingStackParamList,
  'CourseAssignmentUploadConfirmation'
>;

const IMAGE = /\.(jpe?g|gif|png|heic)$/i;

/**
 * The second step of an upload: a description, a preview of the file and
 * the Upload button under them. An empty description is marked on the
 * field; a failed upload stays on this screen with the reason.
 */
export const CourseAssignmentUploadConfirmationScreen = ({
  navigation,
  route,
}: Props) => {
  const { courseId, file } = route.params;
  const { t } = useTranslation();
  const styles = useStylesheet(createStyles);
  const { mutateAsync: requestUpload } = useUploadAssignment(courseId);
  const { setFeedback } = useFeedbackContext();
  const [description, setDescription] = useState('');
  const [showError, setShowError] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const isPdf = file.uri.toLowerCase().endsWith('pdf');
  const isImage = IMAGE.test(file.uri);

  const upload = () => {
    if (!description.trim()) {
      setShowError(true);
      return;
    }
    setIsUploading(true);
    requestUpload({
      courseId,
      description: description.trim(),
      file: file as any as Blob,
    })
      .then(() => {
        setFeedback({
          text: t('courseAssignmentUploadConfirmationScreen.successFeedback'),
        });
        // Back to the course, past the upload screens
        const routes = navigation.getState().routes;
        const courseIndex = routes.map(r => r.name).lastIndexOf('Course');
        navigation.pop(Math.max(1, routes.length - 1 - courseIndex));
      })
      .catch((e: Error) => {
        setFeedback({
          text: t('course.upload.failed', { reason: e.message }),
          isError: true,
        });
      })
      .finally(() => setIsUploading(false));
  };

  return (
    <View style={styles.screen}>
      <View style={styles.form}>
        <TextField
          variant="boxed"
          label={t('courseAssignmentUploadConfirmationScreen.descriptionLabel')}
          autoFocus
          autoCorrect={false}
          autoCapitalize="sentences"
          value={description}
          onChangeText={value => {
            setDescription(value);
            if (value.trim()) setShowError(false);
          }}
          error={showError ? t('course.upload.descriptionMissing') : undefined}
          hint={t('course.upload.descriptionHint')}
        />
        <Text variant="secondaryText" numberOfLines={2}>
          {[file.name, file.size ? formatSize(file.size / 1024) : undefined]
            .filter(Boolean)
            .join(' · ')}
        </Text>
      </View>
      <View style={styles.preview}>
        {isPdf && <Pdf source={file.uri} />}
        {isImage && (
          <ScrollView
            contentInsetAdjustmentBehavior="automatic"
            automaticallyAdjustKeyboardInsets
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={styles.imageContainer}
          >
            <FullWidthPicture source={{ uri: file.uri }} />
          </ScrollView>
        )}
        {!isPdf && !isImage && (
          <Text variant="secondaryText" style={styles.noPreview}>
            {t('course.upload.noPreview')}
          </Text>
        )}
      </View>
      <CtaButton
        absolute={false}
        icon={faUpload}
        title={t('courseAssignmentUploadConfirmationScreen.ctaUpload')}
        action={upload}
        loading={isUploading}
        containerStyle={styles.button}
      />
    </View>
  );
};

const createStyles = ({ colors, layout, spacing }: Theme) =>
  StyleSheet.create({
    screen: {
      flex: 1,
    },
    form: {
      gap: spacing[2],
      paddingHorizontal: layout.gutter,
      paddingTop: spacing[4],
      paddingBottom: spacing[3],
      backgroundColor: colors.surface,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: colors.divider,
    },
    preview: {
      flex: 1,
    },
    imageContainer: {
      paddingVertical: spacing[5],
    },
    noPreview: {
      padding: layout.gutter,
    },
    button: {
      paddingHorizontal: layout.gutter,
      paddingVertical: spacing[3],
      backgroundColor: colors.surface,
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: colors.divider,
    },
  });
