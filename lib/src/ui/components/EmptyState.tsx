import { IconDefinition } from '@fortawesome/fontawesome-svg-core';

import { Theme } from '../types/Theme';
import { StateBlock } from './StateBlock';

interface Props {
  icon?: IconDefinition;
  iconColor?: string;
  iconSize?: number;
  message: string;
  caption?: string;
  spacing?: number;
}

/**
 * "Nothing here": the message as a title, an optional caption and icon,
 * centred. A thin wrapper over StateBlock, kept for its existing callers
 */
export const EmptyState = ({
  icon,
  iconColor,
  message,
  caption,
  spacing,
  iconSize,
}: Props) => (
  <StateBlock
    icon={icon}
    iconColor={iconColor}
    iconSize={iconSize}
    showIcon={!!icon}
    title={message}
    text={caption}
    spacing={spacing as keyof Theme['spacing'] | undefined}
  />
);
