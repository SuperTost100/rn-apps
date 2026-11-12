import { useTranslation } from 'react-i18next';
import { StyleSheet, TouchableOpacity, View } from 'react-native';

import { courseColors, courseIcons } from '@polito/lib/features/courses';
import {
  BottomModal,
  CourseTile,
  ListItem,
  ModalContent,
  OutlineIcon,
  Text,
  TextButton,
  Theme,
  useStylesheet,
} from '@polito/lib/ui';

/** "Book open" for faBookOpen: the icon's name as screen readers say it */
export const iconLabel = (key: string) =>
  key
    .replace(/^fa/, '')
    .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
    .toLowerCase()
    .replace(/^./, c => c.toUpperCase());

/** The name of a course colour, or "Custom colour" for one outside the list */
export const useColourName = () => {
  const { t } = useTranslation();
  return (color: string) => {
    const entry = courseColors.find(
      c => c.color.toLowerCase() === color.toLowerCase(),
    );
    return entry ? t(entry.name) : t('course.settings.customColour');
  };
};

const RadioMark = ({ checked }: { checked: boolean }) => {
  const styles = useStylesheet(createStyles);
  return (
    <View style={[styles.radio, checked && styles.radioOn]}>
      {checked && <View style={styles.radioDot} />}
    </View>
  );
};

interface ColourProps {
  visible: boolean;
  color: string;
  icon?: string;
  onPick: (color: string) => void;
  onCustom: () => void;
  onClose: () => void;
}

/**
 * The course colours as radio rows, each with the course tile in that
 * colour, and a last row for a colour of one's own
 */
export const CourseColourSheet = ({
  visible,
  color,
  icon,
  onPick,
  onCustom,
  onClose,
}: ColourProps) => {
  const { t } = useTranslation();
  const colourName = useColourName();
  const styles = useStylesheet(createStyles);
  const isCustom = !courseColors.some(
    c => c.color.toLowerCase() === color.toLowerCase(),
  );
  return (
    <BottomModal visible={visible} onClose={onClose}>
      <ModalContent title={t('course.settings.colourTitle')} close={onClose}>
        <View accessibilityRole="radiogroup">
          {courseColors.map(c => {
            const checked = c.color.toLowerCase() === color.toLowerCase();
            return (
              <ListItem
                key={c.color}
                title={t(c.name)}
                leadingItem={<CourseTile color={c.color} icon={icon} />}
                trailingItem={<RadioMark checked={checked} />}
                onPress={() => onPick(c.color)}
                accessibilityRole="radio"
                accessibilityState={{ checked }}
              />
            );
          })}
          <ListItem
            title={t('course.settings.customColour')}
            subtitle={
              isCustom ? colourName(color) : t('course.settings.customText')
            }
            leadingItem={
              isCustom ? <CourseTile color={color} icon={icon} /> : undefined
            }
            isAction
            onPress={onCustom}
            accessibilityState={{ selected: isCustom }}
          />
        </View>
        <Text variant="secondaryText" style={styles.note}>
          {t('course.settings.colourNote')}
        </Text>
      </ModalContent>
    </BottomModal>
  );
};

interface IconProps {
  visible: boolean;
  color: string;
  icon?: string;
  onPick: (icon: string | null) => void;
  onClose: () => void;
}

const icons = Object.keys(courseIcons);

/**
 * Every course icon as a grid of tiles in the course colour. The chosen one
 * has a ring; "Use the open book" goes back to the default.
 */
export const CourseIconSheet = ({
  visible,
  color,
  icon,
  onPick,
  onClose,
}: IconProps) => {
  const { t } = useTranslation();
  const styles = useStylesheet(createStyles);
  return (
    <BottomModal visible={visible} onClose={onClose}>
      <ModalContent title={t('course.settings.iconTitle')} close={onClose}>
        <View
          style={styles.grid}
          accessibilityRole="radiogroup"
          accessibilityLabel={t('course.settings.iconTitle')}
        >
          {icons.map(key => {
            const checked = key === icon;
            return (
              <TouchableOpacity
                key={key}
                style={[styles.cell, checked && styles.cellOn]}
                onPress={() => onPick(key)}
                accessibilityRole="radio"
                accessibilityState={{ checked }}
                accessibilityLabel={iconLabel(key)}
              >
                <CourseTile color={color} icon={key} />
              </TouchableOpacity>
            );
          })}
        </View>
        <Text variant="secondaryText" style={styles.note}>
          {t('course.settings.iconNote')}
        </Text>
        {icon && (
          <TextButton
            style={styles.reset}
            onPress={() => onPick(null)}
            accessibilityHint={t('course.settings.defaultIconHint')}
          >
            <View style={styles.resetContent}>
              <OutlineIcon name="bookopen" color={styles.link.color} />
              <Text variant="label" style={styles.link}>
                {t('course.settings.defaultIcon')}
              </Text>
            </View>
          </TextButton>
        )}
      </ModalContent>
    </BottomModal>
  );
};

const createStyles = ({ colors, controls, layout, shapes, spacing }: Theme) =>
  StyleSheet.create({
    radio: {
      width: 24,
      height: 24,
      borderRadius: shapes.pill,
      borderWidth: 2,
      borderColor: colors.controlBorder,
      alignItems: 'center',
      justifyContent: 'center',
    },
    radioOn: {
      borderColor: colors.primary,
    },
    radioDot: {
      width: 10,
      height: 10,
      borderRadius: shapes.pill,
      backgroundColor: colors.primary,
    },
    grid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      paddingHorizontal: layout.gutter - spacing[1],
      paddingTop: spacing[2],
    },
    cell: {
      width: controls.touchTarget + spacing[3],
      height: controls.touchTarget + spacing[3],
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: shapes.md,
      borderWidth: 2,
      borderColor: colors.surface,
      margin: spacing[0.5],
    },
    cellOn: {
      borderColor: colors.focus,
    },
    reset: {
      alignSelf: 'flex-start',
      marginLeft: layout.gutter - spacing[3],
      marginTop: spacing[2],
    },
    resetContent: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing[2],
    },
    link: {
      color: colors.link,
    },
    note: {
      paddingHorizontal: layout.gutter,
      paddingTop: spacing[3],
    },
  });
