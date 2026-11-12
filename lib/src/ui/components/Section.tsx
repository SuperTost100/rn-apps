import { PropsWithChildren } from 'react';
import { Platform, ViewProps } from 'react-native';

import { useTheme } from '../hooks/useTheme';
import { Col, ColProps } from './Col';

/**
 * A group of a section header and its cards. Sections are 32 px apart:
 * 24 here plus the 8 below the last card.
 */
export const Section = ({
  style,
  children,
  ...rest
}: PropsWithChildren<ViewProps & ColProps>) => {
  const { layout, spacing } = useTheme();
  return (
    <Col
      style={[{ marginBottom: layout.sectionGap - spacing[2] }, style]}
      accessible={Platform.select({
        android: true,
        ios: false,
      })}
      {...rest}
    >
      {children}
    </Col>
  );
};
