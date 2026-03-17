// components/ui/OutlineButton.tsx
import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ViewStyle } from 'react-native';
import { Colors, Radius, Fonts, FontSize } from '../../constants/theme';

interface OutlineButtonProps {
  label: string;
  onPress: () => void;
  style?: ViewStyle;
}

export function OutlineButton({ label, onPress, style }: OutlineButtonProps) {
  return (
    <TouchableOpacity style={[styles.btn, style]} onPress={onPress} activeOpacity={0.7}>
      <Text style={styles.label}>{label}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  btn: {
    backgroundColor: 'transparent',
    borderRadius: Radius.sm,
    borderWidth: 1.5,
    borderColor: Colors.tealMid,
    paddingVertical: 12,
    paddingHorizontal: 20,
    alignItems: 'center',
    width: '100%',
  },
  label: {
    fontFamily: Fonts.sansMedium,
    fontSize: FontSize.body,
    color: Colors.teal,
  },
});
