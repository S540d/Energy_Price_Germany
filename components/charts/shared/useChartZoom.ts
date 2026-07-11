import { useCallback, useRef, useState } from 'react';
import {
  Platform,
  PanResponder,
  type ScrollView,
  type GestureResponderEvent,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
} from 'react-native';

const MIN_SCALE = 1;
const MAX_SCALE = 3;
const WHEEL_ZOOM_SPEED = 0.0015;

export interface ChartZoomScrollViewProps {
  horizontal: true;
  scrollEnabled: boolean;
  showsHorizontalScrollIndicator: boolean;
  onScroll: (event: NativeSyntheticEvent<NativeScrollEvent>) => void;
  scrollEventThrottle: number;
}

export interface UseChartZoomResult {
  /** Current zoom factor (1 = no zoom). */
  scale: number;
  /** Zoomed width of the scrollable chart content. */
  contentWidth: number;
  /** Whether the chart is currently zoomed in. */
  isZoomed: boolean;
  /** Resets zoom to 1x and scrolls back to the start. */
  resetZoom: () => void;
  /** Ref to attach to the horizontal ScrollView wrapping the chart content. */
  scrollRef: React.RefObject<ScrollView | null>;
  /** Props to spread onto the horizontal ScrollView. */
  scrollViewProps: ChartZoomScrollViewProps;
  /** Props to spread onto the outer (non-scrolling) chart container for gesture handling. */
  gestureContainerProps: object;
  /** Converts an x coordinate in (zoomed) content space to viewport space, accounting for scroll offset. */
  toViewportX: (contentX: number) => number;
}

/**
 * Shared pinch-to-zoom (native) / scroll-to-zoom (web) behavior for SVG bar/scatter charts (#355).
 * Consumers use `contentWidth` in place of the static chart width for all internal
 * x-position math, and wrap that content in a horizontal ScrollView using `scrollViewProps`.
 */
export function useChartZoom(viewportWidth: number): UseChartZoomResult {
  const [scale, setScale] = useState(1);
  const [scrollX, setScrollX] = useState(0);
  const scrollRef = useRef<ScrollView>(null);
  const pinchStartDistance = useRef<number | null>(null);
  const pinchStartScale = useRef(1);

  const contentWidth = Math.round(viewportWidth * scale);
  const isZoomed = scale > 1.01;

  const resetZoom = useCallback(() => {
    setScale(1);
    setScrollX(0);
    scrollRef.current?.scrollTo({ x: 0, animated: true });
  }, []);

  const onScroll = useCallback((event: NativeSyntheticEvent<NativeScrollEvent>) => {
    setScrollX(event.nativeEvent.contentOffset.x);
  }, []);

  const getDistance = (touches: GestureResponderEvent['nativeEvent']['touches']) => {
    const [a, b] = touches;
    return Math.hypot(a.pageX - b.pageX, a.pageY - b.pageY);
  };

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponderCapture: evt => evt.nativeEvent.touches.length === 2,
      onMoveShouldSetPanResponderCapture: evt => evt.nativeEvent.touches.length === 2,
      onPanResponderGrant: evt => {
        const { touches } = evt.nativeEvent;
        if (touches.length === 2) {
          pinchStartDistance.current = getDistance(touches);
          pinchStartScale.current = scale;
        }
      },
      onPanResponderMove: evt => {
        const { touches } = evt.nativeEvent;
        if (touches.length === 2 && pinchStartDistance.current) {
          const distance = getDistance(touches);
          const ratio = distance / pinchStartDistance.current;
          const nextScale = Math.min(
            MAX_SCALE,
            Math.max(MIN_SCALE, pinchStartScale.current * ratio)
          );
          setScale(nextScale);
        }
      },
      onPanResponderRelease: () => {
        pinchStartDistance.current = null;
      },
      onPanResponderTerminate: () => {
        pinchStartDistance.current = null;
      },
    })
  ).current;

  // Web: wheel/trackpad scroll over the chart zooms in/out (matches #355 "Scroll (Web)" ask).
  const handleWheel = useCallback((event: { deltaY: number; preventDefault?: () => void }) => {
    event.preventDefault?.();
    setScale(prev => {
      const next = prev - event.deltaY * WHEEL_ZOOM_SPEED * prev;
      return Math.min(MAX_SCALE, Math.max(MIN_SCALE, next));
    });
  }, []);

  const gestureContainerProps =
    Platform.OS === 'web' ? { onWheel: handleWheel } : panResponder.panHandlers;

  const toViewportX = useCallback((contentX: number) => contentX - scrollX, [scrollX]);

  return {
    scale,
    contentWidth,
    isZoomed,
    resetZoom,
    scrollRef,
    scrollViewProps: {
      horizontal: true,
      scrollEnabled: isZoomed,
      showsHorizontalScrollIndicator: isZoomed,
      onScroll,
      scrollEventThrottle: 16,
    },
    gestureContainerProps,
    toViewportX,
  };
}
