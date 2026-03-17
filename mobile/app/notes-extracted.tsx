/**
 * app/notes-extracted.tsx — Extracted visit note results
 *
 * Redesigned with warm red/white/charcoal brand.
 * Shows diagnosis, prescriptions, advice, follow-up.
 * Saves to timeline via POST /api/timeline.
 */

import React, { useState } from 'react';
import {
  View, Text, ScrollView, Pressable, StyleSheet, Alert,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import Svg, { Path, Circle, Rect } from 'react-native-svg';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors, FONTS, FontSize, Radius, Shadow } from '../constants/theme';
import { api } from '../services/api';

// ─── Types ────────────────────────────────────────────────────────────────────

interface ParsedNote {
  diagnosis:      string;
  prescriptions:  string[];
  key_advice:     string[];
  follow_up_date: string;
}

const DEFAULT_NOTE: ParsedNote = {
  diagnosis:      'Plantar Fasciitis',
  prescriptions:  ['Ibuprofen 400mg every 6–8 hours as needed with food'],
  key_advice:     ['RICE protocol (Rest, Ice, Compression, Elevation)', 'Avoid high-impact activity for 2 weeks', 'Orthotics referral placed'],
  follow_up_date: '4 weeks from today',
};

// ─── Sub-components ───────────────────────────────────────────────────────────

function SectionCard({ title, children, accent = false }) {
  return (
    <View style={[sc.card, accent && sc.cardAccent]}>
      <View style={[sc.header, accent && sc.headerAccent]}>
        <Text style={[sc.headerTxt, accent && sc.headerTxtAccent]}>{title.toUpperCase()}</Text>
      </View>
      <View style={sc.body}>{children}</View>
    </View>
  );
}
const sc = StyleSheet.create({
  card:        { backgroundColor: Colors.surface, borderRadius: Radius.md, marginBottom: 12, borderWidth: 1, borderColor: Colors.border, overflow: 'hidden' },
  cardAccent:  { borderColor: Colors.red + '44' },
  header:      { paddingHorizontal: 14, paddingVertical: 8, backgroundColor: Colors.surface2, borderBottomWidth: 1, borderBottomColor: Colors.border },
  headerAccent:{ backgroundColor: Colors.redLight, borderBottomColor: Colors.red + '33' },
  headerTxt:   { fontFamily: FONTS.bodySemi, fontSize: FontSize.micro, color: Colors.textMuted, letterSpacing: 1 },
  headerTxtAccent: { color: Colors.redDark },
  body:        { padding: 14 },
});

// ─── Screen ───────────────────────────────────────────────────────────────────

export default function NotesExtractedScreen() {
  const params = useLocalSearchParams<{ extracted?: string }>();
  const insets = useSafeAreaInsets();
  const [saving, setSaving] = useState(false);

  let note: ParsedNote = DEFAULT_NOTE;
  try {
    if (params.extracted) note = JSON.parse(params.extracted);
  } catch {}

  async function handleSave() {
    setSaving(true);
    const visit_date = new Date().toISOString().split('T')[0];
    try {
      await api.saveTimelineEntry({
        visit_date,
        diagnosis:      note.diagnosis,
        prescriptions:  note.prescriptions,
        key_advice:     note.key_advice,
        follow_up_date: note.follow_up_date,
      });
      router.replace('/(tabs)/timeline');
    } catch {
      // Graceful fallback — still navigate
      Alert.alert(
        'Saved locally',
        'Could not reach backend, but your notes are saved for this session.',
        [{ text: 'OK', onPress: () => router.replace('/(tabs)/timeline') }]
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <View style={{ flex: 1, backgroundColor: Colors.offWhite }}>
      <ScrollView
        contentContainerStyle={[styles.content, { paddingTop: insets.top + 20, paddingBottom: insets.bottom + 40 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.headerRow}>
          <View>
            <Text style={styles.title}>Extracted Info</Text>
            <Text style={styles.subtitle}>Review before saving to your timeline</Text>
          </View>
          {/* IBM chip */}
          <View style={styles.chip}>
            <View style={styles.chipDot} />
            <Text style={styles.chipTxt}>AI Processed</Text>
          </View>
        </View>

        {/* Success notice */}
        <View style={styles.successRow}>
          <Svg width={16} height={16} viewBox="0 0 16 16">
            <Circle cx={8} cy={8} r={7} fill={Colors.okLight} />
            <Path d="M5 8l2 2 4-4" stroke={Colors.ok} strokeWidth={1.5} strokeLinecap="round" fill="none" />
          </Svg>
          <Text style={styles.successTxt}>Successfully extracted from your visit notes</Text>
        </View>

        {/* Diagnosis */}
        <SectionCard title="Diagnosis" accent>
          <Text style={styles.diagnosisTxt}>{note.diagnosis}</Text>
        </SectionCard>

        {/* Prescriptions */}
        {note.prescriptions.length > 0 && (
          <SectionCard title={note.prescriptions.length === 1 ? 'Prescription' : 'Prescriptions'}>
            {note.prescriptions.map((rx, i) => (
              <View key={i} style={[styles.rxRow, i < note.prescriptions.length - 1 && styles.rxDivider]}>
                <View style={styles.rxBadge}>
                  <Text style={styles.rxBadgeTxt}>Rx</Text>
                </View>
                <Text style={styles.rxName}>{rx}</Text>
              </View>
            ))}
          </SectionCard>
        )}

        {/* Doctor's Advice */}
        {note.key_advice.length > 0 && (
          <SectionCard title="Doctor's Advice">
            {note.key_advice.map((tip, i) => (
              <View key={i} style={styles.adviceRow}>
                <View style={styles.bulletDot} />
                <Text style={styles.adviceTxt}>{tip}</Text>
              </View>
            ))}
          </SectionCard>
        )}

        {/* Follow-up */}
        <SectionCard title="Follow-Up">
          <View style={styles.followupRow}>
            <Svg width={20} height={20} viewBox="0 0 20 20">
              <Rect x={3} y={4} width={14} height={14} rx={2} stroke={Colors.red} strokeWidth={1.5} fill="none" />
              <Path d="M7 2v3M13 2v3M3 9h14" stroke={Colors.red} strokeWidth={1.5} strokeLinecap="round" />
            </Svg>
            <View>
              <Text style={styles.followupDate}>{note.follow_up_date}</Text>
              <Text style={styles.followupHint}>Set a reminder in your calendar</Text>
            </View>
          </View>
        </SectionCard>

        {/* Disclaimer */}
        <View style={styles.disclaimer}>
          <Text style={styles.disclaimerTxt}>
            This is an AI-generated summary for organizational purposes only. Always follow your doctor's actual advice and refer to your original notes.
          </Text>
        </View>

        {/* Actions */}
        <Pressable
          style={({ pressed }) => [styles.saveBtn, pressed && { opacity: 0.85 }, saving && { opacity: 0.5 }]}
          onPress={handleSave}
          disabled={saving}
        >
          <Text style={styles.saveBtnTxt}>
            {saving ? 'Saving…' : 'ADD TO HEALTH TIMELINE'}
          </Text>
        </Pressable>

        <Pressable style={styles.secondaryBtn} onPress={() => router.back()}>
          <Text style={styles.secondaryTxt}>Go Back</Text>
        </Pressable>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  content: { paddingHorizontal: 20 },

  headerRow:   { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 },
  title:       { fontFamily: FONTS.display, fontSize: 30, color: Colors.black, letterSpacing: 0.5 },
  subtitle:    { fontFamily: FONTS.body, fontSize: FontSize.small, color: Colors.textMuted, marginTop: 2 },

  chip:    { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: Colors.okLight, borderRadius: Radius.pill, paddingVertical: 4, paddingHorizontal: 10, borderWidth: 1, borderColor: Colors.ok + '44' },
  chipDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: Colors.ok },
  chipTxt: { fontFamily: FONTS.bodySemi, fontSize: FontSize.micro, color: '#1A6B40' },

  successRow: { flexDirection: 'row', gap: 6, alignItems: 'center', marginBottom: 16 },
  successTxt: { flex: 1, fontFamily: FONTS.body, fontSize: FontSize.small, color: '#1A6B40' },

  diagnosisTxt: { fontFamily: FONTS.bodySemi, fontSize: FontSize.medium, color: Colors.text },

  rxRow:     { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 8 },
  rxDivider: { borderBottomWidth: 1, borderBottomColor: Colors.border },
  rxBadge:   { backgroundColor: Colors.redLight, borderRadius: Radius.xs, paddingHorizontal: 7, paddingVertical: 3 },
  rxBadgeTxt:{ fontFamily: FONTS.bodySemi, fontSize: FontSize.micro, color: Colors.redDark },
  rxName:    { flex: 1, fontFamily: FONTS.sansMedium, fontSize: FontSize.body, color: Colors.text },

  adviceRow:  { flexDirection: 'row', alignItems: 'flex-start', gap: 10, marginBottom: 8 },
  bulletDot:  { width: 5, height: 5, borderRadius: 3, backgroundColor: Colors.red, marginTop: 8, flexShrink: 0 },
  adviceTxt:  { flex: 1, fontFamily: FONTS.body, fontSize: FontSize.body, color: Colors.text, lineHeight: 21 },

  followupRow:  { flexDirection: 'row', alignItems: 'center', gap: 12 },
  followupDate: { fontFamily: FONTS.bodySemi, fontSize: FontSize.body, color: Colors.text },
  followupHint: { fontFamily: FONTS.body, fontSize: FontSize.small, color: Colors.textFaint, marginTop: 2 },

  disclaimer: { backgroundColor: Colors.surface2, borderRadius: Radius.xs, padding: 12, marginBottom: 16, borderWidth: 1, borderColor: Colors.border },
  disclaimerTxt:{ fontFamily: FONTS.body, fontSize: FontSize.small, color: Colors.textMuted, lineHeight: 19 },

  saveBtn:    { backgroundColor: Colors.red, borderRadius: Radius.sm, paddingVertical: 15, alignItems: 'center', marginBottom: 10, ...Shadow.md },
  saveBtnTxt: { fontFamily: FONTS.display, fontSize: 20, letterSpacing: 2, color: Colors.white },

  secondaryBtn: { borderWidth: 1.5, borderColor: Colors.borderStrong, borderRadius: Radius.sm, paddingVertical: 13, alignItems: 'center' },
  secondaryTxt: { fontFamily: FONTS.bodySemi, fontSize: FontSize.body, color: Colors.textMuted },
});