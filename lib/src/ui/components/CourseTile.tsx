import { StyleSheet, View } from 'react-native';

import { faEyeSlash } from '@fortawesome/free-regular-svg-icons';

import { courseColors, courseIcons } from '../../features/courses/constants';
import { useStylesheet } from '../hooks/useStylesheet';
import { useTheme } from '../hooks/useTheme';
import { Theme } from '../types/Theme';
import { shadeColor } from '../utils/colors';
import { Icon } from './Icon';

interface Props {
  /** The course colour the student picked (a courseColors entry) */
  color?: string;
  /** A key of courseIcons */
  icon?: string;
  /** The course is hidden from the agenda: an eye-off on a neutral tile */
  isHidden?: boolean;
}

/**
 * The darker tile shade of a course colour, so a white icon on it reaches
 * 4.5:1. Colours outside the list get a shade 25% darker.
 */
export const courseTileColor = (color: string) =>
  courseColors.find(c => c.color.toLowerCase() === color.toLowerCase())?.tile ??
  shadeColor(color, -25);

/** The tile's icon: 20 px on the 36 px tile */
const TILE_ICON_SIZE = 20;

/**
 * A course's tile: its icon in white on the tile shade of its colour,
 * 36 px with the md radius. Decorative: the row's text names the course.
 */
export const CourseTile = ({ color, icon, isHidden = false }: Props) => {
  const styles = useStylesheet(createStyles);
  const { colors } = useTheme();
  const background = isHidden
    ? colors.neutralChipBg
    : color
      ? courseTileColor(color)
      : colors.neutralChipBg;
  const glyph = isHidden
    ? faEyeSlash
    : icon && icon in courseIcons
      ? courseIcons[icon]
      : undefined;

  return (
    <View
      style={[styles.tile, { backgroundColor: background }]}
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
    >
      {glyph && (
        <Icon
          icon={glyph}
          size={TILE_ICON_SIZE}
          color={isHidden || !color ? colors.neutralChipText : colors.white}
        />
      )}
    </View>
  );
};

const createStyles = ({ controls, shapes }: Theme) =>
  StyleSheet.create({
    tile: {
      width: controls.courseTileSize,
      height: controls.courseTileSize,
      borderRadius: shapes.md,
      alignItems: 'center',
      justifyContent: 'center',
    },
  });
