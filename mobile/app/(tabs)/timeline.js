/**
 * app/(tabs)/timeline.js — Post-visit health timeline
 *
 * API contract implemented:
 *   GET /api/timeline
 *   Response: { timeline: [] }
 *   Each item: { visit_date, diagnosis, prescriptions: string[], key_advice: string[], follow_up_date }
 *
 * IMPORTANT: This screen shows post-appointment records ONLY (extracted from doctor notes).
 * Pre-visit concern logs are NOT shown here.
 *
 * Empty state provides a link to upload doctor notes.
 */

import { useState, useCallback } from 'react';
import {
  View, Text, ScrollView, StyleSheet,
  StatusBar, ActivityIndicator, Pressable,
} from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { C, FONTS } from '../../constants/colors';
import { ROUTES } from '../../constants/api';

// ─── Helpers ──────────────────────────────────────────────────────────────

/** Format an ISO date string (YYYY-MM-DD) as "Mar 17, 2026" */
function formatVisitDate(dateStr) {
  if (!dateStr) return 'Unknown Date';
  try {
    const d = new Date(dateStr + 'T00:00:00');
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  } catch {
    return dateStr;
  }
}

// ─── Screen ───────────────────────────────────────────────────────────────

export default function TimelineScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [timeline, setTimeline] = useState([]);
  const [loading,  setLoading]  = useState(true);

  // Reload every time the tab gains focus
  useFocusEffect(
    useCallback(() => { load(); }, [])
  );

  async function load() {
    setLoading(true);
    try {
      const r = await fetch(ROUTES.timeline);
      const d = await r.json();
      // API returns { timeline: [] } — most recent first
      setTimeline(Array.isArray(d.timeline) ? d.timeline : []);
    } catch {
      setTimeline([]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <StatusBar barStyle="dark-content" backgroundColor={C.white} />

      {/* ── Top bar ─────────────────────────────────────────────────── */}
      <View style={styles.topBar}>
        <View>
          <Text style={styles.topTitle}>TIMELINE</Text>
          <Text style={styles.topSub}>Your post-appointment health records</Text>
        </View>
      </View>

      <ScrollView
        style={styles.scroll}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: insets.bottom + 32 }}
      >
        {/* ── IBM Granite strip (shown when records exist) ──────────── */}
        {!loading && timeline.length >= 1 && (
          <View style={styles.graniteStrip}>
            <View style={styles.graniteDot} />
            <Text style={styles.graniteText}>
              IBM Granite extracted these records from your doctor notes
            </Text>
          </View>
        )}

        {/* ── Loading ───────────────────────────────────────────────── */}
        {loading ? (
          <ActivityIndicator color={C.red} style={{ padding: 40 }} />

        /* ── Empty state ────────────────────────────────────────────── */
        ) : timeline.length === 0 ? (
          <View style={styles.emptyWrap}>
            <Text style={styles.emptyTitle}>No post-visit records yet.</Text>
            <Text style={styles.emptyBody}>
              After your appointment, upload your doctor notes to build your timeline.
            </Text>
            {/* Simple Pressable with red border — avoids importing OutlineButton from tabs */}
            <Pressable
              style={({ pressed }) => [styles.uploadBtn, pressed && { opacity: 0.7 }]}
              onPress={() => router.push('/doctor-notes')}
            >
              <Text style={styles.uploadBtnTxt}>Upload Doctor Notes</Text>
            </Pressable>
          </View>

        /* ── Record list ─────────────────────────────────────────────── */
        ) : (
          <View style={styles.list}>
            {timeline.map((item, index) => (
              <View key={index} style={styles.recordCard}>

                {/* Date header */}
                <View style={styles.dateHeader}>
                  <View style={styles.dateDot} />
                  <Text style={styles.dateText}>{formatVisitDate(item.visit_date)}</Text>
                </View>

                {/* Diagnosis */}
                <Text style={styles.diagnosisTitle}>{item.diagnosis}</Text>

                {/* Prescriptions */}
                {Array.isArray(item.prescriptions) && item.prescriptions.length > 0 && (
                  <View style={styles.subsection}>
                    <Text style={styles.subsectionLabel}>PRESCRIPTIONS</Text>
                    {item.prescriptions.map((rx, i) => (
                      <View key={i} style={styles.listRow}>
                        <Text style={styles.listBullet}>Rx</Text>
                        <Text style={styles.listText}>{rx}</Text>
                      </View>
                    ))}
                  </View>
                )}

                {/* Key advice */}
                {Array.isArray(item.key_advice) && item.key_advice.length > 0 && (
                  <View style={styles.subsection}>
                    <Text style={styles.subsectionLabel}>DOCTOR'S ADVICE</Text>
                    {item.key_advice.map((tip, i) => (
                      <View key={i} style={styles.listRow}>
                        <View style={styles.bulletDot} />
                        <Text style={styles.listText}>{tip}</Text>
                      </View>
                    ))}
                  </View>
                )}

                {/* Follow-up date */}
                {!!item.follow_up_date && (
                  <View style={styles.followupRow}>
                    <Text style={styles.followupLabel}>Follow-up:</Text>
                    <Text style={styles.followupValue}>{item.follow_up_date}</Text>
                  </View>
                )}
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.white },

  topBar:   { paddingHorizontal: 20, paddingVertical: 12 },
  topTitle: { fontFamily: FONTS.display, fontSize: 32, color: C.black, letterSpacing: 1 },
  topSub:   { fontSize: 12, color: C.gray400, fontFamily: FONTS.body, marginTop: 1 },

  scroll: { flex: 1, paddingHorizontal: 20 },

  // IBM Granite attribution strip
  graniteStrip: {
    flexDirection:   'row',
    alignItems:      'center',
    gap:             6,
    backgroundColor: C.gray100,
    borderRadius:    6,
    paddingVertical: 8,
    paddingHorizontal: 12,
    marginBottom:    16,
    borderWidth:     1,
    borderColor:     C.gray200,
  },
  graniteDot:  { width: 6, height: 6, borderRadius: 3, backgroundColor: '#1D9E75' },
  graniteText: { flex: 1, fontSize: 11, color: C.gray400, fontFamily: FONTS.body, lineHeight: 15 },

  // Empty state
  emptyWrap:  { paddingTop: 48, alignItems: 'center', paddingHorizontal: 24 },
  emptyTitle: { fontFamily: FONTS.bodySemi, fontSize: 16, color: C.black, marginBottom: 10, textAlign: 'center' },
  emptyBody:  { fontFamily: FONTS.body, fontSize: 13, color: C.gray400, textAlign: 'center', lineHeight: 20, marginBottom: 24 },
  uploadBtn:  {
    borderWidth:     1.5,
    borderColor:     C.red,
    borderRadius:    8,
    paddingVertical: 12,
    paddingHorizontal: 24,
    alignItems:      'center',
  },
  uploadBtnTxt: { fontFamily: FONTS.bodySemi, fontSize: 14, color: C.red },

  // Record list
  list: { gap: 12 },

  recordCard: {
    backgroundColor: C.white,
    borderRadius:    12,
    borderWidth:     1,
    borderColor:     C.gray200,
    padding:         14,
    paddingHorizontal: 16,
    marginBottom:    4,
  },

  // Date header row
  dateHeader: {
    flexDirection:  'row',
    alignItems:     'center',
    gap:            8,
    marginBottom:   8,
    paddingBottom:  8,
    borderBottomWidth: 1,
    borderBottomColor: C.gray200,
  },
  dateDot:  { width: 8, height: 8, borderRadius: 4, backgroundColor: C.red },
  dateText: { fontFamily: FONTS.bodySemi, fontSize: 12, color: C.gray400, letterSpacing: 0.5, textTransform: 'uppercase' },

  diagnosisTitle: { fontFamily: FONTS.bodyMedium, fontSize: 16, color: C.black, marginBottom: 10 },

  // Subsection (prescriptions / advice)
  subsection:      { marginBottom: 10 },
  subsectionLabel: { fontFamily: FONTS.bodySemi, fontSize: 10, color: C.gray400, letterSpacing: 1, textTransform: 'uppercase', marginBottom: 5 },

  listRow:   { flexDirection: 'row', alignItems: 'flex-start', gap: 6, marginBottom: 4 },
  listBullet:{ fontFamily: FONTS.bodySemi, fontSize: 11, color: C.red, minWidth: 18 },
  bulletDot: { width: 4, height: 4, borderRadius: 2, backgroundColor: C.gray400, marginTop: 7, flexShrink: 0 },
  listText:  { flex: 1, fontFamily: FONTS.body, fontSize: 13, color: C.black, lineHeight: 19 },

  // Follow-up
  followupRow:  { flexDirection: 'row', gap: 6, alignItems: 'center', marginTop: 4, paddingTop: 8, borderTopWidth: 1, borderTopColor: C.gray200 },
  followupLabel:{ fontFamily: FONTS.bodySemi, fontSize: 11, color: C.gray400 },
  followupValue:{ fontFamily: FONTS.bodyMedium, fontSize: 13, color: C.black },
});
