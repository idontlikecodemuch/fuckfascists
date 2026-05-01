import { useEffect, useRef } from 'react';
import { Animated } from 'react-native';
import {
  CARD_OVERLAY_SLIDE_DISTANCE,
  CARD_OVERLAY_SLIDE_IN_MS,
  CARD_OVERLAY_SLIDE_OUT_MS,
  CARD_OVERLAY_DIM_PEAK_OPACITY,
} from '../../config/constants';

/**
 * Slide-in/slide-out + dim-fade animation pair for the BusinessCard overlay.
 * Shared by Map + Track. Caller controls visibility via the `visible` flag;
 * the returned Animated.Values drive:
 *   - slideY → translateY on the bottom-anchored card container
 *   - dimOpacity → opacity on the full-screen dim/tap-dismiss backdrop
 *
 * Both screens are responsible for keeping their backdrop + card mounted
 * (persistent mount via lastResultRef) so the slide-out animation has
 * something to animate. The hook does not assume ownership of the JSX.
 */
export function useCardOverlayAnimation(visible: boolean): {
  slideY: Animated.Value;
  dimOpacity: Animated.Value;
} {
  const slideY = useRef(new Animated.Value(CARD_OVERLAY_SLIDE_DISTANCE)).current;
  const dimOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.spring(slideY, {
          toValue: 0,
          useNativeDriver: true,
          friction: 11,
          tension: 70,
        }),
        Animated.timing(dimOpacity, {
          toValue: CARD_OVERLAY_DIM_PEAK_OPACITY,
          duration: CARD_OVERLAY_SLIDE_IN_MS,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(slideY, {
          toValue: CARD_OVERLAY_SLIDE_DISTANCE,
          duration: CARD_OVERLAY_SLIDE_OUT_MS,
          useNativeDriver: true,
        }),
        Animated.timing(dimOpacity, {
          toValue: 0,
          duration: CARD_OVERLAY_SLIDE_OUT_MS,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible, slideY, dimOpacity]);

  return { slideY, dimOpacity };
}
