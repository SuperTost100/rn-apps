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
  megaphone: (
    <>
      <Path d="M3 10.5l16-6v15l-16-6z" />
      <Path d="M3 9.5v5" />
      <Path d="M8 15.5l1.2 4.5h3l-1-3.4" />
    </>
  ),
  download: (
    <>
      <Path d="M20.5 15v3.5a2 2 0 0 1-2 2h-13a2 2 0 0 1-2-2V15" />
      <Path d="M7 10l5 5 5-5" />
      <Path d="M12 15V3.5" />
    </>
  ),
  upload: (
    <>
      <Path d="M20.5 15v3.5a2 2 0 0 1-2 2h-13a2 2 0 0 1-2-2V15" />
      <Path d="M17 8.5l-5-5-5 5" />
      <Path d="M12 3.5V15" />
    </>
  ),
  'cloud-off': (
    <>
      <Path d="M3 3l18 18" />
      <Path d="M8.5 6.4A6 6 0 0 1 18 10h.5a4 4 0 0 1 2.2 7.3" />
      <Path d="M17 19H7a5 5 0 0 1-1.8-9.7" />
    </>
  ),
  'check-circle': (
    <>
      <Circle cx={12} cy={12} r={9.5} />
      <Path d="M8 12.2l2.8 2.8L16.2 9" />
    </>
  ),
  sort: (
    <>
      <Path d="M7 4v16M3.5 7.5L7 4l3.5 3.5" />
      <Path d="M17 20V4M13.5 16.5L17 20l3.5-3.5" />
    </>
  ),
  trash: (
    <Path d="M3.5 6.5h17M9 6.5V4.5a1.5 1.5 0 0 1 1.5-1.5h3A1.5 1.5 0 0 1 15 4.5v2M6 6.5l1 14h10l1-14" />
  ),
  folder: (
    <Path d="M20 19.5a2 2 0 0 0 2-2v-9a2 2 0 0 0-2-2h-7.9a2 2 0 0 1-1.7-.9l-.8-1.2a2 2 0 0 0-1.7-.9H4a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2Z" />
  ),
  video: (
    <>
      <Rect x={2.5} y={6} width={13.5} height={12} rx={2.5} />
      <Path d="M16 10.5L21.5 8v8L16 13.5" />
    </>
  ),
  monitor: (
    <>
      <Rect x={2.5} y={3.5} width={19} height={13} rx={2} />
      <Path d="M8 20.5h8M12 16.5v4" />
      <Path d="M10 7.5l4.5 2.5-4.5 2.5z" />
    </>
  ),
  live: (
    <>
      <Circle cx={12} cy={12} r={2} />
      <Path d="M16.2 7.8a6 6 0 0 1 0 8.4M7.8 16.2a6 6 0 0 1 0-8.4M19 5a10 10 0 0 1 0 14M5 19A10 10 0 0 1 5 5" />
    </>
  ),
  link: (
    <>
      <Path d="M14 3.5h6.5V10" />
      <Path d="M20.5 3.5L11 13" />
      <Path d="M18 14v5a1.5 1.5 0 0 1-1.5 1.5H5A1.5 1.5 0 0 1 3.5 19V7.5A1.5 1.5 0 0 1 5 6h5" />
    </>
  ),
  bookopen: (
    <>
      <Path d="M12 7v14" />
      <Path d="M3 18a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1h5a4 4 0 0 1 4 4 4 4 0 0 1 4-4h5a1 1 0 0 1 1 1v13a1 1 0 0 1-1 1h-6a3 3 0 0 0-3 3 3 3 0 0 0-3-3z" />
    </>
  ),
  chart: (
    <>
      <Path d="M3 3.5v17h17.5" />
      <Path d="M7 15l4-5 3 3 5-6" />
    </>
  ),
  file: (
    <>
      <Path d="M14 2.5H6.5a2 2 0 0 0-2 2v15a2 2 0 0 0 2 2h11a2 2 0 0 0 2-2V8z" />
      <Path d="M14 2.5V8h5.5" />
    </>
  ),
  clock: (
    <>
      <Circle cx={12} cy={12} r={9} />
      <Path d="M12 7v5l3 2" />
    </>
  ),
  hdd: (
    <>
      <Rect x={2.5} y={13} width={19} height={7.5} rx={2} />
      <Path d="M5 13l2.5-8.5h9L19 13M6.5 16.8h.01M10 16.8h.01" />
    </>
  ),
  eyeoff: (
    <>
      <Path d="M3 3l18 18" />
      <Path d="M10.6 5.1A10 10 0 0 1 12 5c6 0 9.5 7 9.5 7a17 17 0 0 1-2.4 3.3M6.6 6.6C3.9 8.4 2.5 12 2.5 12s3.5 7 9.5 7a9.6 9.6 0 0 0 4.4-1.1" />
      <Path d="M9.9 9.9a3 3 0 0 0 4.2 4.2" />
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
