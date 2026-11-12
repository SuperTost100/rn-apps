import { ComponentProps, createContext, useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import { SystemBars, SystemBarsEntry } from 'react-native-edge-to-edge';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { faChevronLeft } from '@fortawesome/free-solid-svg-icons';
import { HeaderBackButton, getHeaderTitle } from '@react-navigation/elements';
import { NativeStackHeaderProps } from '@react-navigation/native-stack';

import { IS_IOS } from '../../core/constants';
import { useStylesheet } from '../hooks/useStylesheet';
import { useTheme } from '../hooks/useTheme';
import { Theme } from '../types/Theme';
import { Icon } from './Icon';
import { Text } from './Text';

/**
 * The colour of text and icons on the header around them, for header
 * controls that draw their own colours (undefined on native headers)
 */
export const HeaderForegroundContext = createContext<string | undefined>(
  undefined,
);

export interface AppHeaderProps extends Pick<
  NativeStackHeaderProps,
  'options' | 'route' | 'back'
> {
  navigation: NativeStackHeaderProps['navigation'] | { goBack(): void };
  /**
   * `root`: the navy header of a tab's first screen, with the large title.
   * `inner`: the surface header of the screens inside, with a back arrow.
   */
  variant: 'root' | 'inner';
  /** Lines the title may take before it ends with an ellipsis */
  titleLines?: number;
  /** A hairline under the header (off when a tab row follows) */
  hairline?: boolean;
}

/**
 * A header drawn in JS, for headers the native one cannot draw: titles that
 * follow the in-app text size and wrap. Pass it as the `header` option.
 */
export const AppHeader = ({
  options,
  route,
  back,
  navigation,
  variant,
  titleLines,
  hairline = variant === 'inner',
}: AppHeaderProps) => {
  const { colors } = useTheme();
  const styles = useStylesheet(createStyles);
  const { top } = useSafeAreaInsets();
  const isRoot = variant === 'root';
  const foreground = isRoot ? colors.onHeader : colors.title;
  const title = getHeaderTitle(options, route.name);
  const { headerTitle, headerRight, headerLeft } = options;

  useLightStatusBar(isRoot && 'addListener' in navigation ? navigation : null);

  return (
    <View
      style={[
        styles.container,
        isRoot ? styles.root : styles.inner,
        hairline && styles.hairline,
        { paddingTop: top },
      ]}
    >
      <HeaderForegroundContext.Provider value={foreground}>
        <View style={[styles.row, isRoot && styles.rootRow]}>
          {headerLeft
            ? headerLeft({ tintColor: foreground, canGoBack: !!back })
            : back && (
                <AppHeaderBackButton
                  tintColor={foreground}
                  onPress={navigation.goBack}
                  style={styles.back}
                />
              )}
          <View style={[styles.title, isRoot && styles.rootTitle]}>
            {typeof headerTitle === 'function' ? (
              headerTitle({ children: title, tintColor: foreground })
            ) : (
              <Text
                variant={isRoot ? 'largeTitle' : 'cardTitle'}
                accessibilityRole="header"
                numberOfLines={titleLines}
                keepWords
                style={{ color: foreground }}
              >
                {title}
              </Text>
            )}
          </View>
          {headerRight && (
            <View style={styles.right}>
              {headerRight({ tintColor: foreground, canGoBack: !!back })}
            </View>
          )}
        </View>
      </HeaderForegroundContext.Provider>
    </View>
  );
};

/**
 * The back arrow of the headers drawn in JS. On iOS the library's own arrow,
 * a tinted PNG, drew nothing in release builds and kept a 22 pt gap after
 * it, which cut long titles short: the app's chevron takes its place there.
 */
export const AppHeaderBackButton = (
  props: Omit<ComponentProps<typeof HeaderBackButton>, 'displayMode'>,
) => (
  <HeaderBackButton
    {...props}
    displayMode="minimal"
    backImage={
      IS_IOS
        ? ({ tintColor }) => (
            <View style={chevronStyles.box}>
              <Icon icon={faChevronLeft} size={20} color={tintColor} />
            </View>
          )
        : undefined
    }
  />
);

const chevronStyles = StyleSheet.create({
  // The 24 px glyph box of the Android arrow, with the margin around it
  box: {
    width: 24,
    height: 24,
    margin: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

/**
 * Light status bar content while the screen is focused: tab switches and
 * pushes blur it, so the screen that takes over sets its own
 */
const useLightStatusBar = (
  navigation: NativeStackHeaderProps['navigation'] | null,
) => {
  useEffect(() => {
    if (!navigation) return;
    let entry: SystemBarsEntry | null = null;
    const push = () => {
      entry ??= SystemBars.pushStackEntry({ style: { statusBar: 'light' } });
    };
    const pop = () => {
      if (entry) SystemBars.popStackEntry(entry);
      entry = null;
    };
    if (navigation.isFocused()) push();
    const offFocus = navigation.addListener('focus', push);
    const offBlur = navigation.addListener('blur', pop);
    return () => {
      offFocus();
      offBlur();
      pop();
    };
  }, [navigation]);
};

const createStyles = ({ colors, layout, spacing }: Theme) =>
  StyleSheet.create({
    container: {
      zIndex: 1,
    },
    root: {
      backgroundColor: colors.header,
    },
    inner: {
      backgroundColor: colors.surface,
    },
    hairline: {
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: colors.divider,
    },
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing[2],
      minHeight: 56,
      paddingVertical: spacing[1],
      paddingHorizontal: layout.gutter,
    },
    rootRow: {
      minHeight: 64,
      // At large text the control moves under the title rather than
      // squeezing it until a word breaks
      flexWrap: 'wrap',
    },
    back: {
      // The arrow sits on the gutter, its 48 px target reaches past it
      marginLeft: -spacing[3],
      marginVertical: 0,
    },
    title: {
      flexGrow: 1,
      flexShrink: 1,
      flexBasis: 0,
      minWidth: 0,
    },
    rootTitle: {
      flexBasis: 'auto',
    },
    right: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'flex-end',
      // A long control (the campus name) gives way to the title
      flexShrink: 1,
      maxWidth: '60%',
      marginLeft: 'auto',
      // Header buttons pad their glyph: this keeps it near the gutter
      marginRight: -spacing[2],
    },
  });
