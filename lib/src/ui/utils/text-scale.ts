import type { TextVariantStyle } from '../types/Theme';

/**
 * The largest effect the in-app text size and the phone's own font scale
 * may have together. Above this, rows and headers stop holding their text.
 */
export const MAX_COMBINED_TEXT_SCALE = 2;

/** The in-app text size from Settings (100 to 200 percent) as a factor */
export const textScaleFromPercent = (percent?: number) =>
  (percent ?? 100) / 100;

export interface ScaledTextSize {
  fontSize: number;
  lineHeight: number;
  /** Passed to RN Text, which applies the phone's font scale up to this value */
  maxFontSizeMultiplier: number;
}

/**
 * The size of a text: the variant's size, or a fontSize passed by the screen,
 * times the in-app scale. The line height follows the same factor; without
 * one from the screen it keeps the variant's ratio, so a larger fontSize
 * never sits in a line too short for it.
 *
 * The phone's font scale multiplies the result once more (RN scales fontSize
 * and lineHeight by it). Capping that multiplier at 2.0 / in-app scale keeps
 * the product at 2.0 or less: at 100% the phone setting may double the text,
 * at 200% it adds nothing. maxFontSize caps the final size in px as well.
 */
export const computeTextSize = (
  variant: Pick<TextVariantStyle, 'fontSize' | 'lineHeight'>,
  scale: number,
  styleFontSize?: number,
  styleLineHeight?: number,
  maxFontSize?: number,
): ScaledTextSize => {
  const baseSize = styleFontSize ?? variant.fontSize;
  const baseLine =
    styleLineHeight ?? (variant.lineHeight / variant.fontSize) * baseSize;
  let factor = scale;
  if (maxFontSize !== undefined && baseSize * factor > maxFontSize) {
    factor = maxFontSize / baseSize;
  }
  const fontSize = baseSize * factor;
  let maxFontSizeMultiplier = MAX_COMBINED_TEXT_SCALE / scale;
  if (maxFontSize !== undefined) {
    maxFontSizeMultiplier = Math.min(
      maxFontSizeMultiplier,
      maxFontSize / fontSize,
    );
  }
  return {
    fontSize,
    lineHeight: baseLine * factor,
    // RN treats values below 1 as "no limit", so 1 means no phone scaling
    maxFontSizeMultiplier: Math.max(1, maxFontSizeMultiplier),
  };
};
