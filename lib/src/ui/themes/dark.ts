import { Platform } from 'react-native';

import { Theme } from '../types/Theme';
import { lightTheme, noShadow } from './light';

const { navy, orange, gray, rose, green, darkOrange, lightBlue, red } =
  lightTheme.palettes;

/**
 * One plain dark page, one lighter surface and hairlines.
 * Every colour is set here: nothing is inherited from the light scheme.
 */
export const darkTheme: Theme = {
  ...lightTheme,
  dark: true,
  colors: {
    background: '#0D1720',
    surface: '#16222D',
    surfaceDark: '#16222D',
    surfaceSunken: '#22313D',
    selectedRow: '#1E3A52',
    cardBorder: '#2A3A47',
    scrim: 'rgba(0, 0, 0, 0.6)',
    skeleton: '#22313D',
    translucentSurface: Platform.select({
      android: 'rgba(255, 255, 255, .1)',
      default: 'rgba(0, 0, 0, .1)',
    }),
    touchableHighlight: 'rgba(255, 255, 255, 0.06)',
    headersBackground: '#16222D',
    header: '#16222D',
    headerSunken: '#22313D',
    onHeader: '#F1F5F8',
    onHeaderMuted: '#A9BCCA',
    heroAccent: orange[300],
    thread: '#6E8291',
    focusOnHeader: orange[300],

    heading: '#F1F5F8',
    subHeading: lightBlue[300],
    title: '#F1F5F8',
    prose: '#E3E9EE',
    longProse: '#E3E9EE',
    secondaryText: '#9AABB8',
    caption: '#9AABB8',
    link: navy[200],
    readMore: navy[200],
    // Label of a disabled filled button, on secondaryText
    disableTitle: '#0D1720',
    divider: '#2A3A47',
    white: '#FFFFFF',
    black: '#000000',
    yellow: '#FFD700',

    controlBorder: '#7A93A6',
    primary: navy[200],
    onPrimary: navy[900],
    primaryPressed: navy[100],
    disabledBg: '#22313D',
    onDisabled: '#B8C6D0',
    focus: navy[200],
    selectedChip: navy[100],
    onSelectedChip: navy[900],

    accent: orange[500],
    accentText: orange[400],
    nowMark: orange[500],
    nowText: orange[300],
    nowBg: '#3A2410',

    badge: rose[600],
    onBadge: '#FFFFFF',
    successBg: '#123D24',
    successText: green[200],
    warningBg: '#4A2208',
    warningText: darkOrange[200],
    infoBg: '#0C3550',
    infoText: lightBlue[200],
    neutralChipBg: '#22313D',
    neutralChipText: gray[200],
    dangerText: rose[300],
    dangerBg: '#3B1219',
    dangerSolid: rose[300],
    onDangerSolid: '#3B0712',
    errorCardText: rose[200],
    errorCardBorder: rose[500],

    bookingCardBorder: green[600],
    deadlineCardBorder: red[700],
    examCardBorder: orange[600],
    lectureCardSecondary: gray[300],

    tabBar: navy[100],
    tabBarInactive: '#9AABB8',
    tabBarBackground: '#16222D',
    tabIndicator: '#1E3A52',
    tabText: '#9AABB8',
    onTabSelected: '#F1F5F8',
    tabUnderline: navy[200],

    ringTrack: '#22313D',
    ringFill: navy[200],
    ringAttended: orange[500],
    snackbar: '#E3E9EE',
    onSnackbar: '#0D1720',
    snackbarAction: navy[600],
    weekToday: '#1A2C3B',
    msgMe: '#1E3A52',
    onMsgMe: '#F1F5F8',
    mapBg: '#1A2733',
    mapLine: '#2A3A47',
    mapText: '#C3CFD8',
  },
  elevation: {
    ...lightTheme.elevation,
    // The surface is lighter than the page, so cards need no shadow
    card: noShadow,
  },
};
