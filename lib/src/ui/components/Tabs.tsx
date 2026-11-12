import {
  Children,
  PropsWithChildren,
  ReactElement,
  cloneElement,
  isValidElement,
  useEffect,
  useRef,
  useState,
} from 'react';
import {
  LayoutChangeEvent,
  NativeScrollEvent,
  NativeSyntheticEvent,
  Platform,
  ScrollView,
  ScrollViewProps,
  StyleSheet,
  View,
} from 'react-native';
import Svg, { Defs, LinearGradient, Rect, Stop } from 'react-native-svg';

import { useTheme } from '../hooks/useTheme';
import { TabProps } from './Tab';

interface Props {
  selectedIndexes?: number[];
  /**
   * The colour behind the tabs. When set, the side that has more tabs fades
   * into it over 48 px.
   */
  fadeColor?: string;
}

/** The width of the fade at a scrolling edge */
const FADE_WIDTH = 48;

const EdgeFade = ({
  color,
  side,
}: {
  color: string;
  side: 'left' | 'right';
}) => (
  <View
    pointerEvents="none"
    style={[styles.fade, side === 'left' ? styles.left : styles.right]}
  >
    <Svg width="100%" height="100%">
      <Defs>
        <LinearGradient
          id={`fade-${side}`}
          x1={side === 'left' ? '1' : '0'}
          y1="0"
          x2={side === 'left' ? '0' : '1'}
          y2="0"
        >
          <Stop offset="0" stopColor={color} stopOpacity={0} />
          <Stop offset="1" stopColor={color} stopOpacity={1} />
        </LinearGradient>
      </Defs>
      <Rect width="100%" height="100%" fill={`url(#fade-${side})`} />
    </Svg>
  </View>
);

const selectedIndexOf = (
  children: PropsWithChildren['children'],
  selectedIndexes?: number[],
) => {
  if (selectedIndexes?.length) return selectedIndexes[0];
  return Children.toArray(children).findIndex(
    c => isValidElement(c) && (c.props as TabProps).selected,
  );
};

/**
 * A horizontally scrolling row of tabs or chips. The selected tab is
 * scrolled into view when it changes.
 * To control the selection state of child tabs set the `selectedIndexes`
 * prop to an array of indexes. Leave it undefined to manually control the
 * selection on the children.
 */
export const Tabs = ({
  children,
  style,
  selectedIndexes,
  fadeColor,
  onScroll,
  onLayout,
  onContentSizeChange,
  ...rest
}: PropsWithChildren<ScrollViewProps & Props>) => {
  const { spacing, layout } = useTheme();
  const scrollRef = useRef<ScrollView>(null);
  const positions = useRef<Record<number, { x: number; width: number }>>({});
  const [viewport, setViewport] = useState({ x: 0, width: 0, content: 0 });
  const selectedIndex = selectedIndexOf(children, selectedIndexes);

  // Keep the selected tab in view, with room for the fade beside it
  useEffect(() => {
    const pos = positions.current[selectedIndex];
    if (!pos || !viewport.width) return;
    const margin = fadeColor ? FADE_WIDTH : 0;
    if (pos.x - margin < viewport.x) {
      scrollRef.current?.scrollTo({ x: Math.max(0, pos.x - margin) });
    } else if (pos.x + pos.width + margin > viewport.x + viewport.width) {
      scrollRef.current?.scrollTo({
        x: pos.x + pos.width + margin - viewport.width,
      });
    }
    // Only when the selection or the size changes, not on every scroll
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedIndex, viewport.width, viewport.content]);

  const items = Children.map(children, (c, i) => {
    if (isValidElement(c) && selectedIndexes != null) {
      c = cloneElement(c as ReactElement<TabProps>, {
        selected: selectedIndexes.includes(i),
      });
    }
    return (
      <View
        onLayout={(e: LayoutChangeEvent) => {
          const { x, width } = e.nativeEvent.layout;
          positions.current[i] = { x, width };
        }}
      >
        {c}
      </View>
    );
  });

  const scroll = (
    <ScrollView
      ref={scrollRef}
      showsHorizontalScrollIndicator={false}
      accessible={Platform.select({ android: true, ios: false })}
      accessibilityRole="tablist"
      horizontal
      scrollEventThrottle={32}
      onScroll={(e: NativeSyntheticEvent<NativeScrollEvent>) => {
        const x = e.nativeEvent.contentOffset.x;
        setViewport(v => (Math.abs(v.x - x) < 1 ? v : { ...v, x }));
        onScroll?.(e);
      }}
      onLayout={e => {
        const width = e.nativeEvent.layout.width;
        setViewport(v => (v.width === width ? v : { ...v, width }));
        onLayout?.(e);
      }}
      onContentSizeChange={(w, h) => {
        setViewport(v => (v.content === w ? v : { ...v, content: w }));
        onContentSizeChange?.(w, h);
      }}
      contentContainerStyle={[
        {
          paddingHorizontal: layout.gutter,
          paddingVertical: spacing[2],
          gap: spacing[2],
        },
        rest.contentContainerStyle,
      ]}
      style={[{ flexGrow: 0, flexShrink: 0 }, !fadeColor && style]}
      {...rest}
    >
      {items}
    </ScrollView>
  );

  if (!fadeColor) return scroll;

  const moreLeft = viewport.x > 1;
  const moreRight = viewport.x + viewport.width < viewport.content - 1;
  return (
    <View style={[styles.wrapper, style]}>
      {scroll}
      {moreLeft && <EdgeFade color={fadeColor} side="left" />}
      {moreRight && <EdgeFade color={fadeColor} side="right" />}
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    flexGrow: 0,
    flexShrink: 0,
  },
  fade: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: FADE_WIDTH,
  },
  left: {
    left: 0,
  },
  right: {
    right: 0,
  },
});
