import { useMemo } from 'react';
import {
  Text as RNText,
  TextProps as RNTextProps,
  StyleSheet,
  TextStyle,
} from 'react-native';

import { usePreferencesContext } from '../../core/contexts/PreferencesContext';
import { useTheme } from '../hooks/useTheme';
import { Colors, TextVariant, Theme } from '../types/Theme';
import { resolveFontFace } from '../utils/font-face';
import { computeTextSize, textScaleFromPercent } from '../utils/text-scale';

export interface TextProps extends RNTextProps {
  variant?: TextVariant;
  weight?: keyof Theme['fontWeights'];
  italic?: boolean;
  capitalize?: boolean;
  uppercase?: boolean;
  /**
   * Largest size in px after the in-app and the phone's text scale,
   * e.g. 14 for the tab bar labels
   */
  maxFontSize?: number;
}

const variantColors: Record<TextVariant, keyof Colors> = {
  display: 'heading',
  largeTitle: 'heading',
  cardTitle: 'heading',
  heading: 'heading',
  subHeading: 'subHeading',
  title: 'title',
  prose: 'prose',
  longProse: 'longProse',
  secondaryText: 'secondaryText',
  caption: 'caption',
  link: 'link',
  number: 'heading',
  button: 'title',
  label: 'title',
  tabLabel: 'tabText',
  chip: 'prose',
};

export const calculateValueOfPercentage = (
  fontSize?: number,
  size?: number,
) => {
  return ((size || 16) * (fontSize || 1)) / 100;
};

/**
 * A wrapper around RN's Text component that applies the theme's text
 * variants and the in-app text size
 */
export const Text = ({
  variant = 'prose',
  weight,
  italic = false,
  style,
  capitalize,
  uppercase,
  maxFontSize,
  maxFontSizeMultiplier,
  children,
  ...rest
}: TextProps) => {
  const { colors, fontFamilies, fontWeights, fontSizes, textVariants } =
    useTheme();
  const { accessibility } = usePreferencesContext();
  const scale = textScaleFromPercent(accessibility?.fontSize);
  const variantStyle = textVariants[variant];
  const isLongProse = variant === 'longProse';
  const wordSpacing = fontSizes.md * 0.16;

  const addWordSpacing = (text: string, space: number) => {
    if (isLongProse) return text.split(' ').join(' '.repeat(space));
    else return text;
  };

  const baseStyle = useMemo<TextStyle>(
    () => ({
      fontFamily: fontFamilies[variantStyle.fontFamily],
      fontWeight: fontWeights[weight ?? variantStyle.fontWeight],
      color: colors[variantColors[variant]],
      textTransform: variantStyle.textTransform,
      letterSpacing:
        variantStyle.letterSpacing !== undefined
          ? variantStyle.letterSpacing * scale
          : undefined,
    }),
    [colors, fontFamilies, fontWeights, variant, variantStyle, weight, scale],
  );

  // A fontSize or lineHeight passed by the screen is scaled like the variant's
  const flatStyle = style ? StyleSheet.flatten(style) : undefined;
  const styleFontSize = flatStyle?.fontSize;
  const styleLineHeight = flatStyle?.lineHeight;
  const sizeStyle = useMemo(() => {
    const size = computeTextSize(
      variantStyle,
      scale,
      styleFontSize,
      styleLineHeight,
      maxFontSize,
    );
    // The accessibility options of longProse, as before the scale moved here
    const withLineHeight =
      isLongProse && accessibility?.lineHeight && styleLineHeight === undefined;
    return {
      maxFontSizeMultiplier: size.maxFontSizeMultiplier,
      style: {
        fontSize: size.fontSize,
        lineHeight: withLineHeight ? size.fontSize * 1.5 : size.lineHeight,
      } satisfies TextStyle,
      paragraphSpacing:
        isLongProse && accessibility?.paragraphSpacing
          ? { marginBottom: size.fontSize * 2 }
          : undefined,
    };
  }, [
    variantStyle,
    scale,
    styleFontSize,
    styleLineHeight,
    maxFontSize,
    isLongProse,
    accessibility?.lineHeight,
    accessibility?.paragraphSpacing,
  ]);

  // The family file that has the final weight, after the screen's overrides:
  // a weight from style or the weight prop wins, a family alone keeps its own
  const styleFamily = flatStyle?.fontFamily;
  const styleWeight = flatStyle?.fontWeight;
  const isItalic = italic || flatStyle?.fontStyle === 'italic';
  const fontFace = useMemo(
    () =>
      resolveFontFace(
        styleFamily ?? baseStyle.fontFamily,
        styleWeight ??
          (weight || !styleFamily ? baseStyle.fontWeight : undefined),
        isItalic,
      ),
    [
      styleFamily,
      styleWeight,
      weight,
      baseStyle.fontFamily,
      baseStyle.fontWeight,
      isItalic,
    ],
  );

  return (
    <RNText
      style={[
        baseStyle,
        capitalize && { textTransform: 'capitalize' },
        uppercase && { textTransform: 'uppercase' },
        sizeStyle.paragraphSpacing,
        flatStyle,
        sizeStyle.style,
        fontFace,
      ]}
      // A caller may only lower the cap on the phone's font scale
      maxFontSizeMultiplier={
        maxFontSizeMultiplier && maxFontSizeMultiplier >= 1
          ? Math.min(maxFontSizeMultiplier, sizeStyle.maxFontSizeMultiplier)
          : sizeStyle.maxFontSizeMultiplier
      }
      {...rest}
    >
      {typeof children === 'string' && isLongProse && accessibility?.wordSpacing
        ? addWordSpacing(children, wordSpacing)
        : children}
    </RNText>
  );
};
