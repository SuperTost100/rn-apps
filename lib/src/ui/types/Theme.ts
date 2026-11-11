import { TextStyle } from 'react-native';

export interface Theme {
  dark: boolean;
  colors: Colors;
  palettes: Palettes;
  /** Corner radii */
  shapes: {
    sm: number;
    md: number;
    lg: number;
    xl: number;
    /** Fully round ends, for chips and badges */
    pill: number;
  };
  elevation: {
    none: Elevation;
    /** Cards on the page: a soft shadow in light, none in dark */
    card: Elevation;
    /** Dialogs, sheets and snackbars over a scrim */
    overlay: Elevation;
  };
  controls: {
    /** Minimum size of anything that can be tapped */
    touchTarget: number;
    buttonHeight: number;
    inputHeight: number;
    chipHeight: number;
    rowMinHeight: number;
    /** Width of the leading column of a list row */
    leadingSize: number;
    courseTileSize: number;
    iconSize: number;
    iconStrokeWidth: number;
  };
  layout: {
    /** From the screen edge to cards, section headers and buttons */
    gutter: number;
    /** Between the leading column and the text of a row */
    leadingGap: number;
    rowPaddingVertical: number;
    cardPadding: number;
    sectionGap: number;
  };
  textVariants: Record<TextVariant, TextVariantStyle>;
  spacing: {
    [0]: number;
    [0.5]: number;
    [1]: number;
    [1.5]: number;
    [2]: number;
    [2.5]: number;
    [3]: number;
    [3.5]: number;
    [4]: number;
    [5]: number;
    [6]: number;
    [7]: number;
    [8]: number;
    [9]: number;
    [10]: number;
    [12]: number;
    [16]: number;
    [20]: number;
    [24]: number;
    [32]: number;
    [40]: number;
    [48]: number;
    [56]: number;
    [64]: number;
    [72]: number;
    [80]: number;
    [96]: number;
  };
  fontSizes: {
    '2xs': number;
    xs: number;
    sm: number;
    md: number;
    lg: number;
    xl: number;
    '2xl': number;
    '3xl': number;
    '4xl': number;
    '5xl': number;
    '6xl': number;
    '7xl': number;
    '8xl': number;
    '9xl': number;
  };
  fontFamilies: {
    heading: string;
    body: string;
    title: string;
  };
  fontWeights: {
    normal: TextStyle['fontWeight'];
    medium?: TextStyle['fontWeight'];
    semibold: TextStyle['fontWeight'];
    bold: TextStyle['fontWeight'];
    extrabold?: TextStyle['fontWeight'];
  };
  safeAreaInsets: {
    top: number;
    left: number;
    right: number;
    bottom: number;
  };
}

export type TextVariant =
  | 'display'
  | 'largeTitle'
  | 'cardTitle'
  | 'heading'
  | 'subHeading'
  | 'title'
  | 'prose'
  | 'longProse'
  | 'secondaryText'
  | 'caption'
  | 'link'
  | 'number'
  | 'button'
  | 'label'
  | 'tabLabel'
  | 'chip';

export interface TextVariantStyle {
  fontFamily: keyof Theme['fontFamilies'];
  fontWeight: keyof Theme['fontWeights'];
  /** In px at 100% text size */
  fontSize: number;
  /** In px at 100% text size, on the 4 px grid */
  lineHeight: number;
  textTransform?: TextStyle['textTransform'];
  letterSpacing?: number;
}

export interface Elevation {
  shadowColor: string;
  shadowOpacity: number;
  shadowRadius: number;
  shadowOffset: { width: number; height: number };
  /** Android elevation */
  elevation: number;
}

/**
 * Non-colour tokens an app can replace for both colour schemes,
 * e.g. to keep its own text variants
 */
export type ThemeOverrides = Partial<
  Omit<Theme, 'dark' | 'colors' | 'palettes' | 'safeAreaInsets'>
>;

export interface Colors {
  background: string;
  surface: string;
  surfaceDark: string;
  headersBackground: string;
  heading: string;
  subHeading: string;
  prose: string;
  disableTitle: string;
  longProse: string;
  secondaryText: string;
  caption: string;
  link: string;
  divider: string;
  tabBar: string;
  tabBarInactive: string;
  title: string;
  touchableHighlight: string;
  bookingCardBorder: string;
  deadlineCardBorder: string;
  examCardBorder: string;
  lectureCardSecondary: string;
  errorCardText: string;
  errorCardBorder: string;
  translucentSurface: string;
  white: string;
  yellow: string;
  black: string;
  readMore: string;

  // Surfaces
  surfaceSunken: string;
  selectedRow: string;
  cardBorder: string;
  scrim: string;
  skeleton: string;
  // The navy header of the main screens
  header: string;
  headerSunken: string;
  onHeader: string;
  onHeaderMuted: string;
  heroAccent: string;
  thread: string;
  focusOnHeader: string;
  // Controls
  controlBorder: string;
  primary: string;
  onPrimary: string;
  primaryPressed: string;
  disabledBg: string;
  onDisabled: string;
  focus: string;
  selectedChip: string;
  onSelectedChip: string;
  // Orange: the section mark and "now"
  accent: string;
  accentText: string;
  nowMark: string;
  nowText: string;
  nowBg: string;
  // States
  badge: string;
  onBadge: string;
  successBg: string;
  successText: string;
  warningBg: string;
  warningText: string;
  infoBg: string;
  infoText: string;
  neutralChipBg: string;
  neutralChipText: string;
  dangerText: string;
  dangerBg: string;
  dangerSolid: string;
  onDangerSolid: string;
  // Tab bar and course tabs
  tabBarBackground: string;
  tabIndicator: string;
  tabText: string;
  onTabSelected: string;
  tabUnderline: string;
  // Transcript rings
  ringTrack: string;
  ringFill: string;
  ringAttended: string;
  // Snackbar
  snackbar: string;
  onSnackbar: string;
  snackbarAction: string;
  // Agenda week grid, ticket thread, map placeholder
  weekToday: string;
  msgMe: string;
  onMsgMe: string;
  mapBg: string;
  mapLine: string;
  mapText: string;
}

export interface Palettes {
  navy: Palette;
  orange: Palette;
  rose: Palette;
  red: Palette;
  green: Palette;
  darkOrange: Palette;
  gray: Palette;
  lightBlue: Palette;
  violet: Palette;
  purple: Palette;
  text: Palette;
  primary: Palette;
  secondary: Palette;
  tertiary: Palette;
  danger: Palette;
  success: Palette;
  error: Palette;
  warning: Palette;
  muted: Palette;
  info: Palette;
}

export interface Palette {
  50: string;
  100: string;
  200: string;
  300: string;
  400: string;
  500: string;
  600: string;
  700: string;
  800: string;
  900: string;
}
