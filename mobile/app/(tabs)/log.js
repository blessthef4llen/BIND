/**
 * app/(tabs)/log.js — Concern Log
 *
 * Full revamp:
 * - Shows list of existing concerns (with category badge, urgency, archive)
 * - FAB to add new concern
 * - New concern form (inline, not modal)
 * - Auto-categorizes via /api/categorize
 * - Archive / restore flow
 * - Warm brand colors
 */

import { useState, useCallback, useEffect, useRef } from 'react';
import {
  View, Text, ScrollView, Pressable, TextInput,
  StyleSheet, StatusBar, KeyboardAvoidingView, Platform,
  ActivityIndicator, Animated, Alert,
} from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Path, Circle, Rect } from 'react-native-svg';
import { Colors, FONTS, FontSize, Radius, Shadow, SPECIALIST_COLORS } from '../../constants/theme';
import { api } from '../../services/api';
import BodyMap from '../../components/BodyMap';

const URGENCIES = [
  { key: 'low',    label: 'Low',    bg: Colors.okLight,      border: Colors.ok,      text: '#1A6B40' },
  { key: 'medium', label: 'Medium', bg: Colors.warningLight, border: Colors.warning, text: '#7A4A10' },
  { key: 'high',   label: 'High',   bg: Colors.redLight,     border: Colors.red,     text: Colors.redDark },
];

const LOADING_MESSAGES = [
  'Reviewing your concern…',
  'Running IBM Granite analysis…',
  'Generating visit prep questions…',
];

// ─── Concern card ─────────────────────────────────────────────────────────────
function ConcernItem({ concern, onArchive, onPress }) {
  const urg = concern.urgency_level || 'low';
  const urgColor = urg === 'high' ? Colors.urgent : urg === 'medium' ? Colors.warning : Colors.ok;
  const catStyle  = SPECIALIST_COLORS[concern.category] || SPECIALIST_COLORS['General'];

  return (
    <Pressable style={({ pressed }) => [ci.wrap, pressed && { opacity: 0.82 }]} onPress={onPress}>
      <View style={[ci.bar, { backgroundColor: urgColor }]} />
      <View style={ci.body}>
        <View style={ci.row}>
          <Text style={ci.symptom} numberOfLines={2}>{concern.symptom}</Text>
          <View style={[ci.cat, { backgroundColor: catStyle.bg }]}>
            <Text style={[ci.catTxt, { color: catStyle.text }]}>{concern.category || 'General'}</Text>
          </View>
        </View>
        <Text style={ci.meta}>{concern.body_area} · {concern.symptom_date || concern.date_logged} · Sev {concern.severity}/10</Text>
      </View>
      <Pressable style={ci.archBtn} onPress={() => onArchive(concern)} hitSlop={8}>
        <Svg width={16} height={16} viewBox="0 0 16 16">
          <Rect x={1.5} y={4} width={13} height={10} rx={1.5} stroke={Colors.textFaint} strokeWidth={1.3} fill="none" />
          <Path d="M1 4h14M6 7.5v3M10 7.5v3" stroke={Colors.textFaint} strokeWidth={1.3} strokeLinecap="round" fill="none" />
          <Rect x={5} y={1.5} width={6} height={2.5} rx={1} stroke={Colors.textFaint} strokeWidth={1.3} fill="none" />
        </Svg>
      </Pressable>
    </Pressable>
  );
}

const ci = StyleSheet.create({
  wrap:   { flexDirection:'row', backgroundColor: Colors.surface, borderRadius: Radius.sm, marginBottom:8, overflow:'hidden', borderWidth:1, borderColor: Colors.border, ...Shadow.sm },
  bar:    { width:4 },
  body:   { flex:1, paddingHorizontal:12, paddingVertical:11 },
  row:    { flexDirection:'row', alignItems:'flex-start', gap:8, marginBottom:3 },
  symptom:{ flex:1, fontFamily: FONTS.bodyMedium, fontSize: FontSize.body, color: Colors.text, lineHeight:20 },
  cat:    { borderRadius: Radius.xs, paddingHorizontal:6, paddingVertical:2, alignSelf:'flex-start' },
  catTxt: { fontFamily: FONTS.bodySemi, fontSize: 10, textTransform:'uppercase', letterSpacing:0.4 },
  meta:   { fontFamily: FONTS.body, fontSize: FontSize.tiny, color: Colors.textFaint },
  archBtn:{ paddingHorizontal:12, justifyContent:'center', alignItems:'center' },
});

// ─── Main screen ──────────────────────────────────────────────────────────────
export default function LogScreen() {
  const router  = useRouter();
  const insets  = useSafeAreaInsets();

  const [concerns,   setConcerns]   = useState([]);
  const [listLoading,setListLoading] = useState(true);
  const [showForm,   setShowForm]   = useState(false);

  // Form
  const [selectedArea,  setSelectedArea]  = useState('');
  const [startTime,     setStartTime]     = useState('');
  const [urgency,       setUrgency]       = useState('medium');
  const [description,   setDescription]   = useState('');
  const [notes,         setNotes]         = useState('');
  const [severity,      setSeverity]      = useState(5);
  const [submitting,    setSubmitting]     = useState(false);
  const [msgIdx,        setMsgIdx]         = useState(0);
  const [feedback,      setFeedback]       = useState(null);
  const msgTimer = useRef(null);

  useFocusEffect(useCallback(() => { loadConcerns(); }, []));

  async function loadConcerns() {
    setListLoading(true);
    try {
      const d = await api.getConcerns();
      setConcerns(d.concerns || []);
    } catch {
      setConcerns([]);
    } finally {
      setListLoading(false);
    }
  }

  useEffect(() => {
    if (submitting) {
      setMsgIdx(0);
      msgTimer.current = setInterval(() => setMsgIdx(p => (p + 1) % LOADING_MESSAGES.length), 2500);
    } else {
      clearInterval(msgTimer.current);
    }
    return () => clearInterval(msgTimer.current);
  }, [submitting]);

  function resetForm() {
    setSelectedArea(''); setStartTime(''); setUrgency('medium');
    setDescription(''); setNotes(''); setSeverity(5); setFeedback(null);
  }

  async function submit() {
    if (!selectedArea) { setFeedback({ type:'err', msg:'Tap a body area first.' }); return; }
    if (!description.trim()) { setFeedback({ type:'err', msg:'Describe your concern.' }); return; }

    setFeedback(null);
    setSubmitting(true);

    try {
      // 1. Log concern (backend auto-categorizes)
      const newConcern = await api.logConcern({
        body_area:    selectedArea,
        symptom:      description.trim(),
        urgency_level: urgency,
        severity,
        notes:        notes.trim(),
        symptom_date: new Date().toISOString().split('T')[0],
      });

      // 2. Generate visit prep
      const prepData = await api.prep(newConcern);

      setSubmitting(false);
      setShowForm(false);
      resetForm();
      loadConcerns();

      router.push({ pathname: '/visit-prep', params: { result: JSON.stringify(prepData) } });

    } catch (e) {
      setSubmitting(false);
      setFeedback({ type:'err', msg: 'Could not reach server. Is the backend running?' });
    }
  }

  async function handleArchive(concern) {
    Alert.alert(
      'Archive concern?',
      `"${concern.symptom}" will be archived. You can restore it later.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Archive', style: 'destructive',
          onPress: async () => {
            try {
              await api.archiveConcern(concern.id);
              setConcerns(prev => prev.filter(c => c.id !== concern.id));
            } catch {
              Alert.alert('Error', 'Could not archive — is the server running?');
            }
          },
        },
      ]
    );
  }

  // ── Loading overlay ──────────────────────────────────────────────────────────
  if (submitting) {
    return (
      <View style={[styles.loadingOverlay, { paddingTop: insets.top }]}>
        <View style={styles.loadingCard}>
          <ActivityIndicator size="large" color={Colors.red} />
          <Text style={styles.loadingMsg}>{LOADING_MESSAGES[msgIdx]}</Text>
          <Text style={styles.loadingSub}>IBM Granite is analyzing your concern</Text>
        </View>
      </View>
    );
  }

  // ── New concern form ─────────────────────────────────────────────────────────
  if (showForm) {
    return (
      <KeyboardAvoidingView style={{ flex:1, backgroundColor: Colors.offWhite }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <StatusBar barStyle="dark-content" backgroundColor={Colors.offWhite} />
        <View style={[styles.formHeader, { paddingTop: insets.top + 8 }]}>
          <Pressable onPress={() => { setShowForm(false); resetForm(); }} style={styles.backBtn}>
            <Svg width={20} height={20} viewBox="0 0 20 20">
              <Path d="M13 4L7 10l6 6" stroke={Colors.text} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" fill="none" />
            </Svg>
          </Pressable>
          <Text style={styles.formTitle}>New Concern</Text>
          <View style={{ width: 40 }} />
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: insets.bottom + 40, paddingHorizontal:20 }}
          keyboardShouldPersistTaps="handled"
        >
          <Text style={styles.mapHint}>Tap the area that's bothering you</Text>
          <View style={styles.mapWrap}>
            <BodyMap selectedArea={selectedArea} onSelect={setSelectedArea} />
          </View>

          {selectedArea ? (
            <View style={styles.selectedPill}>
              <View style={[styles.pillDot, { backgroundColor: Colors.red }]} />
              <Text style={styles.pillArea}>{selectedArea}</Text>
              <Text style={styles.pillTip}>Tap to change</Text>
            </View>
          ) : (
            <Text style={styles.noArea}>Select an area on the body above</Text>
          )}

          {/* Severity */}
          <Text style={styles.fieldLabel}>Severity (1–10)</Text>
          <View style={styles.sevRow}>
            {[1,2,3,4,5,6,7,8,9,10].map(n => (
              <Pressable key={n} style={[styles.sevDot, n <= severity && { backgroundColor: severity >= 7 ? Colors.urgent : severity >= 4 ? Colors.warning : Colors.ok }]} onPress={() => setSeverity(n)} />
            ))}
            <Text style={styles.sevNum}>{severity}</Text>
          </View>

          {/* Urgency */}
          <Text style={styles.fieldLabel}>Urgency</Text>
          <View style={styles.urgRow}>
            {URGENCIES.map(u => (
              <Pressable key={u.key} style={[styles.urgBtn, urgency === u.key && { backgroundColor: u.bg, borderColor: u.border }]} onPress={() => setUrgency(u.key)}>
                <Text style={[styles.urgTxt, urgency === u.key && { color: u.text, fontFamily: FONTS.bodySemi }]}>{u.label}</Text>
              </Pressable>
            ))}
          </View>

          {/* When */}
          <Text style={styles.fieldLabel}>When did this start?</Text>
          <TextInput style={styles.input} placeholder="e.g. 3 days ago, last week…" placeholderTextColor={Colors.textFaint} value={startTime} onChangeText={setStartTime} />

          {/* Description */}
          <Text style={styles.fieldLabel}>Describe your concern *</Text>
          <TextInput style={[styles.input, styles.inputTall]} placeholder="e.g. Sharp pain when walking, worse at night…" placeholderTextColor={Colors.textFaint} multiline value={description} onChangeText={setDescription} textAlignVertical="top" />

          {/* Notes */}
          <Text style={styles.fieldLabel}>Additional notes (optional)</Text>
          <TextInput style={[styles.input, { height:64 }]} placeholder="Anything else to mention to your doctor?" placeholderTextColor={Colors.textFaint} multiline value={notes} onChangeText={setNotes} textAlignVertical="top" />

          {feedback && (
            <View style={[styles.feedback, feedback.type === 'err' ? styles.fbErr : styles.fbOk]}>
              <Text style={{ fontFamily: FONTS.body, fontSize: FontSize.small, color: feedback.type === 'err' ? Colors.redDark : '#166534' }}>{feedback.msg}</Text>
            </View>
          )}

          <Pressable style={({ pressed }) => [styles.submitBtn, pressed && { opacity:0.85 }]} onPress={submit}>
            <Text style={styles.submitTxt}>GENERATE VISIT PREP</Text>
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>
    );
  }

  // ── List view ────────────────────────────────────────────────────────────────
  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <StatusBar barStyle="dark-content" backgroundColor={Colors.offWhite} />

      <View style={styles.header}>
        <View>
          <Text style={styles.title}>MY CONCERNS</Text>
          <Text style={styles.subtitle}>
            {concerns.length > 0 ? `${concerns.length} active log${concerns.length !== 1 ? 's' : ''}` : 'No concerns logged yet'}
          </Text>
        </View>
        <Pressable style={styles.archiveLink} onPress={() => router.push('/(tabs)/edit-concern')}>
          <Text style={styles.archiveLinkTxt}>Archived</Text>
        </Pressable>
      </View>

      <ScrollView
        style={styles.scroll}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: insets.bottom + 100 }}
      >
        {listLoading ? (
          <ActivityIndicator color={Colors.red} style={{ padding: 40 }} />
        ) : concerns.length === 0 ? (
          <View style={styles.emptyWrap}>
            <Text style={styles.emptyTitle}>Nothing logged yet</Text>
            <Text style={styles.emptyBody}>
              Tap the button below to log your first concern. IBM Granite will categorize it and help you prepare for a doctor visit.
            </Text>
          </View>
        ) : (
          concerns.map((c, i) => (
            <ConcernItem
              key={c.id || i}
              concern={c}
              onArchive={handleArchive}
              onPress={() => router.push({ pathname: '/(tabs)/edit-concern', params: { id: c.id } })}
            />
          ))
        )}
      </ScrollView>

      {/* FAB */}
      <View style={[styles.fabWrap, { bottom: insets.bottom + 24 }]}>
        <Pressable
          style={({ pressed }) => [styles.fab, pressed && { transform:[{scale:0.95}] }]}
          onPress={() => setShowForm(true)}
        >
          <Svg width={22} height={22} viewBox="0 0 22 22">
            <Path d="M11 4v14M4 11h14" stroke={Colors.white} strokeWidth={2.5} strokeLinecap="round" />
          </Svg>
          <Text style={styles.fabTxt}>LOG CONCERN</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root:    { flex:1, backgroundColor: Colors.offWhite },
  header:  { flexDirection:'row', justifyContent:'space-between', alignItems:'flex-end', paddingHorizontal:20, paddingTop:10, paddingBottom:12 },
  title:   { fontFamily: FONTS.display, fontSize:30, color: Colors.black, letterSpacing:1 },
  subtitle:{ fontFamily: FONTS.body, fontSize: FontSize.small, color: Colors.textMuted, marginTop:2 },
  archiveLink: { paddingVertical:6, paddingHorizontal:10, backgroundColor: Colors.surface2, borderRadius: Radius.pill, borderWidth:1, borderColor: Colors.border },
  archiveLinkTxt: { fontFamily: FONTS.bodySemi, fontSize: FontSize.small, color: Colors.textMuted },
  scroll:  { flex:1, paddingHorizontal:20 },

  emptyWrap: { paddingTop:48, alignItems:'center', paddingHorizontal:16 },
  emptyTitle:{ fontFamily: FONTS.bodySemi, fontSize: FontSize.medium, color: Colors.text, marginBottom:10 },
  emptyBody: { fontFamily: FONTS.body, fontSize: FontSize.body, color: Colors.textMuted, textAlign:'center', lineHeight:21 },

  fabWrap:  { position:'absolute', left:0, right:0, alignItems:'center' },
  fab:      { flexDirection:'row', alignItems:'center', gap:10, backgroundColor: Colors.red, borderRadius: Radius.pill, paddingVertical:14, paddingHorizontal:28, ...Shadow.lg },
  fabTxt:   { fontFamily: FONTS.display, fontSize:18, letterSpacing:2, color: Colors.white },

  // Form
  loadingOverlay: { flex:1, backgroundColor: Colors.offWhite, alignItems:'center', justifyContent:'center', padding:32 },
  loadingCard:    { alignItems:'center', gap:16 },
  loadingMsg:     { fontFamily: FONTS.bodySemi, fontSize: FontSize.medium, color: Colors.text, textAlign:'center' },
  loadingSub:     { fontFamily: FONTS.body, fontSize: FontSize.small, color: Colors.textMuted },

  formHeader: { flexDirection:'row', alignItems:'center', justifyContent:'space-between', paddingHorizontal:20, paddingBottom:8 },
  backBtn:    { width:40, height:40, alignItems:'center', justifyContent:'center' },
  formTitle:  { fontFamily: FONTS.display, fontSize:26, color: Colors.black, letterSpacing:1 },

  mapHint:  { fontFamily: FONTS.body, fontSize: FontSize.small, color: Colors.textMuted, textAlign:'center', marginTop:12, marginBottom:8 },
  mapWrap:  { alignItems:'center', marginBottom:10 },
  selectedPill: { flexDirection:'row', alignItems:'center', gap:8, backgroundColor: Colors.black, borderRadius: Radius.sm, paddingVertical:10, paddingHorizontal:14, marginBottom:16 },
  pillDot:  { width:7, height:7, borderRadius:4 },
  pillArea: { flex:1, fontFamily: FONTS.bodySemi, fontSize: FontSize.body, color: Colors.white },
  pillTip:  { fontFamily: FONTS.body, fontSize: FontSize.tiny, color:'rgba(255,255,255,0.35)' },
  noArea:   { fontFamily: FONTS.body, fontSize: FontSize.small, color: Colors.textFaint, marginBottom:16 },

  fieldLabel: { fontFamily: FONTS.bodySemi, fontSize: FontSize.tiny, color: Colors.textMuted, textTransform:'uppercase', letterSpacing:1, marginBottom:6, marginTop:14 },

  sevRow:  { flexDirection:'row', alignItems:'center', gap:5 },
  sevDot:  { flex:1, height:6, borderRadius:3, backgroundColor: Colors.surface3 },
  sevNum:  { fontFamily: FONTS.bodySemi, fontSize:16, color: Colors.text, minWidth:24, textAlign:'center' },

  urgRow:  { flexDirection:'row', gap:8 },
  urgBtn:  { flex:1, paddingVertical:9, borderWidth:1.5, borderColor: Colors.borderStrong, borderRadius: Radius.xs, alignItems:'center', backgroundColor: Colors.surface },
  urgTxt:  { fontFamily: FONTS.body, fontSize: FontSize.small, color: Colors.textMuted },

  input:    { backgroundColor: Colors.surface, borderWidth:1.5, borderColor: Colors.border, borderRadius: Radius.xs, paddingHorizontal:12, paddingVertical:10, fontSize: FontSize.body, fontFamily: FONTS.body, color: Colors.text },
  inputTall:{ height:88, textAlignVertical:'top' },

  feedback: { borderRadius: Radius.xs, padding:10, marginTop:10 },
  fbErr:    { backgroundColor: Colors.redLight },
  fbOk:     { backgroundColor: Colors.okLight },

  submitBtn: { backgroundColor: Colors.red, borderRadius: Radius.sm, paddingVertical:15, alignItems:'center', marginTop:20, ...Shadow.md },
  submitTxt: { fontFamily: FONTS.display, fontSize:22, letterSpacing:2, color: Colors.white },
});