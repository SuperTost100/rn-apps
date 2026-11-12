import {
  PropsWithChildren,
  ReactElement,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { useTranslation } from 'react-i18next';
import { AccessibilityInfo, StyleSheet, View } from 'react-native';

import { faSlash, faWifi } from '@fortawesome/free-solid-svg-icons';
import { HeaderHeightContext } from '@react-navigation/elements';
import { onlineManager } from '@tanstack/react-query';

import { DateTime } from 'luxon';

import {
  ScreenRegionState,
  ScreenStatesContext,
} from '../../core/contexts/ScreenStatesContext';
import { useIsOnline } from '../../core/hooks/useOfflineDisabled';
import { APP_TIMEZONE } from '../../core/utils/dates';
import { useStylesheet } from '../hooks/useStylesheet';
import { useTheme } from '../hooks/useTheme';
import { Theme } from '../types/Theme';
import { Icon } from './Icon';
import { Text } from './Text';

/** The time the phone last went offline that a banner announced */
let announcedOfflineSince: number | undefined;
let offlineSince: number | undefined = onlineManager.isOnline()
  ? undefined
  : Date.now();
onlineManager.subscribe(isOnline => {
  offlineSince = isOnline ? undefined : Date.now();
});

/** "09:12" today, "10 Nov, 09:12" on another day */
export const useSavedAtText = (updatedAt?: number) => {
  const { t, i18n } = useTranslation();
  if (!updatedAt) return { time: undefined, label: undefined };
  const saved = DateTime.fromMillis(updatedAt, { zone: APP_TIMEZONE });
  const time = saved.toFormat('HH:mm');
  const sameDay = saved.hasSame(DateTime.now().setZone(APP_TIMEZONE), 'day');
  return {
    time,
    label: sameDay
      ? time
      : t('states.savedOnDay', {
          date: saved.setLocale(i18n.language).toFormat('d LLL'),
          time,
        }),
  };
};

const OfflineIcon = ({ color }: { color: string }) => (
  <View style={{ width: 20, height: 20 }}>
    <Icon icon={faWifi} size={20} color={color} />
    <Icon
      icon={faSlash}
      size={20}
      color={color}
      style={StyleSheet.absoluteFillObject as any}
    />
  </View>
);

interface OfflineBannerProps {
  /** When the oldest data on the screen was fetched (ms) */
  updatedAt?: number;
}

/**
 * The slim grey banner under the header while the phone is offline:
 * "Offline. Showing what was saved at 09:12." Screen readers hear it once
 * each time the phone goes offline, not once per screen.
 */
export const OfflineBanner = ({ updatedAt }: OfflineBannerProps) => {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const styles = useStylesheet(createStyles);
  const { label } = useSavedAtText(updatedAt);
  const text = label
    ? t('states.offlineBanner', { time: label })
    : t('states.offlineBannerNoTime');

  useEffect(() => {
    if (offlineSince === undefined || announcedOfflineSince === offlineSince)
      return;
    announcedOfflineSince = offlineSince;
    AccessibilityInfo.announceForAccessibility(text);
  }, [text]);

  return (
    <View
      style={styles.banner}
      accessible={true}
      accessibilityRole="text"
      accessibilityLabel={text}
    >
      <OfflineIcon color={colors.neutralChipText} />
      <Text variant="secondaryText" style={styles.text}>
        {text}
      </Text>
    </View>
  );
};

/**
 * Wraps one screen of a stack: the offline banner under the header, once
 * per screen, fed by the regions of the screen (useQueryStates). The banner
 * hides when no region has data to show, because each region then says it
 * is offline itself. Pass it to a stack navigator as `screenLayout`.
 */
export const OfflineScreenLayout = ({
  children,
  headerTransparent = false,
}: PropsWithChildren<{
  /** The header floats over the content (iOS): the banner goes below it */
  headerTransparent?: boolean;
}>) => {
  const headerHeight = useContext(HeaderHeightContext) ?? 0;
  const isOnline = useIsOnline();
  const [regions, setRegions] = useState<Record<string, ScreenRegionState>>({});
  const report = useCallback(
    (id: string, state: ScreenRegionState | null) =>
      setRegions(prev => {
        const old = prev[id];
        if (state === null) {
          if (!old) return prev;
          const rest = { ...prev };
          delete rest[id];
          return rest;
        }
        if (
          old &&
          old.hasData === state.hasData &&
          old.updatedAt === state.updatedAt
        )
          return prev;
        return { ...prev, [id]: state };
      }),
    [],
  );
  const list = Object.values(regions);
  const withData = list.filter(r => r.hasData);
  // Screens that do not report (not converted yet) still get the banner
  const showBanner = !isOnline && (list.length === 0 || withData.length > 0);
  const times = withData.map(r => r.updatedAt).filter((u): u is number => !!u);
  const oldest = times.length ? Math.min(...times) : undefined;
  const context = useMemo(
    () => ({ report, isBannerVisible: showBanner }),
    [report, showBanner],
  );

  return (
    <ScreenStatesContext.Provider value={context}>
      <View style={{ flex: 1 }}>
        {showBanner && (
          <View style={headerTransparent && { marginTop: headerHeight }}>
            <OfflineBanner updatedAt={oldest} />
          </View>
        )}
        <View style={{ flex: 1 }}>{children}</View>
      </View>
    </ScreenStatesContext.Provider>
  );
};

/** For a navigator's `screenLayout` prop */
export const offlineScreenLayout = ({
  children,
  options,
}: {
  children: ReactElement;
  options: { headerTransparent?: boolean };
}) => (
  <OfflineScreenLayout headerTransparent={!!options.headerTransparent}>
    {children}
  </OfflineScreenLayout>
);

const createStyles = ({ colors, spacing, layout }: Theme) =>
  StyleSheet.create({
    banner: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing[3],
      minHeight: 40,
      paddingVertical: spacing[2],
      paddingHorizontal: layout.gutter,
      backgroundColor: colors.neutralChipBg,
    },
    text: {
      flex: 1,
      color: colors.neutralChipText,
    },
  });
