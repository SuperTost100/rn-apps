import { ReactElement } from 'react';
import Svg, { Circle, Path, Rect } from 'react-native-svg';

/**
 * The outline glyphs of the redesign on a 24 px grid with a 2 px stroke and
 * round joins, drawn after Lucide (ISC licence) as in the mockup
 */
const glyphs = {
  book: (
    <>
      <Path d="M2.5 4.5h6a3.5 3.5 0 0 1 3.5 3.5v12.5a3 3 0 0 0-3-3H2.5z" />
      <Path d="M21.5 4.5h-6A3.5 3.5 0 0 0 12 8v12.5a3 3 0 0 1 3-3h6.5z" />
    </>
  ),
  calendar: (
    <>
      <Rect x={3} y={4.5} width={18} height={17} rx={2.5} />
      <Path d="M16 2.5v4M8 2.5v4M3 10h18" />
    </>
  ),
  compass: (
    <>
      <Circle cx={12} cy={12} r={9.5} />
      <Path d="M15.8 8.2l-2 5.6-5.6 2 2-5.6z" />
    </>
  ),
  grid: (
    <>
      <Rect x={3.5} y={3.5} width={7} height={7} rx={1.5} />
      <Rect x={13.5} y={3.5} width={7} height={7} rx={1.5} />
      <Rect x={13.5} y={13.5} width={7} height={7} rx={1.5} />
      <Rect x={3.5} y={13.5} width={7} height={7} rx={1.5} />
    </>
  ),
  user: (
    <>
      <Circle cx={12} cy={8} r={4} />
      <Path d="M4 21a8 8 0 0 1 16 0" />
    </>
  ),
  gear: (
    <>
      <Circle cx={12} cy={12} r={3} />
      <Path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
    </>
  ),
} satisfies Record<string, ReactElement>;

export type OutlineIconName = keyof typeof glyphs;

interface Props {
  name: OutlineIconName;
  color: string;
  size?: number;
}

/** A decorative outline glyph: the control around it carries the label */
export const OutlineIcon = ({ name, color, size = 24 }: Props) => (
  <Svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke={color}
    strokeWidth={2}
    strokeLinecap="round"
    strokeLinejoin="round"
    accessibilityElementsHidden
    importantForAccessibility="no-hide-descendants"
  >
    {glyphs[name]}
  </Svg>
);
