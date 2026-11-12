import type { StatusChipTone } from '@polito/lib/ui';
import type { Symbol } from '@polito/student-api-client';

/** Hue (0-360) and saturation (0-1) of a #rgb or #rrggbb colour */
const hueOf = (hex: string) => {
  const raw = hex.trim().replace(/^#/, '');
  const full =
    raw.length === 3
      ? raw
          .split('')
          .map(c => c + c)
          .join('')
      : raw;
  if (!/^[0-9a-f]{6}$/i.test(full)) return undefined;
  const [r, g, b] = [0, 2, 4].map(
    i => parseInt(full.slice(i, i + 2), 16) / 255,
  );
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const delta = max - min;
  const lightness = (max + min) / 2;
  const saturation =
    delta === 0 ? 0 : delta / (1 - Math.abs(2 * lightness - 1));
  let hue = 0;
  if (delta !== 0) {
    if (max === r) hue = ((g - b) / delta) % 6;
    else if (max === g) hue = (b - r) / delta + 2;
    else hue = (r - g) / delta + 4;
  }
  return { hue: (hue * 60 + 360) % 360, saturation };
};

/**
 * The theme role of a status the API sends with its own colour (a career
 * that is enrolled, suspended, closed...). The API colour picks the role by
 * its hue, and the theme draws it, so the word stays readable in light and
 * dark. The API sends either { light, dark } or, as the mock does, one hex.
 */
export const symbolTone = (symbol?: Symbol): StatusChipTone => {
  const color: unknown = symbol?.color;
  const hex =
    typeof color === 'string'
      ? color
      : (color as { light?: string } | undefined)?.light;
  const parsed = hex ? hueOf(hex) : undefined;
  if (!parsed || parsed.saturation < 0.2) return 'neutral';
  const { hue } = parsed;
  if (hue < 20 || hue >= 330) return 'danger';
  if (hue < 65) return 'warning';
  if (hue < 170) return 'success';
  if (hue < 260) return 'info';
  return 'neutral';
};
