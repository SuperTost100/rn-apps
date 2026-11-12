import { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useFocusEffect } from '@react-navigation/native';

import {
  usePolitoAppMfaPrivateKeyKeychain,
  usePreferencesContext,
} from '../../../core';
import {
  Card,
  CtaButton,
  InfoMessage,
  ListItem,
  OverviewList,
  SectionHeader,
  StatusChip,
  StatusChipTone,
  type Theme,
  useStylesheet,
  useTheme,
} from '../../../ui';
import { useCheckMfa, useLogout } from '../queries/authHooks';
import { RTFTrans } from './RTFTrans';

export type MfaSettingsProps = {
  onEnroll: () => void;
};

export const MfaSettings = ({ onEnroll }: MfaSettingsProps) => {
  const { t } = useTranslation();
  const styles = useStylesheet(createStyles);
  const { colors, spacing } = useTheme();
  const { data: mfa, refetch: refetchMfa } = useCheckMfa(true);
  const { hasPrivateKeyMFA } = usePolitoAppMfaPrivateKeyKeychain();
  const { mutate: logout } = useLogout();
  const { politoAuthnEnrolmentStatus, updatePreference } =
    usePreferencesContext();
  const [hasLocalMfaKey, setHasLocalMfaKey] = useState<boolean>(false);
  const { bottom } = useSafeAreaInsets();

  useFocusEffect(
    useCallback(() => {
      refetchMfa();
    }, [refetchMfa]),
  );

  useEffect(() => {
    hasPrivateKeyMFA().then(res => setHasLocalMfaKey(res));
  }, [hasPrivateKeyMFA, mfa]);

  const status: { label: string; tone: StatusChipTone } =
    mfa?.status === 'available' || mfa?.status === 'needsReauth'
      ? { label: t('mfaScreen.settings.disabled'), tone: 'neutral' }
      : mfa?.status === 'locked'
        ? { label: t('mfaScreen.settings.locked'), tone: 'warning' }
        : hasLocalMfaKey
          ? { label: t('mfaScreen.settings.active'), tone: 'success' }
          : { label: t('common.error'), tone: 'danger' };

  const showDetails =
    mfa?.status !== 'locked' &&
    (hasLocalMfaKey ||
      mfa?.status === 'available' ||
      mfa?.status === 'needsReauth');
  const errorKey =
    mfa?.status === 'locked'
      ? 'mfaScreen.settings.lockedDescription'
      : (mfa?.status !== 'active' &&
            mfa?.status !== 'available' &&
            mfa?.status !== 'needsReauth') ||
          (mfa?.status === 'active' && !hasLocalMfaKey)
        ? 'mfaScreen.settings.notAccessible'
        : undefined;
  const showAction =
    (mfa?.status !== 'active' && mfa?.status !== 'locked') ||
    (mfa?.status === 'active' && !hasLocalMfaKey);
  const serial = mfa?.details?.serial;
  const deviceName =
    politoAuthnEnrolmentStatus?.insertedDeviceName ?? mfa?.details?.description;

  return (
    <ScrollView contentInsetAdjustmentBehavior="automatic">
      <View style={styles.first}>
        <SectionHeader title={t('mfaScreen.settings.details')} />
        <OverviewList>
          <ListItem
            title={t('mfaScreen.settings.status')}
            chip={<StatusChip label={status.label} tone={status.tone} />}
            chipLabel={status.label}
          />
          {showDetails && (
            <ListItem
              inverted
              title={serial ?? t('mfaScreen.settings.none')}
              titleProps={{ numberOfLines: 0 }}
              subtitle={t('mfaScreen.serial')}
              accessibilityLabel={`${t('mfaScreen.serial')}: ${serial ?? t('mfaScreen.settings.none')}`}
              titleStyle={!serial && { color: colors.secondaryText }}
            />
          )}
          {showDetails && (
            <ListItem
              inverted
              title={deviceName ?? t('mfaScreen.settings.notSet')}
              titleProps={{ numberOfLines: 0 }}
              subtitle={t('mfaScreen.enroll.deviceName')}
              accessibilityLabel={`${t('mfaScreen.enroll.deviceName')}: ${deviceName ?? t('mfaScreen.settings.notSet')}`}
              titleStyle={!deviceName && { color: colors.secondaryText }}
            />
          )}
        </OverviewList>
        {errorKey && (
          <InfoMessage variant="error" style={styles.note}>
            <RTFTrans
              variant="secondaryText"
              style={{ color: colors.dangerText }}
              i18nKey={errorKey}
            />
          </InfoMessage>
        )}
        {showAction && (
          <CtaButton
            absolute={false}
            title={
              mfa?.status === 'available' || mfa?.status === 'needsReauth'
                ? t('mfaScreen.settings.enableNow')
                : t('mfaScreen.settings.correctError')
            }
            action={() => {
              updatePreference('politoAuthnEnrolmentStatus', {
                ...politoAuthnEnrolmentStatus,
                inSettings: true,
              });
              if (
                mfa?.status === 'available' ||
                mfa?.status === 'needsReauth'
              ) {
                onEnroll();
              } else {
                logout();
              }
            }}
          />
        )}
      </View>
      <View style={styles.section}>
        <SectionHeader title={t('mfaScreen.settings.information')} />
        <Card padded>
          <RTFTrans i18nKey="mfaScreen.settings.description" />
        </Card>
      </View>
      <View style={{ height: bottom + spacing[8] }} />
    </ScrollView>
  );
};

const createStyles = ({ layout, spacing }: Theme) =>
  StyleSheet.create({
    first: {
      marginTop: spacing[4],
    },
    section: {
      marginTop: layout.sectionGap,
    },
    note: {
      marginHorizontal: layout.gutter,
      marginTop: spacing[2],
    },
  });
