import { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Alert, View } from 'react-native';

import { DateTime } from 'luxon';
import useLatestCallback from 'use-latest-callback';

import {
  AuthenticatorPrivKey,
  MfaChallenge,
  useAppState,
  useFeedbackContext,
  usePolitoAppMfaPrivateKeyKeychain,
} from '../../../core';
import { CtaButton, Text, useStylesheet } from '../../../ui';
import { useMfaAuth } from '../queries/authHooks';
import { signSecp256k1 } from '../utils/crypto';
import { createStyles } from './MfaEnrollContent';
import { RTFTrans } from './RTFTrans';

export type MfaAuthContentProps = {
  challenge: MfaChallenge;
  onClose: () => void;
  onMissingKey: () => void;
  onFinalized?: () => void;
};

export const MfaAuthContent = ({
  challenge,
  onClose,
  onMissingKey,
  onFinalized,
}: MfaAuthContentProps) => {
  const { t } = useTranslation();

  const { challenge: nonce } = challenge;
  const expiryMs = challenge?.expirationTs
    ? new Date(challenge.expirationTs).getTime()
    : 0;

  const calcSeconds = useCallback(
    () => Math.max(Math.ceil((expiryMs - Date.now()) / 1000), 0),
    [expiryMs],
  );

  const [remainingSeconds, setRemainingSeconds] = useState(calcSeconds);

  const formattedTime = useMemo(() => {
    const mis = Math.floor(remainingSeconds / 60);
    const secs = (remainingSeconds % 60).toString().padStart(2, '0');
    return `${mis}:${secs}`;
  }, [remainingSeconds]);
  const styles = useStylesheet(createStyles);
  const { mutateAsync: verifyMfa, isPending } = useMfaAuth();
  const { getPrivateKeyMFA, hasPrivateKeyMFA, resetPrivateKeyMFA } =
    usePolitoAppMfaPrivateKeyKeychain();
  const appState = useAppState();
  const [authPk, setAuthPk] = useState<
    AuthenticatorPrivKey | null | undefined
  >();
  const { setFeedback } = useFeedbackContext();
  const handleClose = useLatestCallback(onClose);
  const handleMissingKey = useLatestCallback(onMissingKey);
  const handleFinalized = useLatestCallback(() => onFinalized?.());

  const finalizeAuth = useCallback(
    (feedbackLabel: string, success: boolean) => {
      handleFinalized();
      setFeedback({
        text: success ? t(feedbackLabel) : t('mfaScreen.auth.failed'),
        isPersistent: false,
      });
      handleClose();
    },
    [handleClose, handleFinalized, setFeedback, t],
  );

  useEffect(() => {
    let cancelled = false;
    const tick = () => {
      if (cancelled) return;
      const newSeconds = calcSeconds();
      setRemainingSeconds(newSeconds);
      if (newSeconds <= 0) {
        finalizeAuth('mfaScreen.auth.expired', true);
      } else {
        setTimeout(tick, 1000);
      }
    };
    tick();
    return () => {
      cancelled = true;
    };
  }, [expiryMs, calcSeconds, finalizeAuth]);

  useEffect(() => {
    if (authPk || appState !== 'active') return;

    const fetchPrivateKey = async () => {
      try {
        const secret = await getPrivateKeyMFA({
          title: t('mfaScreen.biometricPrompt'),
        });
        if (secret) {
          setAuthPk(AuthenticatorPrivKey.fromJSON(secret));
        } else {
          await resetPrivateKeyMFA();
          throw new Error('Invalid PK');
        }
      } catch (err) {
        console.error(err);
        const hasKey = await hasPrivateKeyMFA();
        if (!hasKey) {
          Alert.alert(
            t('common.error'),
            t('mfaScreen.settings.notAccessibleAlert'),
            [
              {
                text: t('common.ok'),
                onPress: handleMissingKey,
              },
            ],
          );
        } else {
          Alert.alert(t('common.error'), t('mfaScreen.auth.unlockDismissed'));
        }
        handleClose();
      }
    };
    fetchPrivateKey().catch(console.error);
  }, [
    t,
    authPk,
    appState,
    getPrivateKeyMFA,
    resetPrivateKeyMFA,
    hasPrivateKeyMFA,
    handleClose,
    handleMissingKey,
  ]);

  const onNo = async () => {
    if (!authPk) return;
    const signature = signSecp256k1(nonce, authPk, true);
    const success = await verifyMfa({
      decline: true,
      serial: authPk.serial,
      nonce,
      signature,
    });
    finalizeAuth('mfaScreen.auth.rejected', success);
  };

  const onYes = async () => {
    if (!authPk) return;
    let success = false;
    try {
      const signature = signSecp256k1(nonce, authPk);
      success = await verifyMfa({
        serial: authPk.serial,
        nonce,
        signature,
      });
    } catch (err) {
      Alert.alert(t('common.error'));
    }
    finalizeAuth('mfaScreen.auth.accepted', success);
  };

  // When the login asked for approval: the challenge carries it
  const requestedAt = challenge.requestTs
    ? DateTime.fromJSDate(new Date(challenge.requestTs)).toLocaleString(
        DateTime.TIME_SIMPLE,
      )
    : undefined;

  return (
    <View style={styles.body}>
      <Text variant="cardTitle" role="heading" style={styles.center}>
        {t('mfaScreen.auth.prompt')}
      </Text>
      {requestedAt && (
        <Text variant="secondaryText" style={styles.center}>
          {t('auth.mfaRequestedAt', { time: requestedAt })}
        </Text>
      )}
      <Text
        variant="secondaryText"
        weight="semibold"
        style={styles.center}
        accessibilityLiveRegion="none"
      >
        {t('mfaScreen.auth.expiration', { time: formattedTime })}
      </Text>
      <View style={styles.buttons}>
        <CtaButton
          absolute={false}
          title={t('mfaScreen.auth.allow')}
          action={onYes}
          disabled={isPending}
          loading={isPending}
          containerStyle={styles.button}
        />
        <CtaButton
          absolute={false}
          title={t('mfaScreen.auth.denyAccess')}
          action={onNo}
          variant="outlined"
          destructive
          disabled={isPending}
          containerStyle={styles.button}
        />
      </View>
      <RTFTrans
        variant="secondaryText"
        style={styles.center}
        i18nKey="mfaScreen.auth.note"
      />
    </View>
  );
};
