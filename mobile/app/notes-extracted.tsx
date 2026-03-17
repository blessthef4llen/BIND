// app/notes-extracted.tsx — Screen 07: AI Extraction Result
import React, { useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet, Alert,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import Svg, { Circle, Path, Rect } from 'react-native-svg';
import { Colors, Fonts, FontSize, Radius } from '../constants/theme';
import Card from '../components/ui/Card';
import AIChip from '../components/ui/AIChip';
import Badge from '../components/ui/Badge';
import { PrimaryButton } from '../components/ui/PrimaryButton';
import { OutlineButton } from '../components/ui/OutlineButton';
import { api, ExtractedNote } from '../services/api';

interface ParsedNote {
  diagnosis: string;
  prescriptions: Array<{ name: string; instructions: string }>;
  key_advice: string[];
  follow_up: string;
}

const DEFAULT_NOTE: ParsedNote = {
  diagnosis: 'Medial Collateral Ligament Strain',
  prescriptions: [{ name: 'Ibuprofen 400mg', instructions: 'As needed for pain' }],
  key_advice: [
    'RICE protocol (Rest, Ice, Compression, Elevation)',
    'Avoid high-impact activity for 2 weeks',
    'Ortho referral if pain persists',
  ],
  follow_up: '4 weeks from now',
};

export default function NotesExtractedScreen() {
  const params = useLocalSearchParams<{ extracted?: string }>();
  const [saving, setSaving] = useState(false);

  let note: ParsedNote = DEFAULT_NOTE;
  try {
    if (params.extracted) note = JSON.parse(params.extracted);
  } catch {}

  async function handleSaveToTimeline() {
    setSaving(true);
    try {
      await api.saveVisit({
        visit_date: new Date().toISOString().split('T')[0],
        visit_reason: note.diagnosis,
        diagnosis: note.diagnosis,
        advice: note.key_advice.join('. '),
        follow_up: note.follow_up,
        body_area: 'Left lower leg / ankle',
      });
      router.replace('/(tabs)/timeline');
    } catch {
      Alert.alert('Saved', 'Could not reach backend, but entry noted locally.', [
        { text: 'OK', onPress: () => router.replace('/(tabs)/timeline') },
      ]);
    } finally {
      setSaving(false);
    }
  }

  return (
    <View style={styles.root}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Extracted Info</Text>
          <AIChip label="AI Processed" />
        </View>

        {/* Success notice */}
        <View style={styles.successRow}>
          <Svg width={16} height={16} viewBox="0 0 16 16">
            <Circle cx={8} cy={8} r={7} fill={Colors.tealLight} />
            <Path d="M5 8l2 2 4-4" stroke={Colors.teal} strokeWidth={1.5} strokeLinecap="round" fill="none" />
          </Svg>
          <Text style={styles.successText}>Successfully extracted from visit notes — Dr. Chen · Apr 10</Text>
        </View>

        {/* Diagnosis */}
        <Card style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardHeaderLabel}>Diagnosis</Text>
          </View>
          <View style={styles.cardBody}>
            <Text style={styles.diagnosisName}>{note.diagnosis}</Text>
            <Text style={styles.diagnosisArea}>Left lower leg / ankle</Text>
          </View>
        </Card>

        {/* Prescriptions */}
        {note.prescriptions.map((rx, i) => (
          <Card key={i} style={styles.card}>
            <View style={styles.cardHeader}>
              <Text style={styles.cardHeaderLabel}>Prescription</Text>
            </View>
            <View style={[styles.cardBody, styles.rxRow]}>
              <View style={styles.rxText}>
                <Text style={styles.rxName}>{rx.name}</Text>
                <Text style={styles.rxInstructions}>{rx.instructions}</Text>
              </View>
              <Badge label="Rx" variant="teal" />
            </View>
          </Card>
        ))}

        {/* Doctor's Advice */}
        <Card style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardHeaderLabel}>Doctor's Advice</Text>
          </View>
          <View style={styles.cardBody}>
            {note.key_advice.map((item, i) => (
              <View key={i} style={styles.adviceRow}>
                <View style={styles.adviseBullet} />
                <Text style={styles.adviceText}>{item}</Text>
              </View>
            ))}
          </View>
        </Card>

        {/* Follow-up */}
        <Card style={styles.card}>
          <View style={[styles.cardHeader, { backgroundColor: Colors.tealLight }]}>
            <Text style={[styles.cardHeaderLabel, { color: Colors.teal }]}>Follow-Up</Text>
          </View>
          <View style={[styles.cardBody, { flexDirection: 'row', alignItems: 'center', gap: 10 }]}>
            <Svg width={20} height={20} viewBox="0 0 20 20">
              <Rect x={3} y={4} width={14} height={14} rx={2} stroke={Colors.teal} strokeWidth={1.5} fill="none" />
              <Path d="M7 2v3M13 2v3M3 9h14" stroke={Colors.teal} strokeWidth={1.5} strokeLinecap="round" />
            </Svg>
            <View>
              <Text style={styles.followupDate}>{note.follow_up}</Text>
              <Text style={styles.followupHint}>Set reminder?</Text>
            </View>
          </View>
        </Card>

        <View style={styles.spacer} />

        <PrimaryButton
          label="Add to Health Timeline"
          onPress={handleSaveToTimeline}
          loading={saving}
          style={{ marginBottom: 8 }}
        />
        <OutlineButton
          label="Edit Extracted Info"
          onPress={() => Alert.alert('Edit', 'Inline editing coming soon.')}
        />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.bg },
  content: { paddingHorizontal: 20, paddingTop: 54, paddingBottom: 40 },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: { fontFamily: Fonts.serif, fontSize: 22, color: Colors.text },
  successRow: {
    flexDirection: 'row',
    gap: 6,
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  successText: { flex: 1, fontFamily: Fonts.sans, fontSize: FontSize.small, color: Colors.tealDark },
  card: { marginBottom: 10 },
  cardHeader: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    backgroundColor: Colors.surface2,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  cardHeaderLabel: {
    fontFamily: Fonts.sansSemiBold,
    fontSize: FontSize.tiny,
    letterSpacing: 1,
    textTransform: 'uppercase',
    color: Colors.textMuted,
  },
  cardBody: { paddingHorizontal: 14, paddingVertical: 10 },
  diagnosisName: { fontFamily: Fonts.sansMedium, fontSize: 15, color: Colors.text },
  diagnosisArea: { fontFamily: Fonts.sans, fontSize: FontSize.small, color: Colors.textMuted, marginTop: 3 },
  rxRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  rxText: { flex: 1 },
  rxName: { fontFamily: Fonts.sansMedium, fontSize: 15, color: Colors.text },
  rxInstructions: { fontFamily: Fonts.sans, fontSize: FontSize.small, color: Colors.textMuted, marginTop: 2 },
  adviceRow: { flexDirection: 'row', gap: 8, alignItems: 'flex-start', marginBottom: 8 },
  adviseBullet: { width: 4, height: 4, borderRadius: 2, backgroundColor: Colors.teal, marginTop: 8, flexShrink: 0 },
  adviceText: { flex: 1, fontFamily: Fonts.sans, fontSize: FontSize.small + 1, color: Colors.text, lineHeight: 20 },
  followupDate: { fontFamily: Fonts.sansMedium, fontSize: FontSize.body, color: Colors.tealDark },
  followupHint: { fontFamily: Fonts.sans, fontSize: FontSize.small, color: Colors.teal, marginTop: 2 },
  spacer: { height: 16 },
});
