/**
 * app/(tabs)/timeline.js — Post-visit health timeline
 *
 * Redesigned with warm red/white/charcoal brand.
 * Shows post-appointment records with archive support.
 * GET /api/timeline — most recent first.
 */

import { useState, useCallback } from 'react';
import {
  View, Text, ScrollView, StyleSheet, StatusBar,
  ActivityIndicator, Pressable, Alert,
} from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { Linking } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Path, Circle, Rect } from 'react-native-svg';
import { Colors, FONTS, FontSize, Radius, Shadow } from '../../constants/theme';
import { api } from '../../services/api';

// ─── Date formatter ───────────────────────────────────────────────────────────
function fmtDate(dateStr) {
  if (!dateStr) return 'Unknown Date';
  try {
    const d = new Date(dateStr + 'T00:00:00');
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  } catch { return dateStr; }
}

// ─── Timeline entry card ──────────────────────────────────────────────────────
function RecordCard({ item, onArchive }) {
  const [expanded,  setExpanded]  = useState(false);
  const [uploads,   setUploads]   = useState(null);   // null = not loaded yet
  const [loadingUp, setLoadingUp] = useState(false);

  async function handleExpand() {
    const next = !expanded;
    setExpanded(next);
    if (next && uploads === null && item.id) {
      setLoadingUp(true);
      try {
        const d = await api.getTimelineUploads(item.id);
        setUploads(d.uploads || []);
      } catch {
        setUploads([]);
      } finally {
        setLoadingUp(false);
      }
    }
  }

  async function openUpload(upload) {
    try {
      const { API_BASE_URL } = await import('../../services/api');
      const { default: AS }  = await import('@react-native-async-storage/async-storage');
      const token = await AS.getItem('pulse_auth_token');
      const url   = `${API_BASE_URL}/api/uploads/${upload.id}/download`;
      await Linking.openURL(token ? `${url}?token=${token}` : url);
    } catch {
      Alert.alert('Error', 'Could not open file.');
    }
  }

  async function openReport() {
    try {
      const url = await api.getReportUrl(item.id);
      await Linking.openURL(url);
    } catch {
      Alert.alert('Error', 'Could not open report.');
    }
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

      {/* Diagnosis */}
      <Pressable onPress={() => setExpanded(e => !e)}>
        <Text style={rc.diagnosis}>{item.diagnosis}</Text>

        {/* Prescriptions preview */}
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
          </View>
        )}

        {/* Attachments + PDF */}
        {expanded && (
          <View style={rc.attachSection}>
            {loadingUp && (
              <ActivityIndicator color={Colors.red} size="small" style={{ marginBottom: 8 }} />
            )}
            {uploads && uploads.filter(u => !u.original_name?.startsWith('pulse_report_')).map((u, i) => (
              <Pressable key={i} style={rc.attachRow} onPress={() => openUpload(u)}>
                <View style={rc.attachIcon}>
                  <Text style={rc.attachIconTxt}>{u.mime_type === 'application/pdf' ? 'PDF' : 'IMG'}</Text>
                </View>
                <Text style={rc.attachName} numberOfLines={1}>{u.original_name}</Text>
                <Text style={rc.attachOpen}>Open ↗</Text>
              </Pressable>
            ))}
            <Pressable style={rc.reportBtn} onPress={openReport}>
              <Text style={rc.reportBtnTxt}>⬇  Download PDF Report</Text>
            </Pressable>
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
  card:       { backgroundColor: Colors.surface, borderRadius: Radius.md, padding: 14, marginBottom: 12, borderWidth: 1, borderColor: Colors.border, ...Shadow.sm },
  dateRow:    { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8, paddingBottom: 8, borderBottomWidth: 1, borderBottomColor: Colors.border },
  dateDot:    { width: 8, height: 8, borderRadius: 4, backgroundColor: Colors.red },
  dateText:   { flex: 1, fontFamily: FONTS.bodySemi, fontSize: FontSize.tiny, color: Colors.textMuted, letterSpacing: 0.5, textTransform: 'uppercase' },
  archBtn:    { padding: 4 },
  diagnosis:  { fontFamily: FONTS.bodySemi, fontSize: FontSize.medium, color: Colors.text, marginBottom: 6 },
  preview:    { fontFamily: FONTS.body, fontSize: FontSize.small, color: Colors.textFaint },
  detail:     { marginTop: 10, paddingTop: 10, borderTopWidth: 1, borderTopColor: Colors.border },
  section:    { marginBottom: 12 },
  sectionLbl: { fontFamily: FONTS.bodySemi, fontSize: FontSize.micro, color: Colors.textFaint, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 6 },
  listRow:    { flexDirection: 'row', alignItems: 'flex-start', gap: 6, marginBottom: 4 },
  rxLabel:    { fontFamily: FONTS.bodySemi, fontSize: FontSize.tiny, color: Colors.red, minWidth: 20 },
  bullet:     { width: 4, height: 4, borderRadius: 2, backgroundColor: Colors.textFaint, marginTop: 8, flexShrink: 0 },
  listTxt:    { flex: 1, fontFamily: FONTS.body, fontSize: FontSize.body, color: Colors.text, lineHeight: 20 },
  followupRow:{ flexDirection: 'row', alignItems: 'center', gap: 6, paddingTop: 8, borderTopWidth: 1, borderTopColor: Colors.border },
  followupLbl:{ fontFamily: FONTS.bodySemi, fontSize: FontSize.small, color: Colors.textMuted },
  followupVal:{ fontFamily: FONTS.bodySemi, fontSize: FontSize.body, color: Colors.text },
  chevron:    { alignItems: 'flex-end', marginTop: 6 },
  attachSection: { marginTop: 10, paddingTop: 10, borderTopWidth: 1, borderTopColor: Colors.border, gap: 6 },
  attachRow:  { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 6, backgroundColor: Colors.surface2, borderRadius: Radius.xs, paddingHorizontal: 10 },
  attachIcon: { backgroundColor: Colors.redLight, borderRadius: 4, paddingHorizontal: 5, paddingVertical: 2 },
  attachIconTxt: { fontFamily: FONTS.bodySemi, fontSize: FontSize.micro, color: Colors.redDark },
  attachName: { flex: 1, fontFamily: FONTS.body, fontSize: FontSize.small, color: Colors.text },
  attachOpen: { fontFamily: FONTS.bodySemi, fontSize: FontSize.tiny, color: Colors.red },
  reportBtn:  { flexDirection: 'row', justifyContent: 'center', backgroundColor: Colors.black, borderRadius: Radius.xs, paddingVertical: 10, marginTop: 4 },
  reportBtnTxt:{ fontFamily: FONTS.bodySemi, fontSize: FontSize.small, color: Colors.white, letterSpacing: 0.5 },
});

// ─── Screen ───────────────────────────────────────────────────────────────────

export default function TimelineScreen() {
  const insets  = useSafeAreaInsets();
  const router  = useRouter();
  const [timeline, setTimeline] = useState([]);
  const [loading,  setLoading]  = useState(true);

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
    Alert.alert(
      'Archive this record?',
      `"${item.diagnosis}" will be archived. You can restore it anytime.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Archive', style: 'destructive',
          onPress: async () => {
            try {
              await api.archiveTimelineEntry(item.id);
              setTimeline(prev => prev.filter(t => t.id !== item.id));
            } catch {
              Alert.alert('Error', 'Could not archive — is the server running?');
            }
          },
        },
      ]
    );
  }

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <StatusBar barStyle="dark-content" backgroundColor={Colors.offWhite} />

      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>TIMELINE</Text>
          <Text style={styles.subtitle}>Your post-appointment health records</Text>
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
        contentContainerStyle={{ paddingBottom: insets.bottom + 32 }}
      >
        {/* IBM strip */}
        {!loading && timeline.length > 0 && (
          <View style={styles.ibmStrip}>
            <View style={styles.ibmDot} />
            <Text style={styles.ibmTxt}>
              IBM Granite extracted these records from your doctor notes
            </Text>
          </View>
        )}

        {/* Content */}
        {loading ? (
          <ActivityIndicator color={Colors.red} style={{ padding: 40 }} />

        ) : timeline.length === 0 ? (
          <View style={styles.emptyWrap}>
            <Text style={styles.emptyTitle}>No post-visit records yet</Text>
            <Text style={styles.emptyBody}>
              After your appointment, upload your doctor notes to build your timeline.
            </Text>
            <Pressable
              style={({ pressed }) => [styles.uploadBtn, pressed && { opacity: 0.8 }]}
              onPress={() => router.push('/doctor-notes')}
            >
              <Text style={styles.uploadBtnTxt}>Upload Doctor Notes</Text>
            </Pressable>
          </View>

        ) : (
          <View style={styles.list}>
            {timeline.map((item, i) => (
              <RecordCard key={item.id || i} item={item} onArchive={handleArchive} />
            ))}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root:    { flex: 1, backgroundColor: Colors.offWhite },

  header:    { paddingHorizontal: 20, paddingTop: 10, paddingBottom: 12, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end' },
  title:     { fontFamily: FONTS.display, fontSize: 30, color: Colors.black, letterSpacing: 1 },
  subtitle:  { fontFamily: FONTS.body, fontSize: FontSize.small, color: Colors.textMuted, marginTop: 2 },
  countBadge:{ alignItems: 'center', backgroundColor: Colors.surface, borderRadius: Radius.sm, paddingHorizontal: 14, paddingVertical: 8, borderWidth: 1, borderColor: Colors.border },
  countNum:  { fontFamily: FONTS.display, fontSize: 22, color: Colors.black },
  countLbl:  { fontFamily: FONTS.body, fontSize: FontSize.micro, color: Colors.textFaint, textTransform: 'uppercase', letterSpacing: 1 },

  scroll: { flex: 1, paddingHorizontal: 20 },

  ibmStrip: { flexDirection: 'row', alignItems: 'center', gap: 7, backgroundColor: Colors.okLight, borderRadius: Radius.xs, paddingVertical: 8, paddingHorizontal: 12, marginBottom: 14, borderWidth: 1, borderColor: Colors.ok + '44' },
  ibmDot:   { width: 6, height: 6, borderRadius: 3, backgroundColor: Colors.ok },
  ibmTxt:   { flex: 1, fontFamily: FONTS.body, fontSize: FontSize.tiny, color: '#1A6B40' },

  emptyWrap:  { paddingTop: 48, alignItems: 'center', paddingHorizontal: 24 },
  emptyTitle: { fontFamily: FONTS.bodySemi, fontSize: FontSize.medium, color: Colors.text, marginBottom: 10, textAlign: 'center' },
  emptyBody:  { fontFamily: FONTS.body, fontSize: FontSize.body, color: Colors.textMuted, textAlign: 'center', lineHeight: 21, marginBottom: 24 },
  uploadBtn:  { borderWidth: 1.5, borderColor: Colors.red, borderRadius: Radius.sm, paddingVertical: 12, paddingHorizontal: 24 },
  uploadBtnTxt:{ fontFamily: FONTS.bodySemi, fontSize: FontSize.body, color: Colors.red },

  list: { gap: 0 },
});