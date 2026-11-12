import { ReactElement } from 'react';
import { View, ViewProps } from 'react-native';

import { dateFormatter } from '@polito/lib/core';
import { ScreenTitle, Text, useTheme } from '@polito/lib/ui';

type Props = ViewProps & {
  title?: string;
  type?: string;
  time?: string | ReactElement;
  endTime?: Date;
  timeLabel?: string;
};

export const EventDetails = ({
  endTime,
  title,
  type,
  time,
  timeLabel,
  ...rest
}: Props) => {
  const { spacing } = useTheme();
  const formatHHmm = dateFormatter('HH:mm');
  return (
    <View style={{ padding: spacing[5] }} {...rest}>
      <ScreenTitle style={{ marginBottom: spacing[2] }} title={title} />
      <Text variant="caption" style={{ marginBottom: spacing[2] }}>
        {type}
      </Text>
      {time &&
        (typeof time === 'string' ? (
          <Text>
            {time}
            {endTime && ` - ${formatHHmm(endTime)}`}
          </Text>
        ) : (
          time
        ))}
      {!!timeLabel && <Text>{timeLabel}</Text>}
    </View>
  );
};
