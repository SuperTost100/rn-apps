import { useTranslation } from 'react-i18next';
import Svg, { G, Path, Rect, SvgProps } from 'react-native-svg';

/**
 * The mark of test builds, in place of the university's logo, which the
 * licence does not allow on modified versions: the open book of the
 * launcher icon on a navy square
 */
export const TestBuildLogo = (props: SvgProps) => {
  const { t } = useTranslation();
  return (
    <Svg
      viewBox="0 0 48 48"
      accessibilityRole="image"
      accessibilityLabel={t('testBuild.logoLabel')}
      {...props}
    >
      <Rect x={2} y={2} width={44} height={44} rx={9} fill="#002B49" />
      <G
        transform="translate(11 11) scale(1.0833)"
        fill="none"
        stroke="#FFFFFF"
        strokeWidth={2}
        strokeLinejoin="round"
        strokeLinecap="round"
      >
        <Path d="M2.5 4.5h6a3.5 3.5 0 0 1 3.5 3.5v12.5a3 3 0 0 0-3-3H2.5z" />
        <Path d="M21.5 4.5h-6A3.5 3.5 0 0 0 12 8v12.5a3 3 0 0 1 3-3h6.5z" />
      </G>
    </Svg>
  );
};
