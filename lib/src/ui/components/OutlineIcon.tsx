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
  chat: (
    <Path d="M21 12a8.5 8.5 0 0 1-12.4 7.5L3 21l1.5-5.6A8.5 8.5 0 1 1 21 12z" />
  ),
  guide: (
    <Path d="M12 2.5v19M5 5h11l3 2.5L16 10H5zM19 12.5H8l-3 2.5 3 2.5h11z" />
  ),
  card: (
    <>
      <Rect x={2.5} y={5} width={19} height={14} rx={2.5} />
      <Circle cx={8.5} cy={11} r={2} />
      <Path d="M5.5 16c.5-1.5 1.6-2.2 3-2.2s2.5.7 3 2.2M14 10h4M14 13.5h3" />
    </>
  ),
  door: (
    <>
      <Path d="M4 21.5h16" />
      <Path d="M6 21.5v-17a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v17" />
      <Path d="M14.5 12h.01" />
    </>
  ),
  news: (
    <>
      <Rect x={3} y={4} width={18} height={16} rx={2.5} />
      <Path d="M7 8.5h10M7 12h10M7 15.5h6" />
    </>
  ),
  brief: (
    <>
      <Rect x={3} y={7} width={18} height={13} rx={2.5} />
      <Path d="M9 7V5a1.5 1.5 0 0 1 1.5-1.5h3A1.5 1.5 0 0 1 15 5v2M3 12.5h18" />
    </>
  ),
  clipboard: (
    <>
      <Rect x={8} y={2.5} width={8} height={4} rx={1} />
      <Path d="M16 4.5h2a2 2 0 0 1 2 2v13a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2v-13a2 2 0 0 1 2-2h2" />
      <Path d="M9 12h6M9 16h4" />
    </>
  ),
  mail: (
    <>
      <Rect x={2.5} y={4.5} width={19} height={15} rx={2.5} />
      <Path d="M3 7l9 6 9-6" />
    </>
  ),
  ext: (
    <>
      <Path d="M14 3.5h6.5V10" />
      <Path d="M20.5 3.5L11 13" />
      <Path d="M18 14v5a1.5 1.5 0 0 1-1.5 1.5H5A1.5 1.5 0 0 1 3.5 19V7.5A1.5 1.5 0 0 1 5 6h5" />
    </>
  ),
  clip: (
    <Path d="M20 11.5l-7.8 7.8a5 5 0 0 1-7.1-7.1l8.1-8.1a3.3 3.3 0 0 1 4.7 4.7l-8 8a1.6 1.6 0 0 1-2.3-2.3l7.3-7.3" />
  ),
  send: (
    <>
      <Path d="M21.5 2.5L11 13" />
      <Path d="M21.5 2.5l-6.5 19-4-8.5-8.5-4z" />
    </>
  ),
  copy: (
    <>
      <Rect x={8.5} y={8.5} width={12} height={12} rx={2} />
      <Path d="M15.5 8.5V5.5a2 2 0 0 0-2-2h-8a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h3" />
    </>
  ),
  phone: (
    <Path d="M21 16.5v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 3.1 3.7 2 2 0 0 1 5 1.5h3a2 2 0 0 1 2 1.7c.1.9.4 1.8.7 2.7a2 2 0 0 1-.5 2.1L9 9.3a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.4c.9.3 1.8.6 2.7.7a2 2 0 0 1 1.7 2z" />
  ),
  seat: (
    <>
      <Path d="M6 11V5a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v6" />
      <Path d="M4 11h16v4H4zM6 15v6M18 15v6" />
    </>
  ),
  info: (
    <>
      <Circle cx={12} cy={12} r={9.5} />
      <Path d="M12 11v5.5M12 7.5h.01" />
    </>
  ),
  alert: (
    <>
      <Circle cx={12} cy={12} r={9.5} />
      <Path d="M12 7.5v5.5M12 16.5h.01" />
    </>
  ),
  search: (
    <>
      <Circle cx={11} cy={11} r={7} />
      <Path d="M20.5 20.5l-4.3-4.3" />
    </>
  ),
  plus: <Path d="M12 5v14M5 12h14" />,
  pin: (
    <>
      <Path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
      <Circle cx={12} cy={10} r={3} />
    </>
  ),
  more: (
    <>
      <Circle cx={12} cy={5.5} r={1.3} />
      <Circle cx={12} cy={12} r={1.3} />
      <Circle cx={12} cy={18.5} r={1.3} />
    </>
  ),
  refresh: (
    <>
      <Path d="M20.5 12a8.5 8.5 0 0 1-14.6 5.9L3.5 15.5" />
      <Path d="M3.5 20.5v-5h5" />
      <Path d="M3.5 12a8.5 8.5 0 0 1 14.6-5.9l2.4 2.4" />
      <Path d="M20.5 3.5v5h-5" />
    </>
  ),
  check: <Path d="M20 6L9 17l-5-5" />,
  bell: (
    <>
      <Path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
      <Path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
    </>
  ),
  theme: (
    <>
      <Circle cx={12} cy={12} r={9.5} />
      <Path d="M12 2.5v19a9.5 9.5 0 0 0 0-19z" fill="currentColor" />
    </>
  ),
  text: (
    <Path d="M4 19.5L10 4.5l6 15M6.3 14h7.4M16 19.5l2.5-6 2.5 6M16.8 17.5h3.4" />
  ),
  globe: (
    <>
      <Circle cx={12} cy={12} r={9.5} />
      <Path d="M2.5 12h19M12 2.5c3 3 3 16 0 19M12 2.5c-3 3-3 16 0 19" />
    </>
  ),
  shield: (
    <Path d="M12 2.5L4.5 5.5v6c0 4.5 3.2 8.2 7.5 9.5 4.3-1.3 7.5-5 7.5-9.5v-6z" />
  ),
  logout: (
    <>
      <Path d="M14 3.5H6a1.5 1.5 0 0 0-1.5 1.5v14A1.5 1.5 0 0 0 6 20.5h8" />
      <Path d="M10 12h10.5M17 8.5l3.5 3.5-3.5 3.5" />
    </>
  ),
  github: (
    <Path d="M9 19c-4.3 1.4-4.3-2.5-6-3m12 5v-3.5c0-1 .1-1.4-.5-2 2.8-.3 5.5-1.4 5.5-6a4.6 4.6 0 0 0-1.3-3.2 4.2 4.2 0 0 0-.1-3.2s-1.1-.3-3.5 1.3a12.3 12.3 0 0 0-6.2 0C6.5 2.8 5.4 3.1 5.4 3.1a4.2 4.2 0 0 0-.1 3.2A4.6 4.6 0 0 0 4 9.5c0 4.6 2.7 5.7 5.5 6-.6.6-.6 1.2-.5 2V21" />
  ),
  bulb: (
    <>
      <Path d="M9 18h6M10 21.5h4" />
      <Path d="M12 2.5a6.5 6.5 0 0 0-4 11.6c.6.5 1 1.3 1 2.1V17h6v-.8c0-.8.4-1.6 1-2.1A6.5 6.5 0 0 0 12 2.5z" />
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
    // The filled half of the theme glyph reads it as currentColor
    color={color}
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
