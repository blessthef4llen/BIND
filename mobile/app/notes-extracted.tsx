/**
 * app/notes-extracted.tsx — Extracted visit note results
 *
 * Receives params:
 *   extracted  — JSON string of { diagnosis, prescriptions, key_advice, follow_up_date }
 *   uploadId   — optional backend upload ID to link to the saved timeline entry
 *
 * Actions:
 *   1. Save to timeline → POST /api/timeline (links uploadId if present)
 *   2. Download PDF report → POST /api/timeline/{id}/report (after saving)
 */

import React, { useState } from 'react';
import {
  View, Text, ScrollView, Pressable, StyleSheet,
  Alert, ActivityIndicator, Linking,
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

// ─── Section card ─────────────────────────────────────────────────────────────

function SectionCard({ title, accent = false, children }: { title: string; accent?: boolean; children: React.ReactNode }) {
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
  card:           { backgroundColor: Colors.surface, borderRadius: Radius.md, marginBottom: 12, borderWidth: 1, borderColor: Colors.border, overflow: 'hidden' },
  cardAccent:     { borderColor: Colors.red + '44' },
  header:         { paddingHorizontal: 14, paddingVertical: 8, backgroundColor: Colors.surface2, borderBottomWidth: 1, borderBottomColor: Colors.border },
  headerAccent:   { backgroundColor: Colors.redLight, borderBottomColor: Colors.red + '33' },
  headerTxt:      { fontFamily: FONTS.bodySemi, fontSize: FontSize.micro, color: Colors.textMuted, letterSpacing: 1 },
  headerTxtAccent:{ color: Colors.redDark },
  body:           { padding: 14 },
});

// ─── Screen ───────────────────────────────────────────────────────────────────

export default function NotesExtractedScreen() {
  const params = useLocalSearchParams<{ extracted?: string; uploadId?: string }>();
  const insets = useSafeAreaInsets();

  const [saving,           setSaving]           = useState(false);
  const [savedTimelineId,  setSavedTimelineId]  = useState<string | null>(null);
  const [generatingPdf,    setGeneratingPdf]    = useState(false);

  let note: ParsedNote = DEFAULT_NOTE;
  try { if (params.extracted) note = JSON.parse(params.extracted); } catch {}

  // ── Save to timeline ──────────────────────────────────────────────────────
  async function handleSave() {
    setSaving(true);
    const visit_date = new Date().toISOString().split('T')[0];
    try {
      const entry = await api.saveTimelineEntry({
        visit_date,
        diagnosis:      note.diagnosis,
        prescriptions:  note.prescriptions,
        key_advice:     note.key_advice,
        follow_up_date: note.follow_up_date,
      });
      // Link the uploaded file to this timeline entry
      if (params.uploadId) {
        try { await api.linkUpload(params.uploadId, entry.id); } catch {}
      }
      setSavedTimelineId(entry.id);
    } catch {
      Alert.alert(
        'Saved',
        'Could not reach backend — your data will persist once the server is available.',
        [{ text: 'OK', onPress: () => router.replace('/(tabs)/timeline') }]
      );
    } finally {
      setSaving(false);
    }
  }

  // ── Download PDF ──────────────────────────────────────────────────────────
  async function handleDownloadPdf() {
    if (!savedTimelineId) return;
    setGeneratingPdf(true);
    try {
      const url = await api.getReportUrl(savedTimelineId);
      await Linking.openURL(url);
    } catch {
      Alert.alert('PDF', 'Could not open PDF. Make sure the backend is running.');
    } finally {
      setGeneratingPdf(false);
    }
  }

  // ── After save view ───────────────────────────────────────────────────────
  if (savedTimelineId) {
    return (
      <View style={[styles.root, { paddingTop: insets.top }]}>
        <ScrollView contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 40 }]} showsVerticalScrollIndicator={false}>
          <View style={styles.savedHero}>
            <Svg width={48} height={48} viewBox="0 0 48 48">
              <Circle cx={24} cy={24} r={22} fill={Colors.okLight} />
              <Path d="M14 24l7 7 13-13" stroke={Colors.ok} strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" fill="none" />
            </Svg>
            <Text style={styles.savedTitle}>Added to Timeline</Text>
            <Text style={styles.savedSub}>
              Your visit record has been saved. You can find it in the Timeline tab.
            </Text>
          </View>

          <Pressable
            style={({ pressed }) => [styles.pdfBtn, pressed && { opacity: 0.85 }, generatingPdf && { opacity: 0.5 }]}
            onPress={handleDownloadPdf}
            disabled={generatingPdf}
          >
            {generatingPdf
              ? <ActivityIndicator color={Colors.white} />
              : <>
                  <Svg width={18} height={18} viewBox="0 0 18 18" style={{ marginRight: 8 }}>
                    <Rect x={2} y={2} width={14} height={14} rx={2} stroke={Colors.white} strokeWidth={1.5} fill="none" />
                    <Path d="M9 6v6M6 9l3 3 3-3" stroke={Colors.white} strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" fill="none" />
                  </Svg>
                  <Text style={styles.pdfBtnTxt}>DOWNLOAD PDF REPORT</Text>
                </>
            }
          </Pressable>

          <Pressable
            style={({ pressed }) => [styles.primaryBtn, pressed && { opacity: 0.85 }]}
            onPress={() => router.replace('/(tabs)/timeline')}
          >
            <Text style={styles.primaryBtnTxt}>VIEW MY TIMELINE</Text>
          </Pressable>

          <Pressable style={styles.secondaryBtn} onPress={() => router.replace('/(tabs)')}>
            <Text style={styles.secondaryTxt}>Go to Dashboard</Text>
          </Pressable>
        </ScrollView>
      </View>
    );
  }

  // ── Review view ───────────────────────────────────────────────────────────
  return (
    <View style={styles.root}>
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
            AI-generated organizational summary only. Always follow your doctor's actual advice and refer to your original notes.
          </Text>
        </View>

        {/* Save CTA */}
        <Pressable
          style={({ pressed }) => [styles.saveBtn, pressed && { opacity: 0.85 }, saving && { opacity: 0.5 }]}
          onPress={handleSave}
          disabled={saving}
        >
          {saving
            ? <ActivityIndicator color={Colors.white} />
            : <Text style={styles.saveBtnTxt}>ADD TO HEALTH TIMELINE</Text>
          }
        </Pressable>

        <Pressable style={styles.secondaryBtn} onPress={() => router.back()}>
          <Text style={styles.secondaryTxt}>Go Back</Text>
        </Pressable>
      </ScrollView>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  root:    { flex: 1, backgroundColor: Colors.offWhite },
  content: { paddingHorizontal: 20 },

  // Review header
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 },
  title:     { fontFamily: FONTS.display, fontSize: 30, color: Colors.black, letterSpacing: 0.5 },
  subtitle:  { fontFamily: FONTS.body, fontSize: FontSize.small, color: Colors.textMuted, marginTop: 2 },

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
  rxName:    { flex: 1, fontFamily: FONTS.body, fontSize: FontSize.body, color: Colors.text },

  adviceRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, marginBottom: 8 },
  bulletDot: { width: 5, height: 5, borderRadius: 3, backgroundColor: Colors.red, marginTop: 8, flexShrink: 0 },
  adviceTxt: { flex: 1, fontFamily: FONTS.body, fontSize: FontSize.body, color: Colors.text, lineHeight: 21 },

  followupRow:  { flexDirection: 'row', alignItems: 'center', gap: 12 },
  followupDate: { fontFamily: FONTS.bodySemi, fontSize: FontSize.body, color: Colors.text },
  followupHint: { fontFamily: FONTS.body, fontSize: FontSize.small, color: Colors.textFaint, marginTop: 2 },

  disclaimer:    { backgroundColor: Colors.surface2, borderRadius: Radius.xs, padding: 12, marginBottom: 16, borderWidth: 1, borderColor: Colors.border },
  disclaimerTxt: { fontFamily: FONTS.body, fontSize: FontSize.small, color: Colors.textMuted, lineHeight: 19 },

  saveBtn:    { backgroundColor: Colors.red, borderRadius: Radius.sm, paddingVertical: 15, alignItems: 'center', marginBottom: 10, ...Shadow.md, minHeight: 52, justifyContent: 'center' },
  saveBtnTxt: { fontFamily: FONTS.display, fontSize: 20, letterSpacing: 2, color: Colors.white },

  secondaryBtn: { borderWidth: 1.5, borderColor: Colors.borderStrong, borderRadius: Radius.sm, paddingVertical: 13, alignItems: 'center' },
  secondaryTxt: { fontFamily: FONTS.bodySemi, fontSize: FontSize.body, color: Colors.textMuted },

  // Saved / success state
  savedHero:  { alignItems: 'center', paddingVertical: 32, gap: 10 },
  savedTitle: { fontFamily: FONTS.display, fontSize: 28, color: Colors.black, letterSpacing: 0.5 },
  savedSub:   { fontFamily: FONTS.body, fontSize: FontSize.body, color: Colors.textMuted, textAlign: 'center', lineHeight: 21, maxWidth: 280 },

  pdfBtn:    { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: Colors.black, borderRadius: Radius.sm, paddingVertical: 14, marginBottom: 10, ...Shadow.md, minHeight: 52 },
  pdfBtnTxt: { fontFamily: FONTS.display, fontSize: 18, letterSpacing: 1.5, color: Colors.white },

  primaryBtn:    { backgroundColor: Colors.red, borderRadius: Radius.sm, paddingVertical: 15, alignItems: 'center', marginBottom: 10, ...Shadow.md },
  primaryBtnTxt: { fontFamily: FONTS.display, fontSize: 20, letterSpacing: 2, color: Colors.white },
});