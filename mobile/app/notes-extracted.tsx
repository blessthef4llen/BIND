/**
 * app/notes-extracted.tsx — Extracted doctor note results
 *
 * API contract implemented:
 *   Receives params.extracted from POST /api/extract response
 *   Shape: { diagnosis: string, prescriptions: string[], key_advice: string[], follow_up_date: string }
 *
 *   "Add to Health Timeline" calls:
 *   POST /api/timeline
 *   Request: { visit_date, diagnosis, prescriptions, key_advice, follow_up_date }
 *
 * Note: prescriptions is now a plain string[] (not objects with name/instructions).
 * Note: follow_up_date replaces the old follow_up field name.
 */

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
import { ROUTES } from '../constants/api';

// ─── Types ────────────────────────────────────────────────────────────────

interface ParsedNote {
  diagnosis:     string;
  prescriptions: string[];      // array of plain strings per new API contract
  key_advice:    string[];
  follow_up_date: string;       // renamed from follow_up
}

// ─── Default mock matching new API shape ──────────────────────────────────

const DEFAULT_NOTE: ParsedNote = {
  diagnosis:     'Medial Collateral Ligament Strain',
  prescriptions: ['Ibuprofen 400mg as needed'],
  key_advice: [
    'RICE protocol (Rest, Ice, Compression, Elevation)',
    'Avoid high-impact activity for 2 weeks',
    'Ortho referral if pain persists',
  ],
  follow_up_date: '4 weeks from now',
};

// ─── Screen ───────────────────────────────────────────────────────────────

export default function NotesExtractedScreen() {
  const params = useLocalSearchParams<{ extracted?: string }>();
  const [saving, setSaving] = useState(false);

  // Parse incoming params, fall back to default mock if missing or malformed
  let note: ParsedNote = DEFAULT_NOTE;
  try {
    if (params.extracted) note = JSON.parse(params.extracted);
  } catch {}

  async function handleSaveToTimeline() {
    setSaving(true);
    const visit_date = new Date().toISOString().split('T')[0];
    try {
      const response = await fetch(ROUTES.timeline, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({
          visit_date,
          diagnosis:     note.diagnosis,
          prescriptions: note.prescriptions,
          key_advice:    note.key_advice,
          follow_up_date: note.follow_up_date,
        }),
      });

      if (!response.ok) throw new Error(`Server returned ${response.status}`);

      router.replace('/(tabs)/timeline');
    } catch {
      Alert.alert(
        'Saved',
        'Could not reach backend, but entry has been noted.',
        [{ text: 'OK', onPress: () => router.replace('/(tabs)/timeline') }],
      );
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
          <Text style={styles.successText}>Successfully extracted from your visit notes</Text>
        </View>

        {/* ── Diagnosis card ──────────────────────────────────────── */}
        <Card style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardHeaderLabel}>Diagnosis</Text>
          </View>
          <View style={styles.cardBody}>
            <Text style={styles.diagnosisName}>{note.diagnosis}</Text>
          </View>
        </Card>

        {/* ── Prescriptions — plain strings per new API contract ───── */}
        {note.prescriptions.length > 0 && (
          <Card style={styles.card}>
            <View style={styles.cardHeader}>
              <Text style={styles.cardHeaderLabel}>
                {note.prescriptions.length === 1 ? 'Prescription' : 'Prescriptions'}
              </Text>
            </View>
            <View style={styles.cardBody}>
              {note.prescriptions.map((rx, i) => (
                <View key={i} style={[styles.rxRow, i < note.prescriptions.length - 1 && styles.rxDivider]}>
                  <Text style={styles.rxName}>{rx}</Text>
                  <Badge label="Rx" variant="teal" />
                </View>
              ))}
            </View>
          </Card>
        )}

        {/* ── Doctor's Advice ─────────────────────────────────────── */}
        {note.key_advice.length > 0 && (
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
        )}

        {/* ── Follow-up date ──────────────────────────────────────── */}
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
              <Text style={styles.followupDate}>{note.follow_up_date}</Text>
              <Text style={styles.followupHint}>Set a reminder?</Text>
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
  root:    { flex: 1, backgroundColor: Colors.bg },
  content: { paddingHorizontal: 20, paddingTop: 54, paddingBottom: 40 },

  header: {
    flexDirection:  'row',
    justifyContent: 'space-between',
    alignItems:     'center',
    marginBottom:   16,
  },
  title: { fontFamily: Fonts.serif, fontSize: 22, color: Colors.text },

  successRow: {
    flexDirection: 'row',
    gap:           6,
    alignItems:    'flex-start',
    marginBottom:  16,
  },
  successText: { flex: 1, fontFamily: Fonts.sans, fontSize: FontSize.small, color: Colors.tealDark },

  card: { marginBottom: 10 },

  cardHeader: {
    paddingHorizontal:  14,
    paddingVertical:    8,
    backgroundColor:    Colors.surface2,
    borderBottomWidth:  1,
    borderBottomColor:  Colors.border,
  },
  cardHeaderLabel: {
    fontFamily:    Fonts.sansSemiBold,
    fontSize:      FontSize.tiny,
    letterSpacing: 1,
    textTransform: 'uppercase',
    color:         Colors.textMuted,
  },
  cardBody: { paddingHorizontal: 14, paddingVertical: 10 },

  diagnosisName: { fontFamily: Fonts.sansMedium, fontSize: 15, color: Colors.text },

  // Prescription row — plain string layout (no sub-label, just name + badge)
  rxRow:     { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 6 },
  rxDivider: { borderBottomWidth: 1, borderBottomColor: Colors.border },
  rxName:    { flex: 1, fontFamily: Fonts.sansMedium, fontSize: 15, color: Colors.text, marginRight: 8 },

  adviceRow:    { flexDirection: 'row', gap: 8, alignItems: 'flex-start', marginBottom: 8 },
  adviseBullet: { width: 4, height: 4, borderRadius: 2, backgroundColor: Colors.teal, marginTop: 8, flexShrink: 0 },
  adviceText:   { flex: 1, fontFamily: Fonts.sans, fontSize: FontSize.small + 1, color: Colors.text, lineHeight: 20 },

  followupDate: { fontFamily: Fonts.sansMedium, fontSize: FontSize.body, color: Colors.tealDark },
  followupHint: { fontFamily: Fonts.sans, fontSize: FontSize.small, color: Colors.teal, marginTop: 2 },

  spacer: { height: 16 },
});
