import { useEffect, useMemo, useState } from 'react';
import {
  Text as RNText,
  TextProps as RNTextProps,
  StyleSheet,
  TextLayoutEventData,
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
  /**
   * Never breaks a word across lines: when a single word is wider than the
   * line, the text shrinks in steps, down to its size at 100% text
   */
  keepWords?: boolean;
}

const FIT_STEP = 0.9;

// Latin letters and digits: a break between two of them is inside a word
const WORD_END = /[0-9A-Za-z\u00C0-\u024F]$/;
const WORD_START = /^[0-9A-Za-z\u00C0-\u024F]/;

/** A line that ends inside a word, which goes on at the start of the next */
export const breaksInsideWord = (lines: { text: string }[]) =>
  lines.some((line, i) => {
    const next = lines[i + 1];
    return !!next && WORD_END.test(line.text) && WORD_START.test(next.text);
  });

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
  keepWords = false,
  onTextLayout,
  children,
  ...rest
}: TextProps) => {
  const { colors, fontFamilies, fontWeights, fontSizes, textVariants } =
    useTheme();
  const { accessibility } = usePreferencesContext();
  const scale = textScaleFromPercent(accessibility?.fontSize);
  const variantStyle = textVariants[variant];
  // Shrink factor for keepWords; starts again when the text or size changes
  const [fit, setFit] = useState(1);
  const textKey = typeof children === 'string' ? children : undefined;
  useEffect(() => setFit(1), [textKey, scale]);
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
    // Never smaller than the size at 100% text
    const minFit = Math.min(
      1,
      (styleFontSize ?? variantStyle.fontSize) / size.fontSize,
    );
    const f = Math.max(fit, minFit);
    return {
      maxFontSizeMultiplier: size.maxFontSizeMultiplier,
      canShrink: f * FIT_STEP >= minFit,
      style: {
        fontSize: size.fontSize * f,
        lineHeight:
          (withLineHeight ? size.fontSize * 1.5 : size.lineHeight) * f,
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
    fit,
  ]);

  const handleTextLayout = keepWords
    ? (e: { nativeEvent: TextLayoutEventData }) => {
        if (sizeStyle.canShrink && breaksInsideWord(e.nativeEvent.lines)) {
          setFit(value => value * FIT_STEP);
        }
        onTextLayout?.(e as any);
      }
    : onTextLayout;

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
      onTextLayout={handleTextLayout}
      {...rest}
    >
      {typeof children === 'string' && isLongProse && accessibility?.wordSpacing
        ? addWordSpacing(children, wordSpacing)
        : children}
    </RNText>
  );
};
