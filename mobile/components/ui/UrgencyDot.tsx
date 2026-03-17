// components/ui/UrgencyDot.tsx
import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Colors } from '../../constants/theme';

type UrgencyLevel = 'high' | 'medium' | 'low';

interface UrgencyDotProps {
  level: UrgencyLevel;
}

const dotColors: Record<UrgencyLevel, string> = {
  high:   Colors.red,
  medium: Colors.amber,
  low:    Colors.tealMid,
};

export default function UrgencyDot({ level }: UrgencyDotProps) {
  return (
    <View style={[styles.dot, { backgroundColor: dotColors[level] }]} />
  );
}

const styles = StyleSheet.create({
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    flexShrink: 0,
  },
});
