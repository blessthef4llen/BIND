import { useState, useRef } from 'react';
import {
  View, Text, ScrollView, Pressable, TextInput,
  StyleSheet, StatusBar, Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { C, FONTS } from '../../constants/colors';
import { API_BASE } from '../../constants/api';
import BodyMap from '../../components/BodyMap';

const URGENCIES = [
  { key: 'low',    label: 'Low',    bg: C.gray100,   border: C.black,   text: C.black },
  { key: 'medium', label: 'Medium', bg: '#FFF3CD',   border: '#D4A500', text: '#7A5E00' },
  { key: 'high',   label: 'High',   bg: '#FDF0F0',   border: C.red,     text: C.redDark },
];

function SeverityPicker({ value, onChange }) {
  return (
    <View>
      <View style={sev.row}>
        {Array.from({ length: 10 }, (_, i) => i + 1).map((n) => (
          <Pressable
            key={n}
            style={[sev.seg, n <= value && sev.segActive]}
            onPress={() => onChange(n)}
          />
        ))}
      </View>
      <View style={sev.labels}>
        <Text style={sev.lbl}>Mild</Text>
        <Text style={sev.num}>{value}</Text>
        <Text style={sev.lbl}>Severe</Text>
      </View>
    </View>
  );
}

const sev = StyleSheet.create({
  row:       { flexDirection: 'row', gap: 4, height: 20 },
  seg:       { flex: 1, borderRadius: 3, backgroundColor: C.gray200 },
  segActive: { backgroundColor: C.red },
  labels:    { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 6 },
  lbl:       { fontSize: 11, color: C.gray400, fontFamily: 'DMSans_400Regular' },
  num:       { fontFamily: 'BebasNeue_400Regular', fontSize: 26, color: C.black },
});

export default function LogScreen() {
  const router = useRouter();
  const [selectedArea, setSelectedArea] = useState('');
  const [severity, setSeverity]         = useState(5);
  const [urgency, setUrgency]           = useState('medium');
  const [symptom, setSymptom]           = useState('');
  const [notes, setNotes]               = useState('');
  const [saving, setSaving]             = useState(false);
  const [feedback, setFeedback]         = useState(null); // { type: 'ok'|'err', msg }

async function submit() {
  if (!selectedArea) {
    setFeedback({ type: 'err', msg: 'Please tap a body area first.' });
    return;
  }
  if (!symptom.trim()) {
    setFeedback({ type: 'err', msg: 'Please describe your pain.' });
    return;
  }

  setSaving(true);
  setFeedback(null);

  try {
    const r = await fetch(`${API_BASE}/run-agent-chain`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        body_area: selectedArea,
        symptom: symptom.trim(),
        urgency_level: urgency,
        severity,
        notes: notes.trim(),
        language: 'en',
      }),
    });

    if (!r.ok) throw new Error(`HTTP ${r.status}`);

    const data = await r.json();

    // 🚀 Navigate to Visit Prep with agent result
    router.push({
      pathname: '/visit-prep',
      params: {
        agentResult: JSON.stringify(data),
      },
    });

  } catch (e) {
    setFeedback({
      type: 'err',
      msg: 'Could not reach AI agents — is backend running?',
    });
  } finally {
    setSaving(false);
  }
}

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={C.white} />

      <View style={styles.topBar}>
        <Text style={styles.topTitle}>LOG PAIN</Text>
        <Text style={styles.topHint}>Tap the body</Text>
      </View>

      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>

        {/* Body Map */}
        <Text style={styles.mapNote}>Tap any area to select where it hurts</Text>
        <View style={styles.mapWrap}>
          <BodyMap selectedArea={selectedArea} onSelect={setSelectedArea} />
        </View>

        {/* Area indicator */}
        {selectedArea ? (
          <View style={styles.areaPill}>
            <View style={styles.areaDot} />
            <Text style={styles.areaName}>{selectedArea}</Text>
            <Text style={styles.areaTap}>Tap again to deselect</Text>
          </View>
        ) : (
          <Text style={styles.noAreaMsg}>ⓘ  Select an area on the body above</Text>
        )}

        {/* Severity */}
        <View style={styles.section}>
          <Text style={styles.label}>Pain Severity</Text>
          <SeverityPicker value={severity} onChange={setSeverity} />
        </View>

        {/* Urgency */}
        <View style={styles.section}>
          <Text style={styles.label}>Urgency Level</Text>
          <View style={styles.urgRow}>
            {URGENCIES.map((u) => (
              <Pressable
                key={u.key}
                style={[
                  styles.urgBtn,
                  urgency === u.key && {
                    backgroundColor: u.bg,
                    borderColor: u.border,
                  },
                ]}
                onPress={() => setUrgency(u.key)}
              >
                <Text style={[
                  styles.urgTxt,
                  urgency === u.key && { color: u.text, fontFamily: FONTS.bodySemi },
                ]}>
                  {u.label}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>

        {/* Description */}
        <View style={styles.section}>
          <Text style={styles.label}>Describe the pain</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g. Sharp throbbing, worse when walking..."
            placeholderTextColor={C.gray400}
            multiline
            numberOfLines={4}
            value={symptom}
            onChangeText={setSymptom}
          />
          <Text style={[styles.label, { marginTop: 4 }]}>Additional notes (optional)</Text>
          <TextInput
            style={[styles.input, { height: 64 }]}
            placeholder="What makes it better or worse?"
            placeholderTextColor={C.gray400}
            multiline
            numberOfLines={3}
            value={notes}
            onChangeText={setNotes}
          />
        </View>

        {/* Feedback */}
        {feedback && (
          <View style={[styles.feedbackBox, feedback.type === 'ok' ? styles.fbOk : styles.fbErr]}>
            <Text style={[styles.fbTxt, { color: feedback.type === 'ok' ? '#166534' : C.redDark }]}>
              {feedback.msg}
            </Text>
          </View>
        )}

        {/* Actions */}
        <View style={styles.actions}>
          <Pressable
            style={({ pressed }) => [styles.btnRed, pressed && { opacity: 0.85 }, saving && { opacity: 0.5 }]}
            onPress={submit}
            disabled={saving}
          >
            <Text style={styles.btnRedTxt}>{saving ? '...' : 'SAVE CONCERN'}</Text>
          </Pressable>
          <Pressable
            style={styles.btnOutline}
            onPress={() => router.push('/(tabs)')}
          >
            <Text style={styles.btnOutlineTxt}>Cancel</Text>
          </Pressable>
        </View>

        <View style={{ height: 32 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.white },
  topBar:    { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingTop: 56, paddingBottom: 4 },
  topTitle:  { fontFamily: FONTS.display, fontSize: 32, color: C.black, letterSpacing: 1 },
  topHint:   { fontSize: 12, color: C.gray400, fontFamily: FONTS.body },
  scroll:    { flex: 1 },

  mapNote:   { fontSize: 12, color: C.gray400, textAlign: 'center', marginTop: 8, marginBottom: 8, fontFamily: FONTS.body },
  mapWrap:   { alignItems: 'center', marginBottom: 12 },

  areaPill:  { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: C.black, borderRadius: 8, paddingVertical: 10, paddingHorizontal: 14, marginHorizontal: 20, marginBottom: 14 },
  areaDot:   { width: 8, height: 8, borderRadius: 4, backgroundColor: C.red },
  areaName:  { flex: 1, fontSize: 14, fontWeight: '600', color: C.white, fontFamily: FONTS.bodySemi },
  areaTap:   { fontSize: 12, color: 'rgba(255,255,255,0.35)', fontFamily: FONTS.body },
  noAreaMsg: { fontSize: 13, color: C.gray400, marginHorizontal: 20, marginBottom: 14, fontFamily: FONTS.body },

  section:   { paddingHorizontal: 20, marginBottom: 12 },
  label:     { fontSize: 12, fontWeight: '700', letterSpacing: 1, textTransform: 'uppercase', color: C.gray400, marginBottom: 6, fontFamily: FONTS.bodySemi },

  urgRow:    { flexDirection: 'row', gap: 8 },
  urgBtn:    { flex: 1, paddingVertical: 9, borderWidth: 1.5, borderColor: C.gray200, borderRadius: 5, alignItems: 'center', backgroundColor: C.gray100 },
  urgTxt:    { fontSize: 13, color: C.gray400, fontFamily: FONTS.body },

  input:     { backgroundColor: C.gray100, borderWidth: 1.5, borderColor: C.gray200, borderRadius: 5, paddingHorizontal: 12, paddingVertical: 10, fontSize: 14, color: C.black, fontFamily: FONTS.body, height: 80, textAlignVertical: 'top' },

  feedbackBox: { marginHorizontal: 20, marginBottom: 10, padding: 10, borderRadius: 5 },
  fbOk:      { backgroundColor: '#F0FFF4' },
  fbErr:     { backgroundColor: '#FDF0F0' },
  fbTxt:     { fontSize: 13, fontFamily: FONTS.body },

  actions:   { paddingHorizontal: 20, gap: 8, marginTop: 4 },
  btnRed:    { backgroundColor: C.red, borderRadius: 8, paddingVertical: 14, alignItems: 'center' },
  btnRedTxt: { fontFamily: FONTS.display, fontSize: 22, letterSpacing: 2, color: C.white },
  btnOutline: { borderWidth: 1.5, borderColor: C.gray200, borderRadius: 8, paddingVertical: 14, alignItems: 'center' },
  btnOutlineTxt: { fontSize: 15, fontWeight: '600', color: C.black, fontFamily: FONTS.bodySemi },
});
