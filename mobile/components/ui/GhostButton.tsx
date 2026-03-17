// components/ui/GhostButton.tsx
import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ViewStyle } from 'react-native';
import { Colors, Radius, Fonts, FontSize } from '../../constants/theme';

interface GhostButtonProps {
  label: string;
  onPress: () => void;
  style?: ViewStyle;
}

export default function GhostButton({ label, onPress, style }: GhostButtonProps) {
  return (
    <TouchableOpacity style={[styles.btn, style]} onPress={onPress} activeOpacity={0.7}>
      <Text style={styles.label}>{label}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  btn: {
    backgroundColor: Colors.tealLight,
    borderRadius: Radius.xs,
    paddingVertical: 8,
    paddingHorizontal: 14,
    alignSelf: 'flex-start',
  },
  label: {
    fontFamily: Fonts.sansMedium,
    fontSize: FontSize.small,
    color: Colors.tealDark,
  },
});
