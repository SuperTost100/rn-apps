import { ReactElement, useCallback, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  AccessibilityInfo,
  Alert,
  Platform,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';

import {
  PreferencesContextBase,
  useFeedbackContext,
  useOfflineDisabled,
  usePolitoAppMfaPrivateKeyKeychain,
  usePreferencesContext,
} from '@polito/lib/core';
import { useCheckMfa } from '@polito/lib/features/auth';
import {
  BottomBarSpacer,
  ListItem,
  OutlineIcon,
  OutlineIconName,
  OverviewList,
  SectionHeader,
  StatusChip,
  StatusChipTone,
  Text,
  type Theme,
  useStylesheet,
  useTextScale,
  useTheme,
} from '@polito/lib/ui';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { useDownloadsContext } from '~/core/contexts/DownloadsContext';
import { getFileDatabase } from '~/core/database/FileDatabase';
import { AppPreferences } from '~/core/types/preferences';

import i18next from 'i18next';
import { Settings } from 'luxon';

import { useConfirmationDialog } from '../../../core/hooks/useConfirmationDialog';
import { useVersionText } from '../../../core/hooks/useVersionText';
import { useUpdateDevicePreferences } from '../../../core/queries/studentHooks';
import { formatSize } from '../../courses/utils/fileTree';
import { OptionSheet } from '../components/OptionSheet';
import { UserStackParamList } from '../components/UserNavigator';

type Sheet = 'theme' | 'text' | 'language' | 'storage';

const TEXT_SIZES = [100, 125, 150, 175, 200] as const;
type TextSize = (typeof TEXT_SIZES)[number];

/** Languages in their own name, whatever the app's language */
const LANGUAGE_NAMES = { en: 'English', it: 'Italiano' } as const;

interface ValueRowProps {
  icon: OutlineIconName;
  title: string;
  /** The current value, on the right; under the title at large text */
  value?: string;
  /** A state chip instead of a value; it moves under the title at large text */
  chip?: ReactElement;
  chipLabel?: string;
  /** A line under the title, such as why the row is off */
  note?: string;
  onPress?: () => void;
  disabled?: boolean;
  accessibilityHint?: string;
}

/**
 * A settings row: the icon, the name, the current value and a chevron. At
 * 150% and above the value moves under the name, so the name never breaks.
 */
const ValueRow = ({
  icon,
  title,
  value,
  chip,
  chipLabel,
  note,
  onPress,
  disabled,
  accessibilityHint,
}: ValueRowProps) => {
  const styles = useStylesheet(createStyles);
  const { colors } = useTheme();
  const { isLarge } = useTextScale();
  const lines = [isLarge ? value : undefined, note].filter(Boolean);
  return (
    <ListItem
      title={title}
      titleProps={{ numberOfLines: 0 }}
      subtitle={lines.length ? lines.join('\n') : undefined}
      subtitleProps={{ numberOfLines: 0 }}
      leadingItem={<OutlineIcon name={icon} color={colors.secondaryText} />}
      trailingItem={
        !isLarge && value ? (
          <Text variant="secondaryText" style={styles.value}>
            {value}
          </Text>
        ) : undefined
      }
      chip={chip}
      chipLabel={chipLabel}
      showChevron
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={[`${title}: ${value ?? chipLabel ?? ''}`, note]
        .filter(Boolean)
        .join('. ')}
      accessibilityHint={accessibilityHint}
    />
  );
};

/** The authenticator's state as a word in a chip, and its tone */
const useAuthenticatorState = () => {
  const { t } = useTranslation();
  const { data: mfaStatus } = useCheckMfa(true);
  const { hasPrivateKeyMFA, resetPrivateKeyMFA } =
    usePolitoAppMfaPrivateKeyKeychain();
  const [localMfaKey, setLocalMfaKey] = useState<boolean>(false);

  useEffect(() => {
    hasPrivateKeyMFA().then(res => setLocalMfaKey(res));
  }, [hasPrivateKeyMFA, mfaStatus]);

  const handleKeyRemoval = useCallback(async () => {
    try {
      await resetPrivateKeyMFA();
      setLocalMfaKey(false);
      Alert.alert(
        t('profile.authenticatorRemoved.title'),
        t('profile.authenticatorRemoved.text'),
        [{ text: t('common.ok') }],
      );
    } catch (error) {
      console.error('Error removing MFA key:', error);
    }
  }, [resetPrivateKeyMFA, t]);

  // A key the server no longer knows (removed from MFA management) goes
  useEffect(() => {
    if (
      (mfaStatus?.status === 'available' ||
        mfaStatus?.status === 'needsReauth') &&
      localMfaKey
    ) {
      handleKeyRemoval();
    }
  }, [mfaStatus?.status, localMfaKey, handleKeyRemoval]);

  let state: { label: string; tone: StatusChipTone };
  if (mfaStatus?.status === 'active' && localMfaKey) {
    state = { label: t('mfaScreen.settings.active'), tone: 'success' };
  } else if (mfaStatus?.status === 'locked') {
    state = { label: t('mfaScreen.settings.locked'), tone: 'warning' };
  } else if (
    mfaStatus?.status === 'available' ||
    mfaStatus?.status === 'needsReauth'
  ) {
    state = { label: t('mfaScreen.settings.disabled'), tone: 'neutral' };
  } else {
    state = { label: t('common.error'), tone: 'danger' };
  }
  return { isAvailable: mfaStatus?.status !== 'unavailable', state };
};

/**
 * Downloaded files: their size, and a row that removes them all after
 * asking, saying how much it frees
 */
const RemoveFilesRow = () => {
  const { t } = useTranslation();
  const { language } = usePreferencesContext<AppPreferences>();
  const { setFeedback } = useFeedbackContext();
  const {
    getCoursesCachePath,
    removeFileFromStorage,
    deleteLocalPath,
    cacheSizeVersion,
    refreshCacheVersion,
    isAnyDownloadInProgress,
  } = useDownloadsContext();
  const filesCache = getCoursesCachePath();
  const [cacheSize, setCacheSize] = useState<number>();
  const fileDatabaseRef = useRef(getFileDatabase());

  const refreshSize = useCallback(() => {
    fileDatabaseRef.current
      .getTotalSize()
      .then(size => {
        setCacheSize(size);
      })
      .catch(() => {
        setCacheSize(undefined);
      });
  }, []);

  useEffect(() => {
    refreshSize();
  }, [cacheSizeVersion, refreshSize]);

  useFocusEffect(
    useCallback(() => {
      refreshSize();
    }, [refreshSize]),
  );

  const size = cacheSize ? formatSize(cacheSize, language) : undefined;
  const confirm = useConfirmationDialog({
    title: t('profile.settings.removeFilesTitle'),
    message: t('profile.settings.removeFilesText', { size }),
    confirmText: t('profile.settings.removeFilesAction'),
    cancelText: t('profile.settings.keepFiles'),
  });

  const remove = async () => {
    if (!filesCache || !(await confirm())) return;
    try {
      const allFiles = await fileDatabaseRef.current.getAllFiles();
      await Promise.all(
        allFiles.map(f => removeFileFromStorage(f.path).catch(() => {})),
      );
      await fileDatabaseRef.current.deleteAllFiles();
      await deleteLocalPath(filesCache).catch(() => {});
      refreshCacheVersion();
      setFeedback({
        text: t('profile.settings.filesRemoved'),
        isPersistent: false,
      });
      refreshSize();
    } catch {
      setFeedback({ text: t('profile.settings.removeFailed'), isError: true });
    }
  };

  return (
    <ValueRow
      icon="trash"
      title={t('profile.settings.removeFiles')}
      value={
        cacheSize === undefined ? '--' : (size ?? t('profile.settings.noFiles'))
      }
      note={
        isAnyDownloadInProgress ? t('profile.settings.downloading') : undefined
      }
      disabled={cacheSize === 0 || isAnyDownloadInProgress}
      onPress={remove}
    />
  );
};

/**
 * Where downloaded files go: the app's own storage, or a folder the student
 * picks, which empties the downloads first as before
 */
const useStorageLocation = () => {
  const { t } = useTranslation();
  const {
    fileStorageLocation,
    customStoragePath,
    customStorageDisplayPath,
    updatePreference,
  } = usePreferencesContext<AppPreferences>();
  const { setFeedback } = useFeedbackContext();
  const { pickStorageFolder, removeFileFromStorage } = useDownloadsContext();
  const [isMoving, setIsMoving] = useState(false);
  const currentLocation =
    fileStorageLocation === 'custom' ? 'custom' : 'internal';
  const confirmStorageChange = useConfirmationDialog({
    title: t('settingsScreen.storageChangeConfirmTitle'),
    message: t('settingsScreen.storageChangeConfirmMessage'),
  });

  const handlePickDirectory = useCallback(async () => {
    if (!(await confirmStorageChange())) return;
    try {
      const result = await pickStorageFolder();

      setIsMoving(true);
      setFeedback({ text: t('settingsScreen.storageChanging') });

      try {
        const fileDatabase = getFileDatabase();
        const allFiles = await fileDatabase.getAllFiles();
        await Promise.all(
          allFiles.map(f => removeFileFromStorage(f.path).catch(() => {})),
        );
        await fileDatabase.deleteAllFiles();
      } catch (deleteError) {
        console.error('Error removing files before switch:', deleteError);
      }

      updatePreference('customStoragePath', result.uri);
      updatePreference('customStorageDisplayPath', result.displayPath);
      updatePreference('fileStorageLocation', 'custom');
      setFeedback({ text: t('settingsScreen.storageCustomSet') });
    } catch (error: any) {
      if (error?.code !== 'CANCELLED') {
        console.error('Error picking directory:', error);
        setFeedback({ text: t('common.error'), isError: true });
      }
    } finally {
      setIsMoving(false);
    }
  }, [
    confirmStorageChange,
    updatePreference,
    setFeedback,
    t,
    pickStorageFolder,
    removeFileFromStorage,
  ]);

  const handleSwitchToInternal = useCallback(async () => {
    if (!customStoragePath) {
      updatePreference('fileStorageLocation', 'internal');
      return;
    }
    if (!(await confirmStorageChange())) return;

    setIsMoving(true);
    setFeedback({ text: t('settingsScreen.storageChanging') });

    try {
      const fileDatabase = getFileDatabase();
      const allFiles = await fileDatabase.getAllFiles();
      await Promise.all(
        allFiles.map(f => removeFileFromStorage(f.path).catch(() => {})),
      );
      await fileDatabase.deleteAllFiles();
    } catch (deleteError) {
      console.error('Error removing files before switch:', deleteError);
    } finally {
      setIsMoving(false);
    }

    updatePreference('fileStorageLocation', 'internal');
    setFeedback({ text: t('settingsScreen.storageInternalSet') });
  }, [
    customStoragePath,
    confirmStorageChange,
    updatePreference,
    setFeedback,
    t,
    removeFileFromStorage,
  ]);

  const change = useCallback(
    async (newLocation: 'internal' | 'custom') => {
      if (newLocation === currentLocation || isMoving) return;
      if (newLocation === 'custom') {
        await handlePickDirectory();
      } else {
        await handleSwitchToInternal();
      }
    },
    [currentLocation, isMoving, handlePickDirectory, handleSwitchToInternal],
  );

  const value =
    currentLocation === 'custom'
      ? (customStorageDisplayPath ?? t('profile.settings.storageFolder'))
      : t('profile.settings.storageApp');

  return { currentLocation, value, isMoving, change };
};

/**
 * Settings as one grouped list: how the app looks, then security and
 * storage. Each row shows its current value and opens its choices.
 */
export const SettingsScreen = () => {
  const { t } = useTranslation();
  const styles = useStylesheet(createStyles);
  const navigation =
    useNavigation<NativeStackNavigationProp<UserStackParamList>>();
  const { colorScheme, language, accessibility, updatePreference } =
    usePreferencesContext<AppPreferences>();
  const { mutate: updateDevicePreferences } = useUpdateDevicePreferences();
  const isOffline = useOfflineDisabled();
  const authenticator = useAuthenticatorState();
  const storage = useStorageLocation();
  const versionText = useVersionText();
  const [sheet, setSheet] = useState<Sheet | null>(null);
  const closeSheet = () => setSheet(null);

  const textSize = (Number(accessibility?.fontSize) || 100) as TextSize;
  const textSizeLabel = (size: TextSize) =>
    size === 100 ? t('profile.settings.textDefault') : `${size}%`;
  const spacingCount = [
    accessibility?.lineHeight,
    accessibility?.paragraphSpacing,
    accessibility?.wordSpacing,
  ].filter(Boolean).length;

  const setLanguage = (lang: 'it' | 'en') => {
    if (lang === language) return;
    updateDevicePreferences({ updatePreferencesRequest: { language: lang } });
    updatePreference('language', lang);
    i18next.changeLanguage(lang).then(() => (Settings.defaultLocale = lang));
  };

  return (
    <>
      <ScrollView contentInsetAdjustmentBehavior="automatic">
        <View style={styles.first}>
          <SectionHeader title={t('profile.settings.look')} />
          <OverviewList>
            <ValueRow
              icon="theme"
              title={t('common.theme')}
              value={t(`theme.${colorScheme}`)}
              onPress={() => setSheet('theme')}
            />
            <ValueRow
              icon="text"
              title={t('profile.settings.textSize')}
              value={textSizeLabel(textSize)}
              onPress={() => setSheet('text')}
            />
            <ValueRow
              icon="file"
              title={t('accessibilitySettingsScreen.customFontSectionTitle')}
              value={
                spacingCount
                  ? t('profile.settings.spacingOn', { count: spacingCount })
                  : t('profile.settings.spacingOff')
              }
              onPress={() => navigation.navigate('AccessibilitySettings')}
            />
            <ValueRow
              icon="globe"
              title={t('common.language')}
              value={LANGUAGE_NAMES[language]}
              // The server sends notifications in this language: changing it
              // needs a connection
              note={
                isOffline ? t('profile.settings.languageOffline') : undefined
              }
              disabled={isOffline}
              onPress={() => setSheet('language')}
            />
          </OverviewList>
        </View>
        <View style={styles.section}>
          <SectionHeader title={t('profile.settings.securityAndStorage')} />
          <OverviewList>
            {authenticator.isAvailable && (
              <ValueRow
                icon="shield"
                title={t('settingsScreen.authenticatorTitle')}
                chip={
                  <StatusChip
                    label={authenticator.state.label}
                    tone={authenticator.state.tone}
                  />
                }
                chipLabel={authenticator.state.label}
                onPress={() => navigation.navigate('MfaSettings')}
              />
            )}
            {Platform.OS === 'android' && (
              <ValueRow
                icon="hdd"
                title={t('settingsScreen.storageTitle')}
                value={storage.value}
                disabled={storage.isMoving}
                onPress={() => setSheet('storage')}
              />
            )}
            <RemoveFilesRow />
          </OverviewList>
        </View>
        <Text variant="secondaryText" style={styles.version}>
          {versionText}
        </Text>
        <BottomBarSpacer />
      </ScrollView>

      <OptionSheet
        visible={sheet === 'theme'}
        title={t('common.theme')}
        options={(['system', 'light', 'dark'] as const).map(value => ({
          value,
          label: t(`theme.${value}`),
        }))}
        value={colorScheme}
        onPick={value => {
          updatePreference(
            'colorScheme',
            value as PreferencesContextBase<AppPreferences>['colorScheme'],
          );
          AccessibilityInfo.announceForAccessibility(
            `${t('common.theme')}: ${t(`theme.${value}`)}`,
          );
        }}
        onClose={closeSheet}
        note={t('profile.settings.themeNote')}
      />
      <OptionSheet
        visible={sheet === 'text'}
        title={t('profile.settings.textSize')}
        options={TEXT_SIZES.map(value => ({
          value,
          label: textSizeLabel(value),
        }))}
        value={textSize}
        onPick={value => {
          updatePreference('accessibility', {
            ...accessibility,
            fontSize: value,
          });
          AccessibilityInfo.announceForAccessibility(
            `${t('profile.settings.textSize')}: ${textSizeLabel(value)}`,
          );
        }}
        onClose={closeSheet}
        note={t('profile.settings.textNote')}
      />
      <OptionSheet
        visible={sheet === 'language'}
        title={t('common.language')}
        options={(['en', 'it'] as const).map(value => ({
          value,
          label: LANGUAGE_NAMES[value],
        }))}
        value={language}
        onPick={setLanguage}
        onClose={closeSheet}
      />
      <OptionSheet
        visible={sheet === 'storage'}
        title={t('settingsScreen.storageTitle')}
        options={[
          { value: 'internal', label: t('profile.settings.storageApp') },
          { value: 'custom', label: t('profile.settings.storageFolder') },
        ]}
        value={storage.currentLocation}
        onPick={value => storage.change(value as 'internal' | 'custom')}
        onClose={closeSheet}
        note={
          storage.currentLocation === 'custom'
            ? t('settingsScreen.storageCustomDescription')
            : t('settingsScreen.storageInternalDescription')
        }
      />
    </>
  );
};

const createStyles = ({ colors, layout, spacing }: Theme) =>
  StyleSheet.create({
    first: {
      marginTop: spacing[4],
    },
    section: {
      marginTop: layout.sectionGap,
    },
    value: {
      color: colors.secondaryText,
      textAlign: 'right',
    },
    version: {
      paddingHorizontal: layout.gutter,
      marginTop: spacing[6],
    },
  });
