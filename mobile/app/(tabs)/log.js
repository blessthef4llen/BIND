/**
 * app/(tabs)/log.js — Pre-visit concern log form
 *
 * API contract implemented:
 *   POST /api/prep
 *   Request:  { body_area, start_time, concern_description, urgency, additional_message }
 *   Response: { symptom_summary, questions_to_ask, concerns_to_mention }
 *
 * Navigation: does NOT navigate until the API response is received.
 * A full-screen loading overlay with cycling messages is shown while waiting.
 */

import { useState, useEffect, useRef } from 'react';
import {
  View, Text, ScrollView, Pressable, TextInput,
  StyleSheet, StatusBar, KeyboardAvoidingView, Platform,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { C, FONTS } from '../../constants/colors';
import { ROUTES } from '../../constants/api';
import BodyMap from '../../components/BodyMap';

// Cycling messages shown in the loading overlay while awaiting API
const LOADING_MESSAGES = [
  'Reviewing your concern details…',
  'Generating your visit prep…',
  'Preparing questions for your doctor…',
];

const URGENCIES = [
  { key: 'low',    label: 'Low',    bg: C.gray100, border: C.black,   text: C.black },
  { key: 'medium', label: 'Medium', bg: '#FFF3CD', border: '#D4A500', text: '#7A5E00' },
  { key: 'high',   label: 'High',   bg: '#FDF0F0', border: C.red,     text: C.redDark },
];

export default function LogScreen() {
  const router  = useRouter();
  const insets  = useSafeAreaInsets();

  // Form fields
  const [selectedArea,       setSelectedArea]       = useState('');
  const [startTime,          setStartTime]           = useState('');
  const [urgency,            setUrgency]             = useState('medium');
  const [concernDescription, setConcernDescription] = useState('');
  const [additionalMessage,  setAdditionalMessage]  = useState('');

  // UI state
  const [loading,  setLoading]  = useState(false);
  const [feedback, setFeedback] = useState(null);

  // Loading overlay cycling message
  const [msgIndex,   setMsgIndex]   = useState(0);
  const msgIntervalRef = useRef(null);

  useEffect(() => {
    if (loading) {
      setMsgIndex(0);
      msgIntervalRef.current = setInterval(() => {
        setMsgIndex(prev => (prev + 1) % LOADING_MESSAGES.length);
      }, 2500);
    } else {
      clearInterval(msgIntervalRef.current);
    }
    return () => clearInterval(msgIntervalRef.current);
  }, [loading]);

  async function submit() {
    // Validate required fields
    if (!selectedArea) {
      setFeedback({ type: 'err', msg: 'Please tap a body area first.' });
      return;
    }
    if (!concernDescription.trim()) {
      setFeedback({ type: 'err', msg: 'Please describe your concern.' });
      return;
    }

    setFeedback(null);
    setLoading(true);

    try {
      const response = await fetch(ROUTES.prep, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          body_area:           selectedArea,
          start_time:          startTime.trim(),
          concern_description: concernDescription.trim(),
          urgency,
          additional_message:  additionalMessage.trim(),
        }),
      });

      if (!response.ok) {
        throw new Error(`Server returned ${response.status}`);
      }

      const data = await response.json();

      // Only navigate AFTER the response has been received
      router.push({
        pathname: '/visit-prep',
        params:   { result: JSON.stringify(data) },
      });
    } catch {
      setLoading(false);
      setFeedback({ type: 'err', msg: 'Could not reach the server. Is it running?' });
    }
    // Note: setLoading(false) is NOT called on success — the overlay stays until navigation completes
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: C.white }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <StatusBar barStyle="dark-content" backgroundColor={C.white} />

      {/* ── Full-screen loading overlay ──────────────────────────────── */}
      {loading && (
        <View style={overlay.container}>
          <ActivityIndicator size="large" color={C.red} />
          <Text style={overlay.message}>{LOADING_MESSAGES[msgIndex]}</Text>
          <Text style={overlay.sub}>IBM Granite is analyzing your concern</Text>
        </View>
      )}

      {/* ── Top bar ─────────────────────────────────────────────────── */}
      <View style={[styles.topBar, { paddingTop: insets.top + 8 }]}>
        <Text style={styles.topTitle}>LOG CONCERN</Text>
        <Text style={styles.topHint}>Tap the body</Text>
      </View>

      <ScrollView
        style={styles.scroll}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: insets.bottom + 32 }}
        keyboardShouldPersistTaps="handled"
      >

        {/* ── Body Map ──────────────────────────────────────────────── */}
        <Text style={styles.mapNote}>Tap any area to select where it hurts</Text>
        <View style={styles.mapWrap}>
          <BodyMap selectedArea={selectedArea} onSelect={setSelectedArea} />
        </View>

        {/* Selected area indicator */}
        {selectedArea ? (
          <View style={styles.areaPill}>
            <View style={styles.areaDot} />
            <Text style={styles.areaName}>{selectedArea}</Text>
            <Text style={styles.areaTap}>Tap again to deselect</Text>
          </View>
        ) : (
          <Text style={styles.noAreaMsg}>ⓘ  Select an area on the body above</Text>
        )}

        {/* ── When did this start? ──────────────────────────────────── */}
        <View style={styles.section}>
          <Text style={styles.label}>When did this start?</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g. 3 days ago, last week, since Monday…"
            placeholderTextColor={C.gray400}
            value={startTime}
            onChangeText={setStartTime}
          />
        </View>

        {/* ── Urgency ───────────────────────────────────────────────── */}
        <View style={styles.section}>
          <Text style={styles.label}>Urgency Level</Text>
          <View style={styles.urgRow}>
            {URGENCIES.map(u => (
              <Pressable
                key={u.key}
                style={[
                  styles.urgBtn,
                  urgency === u.key && { backgroundColor: u.bg, borderColor: u.border },
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

        {/* ── Describe the concern ──────────────────────────────────── */}
        <View style={styles.section}>
          <Text style={styles.label}>Describe the concern</Text>
          <TextInput
            style={[styles.input, styles.inputTall]}
            placeholder="e.g. Sharp throbbing pain in my left ankle, worse when walking…"
            placeholderTextColor={C.gray400}
            multiline
            numberOfLines={4}
            value={concernDescription}
            onChangeText={setConcernDescription}
            textAlignVertical="top"
          />
        </View>

        {/* ── Additional message (optional) ─────────────────────────── */}
        <View style={styles.section}>
          <Text style={styles.label}>Additional message (optional)</Text>
          <TextInput
            style={[styles.input, { height: 64 }]}
            placeholder="Anything else to tell your doctor?"
            placeholderTextColor={C.gray400}
            multiline
            numberOfLines={3}
            value={additionalMessage}
            onChangeText={setAdditionalMessage}
            textAlignVertical="top"
          />
        </View>

        {/* ── Error feedback ────────────────────────────────────────── */}
        {feedback && (
          <View style={[styles.feedbackBox, feedback.type === 'err' ? styles.fbErr : styles.fbOk]}>
            <Text style={[styles.fbTxt, { color: feedback.type === 'err' ? C.redDark : '#166534' }]}>
              {feedback.msg}
            </Text>
          </View>
        )}

        {/* ── Actions ───────────────────────────────────────────────── */}
        <View style={styles.actions}>
          <Pressable
            style={({ pressed }) => [styles.btnRed, pressed && { opacity: 0.85 }, loading && { opacity: 0.5 }]}
            onPress={submit}
            disabled={loading}
          >
            <Text style={styles.btnRedTxt}>GENERATE VISIT PREP</Text>
          </Pressable>
          <Pressable style={styles.btnOutline} onPress={() => router.push('/(tabs)')}>
            <Text style={styles.btnOutlineTxt}>Cancel</Text>
          </Pressable>
        </View>

      </ScrollView>
    </KeyboardAvoidingView>
  );
}

// ── Loading overlay styles ─────────────────────────────────────────────────
const overlay = StyleSheet.create({
  container: {
    position:        'absolute',
    top:             0,
    left:            0,
    right:           0,
    bottom:          0,
    zIndex:          100,
    backgroundColor: C.white,
    alignItems:      'center',
    justifyContent:  'center',
    gap:             16,
  },
  message: {
    fontFamily: FONTS.bodySemi,
    fontSize:   16,
    color:      C.black,
    textAlign:  'center',
    paddingHorizontal: 32,
  },
  sub: {
    fontFamily: FONTS.body,
    fontSize:   13,
    color:      C.gray400,
    textAlign:  'center',
  },
});

// ── Main styles ────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  topBar:   { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingBottom: 4 },
  topTitle: { fontFamily: FONTS.display, fontSize: 32, color: C.black, letterSpacing: 1 },
  topHint:  { fontSize: 12, color: C.gray400, fontFamily: FONTS.body },
  scroll:   { flex: 1 },

  mapNote:  { fontSize: 12, color: C.gray400, textAlign: 'center', marginTop: 8, marginBottom: 8, fontFamily: FONTS.body },
  mapWrap:  { alignItems: 'center', marginBottom: 12 },

  areaPill: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: C.black, borderRadius: 8, paddingVertical: 10, paddingHorizontal: 14, marginHorizontal: 20, marginBottom: 14 },
  areaDot:  { width: 8, height: 8, borderRadius: 4, backgroundColor: C.red },
  areaName: { flex: 1, fontSize: 14, fontWeight: '600', color: C.white, fontFamily: FONTS.bodySemi },
  areaTap:  { fontSize: 12, color: 'rgba(255,255,255,0.35)', fontFamily: FONTS.body },
  noAreaMsg:{ fontSize: 13, color: C.gray400, marginHorizontal: 20, marginBottom: 14, fontFamily: FONTS.body },

  section:  { paddingHorizontal: 20, marginBottom: 12 },
  label:    { fontSize: 12, fontWeight: '700', letterSpacing: 1, textTransform: 'uppercase', color: C.gray400, marginBottom: 6, fontFamily: FONTS.bodySemi },

  urgRow:   { flexDirection: 'row', gap: 8 },
  urgBtn:   { flex: 1, paddingVertical: 9, borderWidth: 1.5, borderColor: C.gray200, borderRadius: 5, alignItems: 'center', backgroundColor: C.gray100 },
  urgTxt:   { fontSize: 13, color: C.gray400, fontFamily: FONTS.body },

  input:     { backgroundColor: C.gray100, borderWidth: 1.5, borderColor: C.gray200, borderRadius: 5, paddingHorizontal: 12, paddingVertical: 10, fontSize: 14, color: C.black, fontFamily: FONTS.body },
  inputTall: { height: 96, textAlignVertical: 'top' },

  feedbackBox: { marginHorizontal: 20, marginBottom: 10, padding: 10, borderRadius: 5 },
  fbOk:        { backgroundColor: '#F0FFF4' },
  fbErr:       { backgroundColor: '#FDF0F0' },
  fbTxt:       { fontSize: 13, fontFamily: FONTS.body },

  actions:       { paddingHorizontal: 20, gap: 8, marginTop: 4 },
  btnRed:        { backgroundColor: C.red, borderRadius: 8, paddingVertical: 14, alignItems: 'center' },
  btnRedTxt:     { fontFamily: FONTS.display, fontSize: 22, letterSpacing: 2, color: C.white },
  btnOutline:    { borderWidth: 1.5, borderColor: C.gray200, borderRadius: 8, paddingVertical: 14, alignItems: 'center' },
  btnOutlineTxt: { fontSize: 15, fontWeight: '600', color: C.black, fontFamily: FONTS.bodySemi },
});
