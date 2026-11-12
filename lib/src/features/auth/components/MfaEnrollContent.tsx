import { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Alert, StyleSheet, View } from 'react-native';
import DeviceInfo from 'react-native-device-info';
import Animated, {
  useAnimatedKeyboard,
  useAnimatedStyle,
} from 'react-native-reanimated';

import { useQueryClient } from '@tanstack/react-query';

import useLatestCallback from 'use-latest-callback';

import {
  ApiError,
  useFeedbackContext,
  usePolitoAppMfaPrivateKeyKeychain,
  usePreferencesContext,
} from '../../../core';
import {
  CtaButton,
  TextField,
  type Theme,
  useSafeBottomBarHeight,
  useStylesheet,
} from '../../../ui';
import {
  MFA_STATUS_QUERY_KEY,
  useMfaEnrol,
  useSSOLoginInitiator,
} from '../queries/authHooks';
import { generateSecp256k1KeyPair } from '../utils/crypto';
import { RTFTrans } from './RTFTrans';

export type MfaEnrollContentProps = {
  onClose: () => void;
  onSettingsEnrollmentComplete: () => void;
};

export const MfaEnrollContent = ({
  onClose,
  onSettingsEnrollmentComplete,
}: MfaEnrollContentProps) => {
  const { t } = useTranslation();
  const { mutateAsync: enrolMfa } = useMfaEnrol();
  const { checkCanSavePrivateKeyMFA, savePrivateKeyMFA } =
    usePolitoAppMfaPrivateKeyKeychain();
  const queryClient = useQueryClient();
  const handleSSO = useSSOLoginInitiator();
  const { setFeedback } = useFeedbackContext();
  const [step, setStep] = useState(0);
  const { publicKey, privateKey } = generateSecp256k1KeyPair();
  const { politoAuthnEnrolmentStatus, updatePreference } =
    usePreferencesContext();
  const styles = useStylesheet(createStyles);
  const deviceId = DeviceInfo.getDeviceNameSync();
  const [deviceName, setDeviceName] = useState(deviceId);
  const [isLoading, setIsLoading] = useState(false);
  const handleClose = useLatestCallback(onClose);
  const handleSettingsEnrollmentComplete = useLatestCallback(
    onSettingsEnrollmentComplete,
  );
  const bottomBarHeight = useSafeBottomBarHeight();
  const keyboard = useAnimatedKeyboard();
  const animatedBottomPadding = useAnimatedStyle(() => ({
    paddingBottom: Math.max(keyboard.height.value, bottomBarHeight),
  }));

  const isAutoEnrollment =
    politoAuthnEnrolmentStatus?.inSettings === true &&
    politoAuthnEnrolmentStatus?.insertedDeviceName !== undefined &&
    politoAuthnEnrolmentStatus?.insertedDeviceName !== '';

  const onNo = useCallback(() => {
    updatePreference('politoAuthnEnrolmentStatus', {
      ...politoAuthnEnrolmentStatus,
      hideInitialPrompt: true,
    });
    handleClose();
  }, [handleClose, politoAuthnEnrolmentStatus, updatePreference]);

  const executeEnrollment = useCallback(async () => {
    const dtoMfa = {
      description:
        politoAuthnEnrolmentStatus?.insertedDeviceName ??
        deviceName ??
        deviceId,
      pubkey: publicKey,
    };

    try {
      setIsLoading(true);
      const res = await enrolMfa(dtoMfa);
      await savePrivateKeyMFA(res.serial, privateKey, {
        title: t('mfaScreen.biometricPrompt'),
      });
      await queryClient.invalidateQueries({ queryKey: MFA_STATUS_QUERY_KEY });
      setFeedback({
        text: t('mfaScreen.enroll.Success'),
        isPersistent: false,
      });
      if (politoAuthnEnrolmentStatus?.inSettings === true) {
        handleSettingsEnrollmentComplete();
        updatePreference('politoAuthnEnrolmentStatus', {
          inSettings: false,
          insertedDeviceName: undefined,
          hideInitialPrompt: true,
        });
      }
    } catch (e) {
      console.error(e);
      if (e instanceof ApiError) {
        if (e.error === 'secureSessionExpired') {
          Alert.alert(t('common.warning'), t('mfaScreen.enroll.expired'), [
            {
              text: t('common.ok'),
              onPress: () => {
                updatePreference('politoAuthnEnrolmentStatus', {
                  inSettings: true,
                  insertedDeviceName: deviceName,
                  hideInitialPrompt: false,
                });
                handleSSO(true);
              },
            },
          ]);
          return;
        } else {
          Alert.alert(t('common.error'), t('common.somethingWentWrong'));
        }
      } else {
        Alert.alert(t('common.error'), t('mfaScreen.enroll.saveFailure'));
      }
    }
    setIsLoading(false);
    handleClose();
  }, [
    deviceName,
    deviceId,
    publicKey,
    enrolMfa,
    privateKey,
    t,
    queryClient,
    setFeedback,
    politoAuthnEnrolmentStatus,
    updatePreference,
    handleSSO,
    handleClose,
    handleSettingsEnrollmentComplete,
    savePrivateKeyMFA,
  ]);

  const onYes = useCallback(async () => {
    if (step === 0) {
      if (!(await checkCanSavePrivateKeyMFA())) {
        Alert.alert(t('common.error'), t('mfaScreen.enroll.unsupported'));
        handleClose();
        return;
      }
      setStep(s => s + 1);
      return;
    }

    await executeEnrollment();
  }, [step, t, handleClose, executeEnrollment, checkCanSavePrivateKeyMFA]);

  useEffect(() => {
    if (isAutoEnrollment && step === 0) {
      setDeviceName(politoAuthnEnrolmentStatus.insertedDeviceName || deviceId);
      setStep(1);
      executeEnrollment();
    }
  }, [
    isAutoEnrollment,
    step,
    politoAuthnEnrolmentStatus?.insertedDeviceName,
    executeEnrollment,
    deviceId,
  ]);

  if (step === 0)
    return (
      <View style={styles.body}>
        <RTFTrans
          variant="cardTitle"
          i18nKey="mfaScreen.enroll.prompt"
          style={styles.center}
        />
        <View style={styles.buttons}>
          <CtaButton
            absolute={false}
            title={t('mfaScreen.enroll.confirm')}
            action={onYes}
            loading={isLoading}
            containerStyle={styles.button}
          />
          <CtaButton
            absolute={false}
            title={t('mfaScreen.enroll.cancel')}
            action={onNo}
            variant="outlined"
            containerStyle={styles.button}
          />
        </View>
        <RTFTrans
          variant="secondaryText"
          i18nKey="mfaScreen.enroll.note"
          style={styles.center}
        />
      </View>
    );
  else
    return (
      <Animated.View style={[styles.body, animatedBottomPadding]}>
        <RTFTrans
          i18nKey="mfaScreen.enroll.devicePrompt"
          style={styles.center}
        />
        <TextField
          variant="boxed"
          label={t('mfaScreen.enroll.deviceName')}
          value={deviceName}
          onChangeText={setDeviceName}
          style={styles.field}
        />
        <CtaButton
          absolute={false}
          title={t('common.confirm')}
          action={onYes}
          containerStyle={styles.button}
          loading={isLoading}
          disabled={deviceName.length === 0}
        />
      </Animated.View>
    );
};

export const createStyles = ({ spacing }: Theme) =>
  StyleSheet.create({
    body: {
      width: '100%',
      maxWidth: 480,
      gap: spacing[4],
    },
    center: {
      textAlign: 'center',
    },
    buttons: {
      gap: spacing[3],
      marginTop: spacing[2],
    },
    button: {
      padding: 0,
    },
    field: {
      alignSelf: 'stretch',
    },
  });
