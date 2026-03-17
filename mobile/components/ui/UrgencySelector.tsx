// components/ui/UrgencySelector.tsx
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Colors, Radius, Fonts, FontSize } from '../../constants/theme';

type UrgencyLevel = 'low' | 'medium' | 'high';

interface UrgencySelectorProps {
  selected: UrgencyLevel;
  onChange: (level: UrgencyLevel) => void;
}

const OPTIONS: { key: UrgencyLevel; label: string }[] = [
  { key: 'low',    label: 'Low' },
  { key: 'medium', label: 'Medium' },
  { key: 'high',   label: 'High' },
];

const selectedStyles: Record<UrgencyLevel, { backgroundColor: string; borderColor: string; color: string }> = {
  low:    { backgroundColor: Colors.tealLight,  borderColor: Colors.tealMid, color: Colors.tealDark },
  medium: { backgroundColor: Colors.amberLight, borderColor: Colors.amber,   color: '#6B3D05' },
  high:   { backgroundColor: Colors.redLight,   borderColor: Colors.red,     color: '#701414' },
};

export default function UrgencySelector({ selected, onChange }: UrgencySelectorProps) {
  return (
    <View style={styles.row}>
      {OPTIONS.map(({ key, label }) => {
        const isSelected = selected === key;
        const sel = selectedStyles[key];
        return (
          <TouchableOpacity
            key={key}
            style={[
              styles.btn,
              isSelected && {
                backgroundColor: sel.backgroundColor,
                borderColor: sel.borderColor,
              },
            ]}
            onPress={() => onChange(key)}
            activeOpacity={0.7}
          >
            <Text
              style={[
                styles.label,
                isSelected && { color: sel.color, fontFamily: Fonts.sansMedium },
              ]}
            >
              {label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: 8,
  },
  btn: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 4,
    borderRadius: Radius.xs,
    borderWidth: 1.5,
    borderColor: Colors.borderStrong,
    backgroundColor: Colors.surface,
    alignItems: 'center',
  },
  label: {
    fontFamily: Fonts.sans,
    fontSize: FontSize.small,
    color: Colors.textMuted,
  },
});
