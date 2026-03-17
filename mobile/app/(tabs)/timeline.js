/**
 * app/(tabs)/timeline.js — Post-Appointment Records
 * (Renamed "Records" in UI, route stays "timeline" for compatibility)
 *
 * Features:
 *   - Lists all post-visit records from GET /api/timeline
 *   - FAB (＋) opens an action sheet: Take Photo / Upload File / Paste Text
 *   - Camera uses expo-image-picker (available in Expo Go)
 *   - File upload uses expo-document-picker
 *   - Expanded record card shows attachments + PDF download button
 *   - Archive support
 */

import { useState, useCallback, useRef } from 'react';
import {
  View, Text, ScrollView, StyleSheet, StatusBar,
  ActivityIndicator, Pressable, Alert, Animated,
  Modal, TouchableOpacity, TouchableWithoutFeedback,
  Linking,
} from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Path, Circle, Rect } from 'react-native-svg';
import { Colors, FONTS, FontSize, Radius, Shadow } from '../../constants/theme';
import { api, API_BASE_URL } from '../../services/api';

// ─── Try loading optional camera/picker libs ──────────────────────────────────
let ImagePicker = null;
let DocumentPicker = null;
try { ImagePicker    = require('expo-image-picker'); }    catch {}
try { DocumentPicker = require('expo-document-picker'); } catch {}

// ─── Date helper ─────────────────────────────────────────────────────────────
function fmtDate(s) {
  if (!s) return '';
  try {
    return new Date(s + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  } catch { return s; }
}

// ─── Record card ─────────────────────────────────────────────────────────────
function RecordCard({ item, onArchive }) {
  const [expanded,  setExpanded]  = useState(false);
  const [uploads,   setUploads]   = useState(null);
  const [loadingUp, setLoadingUp] = useState(false);

  async function handleExpand() {
    const next = !expanded;
    setExpanded(next);
    if (next && uploads === null && item.id) {
      setLoadingUp(true);
      try {
        const d = await api.getTimelineUploads(item.id);
        setUploads(d.uploads || []);
      } catch { setUploads([]); }
      finally  { setLoadingUp(false); }
    }
  }

  async function openFile(upload) {
    try {
      const token = await (await import('@react-native-async-storage/async-storage')).default.getItem('pulse_auth_token');
      const url   = `${API_BASE_URL}/api/uploads/${upload.id}/download`;
      await Linking.openURL(token ? `${url}?token=${token}` : url);
    } catch { Alert.alert('Error', 'Could not open file.'); }
  }

  async function openReport() {
    try {
      const url = await api.getReportUrl(item.id);
      await Linking.openURL(url);
    } catch { Alert.alert('Error', 'Could not open report. Make sure the backend is running.'); }
  }

  return (
    <View style={rc.card}>
      {/* Date row */}
      <View style={rc.dateRow}>
        <View style={rc.dateDot} />
        <Text style={rc.dateText}>{fmtDate(item.visit_date)}</Text>
        <Pressable style={rc.archBtn} onPress={() => onArchive(item)} hitSlop={8}>
          <Svg width={14} height={14} viewBox="0 0 14 14">
            <Rect x={1} y={4} width={12} height={9} rx={1.5} stroke={Colors.textFaint} strokeWidth={1.2} fill="none" />
            <Path d="M1 4h12M5 7v3M9 7v3" stroke={Colors.textFaint} strokeWidth={1.2} strokeLinecap="round" fill="none" />
            <Rect x={4.5} y={1.5} width={5} height={2.5} rx={1} stroke={Colors.textFaint} strokeWidth={1.2} fill="none" />
          </Svg>
        </Pressable>
      </View>

      <Pressable onPress={handleExpand}>
        {/* Diagnosis */}
        <Text style={rc.diagnosis}>{item.diagnosis}</Text>

        {/* Preview when collapsed */}
        {!expanded && item.prescriptions?.length > 0 && (
          <Text style={rc.preview} numberOfLines={1}>
            Rx: {item.prescriptions.slice(0, 2).join(' · ')}
            {item.prescriptions.length > 2 ? ` +${item.prescriptions.length - 2} more` : ''}
          </Text>
        )}

        {/* Expanded detail */}
        {expanded && (
          <View style={rc.detail}>
            {item.prescriptions?.length > 0 && (
              <View style={rc.section}>
                <Text style={rc.sectionLbl}>PRESCRIPTIONS</Text>
                {item.prescriptions.map((rx, i) => (
                  <View key={i} style={rc.listRow}>
                    <Text style={rc.rxLabel}>Rx</Text>
                    <Text style={rc.listTxt}>{rx}</Text>
                  </View>
                ))}
              </View>
            )}
            {item.key_advice?.length > 0 && (
              <View style={rc.section}>
                <Text style={rc.sectionLbl}>DOCTOR'S ADVICE</Text>
                {item.key_advice.map((tip, i) => (
                  <View key={i} style={rc.listRow}>
                    <View style={rc.bullet} />
                    <Text style={rc.listTxt}>{tip}</Text>
                  </View>
                ))}
              </View>
            )}
            {!!item.follow_up_date && (
              <View style={rc.followupRow}>
                <Svg width={14} height={14} viewBox="0 0 14 14">
                  <Rect x={2} y={3} width={10} height={10} rx={1.5} stroke={Colors.red} strokeWidth={1.3} fill="none" />
                  <Path d="M5 1.5v2M9 1.5v2M2 6.5h10" stroke={Colors.red} strokeWidth={1.3} strokeLinecap="round" />
                </Svg>
                <Text style={rc.followupLbl}>Follow-up:</Text>
                <Text style={rc.followupVal}>{item.follow_up_date}</Text>
              </View>
            )}

            {/* Attachments */}
            <View style={rc.attachSection}>
              {loadingUp && <ActivityIndicator color={Colors.red} size="small" style={{ marginBottom: 8 }} />}
              {uploads && uploads.filter(u => !u.original_name?.startsWith('pulse_report_')).map((u, i) => (
                <Pressable key={i} style={rc.attachRow} onPress={() => openFile(u)}>
                  <View style={rc.attachIcon}>
                    <Text style={rc.attachIconTxt}>{u.mime_type === 'application/pdf' ? 'PDF' : 'IMG'}</Text>
                  </View>
                  <Text style={rc.attachName} numberOfLines={1}>{u.original_name}</Text>
                  <Text style={rc.attachOpen}>Open ↗</Text>
                </Pressable>
              ))}
              <Pressable style={rc.reportBtn} onPress={openReport}>
                <Svg width={14} height={14} viewBox="0 0 14 14" style={{ marginRight: 6 }}>
                  <Rect x={2} y={2} width={10} height={10} rx={1.5} stroke={Colors.white} strokeWidth={1.2} fill="none" />
                  <Path d="M7 4v5M5 7l2 2 2-2" stroke={Colors.white} strokeWidth={1.2} strokeLinecap="round" strokeLinejoin="round" fill="none" />
                </Svg>
                <Text style={rc.reportBtnTxt}>Download PDF Report</Text>
              </Pressable>
            </View>
          </View>
        )}

        {/* Expand chevron */}
        <View style={rc.chevron}>
          <Svg width={14} height={14} viewBox="0 0 14 14">
            <Path d={expanded ? 'M3 9l4-4 4 4' : 'M3 5l4 4 4-4'} stroke={Colors.textFaint} strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" fill="none" />
          </Svg>
        </View>
      </Pressable>
    </View>
  );
}

const rc = StyleSheet.create({
  card:         { backgroundColor: Colors.surface, borderRadius: Radius.md, padding: 14, marginBottom: 12, borderWidth: 1, borderColor: Colors.border, ...Shadow.sm },
  dateRow:      { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8, paddingBottom: 8, borderBottomWidth: 1, borderBottomColor: Colors.border },
  dateDot:      { width: 8, height: 8, borderRadius: 4, backgroundColor: Colors.red },
  dateText:     { flex: 1, fontFamily: FONTS.bodySemi, fontSize: FontSize.tiny, color: Colors.textMuted, letterSpacing: 0.5, textTransform: 'uppercase' },
  archBtn:      { padding: 4 },
  diagnosis:    { fontFamily: FONTS.bodySemi, fontSize: FontSize.medium, color: Colors.text, marginBottom: 6 },
  preview:      { fontFamily: FONTS.body, fontSize: FontSize.small, color: Colors.textFaint },
  detail:       { marginTop: 10, paddingTop: 10, borderTopWidth: 1, borderTopColor: Colors.border },
  section:      { marginBottom: 12 },
  sectionLbl:   { fontFamily: FONTS.bodySemi, fontSize: FontSize.micro, color: Colors.textFaint, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 6 },
  listRow:      { flexDirection: 'row', alignItems: 'flex-start', gap: 6, marginBottom: 4 },
  rxLabel:      { fontFamily: FONTS.bodySemi, fontSize: FontSize.tiny, color: Colors.red, minWidth: 20 },
  bullet:       { width: 4, height: 4, borderRadius: 2, backgroundColor: Colors.textFaint, marginTop: 8, flexShrink: 0 },
  listTxt:      { flex: 1, fontFamily: FONTS.body, fontSize: FontSize.body, color: Colors.text, lineHeight: 20 },
  followupRow:  { flexDirection: 'row', alignItems: 'center', gap: 6, paddingTop: 8, borderTopWidth: 1, borderTopColor: Colors.border, marginBottom: 12 },
  followupLbl:  { fontFamily: FONTS.bodySemi, fontSize: FontSize.small, color: Colors.textMuted },
  followupVal:  { fontFamily: FONTS.bodySemi, fontSize: FontSize.body, color: Colors.text },
  attachSection:{ gap: 6, paddingTop: 4 },
  attachRow:    { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: Colors.surface2, borderRadius: Radius.xs, padding: 10 },
  attachIcon:   { backgroundColor: Colors.redLight, borderRadius: 4, paddingHorizontal: 5, paddingVertical: 2 },
  attachIconTxt:{ fontFamily: FONTS.bodySemi, fontSize: FontSize.micro, color: Colors.redDark },
  attachName:   { flex: 1, fontFamily: FONTS.body, fontSize: FontSize.small, color: Colors.text },
  attachOpen:   { fontFamily: FONTS.bodySemi, fontSize: FontSize.tiny, color: Colors.red },
  reportBtn:    { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', backgroundColor: Colors.black, borderRadius: Radius.xs, paddingVertical: 10, marginTop: 4 },
  reportBtnTxt: { fontFamily: FONTS.bodySemi, fontSize: FontSize.small, color: Colors.white, letterSpacing: 0.5 },
  chevron:      { alignItems: 'flex-end', marginTop: 6 },
});

// ─── Add-record action sheet ──────────────────────────────────────────────────
function AddRecordSheet({ visible, onClose, onPickCamera, onPickFile, onPasteText }) {
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={sh.backdrop} />
      </TouchableWithoutFeedback>
      <View style={sh.sheet}>
        <View style={sh.handle} />
        <Text style={sh.title}>Add Post-Visit Record</Text>
        <Text style={sh.sub}>Upload your doctor notes or take a photo</Text>

        <TouchableOpacity style={sh.option} onPress={onPickCamera} activeOpacity={0.7}>
          <View style={[sh.optIcon, { backgroundColor: '#EAF5EF' }]}>
            <Svg width={22} height={22} viewBox="0 0 22 22">
              <Rect x={2} y={6} width={18} height={13} rx={2} stroke={Colors.ok} strokeWidth={1.5} fill="none" />
              <Circle cx={11} cy={13} r={3.5} stroke={Colors.ok} strokeWidth={1.5} fill="none" />
              <Path d="M8 6l1.5-2h3L14 6" stroke={Colors.ok} strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" fill="none" />
            </Svg>
          </View>
          <View style={sh.optText}>
            <Text style={sh.optTitle}>Take Photo</Text>
            <Text style={sh.optSub}>Photograph discharge summary or notes</Text>
          </View>
          <Text style={sh.optArrow}>›</Text>
        </TouchableOpacity>

        <TouchableOpacity style={sh.option} onPress={onPickFile} activeOpacity={0.7}>
          <View style={[sh.optIcon, { backgroundColor: Colors.redLight }]}>
            <Svg width={22} height={22} viewBox="0 0 22 22">
              <Rect x={3} y={2} width={16} height={18} rx={2} stroke={Colors.red} strokeWidth={1.5} fill="none" />
              <Path d="M11 8v6M8 11l3-3 3 3" stroke={Colors.red} strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" fill="none" />
            </Svg>
          </View>
          <View style={sh.optText}>
            <Text style={sh.optTitle}>Upload File</Text>
            <Text style={sh.optSub}>PDF, image, or document from your device</Text>
          </View>
          <Text style={sh.optArrow}>›</Text>
        </TouchableOpacity>

        <TouchableOpacity style={sh.option} onPress={onPasteText} activeOpacity={0.7}>
          <View style={[sh.optIcon, { backgroundColor: '#EDF4FF' }]}>
            <Svg width={22} height={22} viewBox="0 0 22 22">
              <Rect x={4} y={3} width={14} height={16} rx={2} stroke={Colors.ibmBlue} strokeWidth={1.5} fill="none" />
              <Path d="M7 8h8M7 12h8M7 16h5" stroke={Colors.ibmBlue} strokeWidth={1.5} strokeLinecap="round" />
            </Svg>
          </View>
          <View style={sh.optText}>
            <Text style={sh.optTitle}>Paste Text</Text>
            <Text style={sh.optSub}>Copy-paste your notes for AI extraction</Text>
          </View>
          <Text style={sh.optArrow}>›</Text>
        </TouchableOpacity>

        <TouchableOpacity style={sh.cancel} onPress={onClose} activeOpacity={0.7}>
          <Text style={sh.cancelTxt}>Cancel</Text>
        </TouchableOpacity>
      </View>
    </Modal>
  );
}

const sh = StyleSheet.create({
  backdrop:  { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)' },
  sheet:     { backgroundColor: Colors.surface, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20, paddingBottom: 36, gap: 0 },
  handle:    { width: 36, height: 4, backgroundColor: Colors.border, borderRadius: 2, alignSelf: 'center', marginBottom: 16 },
  title:     { fontFamily: FONTS.display, fontSize: 24, color: Colors.black, letterSpacing: 0.5, marginBottom: 4 },
  sub:       { fontFamily: FONTS.body, fontSize: FontSize.small, color: Colors.textMuted, marginBottom: 16 },
  option:    { flexDirection: 'row', alignItems: 'center', gap: 14, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: Colors.border },
  optIcon:   { width: 44, height: 44, borderRadius: Radius.sm, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  optText:   { flex: 1 },
  optTitle:  { fontFamily: FONTS.bodySemi, fontSize: FontSize.body, color: Colors.text },
  optSub:    { fontFamily: FONTS.body, fontSize: FontSize.small, color: Colors.textMuted, marginTop: 2 },
  optArrow:  { fontFamily: FONTS.body, fontSize: 22, color: Colors.textFaint },
  cancel:    { paddingVertical: 14, alignItems: 'center', marginTop: 4 },
  cancelTxt: { fontFamily: FONTS.bodySemi, fontSize: FontSize.body, color: Colors.textMuted },
});

// ─── Main screen ──────────────────────────────────────────────────────────────
export default function RecordsScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [timeline,    setTimeline]    = useState([]);
  const [loading,     setLoading]     = useState(true);
  const [sheetOpen,   setSheetOpen]   = useState(false);
  const fabScale = useRef(new Animated.Value(1)).current;

  useFocusEffect(useCallback(() => { load(); }, []));

  async function load() {
    setLoading(true);
    try {
      const d = await api.getTimeline();
      setTimeline(Array.isArray(d.timeline) ? d.timeline : []);
    } catch {
      setTimeline([]);
    } finally {
      setLoading(false);
    }
  }

  async function handleArchive(item) {
    Alert.alert('Archive record?', `"${item.diagnosis}" will be archived.`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Archive', style: 'destructive', onPress: async () => {
        try {
          await api.archiveTimelineEntry(item.id);
          setTimeline(prev => prev.filter(t => t.id !== item.id));
        } catch {
          Alert.alert('Error', 'Could not archive — is the server running?');
        }
      }},
    ]);
  }

  // FAB press animation
  function pressFab() {
    Animated.sequence([
      Animated.timing(fabScale, { toValue: 0.88, duration: 80, useNativeDriver: true }),
      Animated.timing(fabScale, { toValue: 1,    duration: 80, useNativeDriver: true }),
    ]).start(() => setSheetOpen(true));
  }

  // ── Camera ───────────────────────────────────────────────────────────────
  async function handleCamera() {
    setSheetOpen(false);
    if (!ImagePicker) {
      Alert.alert('Not installed', 'Run: npx expo install expo-image-picker');
      return;
    }
    const perm = await ImagePicker.requestCameraPermissionsAsync();
    if (!perm.granted) {
      Alert.alert('Permission needed', 'Camera access is required to photograph your notes.');
      return;
    }
    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsMultipleSelection: false,
      quality: 0.85,
    });
    if (result.canceled || !result.assets?.length) return;
    const asset = result.assets[0];
    router.push({
      pathname: '/doctor-notes',
      params:   { preloadedUri: asset.uri, preloadedName: 'camera-photo.jpg', preloadedMime: 'image/jpeg' },
    });
  }

  // ── File picker ──────────────────────────────────────────────────────────
  async function handlePickFile() {
    setSheetOpen(false);
    if (!DocumentPicker) {
      Alert.alert('Not installed', 'Run: npx expo install expo-document-picker');
      return;
    }
    const result = await DocumentPicker.getDocumentAsync({
      type: ['application/pdf', 'image/jpeg', 'image/png', 'image/heic', 'image/webp'],
      copyToCacheDirectory: true,
      multiple: false,
    });
    if (result.canceled || !result.assets?.length) return;
    const asset = result.assets[0];
    router.push({
      pathname: '/doctor-notes',
      params:   { preloadedUri: asset.uri, preloadedName: asset.name, preloadedMime: asset.mimeType || 'application/octet-stream' },
    });
  }

  // ── Paste text ───────────────────────────────────────────────────────────
  function handlePasteText() {
    setSheetOpen(false);
    router.push('/doctor-notes');
  }

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <StatusBar barStyle="dark-content" backgroundColor={Colors.offWhite} />

      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>RECORDS</Text>
          <Text style={styles.subtitle}>Post-appointment reports</Text>
        </View>
        {!loading && timeline.length > 0 && (
          <View style={styles.countBadge}>
            <Text style={styles.countNum}>{timeline.length}</Text>
            <Text style={styles.countLbl}>visits</Text>
          </View>
        )}
      </View>

      <ScrollView
        style={styles.scroll}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: insets.bottom + 100 }}
      >
        {!loading && timeline.length > 0 && (
          <View style={styles.ibmStrip}>
            <View style={styles.ibmDot} />
            <Text style={styles.ibmTxt}>IBM Granite extracted these records from your doctor notes</Text>
          </View>
        )}

        {loading ? (
          <ActivityIndicator color={Colors.red} style={{ padding: 40 }} />
        ) : timeline.length === 0 ? (
          <View style={styles.emptyWrap}>
            <Svg width={56} height={56} viewBox="0 0 56 56" style={{ marginBottom: 12 }}>
              <Rect x={8} y={8} width={40} height={40} rx={8} fill={Colors.surface2} />
              <Path d="M20 28h16M28 20v16" stroke={Colors.borderStrong} strokeWidth={2.5} strokeLinecap="round" />
            </Svg>
            <Text style={styles.emptyTitle}>No records yet</Text>
            <Text style={styles.emptyBody}>
              Tap the ＋ button to add your first post-appointment report.
            </Text>
          </View>
        ) : (
          timeline.map((item, i) => (
            <RecordCard key={item.id || i} item={item} onArchive={handleArchive} />
          ))
        )}
      </ScrollView>

      {/* FAB */}
      <Animated.View style={[styles.fabWrap, { transform: [{ scale: fabScale }], bottom: insets.bottom + 24 }]}>
        <Pressable style={styles.fab} onPress={pressFab}>
          <Svg width={28} height={28} viewBox="0 0 28 28">
            <Path d="M14 6v16M6 14h16" stroke={Colors.white} strokeWidth={2.5} strokeLinecap="round" />
          </Svg>
        </Pressable>
      </Animated.View>

      {/* Action sheet */}
      <AddRecordSheet
        visible={sheetOpen}
        onClose={() => setSheetOpen(false)}
        onPickCamera={handleCamera}
        onPickFile={handlePickFile}
        onPasteText={handlePasteText}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root:      { flex: 1, backgroundColor: Colors.offWhite },
  header:    { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', paddingHorizontal: 20, paddingTop: 10, paddingBottom: 12 },
  title:     { fontFamily: FONTS.display, fontSize: 30, color: Colors.black, letterSpacing: 1 },
  subtitle:  { fontFamily: FONTS.body, fontSize: FontSize.small, color: Colors.textMuted, marginTop: 2 },
  countBadge:{ alignItems: 'center', backgroundColor: Colors.surface, borderRadius: Radius.sm, paddingHorizontal: 14, paddingVertical: 8, borderWidth: 1, borderColor: Colors.border },
  countNum:  { fontFamily: FONTS.display, fontSize: 22, color: Colors.black },
  countLbl:  { fontFamily: FONTS.body, fontSize: FontSize.micro, color: Colors.textFaint, textTransform: 'uppercase', letterSpacing: 1 },
  scroll:    { flex: 1, paddingHorizontal: 20 },
  ibmStrip:  { flexDirection: 'row', alignItems: 'center', gap: 7, backgroundColor: Colors.okLight, borderRadius: Radius.xs, paddingVertical: 8, paddingHorizontal: 12, marginBottom: 14, borderWidth: 1, borderColor: Colors.ok + '44' },
  ibmDot:    { width: 6, height: 6, borderRadius: 3, backgroundColor: Colors.ok },
  ibmTxt:    { flex: 1, fontFamily: FONTS.body, fontSize: FontSize.tiny, color: '#1A6B40' },
  emptyWrap: { flex: 1, alignItems: 'center', paddingTop: 60, paddingHorizontal: 32 },
  emptyTitle:{ fontFamily: FONTS.bodySemi, fontSize: FontSize.medium, color: Colors.text, marginBottom: 8, textAlign: 'center' },
  emptyBody: { fontFamily: FONTS.body, fontSize: FontSize.body, color: Colors.textMuted, textAlign: 'center', lineHeight: 21 },
  fabWrap:   { position: 'absolute', right: 24, ...Shadow.lg },
  fab:       { width: 60, height: 60, borderRadius: 30, backgroundColor: Colors.red, alignItems: 'center', justifyContent: 'center' },
});