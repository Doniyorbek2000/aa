import { useImperativeHandle, type Ref } from 'react';
import { StyleSheet } from 'react-native';
import { Image } from 'expo-image';
import {
  GestureDetector,
  usePanGesture,
  usePinchGesture,
  useRotationGesture,
  useSimultaneousGestures,
} from 'react-native-gesture-handler';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';

const MIN_SCALE = 0.35;
const MAX_SCALE = 3;

export interface GarmentOverlayHandle {
  reset: () => void;
}

interface GarmentOverlayProps {
  uri: string;
  width: number;
  ref?: Ref<GarmentOverlayHandle>;
}

/** Garment drawn over the camera: one finger moves it, pinch resizes, two-finger twist rotates. */
export function GarmentOverlay({ uri, width, ref }: GarmentOverlayProps) {
  const x = useSharedValue(0);
  const y = useSharedValue(0);
  const scale = useSharedValue(1);
  const rotation = useSharedValue(0);

  useImperativeHandle(ref, () => ({
    reset: () => {
      x.value = withSpring(0);
      y.value = withSpring(0);
      scale.value = withSpring(1);
      rotation.value = withSpring(0);
    },
  }));

  const pan = usePanGesture({
    onUpdate: (e) => {
      'worklet';
      x.value += e.changeX;
      y.value += e.changeY;
    },
  });
  const pinch = usePinchGesture({
    onUpdate: (e) => {
      'worklet';
      scale.value = Math.min(MAX_SCALE, Math.max(MIN_SCALE, scale.value * e.scaleChange));
    },
  });
  const rotate = useRotationGesture({
    onUpdate: (e) => {
      'worklet';
      rotation.value += e.rotationChange;
    },
  });
  const gesture = useSimultaneousGestures(pan, pinch, rotate);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: x.value },
      { translateY: y.value },
      { scale: scale.value },
      { rotate: `${rotation.value}rad` },
    ],
  }));

  return (
    <GestureDetector gesture={gesture}>
      <Animated.View style={[styles.layer, animatedStyle]} collapsable={false}>
        <Image
          source={{ uri }}
          style={{ width, height: width * 1.25 }}
          contentFit="contain"
          transition={180}
          accessibilityLabel="Garment overlay"
        />
      </Animated.View>
    </GestureDetector>
  );
}

const styles = StyleSheet.create({
  layer: { position: 'absolute', alignSelf: 'center', top: '18%' },
});
