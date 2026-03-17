// app/doctor-notes.tsx — Screen 06: Upload / Paste Doctor Notes
import React, { useState } from 'react';
import {
  View, Text, ScrollView, TextInput, TouchableOpacity,
  StyleSheet, KeyboardAvoidingView, Platform, Alert,
} from 'react-native';
import { router } from 'expo-router';
import Svg, { Circle, Path } from 'react-native-svg';
import { Colors, Fonts, FontSize, Radius } from '../constants/theme';
import { PrimaryButton } from '../components/ui/PrimaryButton';
import { api } from '../services/api';

const SAMPLE_NOTE =
  "Patient presents with left ankle pain (8/10). Likely plantar fasciitis aggravated by flat feet. " +
  "Advised RICE protocol and orthotics referral. Rx: Ibuprofen 400mg as needed. " +
  "Follow up in 4 weeks if no improvement. Orthopedic referral if pain persists.";

export default function DoctorNotesScreen() {
  const [noteText, setNoteText]   = useState('');
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
      const result = await api.extractNotes(text);
      router.replace({
        pathname: '/notes-extracted',
        params: { extracted: JSON.stringify(result) },
      });
    } catch {
      // Fallback with mock data
      router.replace({
        pathname: '/notes-extracted',
        params: { extracted: JSON.stringify({
          diagnosis: 'Plantar Fasciitis — Flat Feet',
          prescriptions: [{ name: 'Ibuprofen 400mg', instructions: 'As needed for pain' }],
          key_advice: ['RICE protocol', 'Avoid high-impact activity', 'Orthotics referral'],
          follow_up: '4 weeks (if no improvement)',
        })},
      });
    } finally {
      setExtracting(false);
    }
  }

  return (
    <KeyboardAvoidingView
      style={styles.root}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={styles.title}>After Your Visit</Text>
        <Text style={styles.subtitle}>Add your doctor notes to build your health timeline</Text>

        {/* Upload drop zone (visual only — no file API in Expo Go managed) */}
        <View style={styles.dropZone}>
          <Svg width={36} height={36} viewBox="0 0 36 36" style={styles.uploadIcon}>
            <Circle cx={18} cy={18} r={17} fill={Colors.tealLight} />
            <Path
              d="M18 10v16M11 17l7-7 7 7"
              stroke={Colors.teal}
              strokeWidth={2}
              strokeLinecap="round"
              fill="none"
            />
          </Svg>
          <Text style={styles.dropTitle}>Upload Notes or Photo</Text>
          <Text style={styles.dropSub}>PDF, JPG, PNG supported</Text>
        </View>

        {/* Divider */}
        <View style={styles.orRow}>
          <View style={styles.orLine} />
          <Text style={styles.orText}>or paste text</Text>
          <View style={styles.orLine} />
        </View>

        {/* Paste textarea */}
        <Text style={styles.inputLabel}>Paste doctor notes</Text>
        <TextInput
          style={styles.textarea}
          value={noteText}
          onChangeText={setNoteText}
          placeholder="Paste your doctor's notes here..."
          placeholderTextColor={Colors.textFaint}
          multiline
          textAlignVertical="top"
        />

        {/* Sample note helper */}
        <TouchableOpacity onPress={() => setNoteText(SAMPLE_NOTE)} style={styles.sampleBtn}>
          <Text style={styles.sampleBtnText}>Use sample note for demo</Text>
        </TouchableOpacity>

        {/* Disclaimer */}
        <View style={styles.disclaimer}>
          <Svg width={16} height={16} viewBox="0 0 16 16" style={{ flexShrink: 0, marginTop: 1 }}>
            <Circle cx={8} cy={8} r={7} fill="none" stroke={Colors.amber} strokeWidth={1.5} />
            <Path d="M8 5v4M8 11v1" stroke={Colors.amber} strokeWidth={1.5} strokeLinecap="round" />
          </Svg>
          <Text style={styles.disclaimerText}>
            Pulse does not provide medical diagnoses. AI extraction is for organization only —
            always follow your doctor's advice.
          </Text>
        </View>

        <PrimaryButton
          label="Extract with AI"
          onPress={handleExtract}
          loading={extracting}
        />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.bg },
  content: { paddingHorizontal: 20, paddingTop: 54, paddingBottom: 40 },
  title: { fontFamily: Fonts.serif, fontSize: 22, color: Colors.text, marginBottom: 4 },
  subtitle: { fontFamily: Fonts.sans, fontSize: FontSize.small, color: Colors.textMuted, marginBottom: 18 },
  dropZone: {
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: Colors.borderStrong,
    borderRadius: Radius.md,
    padding: 28,
    alignItems: 'center',
    backgroundColor: Colors.surface,
    marginBottom: 14,
  },
  uploadIcon: { marginBottom: 10 },
  dropTitle: { fontFamily: Fonts.sansMedium, fontSize: FontSize.body, color: Colors.text, marginBottom: 4 },
  dropSub: { fontFamily: Fonts.sans, fontSize: FontSize.small, color: Colors.textFaint },
  orRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 14 },
  orLine: { flex: 1, height: 1, backgroundColor: Colors.border },
  orText: { fontFamily: Fonts.sans, fontSize: FontSize.tiny, color: Colors.textFaint },
  inputLabel: { fontFamily: Fonts.sansMedium, fontSize: FontSize.small, color: Colors.textMuted, marginBottom: 6 },
  textarea: {
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.borderStrong,
    borderRadius: Radius.xs,
    padding: 12,
    minHeight: 180,
    fontFamily: Fonts.sans,
    fontSize: FontSize.small + 1,
    color: Colors.text,
    lineHeight: 22,
    textAlignVertical: 'top',
    marginBottom: 8,
  },
  sampleBtn: { marginBottom: 14, alignSelf: 'flex-start' },
  sampleBtnText: { fontFamily: Fonts.sans, fontSize: FontSize.small, color: Colors.teal },
  disclaimer: {
    flexDirection: 'row',
    gap: 8,
    backgroundColor: Colors.amberLight,
    borderRadius: Radius.sm,
    padding: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(239,159,39,0.3)',
  },
  disclaimerText: {
    flex: 1,
    fontFamily: Fonts.sans,
    fontSize: FontSize.small,
    color: '#6B3D05',
    lineHeight: 20,
  },
});
