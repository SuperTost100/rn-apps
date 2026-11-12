import { PropsWithChildren } from 'react';
import { useTranslation } from 'react-i18next';
import { Linking, StyleSheet, TouchableOpacity } from 'react-native';
import ContextMenu from 'react-native-context-menu-view';

import { faEllipsisVertical } from '@fortawesome/free-solid-svg-icons';
import { APP_TIMEZONE, usePreferencesContext } from '@polito/lib/core';
import {
  Icon,
  ListItem,
  StatusChip,
  Theme,
  getIconFromMimeType,
  useStylesheet,
  useTheme,
} from '@polito/lib/ui';
import { CourseAssignment } from '@polito/student-api-client';

import {
  useRestoreAssignment,
  useWithdrawAssignment,
} from '~/core/queries/courseHooks';

import { DateTime } from 'luxon';

import { AppPreferences } from '../../../core/types/preferences';
import { useCourseContext } from '../contexts/CourseContext';
import { formatSize } from '../utils/fileTree';

interface Props {
  item: CourseAssignment;
  disabled?: boolean;
}

const Menu = ({
  assignmentId,
  isWithdrawn,
  children,
}: PropsWithChildren<{ assignmentId: number; isWithdrawn: boolean }>) => {
  const { t } = useTranslation();
  const { dark, colors } = useTheme();
  const courseId = useCourseContext();
  const { mutate: withdrawAssignment } = useWithdrawAssignment(courseId);
  const { mutate: restoreAssignment } = useRestoreAssignment(courseId);

  return (
    <ContextMenu
      dropdownMenuMode
      actions={[
        {
          title: isWithdrawn ? t('common.restore') : t('common.withdraw'),
          titleColor: dark ? colors.white : colors.black,
          destructive: !isWithdrawn,
        },
      ]}
      onPress={({ nativeEvent: { index } }) => {
        if (index !== 0) return;
        if (isWithdrawn) restoreAssignment(assignmentId);
        else withdrawAssignment(assignmentId);
      }}
    >
      {children}
    </ContextMenu>
  );
};

/**
 * A file handed in for the course: what it is, the file name, size and when
 * it was sent, and "Withdrawn" when the student took it back. The menu
 * withdraws or restores it.
 */
export const CourseAssignmentListItem = ({ item, disabled }: Props) => {
  const { t } = useTranslation();
  const { colors, controls } = useTheme();
  const styles = useStylesheet(createStyles);
  const { language } = usePreferencesContext<AppPreferences>();
  const isWithdrawn = item.deletedAt != null;
  const sent = DateTime.fromJSDate(item.uploadedAt, { zone: APP_TIMEZONE })
    .setLocale(language)
    .toFormat('ccc d LLL, HH:mm');
  const subtitle = [
    item.filename,
    formatSize(item.sizeInKiloBytes, language),
    sent,
  ]
    .filter(Boolean)
    .join(' · ');
  const withdrawn = t('course.assignments.withdrawn');

  return (
    <ListItem
      title={item.description}
      titleStyle={isWithdrawn && { color: colors.secondaryText }}
      subtitle={subtitle}
      subtitleProps={{ numberOfLines: 3 }}
      leadingItem={
        <Icon
          icon={getIconFromMimeType(item.mimeType)}
          size={controls.iconSize}
          color={colors.secondaryText}
        />
      }
      chip={
        isWithdrawn ? (
          <StatusChip label={withdrawn} tone="neutral" />
        ) : undefined
      }
      chipLabel={isWithdrawn ? withdrawn : undefined}
      onPress={() => Linking.openURL(item.url)}
      disabled={disabled}
      accessibilityLabel={[item.description, subtitle, isWithdrawn && withdrawn]
        .filter(Boolean)
        .join(', ')}
      accessibilityHint={
        disabled
          ? t('states.needsConnection')
          : t('course.assignments.opensFile')
      }
      trailingItem={
        <Menu assignmentId={item.id} isWithdrawn={isWithdrawn}>
          {/* A touchable without onPress keeps the tap from the row */}
          <TouchableOpacity
            style={styles.menuButton}
            accessibilityRole="button"
            accessibilityLabel={t('course.assignments.optionsLabel', {
              name: item.description,
            })}
          >
            <Icon
              icon={faEllipsisVertical}
              size={controls.iconSize - 4}
              color={colors.secondaryText}
            />
          </TouchableOpacity>
        </Menu>
      }
    />
  );
};

const createStyles = ({ controls, spacing }: Theme) =>
  StyleSheet.create({
    menuButton: {
      width: controls.touchTarget,
      height: controls.touchTarget,
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: -spacing[3],
    },
  });
