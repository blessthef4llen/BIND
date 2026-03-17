// components/ui/MetricChip.tsx
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors, Radius, Fonts, FontSize } from '../../constants/theme';

interface MetricChipProps {
  value: string | number;
  label: string;
}

export default function MetricChip({ value, label }: MetricChipProps) {
  return (
    <View style={styles.chip}>
      <Text style={styles.value}>{value}</Text>
      <Text style={styles.label}>{label.toUpperCase()}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  chip: {
    backgroundColor: Colors.tealLight,
    borderRadius: Radius.sm,
    padding: 12,
    flex: 1,
  },
  value: {
    fontFamily: Fonts.serif,
    fontSize: 22,
    color: Colors.tealDark,
    marginBottom: 4,
  },
  label: {
    fontFamily: Fonts.sansMedium,
    fontSize: 10,
    color: Colors.teal,
    letterSpacing: 0.6,
  },
});
