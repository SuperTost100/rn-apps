import { CourseTile } from '@polito/lib/ui';

interface Props {
  color?: string;
  icon?: string;
  isHidden?: boolean;
}

/**
 * The course's tile: its icon in white on the darker shade of its colour
 */
export const CourseIcon = ({ color, icon, isHidden }: Props) => (
  <CourseTile color={color} icon={icon} isHidden={isHidden} />
);
