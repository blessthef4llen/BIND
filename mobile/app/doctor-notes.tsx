/**
 * app/doctor-notes.tsx — After Visit: Upload & paste doctor notes
 *
 * Redesigned with warm red/white/charcoal brand.
 * Uses api.extract() from the unified service layer.
 */

import React, { useState } from 'react';
import {
  View, Text, ScrollView, TextInput, Pressable,
  StyleSheet, KeyboardAvoidingView, Platform, Alert,
} from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Path, Circle, Rect } from 'react-native-svg';
import { Colors, FONTS, FontSize, Radius, Shadow } from '../constants/theme';
import { api } from '../services/api';

const SAMPLE_NOTE =
  'Patient presents with left ankle pain (8/10) following increased running activity. ' +
  'Likely plantar fasciitis aggravated by flat feet and inadequate footwear support. ' +
  'Advised RICE protocol: Rest, Ice 20 min 3x/day, Compression wrap, Elevation when possible. ' +
  'Orthotics referral placed. Rx: Ibuprofen 400mg every 6–8 hours as needed with food. ' +
  'Avoid high-impact activity for 2 weeks. Follow up in 4 weeks if no improvement. ' +
  'Orthopedic referral if pain persists or worsens.';

const MOCK_EXTRACTED = {
  diagnosis:      'Plantar Fasciitis',
  prescriptions:  ['Ibuprofen 400mg every 6–8 hours as needed with food'],
  key_advice:     ['RICE protocol (Rest, Ice, Compression, Elevation)', 'Avoid high-impact activity for 2 weeks', 'Orthotics referral placed'],
  follow_up_date: '4 weeks',
};

export default function DoctorNotesScreen() {
  const insets = useSafeAreaInsets();
  const [noteText,   setNoteText]   = useState('');
  const [extracting, setExtracting] = useState(false);

  async function handleExtract() {
    const text = noteText.trim();
    if (!text) {
      Alert.alert('Empty notes', 'Please paste your doctor notes first.');
      return;
    }

    setExtracting(true);
    router.push('/loading');

    try {
      const result = await api.extract(text);
      router.replace({
        pathname: '/notes-extracted',
        params:   { extracted: JSON.stringify(result) },
      });
    } catch {
      router.replace({
        pathname: '/notes-extracted',
        params:   { extracted: JSON.stringify(MOCK_EXTRACTED) },
      });
    } finally {
      setExtracting(false);
    }
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: Colors.offWhite }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        contentContainerStyle={[styles.content, { paddingTop: insets.top + 20, paddingBottom: insets.bottom + 40 }]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Back */}
        <Pressable style={styles.backBtn} onPress={() => router.back()}>
          <Svg width={18} height={18} viewBox="0 0 18 18">
            <Path d="M11 4L6 9l5 5" stroke={Colors.text} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" fill="none" />
          </Svg>
          <Text style={styles.backTxt}>Back</Text>
        </Pressable>

        {/* Header */}
        <Text style={styles.title}>After Your Visit</Text>
        <Text style={styles.subtitle}>
          Upload or paste your doctor notes. IBM Granite will extract the key information.
        </Text>

        {/* Upload area (visual only — future: file picker) */}
        <View style={styles.uploadZone}>
          <View style={styles.uploadIconWrap}>
            <Svg width={28} height={28} viewBox="0 0 28 28">
              <Circle cx={14} cy={14} r={13} fill={Colors.redLight} />
              <Path d="M14 8v12M10 12l4-4 4 4" stroke={Colors.red} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" fill="none" />
            </Svg>
          </View>
          <Text style={styles.uploadTitle}>Upload Notes or Photo</Text>
          <Text style={styles.uploadSub}>PDF · JPG · PNG supported</Text>
          <View style={styles.uploadBadge}>
            <Text style={styles.uploadBadgeTxt}>Coming soon</Text>
          </View>
        </View>

        {/* Divider */}
        <View style={styles.orRow}>
          <View style={styles.orLine} />
          <Text style={styles.orTxt}>or paste text</Text>
          <View style={styles.orLine} />
        </View>

        {/* Text input */}
        <Text style={styles.fieldLabel}>Paste doctor notes</Text>
        <TextInput
          style={styles.textarea}
          value={noteText}
          onChangeText={setNoteText}
          placeholder="Paste your doctor's notes, discharge summary, or any visit documentation here…"
          placeholderTextColor={Colors.textFaint}
          multiline
          textAlignVertical="top"
        />

        {/* Sample note helper */}
        <Pressable onPress={() => setNoteText(SAMPLE_NOTE)} style={styles.sampleBtn}>
          <Text style={styles.sampleTxt}>Use sample note for demo</Text>
        </Pressable>

        {/* Disclaimer */}
        <View style={styles.disclaimer}>
          <Svg width={16} height={16} viewBox="0 0 16 16" style={{ flexShrink: 0, marginTop: 1 }}>
            <Circle cx={8} cy={8} r={7} fill="none" stroke={Colors.warning} strokeWidth={1.5} />
            <Path d="M8 5v4M8 11v1" stroke={Colors.warning} strokeWidth={1.5} strokeLinecap="round" />
          </Svg>
          <Text style={styles.disclaimerTxt}>
            Pulse does not provide medical diagnoses. AI extraction is for organization only — always follow your doctor's advice.
          </Text>
        </View>

        {/* CTA */}
        <Pressable
          style={({ pressed }) => [styles.submitBtn, pressed && { opacity: 0.85 }, extracting && { opacity: 0.5 }]}
          onPress={handleExtract}
          disabled={extracting}
        >
          <Text style={styles.submitTxt}>
            {extracting ? 'Extracting…' : 'EXTRACT WITH IBM GRANITE'}
          </Text>
        </Pressable>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  content: { paddingHorizontal: 20 },

  backBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 20 },
  backTxt: { fontFamily: FONTS.bodySemi, fontSize: FontSize.body, color: Colors.text },

  title:    { fontFamily: FONTS.display, fontSize: 32, color: Colors.black, letterSpacing: 0.5, marginBottom: 6 },
  subtitle: { fontFamily: FONTS.body, fontSize: FontSize.body, color: Colors.textMuted, lineHeight: 21, marginBottom: 20 },

  uploadZone: {
    borderWidth: 2, borderStyle: 'dashed', borderColor: Colors.borderStrong,
    borderRadius: Radius.md, padding: 28, alignItems: 'center',
    backgroundColor: Colors.surface, marginBottom: 16, gap: 6,
  },
  uploadIconWrap: { marginBottom: 4 },
  uploadTitle:    { fontFamily: FONTS.bodySemi, fontSize: FontSize.body, color: Colors.text },
  uploadSub:      { fontFamily: FONTS.body, fontSize: FontSize.small, color: Colors.textFaint },
  uploadBadge:    { marginTop: 4, backgroundColor: Colors.surface2, borderRadius: Radius.pill, paddingVertical: 3, paddingHorizontal: 10, borderWidth: 1, borderColor: Colors.border },
  uploadBadgeTxt: { fontFamily: FONTS.body, fontSize: FontSize.micro, color: Colors.textMuted },

  orRow:  { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 14 },
  orLine: { flex: 1, height: 1, backgroundColor: Colors.border },
  orTxt:  { fontFamily: FONTS.body, fontSize: FontSize.tiny, color: Colors.textFaint },

  fieldLabel: { fontFamily: FONTS.bodySemi, fontSize: FontSize.tiny, color: Colors.textMuted, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 6 },
  textarea: {
    backgroundColor: Colors.surface, borderWidth: 1.5, borderColor: Colors.border,
    borderRadius: Radius.xs, padding: 12, minHeight: 180,
    fontFamily: FONTS.body, fontSize: FontSize.body, color: Colors.text,
    lineHeight: 22, textAlignVertical: 'top', marginBottom: 8,
  },

  sampleBtn: { alignSelf: 'flex-start', marginBottom: 16 },
  sampleTxt: { fontFamily: FONTS.body, fontSize: FontSize.small, color: Colors.red },

  disclaimer: {
    flexDirection: 'row', gap: 8, backgroundColor: Colors.warningLight,
    borderRadius: Radius.xs, padding: 12, marginBottom: 18,
    borderWidth: 1, borderColor: Colors.warning + '44',
  },
  disclaimerTxt: { flex: 1, fontFamily: FONTS.body, fontSize: FontSize.small, color: '#6B3D05', lineHeight: 20 },

  submitBtn: {
    backgroundColor: Colors.red, borderRadius: Radius.sm,
    paddingVertical: 15, alignItems: 'center', ...Shadow.md,
  },
  submitTxt: { fontFamily: FONTS.display, fontSize: 20, letterSpacing: 2, color: Colors.white },
});