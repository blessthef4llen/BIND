// app/body-map.tsx — Screen 04: Body Map Selection
import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { router } from 'expo-router';
import { Colors, Fonts, FontSize, Radius } from '../constants/theme';
import BodyMap from '../components/BodyMap';
import GhostButton from '../components/ui/GhostButton';
import { ZONE_LABELS } from '../constants/bodyZones';

export default function BodyMapScreen() {
  const [selectedZone, setSelectedZone] = useState<string | null>(null);

  function handleNext() {
    if (!selectedZone) return;
    router.push({
      pathname: '/(tabs)/log',
      params: { bodyArea: ZONE_LABELS[selectedZone] ?? selectedZone },
    });
  }

  return (
    <View style={styles.root}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Progress */}
        <View style={styles.progressMeta}>
          <Text style={styles.stepLabel}>Step 1 of 3</Text>
          <Text style={styles.title}>Where does it hurt?</Text>
        </View>
        <View style={styles.progressTrack}>
          <View style={styles.progressFill} />
        </View>

        {/* Body map */}
        <View style={styles.mapWrapper}>
          <BodyMap selectedZone={selectedZone} onZoneSelect={setSelectedZone} />
        </View>
      </ScrollView>

      {/* Confirmation bar */}
      {selectedZone && (
        <View style={styles.confirmBar}>
          <View style={styles.confirmText}>
            <Text style={styles.confirmZone}>{ZONE_LABELS[selectedZone] ?? selectedZone} selected</Text>
            <Text style={styles.confirmHint}>Tap another area to change</Text>
          </View>
          <GhostButton label="Next →" onPress={handleNext} />
        </View>
      )}

      {!selectedZone && (
        <View style={styles.hintBar}>
          <Text style={styles.hintText}>Tap a body area to select it</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.bg },
  content: { paddingHorizontal: 20, paddingBottom: 120 },
  progressMeta: { paddingTop: 54, marginBottom: 10 },
  stepLabel: { fontFamily: Fonts.sans, fontSize: FontSize.small, color: Colors.textMuted, marginBottom: 4 },
  title: { fontFamily: Fonts.serif, fontSize: 22, color: Colors.text },
  progressTrack: {
    height: 3,
    backgroundColor: Colors.border,
    borderRadius: 2,
    marginBottom: 24,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    width: '33%',
    backgroundColor: Colors.teal,
    borderRadius: 2,
  },
  mapWrapper: {
    alignItems: 'center',
    marginBottom: 24,
  },
  confirmBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: Colors.tealLight,
    paddingHorizontal: 20,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  confirmText: { flex: 1 },
  confirmZone: { fontFamily: Fonts.sansMedium, fontSize: FontSize.small + 1, color: Colors.tealDark },
  confirmHint: { fontFamily: Fonts.sans, fontSize: FontSize.tiny, color: Colors.teal, marginTop: 2 },
  hintBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: Colors.surface2,
    padding: 16,
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  hintText: { fontFamily: Fonts.sans, fontSize: FontSize.small, color: Colors.textMuted },
});
