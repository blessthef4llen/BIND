// components/ui/AIChip.tsx
import React, { useEffect, useRef } from 'react';
import { View, Text, Animated, StyleSheet } from 'react-native';
import { Colors, Radius, Fonts, FontSize } from '../../constants/theme';

interface AIChipProps {
  label?: string;
}

export default function AIChip({ label = 'AI Generated' }: AIChipProps) {
  const opacity = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const anim = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, { toValue: 0.3, duration: 600, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 1,   duration: 600, useNativeDriver: true }),
      ])
    );
    anim.start();
    return () => anim.stop();
  }, []);

  return (
    <View style={styles.chip}>
      <Animated.View style={[styles.dot, { opacity }]} />
      <Text style={styles.label}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: Colors.tealLight,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: Radius.pill,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.teal,
  },
  label: {
    fontFamily: Fonts.sansSemiBold,
    fontSize: FontSize.tiny,
    color: Colors.tealDark,
  },
});
