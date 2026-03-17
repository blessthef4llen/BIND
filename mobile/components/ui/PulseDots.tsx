// components/ui/PulseDots.tsx
// Animated 3-dot loading indicator — Animated.loop with staggered delays
import React, { useEffect, useRef } from 'react';
import { View, Animated, StyleSheet } from 'react-native';
import { Colors } from '../../constants/theme';

interface PulseDotsProps {
  color?: string;
  size?: number;
}

function PulseDot({ delay, color, size }: { delay: number; color: string; size: number }) {
  const opacity = useRef(new Animated.Value(0.3)).current;
  const scale   = useRef(new Animated.Value(0.8)).current;

  useEffect(() => {
    const anim = Animated.loop(
      Animated.sequence([
        Animated.delay(delay),
        Animated.parallel([
          Animated.timing(opacity, {
            toValue: 1,
            duration: 300,
            useNativeDriver: true,
          }),
          Animated.timing(scale, {
            toValue: 1,
            duration: 300,
            useNativeDriver: true,
          }),
        ]),
        Animated.parallel([
          Animated.timing(opacity, {
            toValue: 0.3,
            duration: 300,
            useNativeDriver: true,
          }),
          Animated.timing(scale, {
            toValue: 0.8,
            duration: 300,
            useNativeDriver: true,
          }),
        ]),
        Animated.delay(600 - delay),
      ])
    );
    anim.start();
    return () => anim.stop();
  }, []);

  return (
    <Animated.View
      style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        backgroundColor: color,
        opacity,
        transform: [{ scale }],
      }}
    />
  );
}

export default function PulseDots({ color = Colors.tealMid, size = 8 }: PulseDotsProps) {
  return (
    <View style={styles.row}>
      <PulseDot delay={0}   color={color} size={size} />
      <PulseDot delay={200} color={color} size={size} />
      <PulseDot delay={400} color={color} size={size} />
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    justifyContent: 'center',
    paddingVertical: 14,
  },
});
