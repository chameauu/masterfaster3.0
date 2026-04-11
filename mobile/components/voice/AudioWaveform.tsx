import { View, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  withDelay,
} from 'react-native-reanimated';
import { useEffect } from 'react';

interface AudioWaveformProps {
  isActive: boolean;
  barCount?: number;
}

export function AudioWaveform({ isActive, barCount = 5 }: AudioWaveformProps) {
  return (
    <View style={styles.container}>
      {Array.from({ length: barCount }).map((_, index) => (
        <WaveformBar key={index} isActive={isActive} delay={index * 100} />
      ))}
    </View>
  );
}

function WaveformBar({ isActive, delay }: { isActive: boolean; delay: number }) {
  const height = useSharedValue(20);

  useEffect(() => {
    if (isActive) {
      height.value = withDelay(
        delay,
        withRepeat(
          withTiming(Math.random() * 40 + 20, { duration: 400 }),
          -1,
          true
        )
      );
    } else {
      height.value = withTiming(20);
    }
  }, [isActive, delay]);

  const animatedStyle = useAnimatedStyle(() => ({
    height: height.value,
  }));

  return <Animated.View style={[styles.bar, animatedStyle]} />;
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    height: 60,
  },
  bar: {
    width: 4,
    backgroundColor: '#4CAF50',
    borderRadius: 2,
  },
});
