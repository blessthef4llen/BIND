import { useState, useEffect, useCallback } from 'react';
import {
  View, Text, ScrollView, Pressable, StyleSheet,
  StatusBar, ActivityIndicator, Platform,
} from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Path, Rect, Circle, Line } from 'react-native-svg';
import { C, FONTS } from '../../constants/colors';
import { API_BASE } from '../../constants/api';

// ─── Granite hero state ───────────────────────────────────────────────────────
function getGraniteState(count, peakSev, apiStatus) {
  if (apiStatus === 'offline') {
    return {
      eyebrow: 'IBM GRANITE · OFFLINE',
      headline: 'Connect to activate\npattern analysis',
      sub: 'Start the backend server to enable AI-powered health tracking.',
      pillA: 'Server offline',
      pillB: null,
      accent: C.gray400,
    };
  }
  if (count === 0) {
    return {
      eyebrow: 'IBM GRANITE · READY',
      headline: 'Log your first\nconcern to begin',
      sub: 'IBM Granite will analyze patterns across your entries over time.',
      pillA: 'Awaiting first entry',
      pillB: 'IBM Granite active',
      accent: C.red,
    };
  }
  if (count < 3) {
    return {
      eyebrow: 'IBM GRANITE · LEARNING',
      headline: `${count} entr${count === 1 ? 'y' : 'ies'} logged`,
      sub: 'IBM Granite is building your health history. Log a few more to enable pattern detection.',
      pillA: `${count} concern${count !== 1 ? 's' : ''} logged`,
      pillB: 'Pattern detection pending',
      accent: '#F59E0B',
    };
  }
  if (peakSev >= 7) {
    return {
      eyebrow: 'IBM GRANITE · ALERT',
      headline: 'Escalation pattern\ndetected',
      sub: `Peak severity ${peakSev}/10 across ${count} entries. IBM Granite recommends visit prep.`,
      pillA: `${count} concerns · Peak ${peakSev}/10`,
      pillB: 'Visit prep recommended',
      accent: C.red,
    };
  }
  return {
    eyebrow: 'IBM GRANITE · MONITORING',
    headline: `${count} concerns\nunder analysis`,
    sub: `IBM Granite is tracking your health history. Peak severity ${peakSev}/10.`,
    pillA: `${count} concerns logged`,
    pillB: 'No escalation detected',
    accent: '#22C55E',
  };
}

// ─── Quick action tile ────────────────────────────────────────────────────────
function QuickTile({ label, sublabel, icon, onPress }) {
  return (
    <Pressable
      style={({ pressed }) => [styles.quickTile, pressed && styles.quickTilePressed]}
      onPress={onPress}
    >
      {icon}
      <Text style={styles.quickLabel}>{label}</Text>
      {sublabel ? <Text style={styles.quickSub}>{sublabel}</Text> : null}
    </Pressable>
  );
}

// ─── Home screen ─────────────────────────────────────────────────────────────
export default function HomeScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [apiStatus, setApiStatus] = useState('connecting');
  const [concerns, setConcerns]   = useState([]);
  const [loading, setLoading]     = useState(true);

  async function checkHealth() {
    try {
      const r = await fetch(`${API_BASE}/health`, { signal: AbortSignal.timeout(3000) });
      const d = await r.json();
      setApiStatus(d.granite_ready ? 'granite' : 'mock');
    } catch {
      setApiStatus('offline');
    }
  }

  async function loadConcerns() {
    try {
      const r = await fetch(`${API_BASE}/concerns`);
      const d = await r.json();
      setConcerns(d.concerns || []);
    } catch {
      setConcerns([]);
    } finally {
      setLoading(false);
    }
  }

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      checkHealth();
      loadConcerns();
    }, [])
  );

  useEffect(() => {
    const t = setInterval(checkHealth, 10000);
    return () => clearInterval(t);
  }, []);

  const count   = concerns.length;
  const peakSev = count ? Math.max(...concerns.map(c => c.severity || 0)) : 0;
  const recent  = concerns.slice(-4).reverse();

  const granite  = getGraniteState(count, peakSev, apiStatus);

  // IBM Granite badge in top bar
  const ibmDotColor =
    apiStatus === 'offline'    ? C.gray400 :
    apiStatus === 'connecting' ? C.gray400 : '#22C55E';
  const ibmLabel =
    apiStatus === 'connecting' ? 'IBM Granite · Connecting' :
    apiStatus === 'offline'    ? 'IBM Granite · Offline' :
    apiStatus === 'granite'    ? 'IBM Granite · Live' : 'IBM Granite · Mock';

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <StatusBar barStyle="dark-content" backgroundColor={C.white} />

      {/* Top bar */}
      <View style={styles.topBar}>
        <Text style={styles.topTitle}>PULSE</Text>
        <View style={styles.ibmPill}>
          <View style={[styles.ibmDot, { backgroundColor: ibmDotColor }]} />
          <Text style={styles.ibmTxt}>{ibmLabel}</Text>
        </View>
      </View>

      <ScrollView
        style={styles.scroll}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: insets.bottom + 24 }}
      >
        {/* Hero — IBM Granite dynamic state */}
        <View style={styles.hero}>
          <Text style={[styles.heroEye, { color: granite.accent }]}>{granite.eyebrow}</Text>
          <Text style={styles.heroHeadline}>{granite.headline}</Text>
          <Text style={styles.heroSub}>{granite.sub}</Text>
          <View style={styles.heroPills}>
            <View style={[styles.heroPill, { borderColor: granite.accent + '55' }]}>
              <Text style={styles.heroPillTxt}>{granite.pillA}</Text>
            </View>
            {granite.pillB && (
              <View style={[styles.heroPill, { borderColor: granite.accent + '55' }]}>
                <Text style={styles.heroPillTxt}>{granite.pillB}</Text>
              </View>
            )}
          </View>
        </View>

        {/* Metrics */}
        <View style={styles.metricsRow}>
          <View style={styles.metricBox}>
            <Text style={styles.metricVal}>{count || '—'}</Text>
            <Text style={styles.metricLbl}>Concerns</Text>
          </View>
          <View style={styles.metricBox}>
            <Text style={styles.metricVal}>{count ? `${peakSev}/10` : '—'}</Text>
            <Text style={styles.metricLbl}>Peak Severity</Text>
          </View>
        </View>

        {/* Recent concerns */}
        <Text style={styles.sectionHead}>Recent Concerns</Text>
        <View style={styles.card}>
          {loading ? (
            <ActivityIndicator color={C.red} style={{ padding: 20 }} />
          ) : recent.length === 0 ? (
            <View style={styles.emptyWrap}>
              <Text style={styles.emptyTitle}>No concerns logged yet</Text>
              <Text style={styles.emptyBody}>
                Tap "Log Concern" below to start. IBM Granite will begin pattern analysis after your first entry.
              </Text>
            </View>
          ) : (
            recent.map((c, i) => {
              const high = c.urgency_level === 'high';
              const dateDisplay = c.symptom_date || c.date_logged || 'Today';
              return (
                <Pressable
                  key={c.id || i}
                  style={[
                    styles.concernRow,
                    i === recent.length - 1 && { borderBottomWidth: 0 },
                  ]}
                  onPress={() => router.push({
                    pathname: '/(tabs)/edit-concern',
                    params: { concern: JSON.stringify(c) },
                  })}
                >
                  <View style={[styles.cDot, { backgroundColor: high ? C.red : C.gray400 }]} />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.cName} numberOfLines={1}>{c.symptom || 'No description'}</Text>
                    <Text style={styles.cMeta}>
                      {c.body_area} · {dateDisplay} · Sev {c.severity}/10
                    </Text>
                  </View>
                  <View style={[styles.badge, { backgroundColor: high ? '#FDF0F0' : C.gray100 }]}>
                    <Text style={[styles.badgeTxt, { color: high ? C.redDark : C.gray400 }]}>
                      {(c.urgency_level || 'low').toUpperCase()}
                    </Text>
                  </View>
                </Pressable>
              );
            })
          )}
        </View>

        {/* Quick actions */}
        <Text style={styles.sectionHead}>Quick Actions</Text>
        <View style={styles.quickGrid}>
          <QuickTile
            label="Log Concern"
            sublabel="Body tap + AI logging"
            onPress={() => router.push('/(tabs)/log')}
            icon={
              <Svg width={22} height={22} viewBox="0 0 22 22">
                <Path d="M11 4v14M4 11h14" stroke={C.red} strokeWidth={2.5} strokeLinecap="round" />
              </Svg>
            }
          />
          <QuickTile
            label="Visit Prep"
            sublabel="IBM Granite · pre-visit"
            onPress={() => router.push('/(tabs)/demo')}
            icon={
              <Svg width={22} height={22} viewBox="0 0 22 22">
                <Rect x={3} y={3} width={16} height={16} rx={3} stroke={C.red} strokeWidth={1.5} fill="none" />
                <Path d="M7 11h8M7 14h5" stroke={C.red} strokeWidth={1.5} strokeLinecap="round" />
              </Svg>
            }
          />
          <QuickTile
            label="After Visit"
            sublabel="Upload doctor notes"
            onPress={() => router.push('/doctor-notes')}
            icon={
              <Svg width={22} height={22} viewBox="0 0 22 22">
                <Path d="M6 3h10a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2z" stroke={C.red} strokeWidth={1.5} fill="none" />
                <Path d="M11 8v6M8 11l3-3 3 3" stroke={C.red} strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" />
              </Svg>
            }
          />
          <QuickTile
            label="Timeline"
            sublabel="Your health history"
            onPress={() => router.push('/(tabs)/edit-concern')}
            icon={
              <Svg width={22} height={22} viewBox="0 0 22 22">
                <Circle cx={11} cy={11} r={8} stroke={C.red} strokeWidth={1.5} fill="none" />
                <Path d="M11 7v5l3 3" stroke={C.red} strokeWidth={1.5} strokeLinecap="round" />
              </Svg>
            }
          />
        </View>

        {/* IBM attribution footer */}
        <Text style={styles.ibmFooter}>
          Powered by IBM WatsonX Orchestrate · IBM Granite
        </Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container:    { flex: 1, backgroundColor: C.white },
  topBar:       { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 12 },
  topTitle:     { fontFamily: FONTS.display, fontSize: 32, color: C.black, letterSpacing: 1 },
  ibmPill:      { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: C.gray100, borderRadius: 20, paddingVertical: 5, paddingHorizontal: 11, borderWidth: 1, borderColor: C.gray200 },
  ibmDot:       { width: 6, height: 6, borderRadius: 3 },
  ibmTxt:       { fontSize: 10, fontWeight: '700', letterSpacing: 0.5, color: C.gray400, fontFamily: FONTS.bodySemi },
  scroll:       { flex: 1, paddingHorizontal: 20 },

  hero:         { backgroundColor: C.black, borderRadius: 14, padding: 18, marginBottom: 12 },
  heroEye:      { fontSize: 10, fontWeight: '700', letterSpacing: 2, textTransform: 'uppercase', marginBottom: 8, fontFamily: FONTS.bodySemi },
  heroHeadline: { fontFamily: FONTS.display, fontSize: 30, color: C.white, letterSpacing: 0.5, marginBottom: 8, lineHeight: 34 },
  heroSub:      { fontSize: 13, color: 'rgba(255,255,255,0.45)', marginBottom: 14, fontFamily: FONTS.body, lineHeight: 18 },
  heroPills:    { flexDirection: 'row', gap: 7, flexWrap: 'wrap' },
  heroPill:     { backgroundColor: 'rgba(255,255,255,0.07)', borderWidth: 1, borderRadius: 6, paddingVertical: 5, paddingHorizontal: 10 },
  heroPillTxt:  { fontSize: 11, color: 'rgba(255,255,255,0.6)', fontFamily: FONTS.body },

  metricsRow:   { flexDirection: 'row', gap: 10, marginBottom: 14 },
  metricBox:    { flex: 1, backgroundColor: C.gray100, borderRadius: 8, padding: 14 },
  metricVal:    { fontFamily: FONTS.display, fontSize: 36, color: C.black, lineHeight: 36 },
  metricLbl:    { fontSize: 10, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1.5, color: C.gray400, marginTop: 3, fontFamily: FONTS.bodySemi },

  sectionHead:  { fontSize: 11, fontWeight: '700', letterSpacing: 2, textTransform: 'uppercase', color: C.gray400, marginBottom: 8, marginTop: 14, fontFamily: FONTS.bodySemi },
  card:         { backgroundColor: C.white, borderRadius: 14, borderWidth: 1, borderColor: C.gray200, marginBottom: 10 },

  emptyWrap:    { padding: 20, alignItems: 'center' },
  emptyTitle:   { fontSize: 14, fontFamily: FONTS.bodySemi, color: C.black, marginBottom: 6 },
  emptyBody:    { fontSize: 13, color: C.gray400, fontFamily: FONTS.body, textAlign: 'center', lineHeight: 19 },

  concernRow:   { flexDirection: 'row', alignItems: 'flex-start', gap: 10, paddingVertical: 11, paddingHorizontal: 14, borderBottomWidth: 1, borderBottomColor: C.gray200 },
  cDot:         { width: 8, height: 8, borderRadius: 4, marginTop: 5 },
  cName:        { fontSize: 14, fontWeight: '500', color: C.black, fontFamily: FONTS.bodyMedium },
  cMeta:        { fontSize: 12, color: C.gray400, marginTop: 2, fontFamily: FONTS.body },
  badge:        { borderRadius: 20, paddingVertical: 3, paddingHorizontal: 8, alignSelf: 'flex-start' },
  badgeTxt:     { fontSize: 10, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1, fontFamily: FONTS.bodySemi },

  quickGrid:    { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  quickTile:    { width: '48%', backgroundColor: C.gray100, borderRadius: 10, padding: 16, alignItems: 'center', borderWidth: 1.5, borderColor: 'transparent' },
  quickTilePressed: { borderColor: C.red, backgroundColor: '#FDF0F0' },
  quickLabel:   { fontSize: 13, fontWeight: '600', color: C.black, marginTop: 8, fontFamily: FONTS.bodySemi },
  quickSub:     { fontSize: 10, color: C.gray400, marginTop: 2, fontFamily: FONTS.body, textAlign: 'center' },

  ibmFooter:    { fontSize: 10, color: C.gray400, fontFamily: FONTS.body, textAlign: 'center', marginTop: 20, letterSpacing: 0.5 },
});
