// components/ui/SectionHead.tsx
import React from 'react';
import { Text, StyleSheet, TextStyle } from 'react-native';
import { Colors, Fonts, FontSize } from '../../constants/theme';

interface SectionHeadProps {
  label: string;
  style?: TextStyle;
}

export default function SectionHead({ label, style }: SectionHeadProps) {
  return (
    <Text style={[styles.text, style]}>{label.toUpperCase()}</Text>
  );
}

const styles = StyleSheet.create({
  text: {
    fontFamily: Fonts.sansSemiBold,
    fontSize: FontSize.section,
    letterSpacing: 1.1,
    color: Colors.textFaint,
    marginBottom: 10,
  },
});
