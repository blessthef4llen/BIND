// components/ui/TipCard.tsx
// Green gradient card — uses expo-linear-gradient
// Install: npx expo install expo-linear-gradient
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Radius, Fonts, FontSize } from '../../constants/theme';

interface TipCardProps {
  doctorName: string;
  specialty: string;
  dateTime: string;
  concernCount?: number;
  prepReady?: boolean;
}

export default function TipCard({
  doctorName,
  specialty,
  dateTime,
  concernCount = 0,
  prepReady = false,
}: TipCardProps) {
  return (
    <LinearGradient
      colors={['#1D9E75', '#0F6E56']}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.card}
    >
      <Text style={styles.upcomingLabel}>Upcoming Visit</Text>
      <Text style={styles.doctorName}>{doctorName} — {specialty}</Text>
      <Text style={styles.dateTime}>{dateTime}</Text>
      <View style={styles.tagRow}>
        {concernCount > 0 && (
          <View style={styles.tag}>
            <Text style={styles.tagText}>{concernCount} concerns logged</Text>
          </View>
        )}
        {prepReady && (
          <View style={styles.tag}>
            <Text style={styles.tagText}>Prep ready</Text>
          </View>
        )}
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: Radius.md,
    padding: 16,
  },
  upcomingLabel: {
    fontFamily: Fonts.sansSemiBold,
    fontSize: 10,
    letterSpacing: 1,
    color: 'rgba(255,255,255,0.6)',
    textTransform: 'uppercase',
    marginBottom: 6,
  },
  doctorName: {
    fontFamily: Fonts.sansMedium,
    fontSize: FontSize.regular,
    color: '#fff',
    marginBottom: 4,
  },
  dateTime: {
    fontFamily: Fonts.sans,
    fontSize: FontSize.small,
    color: 'rgba(255,255,255,0.7)',
  },
  tagRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 12,
  },
  tag: {
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 6,
    paddingVertical: 6,
    paddingHorizontal: 10,
  },
  tagText: {
    fontFamily: Fonts.sans,
    fontSize: 12,
    color: 'rgba(255,255,255,0.9)',
  },
});
