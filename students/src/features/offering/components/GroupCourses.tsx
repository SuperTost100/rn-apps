import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

import { faChevronDown, faChevronUp } from '@fortawesome/free-solid-svg-icons';
import { Icon, ListItem, useTheme } from '@polito/lib/ui';
import { OfferingCourseOverview } from '@polito/student-api-client';

import { GroupCoursesExpanded } from './GroupCoursesExpanded';

interface GroupCoursesProps {
  group: { name: string; data: OfferingCourseOverview[] };
  isExpanded: boolean;
  toggleExpand: () => void;
  disabled?: boolean;
  /** How far the rows sit from the card's edge, in px past its padding */
  indent?: number;
}

/** A group of elective courses: a row that opens to show them */
export const GroupCourses = ({
  disabled,
  group,
  isExpanded,
  toggleExpand,
  indent = 0,
}: GroupCoursesProps) => {
  const { t } = useTranslation();
  const { colors, layout } = useTheme();
  const count = t('serviceInfo.catalogue.courses', {
    count: group.data.length,
  });
  return (
    <View>
      <ListItem
        title={group.name}
        multilineTitle
        subtitle={count}
        onPress={toggleExpand}
        accessibilityLabel={`${group.name}, ${count}`}
        accessibilityState={{ expanded: isExpanded }}
        containerStyle={{ paddingLeft: layout.cardPadding + indent }}
        trailingItem={
          <Icon
            icon={isExpanded ? faChevronUp : faChevronDown}
            size={16}
            color={colors.secondaryText}
          />
        }
      />
      {isExpanded && (
        <GroupCoursesExpanded
          courses={group.data}
          disabled={disabled}
          indent={indent + layout.cardPadding}
        />
      )}
    </View>
  );
};
