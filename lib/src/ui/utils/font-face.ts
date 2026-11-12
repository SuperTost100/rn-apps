import type { TextStyle } from 'react-native';

/**
 * The Montserrat files bundled on Android and iOS, by weight.
 * There is no Thin, ExtraLight or Light file: lighter weights use Regular.
 */
const MONTSERRAT_FILES: Record<number, string> = {
  400: 'Regular',
  500: 'Medium',
  600: 'SemiBold',
  700: 'Bold',
  800: 'ExtraBold',
};

const FILE_WEIGHTS: Record<string, number> = {
  Regular: 400,
  Italic: 400,
  Medium: 500,
  SemiBold: 600,
  Bold: 700,
  ExtraBold: 800,
};

const MONTSERRAT_FILE =
  /^Montserrat-(Regular|Italic|Medium|SemiBold|Bold|ExtraBold)(Italic)?$/;

const numericWeight = (weight: TextStyle['fontWeight']): number | undefined => {
  if (weight === undefined) return undefined;
  if (weight === 'normal') return 400;
  if (weight === 'bold') return 700;
  const n = Number(weight);
  return Number.isNaN(n) ? undefined : n;
};

const fileForWeight = (weight: number) => {
  if (weight >= 800) return MONTSERRAT_FILES[800];
  if (weight >= 700) return MONTSERRAT_FILES[700];
  if (weight >= 600) return MONTSERRAT_FILES[600];
  if (weight >= 500) return MONTSERRAT_FILES[500];
  return MONTSERRAT_FILES[400];
};

export interface FontFace {
  fontFamily?: string;
  fontWeight?: TextStyle['fontWeight'];
  fontStyle?: TextStyle['fontStyle'];
}

/**
 * Picks the Montserrat file that has the requested weight and style.
 *
 * Android draws a family file with a heavier fontWeight as synthetic bold,
 * so "Montserrat-Regular" with weight 600 looked smeared next to iOS, which
 * found the real SemiBold. Naming the file of that weight, with the same
 * weight, renders the real face on both platforms.
 *
 * `weight` wins when given; otherwise the weight of the file named in
 * `family` is kept. Families that are not Montserrat pass through unchanged.
 */
export const resolveFontFace = (
  family: string | undefined,
  weight: TextStyle['fontWeight'] | undefined,
  italic: boolean,
): FontFace => {
  const match = family ? MONTSERRAT_FILE.exec(family) : null;
  if (!match) {
    return {
      fontFamily: family,
      fontWeight: weight,
      fontStyle: italic ? 'italic' : undefined,
    };
  }
  const familyWeight = FILE_WEIGHTS[match[1]];
  const isItalic = italic || !!match[2] || match[1] === 'Italic';
  const wanted = numericWeight(weight) ?? familyWeight;
  const file = fileForWeight(wanted);
  const name =
    isItalic && file === 'Regular'
      ? 'Montserrat-Italic'
      : `Montserrat-${file}${isItalic ? 'Italic' : ''}`;
  return {
    fontFamily: name,
    // The weight of the file itself, so neither platform adds synthetic bold
    fontWeight: String(FILE_WEIGHTS[file]) as TextStyle['fontWeight'],
    // Matches the file: an italic file is not slanted again, and iOS keeps
    // the italic face when it looks the weight up in the family
    fontStyle: isItalic ? 'italic' : 'normal',
  };
};
