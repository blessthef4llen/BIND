// components/ui/SpecialtyChip.tsx
import React from 'react';
import { TouchableOpacity, Text, StyleSheet } from 'react-native';
import { Colors, Radius, Fonts, FontSize } from '../../constants/theme';

interface SpecialtyChipProps {
  label: string;
  selected: boolean;
  onPress: () => void;
}

export default function SpecialtyChip({ label, selected, onPress }: SpecialtyChipProps) {
  return (
    <TouchableOpacity
      style={[styles.chip, selected && styles.chipSelected]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <Text style={[styles.label, selected && styles.labelSelected]}>{label}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: Radius.pill,
    borderWidth: 1.5,
    borderColor: Colors.borderStrong,
    backgroundColor: Colors.surface,
    marginRight: 8,
  },
  chipSelected: {
    backgroundColor: Colors.teal,
    borderColor: Colors.teal,
  },
  label: {
    fontFamily: Fonts.sansMedium,
    fontSize: FontSize.small + 1,
    color: Colors.textMuted,
  },
  labelSelected: {
    color: '#fff',
  },
});
