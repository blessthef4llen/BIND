// components/ui/Badge.tsx
import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { Colors, Radius, Fonts, FontSize } from '../../constants/theme';

export type BadgeVariant = 'teal' | 'coral' | 'amber' | 'red';

interface BadgeProps {
  label: string;
  variant?: BadgeVariant;
  style?: ViewStyle;
}

const variantStyles: Record<BadgeVariant, { bg: string; color: string }> = {
  teal:  { bg: Colors.tealLight,  color: Colors.tealDark },
  coral: { bg: Colors.coralLight, color: '#6B2A10' },
  amber: { bg: Colors.amberLight, color: '#6B3D05' },
  red:   { bg: Colors.redLight,   color: '#701414' },
};

export default function Badge({ label, variant = 'teal', style }: BadgeProps) {
  const { bg, color } = variantStyles[variant];
  return (
    <View style={[styles.badge, { backgroundColor: bg }, style]}>
      <Text style={[styles.label, { color }]}>{label.toUpperCase()}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: Radius.pill,
    alignSelf: 'flex-start',
  },
  label: {
    fontFamily: Fonts.sansSemiBold,
    fontSize: FontSize.tiny,
    letterSpacing: 0.5,
  },
});
