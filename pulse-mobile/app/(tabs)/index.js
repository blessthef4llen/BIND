import { useState, useEffect, useCallback } from 'react';
import {
  View, Text, ScrollView, Pressable, StyleSheet,
  StatusBar, ActivityIndicator,
} from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import Svg, { Path, Rect, Circle } from 'react-native-svg';
import { C, FONTS } from '../../constants/colors';
import { API_BASE } from '../../constants/api';

function QuickTile({ label, icon, onPress }) {
  return (
    <Pressable
      style={({ pressed }) => [styles.quickTile, pressed && styles.quickTilePressed]}
      onPress={onPress}
    >
      {icon}
      <Text style={styles.quickLabel}>{label}</Text>
    </Pressable>
  );
}

export default function HomeScreen() {
  const router = useRouter();
  const [apiStatus, setApiStatus] = useState('connecting');
  const [concerns, setConcerns] = useState([]);
  const [loading, setLoading] = useState(true);

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
  const peakSev = count ? Math.max(...concerns.map((c) => c.severity || 0)) : 0;
  const recent  = concerns.slice(-4).reverse();

  const dotColor =
    apiStatus === 'offline' ? C.red :
    apiStatus === 'connecting' ? C.gray400 :
    '#22C55E';
  const dotLabel =
    apiStatus === 'offline'    ? 'API offline' :
    apiStatus === 'connecting' ? 'Connecting…' :
    apiStatus === 'granite'    ? 'Granite live' : 'Mock mode';

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={C.white} />

      {/* Top bar */}
      <View style={styles.topBar}>
        <Text style={styles.topTitle}>PULSE</Text>
        <View style={styles.apiPill}>
          <View style={[styles.apiDot, { backgroundColor: dotColor }]} />
          <Text style={styles.apiTxt}>{dotLabel}</Text>
        </View>
      </View>

      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Hero card */}
        <View style={styles.hero}>
          <Text style={styles.heroEye}>● Next Step</Text>
          <Text style={styles.heroName}>Alex Johnson</Text>
          <Text style={styles.heroSub}>
            {count} day{count !== 1 ? 's' : ''} of symptoms logged
          </Text>
          <View style={styles.heroPills}>
            <View style={styles.heroPill}>
              <Text style={styles.heroPillTxt}>{count} concerns logged</Text>
            </View>
            <View style={styles.heroPill}>
              <Text style={styles.heroPillTxt}>IBM Granite active</Text>
            </View>
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
            <Text style={styles.emptyTxt}>No concerns yet. Tap Log Concern.</Text>
          ) : (
            recent.map((c, i) => {
              const high = c.urgency_level === 'high';
              return (
                <View key={i} style={[styles.concernRow, i === recent.length - 1 && { borderBottomWidth: 0 }]}>
                  <View style={[styles.cDot, { backgroundColor: high ? C.red : C.gray400 }]} />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.cName} numberOfLines={1}>{c.symptom || 'No description'}</Text>
                    <Text style={styles.cMeta}>
                      {c.body_area} · {c.date_logged || 'Today'} · Sev {c.severity}/10
                    </Text>
                  </View>
                  <View style={[styles.badge, { backgroundColor: high ? '#FDF0F0' : C.gray100 }]}>
                    <Text style={[styles.badgeTxt, { color: high ? C.redDark : C.gray400 }]}>
                      {(c.urgency_level || 'low').toUpperCase()}
                    </Text>
                  </View>
                </View>
              );
            })
          )}
        </View>

        {/* Quick actions */}
        <Text style={styles.sectionHead}>Quick Actions</Text>
        <View style={styles.quickGrid}>
          <QuickTile
            label="Log Concern"
            onPress={() => router.push('/(tabs)/log')}
            icon={
              <Svg width={22} height={22} viewBox="0 0 22 22">
                <Path d="M11 4v14M4 11h14" stroke={C.red} strokeWidth={2.5} strokeLinecap="round" />
              </Svg>
            }
          />
          <QuickTile
            label="Live Demo"
            onPress={() => router.push('/(tabs)/demo')}
            icon={
              <Svg width={22} height={22} viewBox="0 0 22 22">
                <Circle cx={11} cy={11} r={8} stroke={C.red} strokeWidth={1.5} fill="none" />
                <Path d="M9 8l5 3-5 3V8z" fill={C.red} />
              </Svg>
            }
          />
          <QuickTile
            label="Visit Prep"
            onPress={() => router.push('/(tabs)/demo')}
            icon={
              <Svg width={22} height={22} viewBox="0 0 22 22">
                <Rect x={3} y={3} width={16} height={16} rx={3} stroke={C.red} strokeWidth={1.5} fill="none" />
                <Path d="M7 11h8M7 14h5" stroke={C.red} strokeWidth={1.5} strokeLinecap="round" />
              </Svg>
            }
          />
          <QuickTile
            label="Timeline"
            onPress={() => router.push('/(tabs)/timeline')}
            icon={
              <Svg width={22} height={22} viewBox="0 0 22 22">
                <Circle cx={11} cy={11} r={8} stroke={C.red} strokeWidth={1.5} fill="none" />
                <Path d="M11 7v5l3 3" stroke={C.red} strokeWidth={1.5} strokeLinecap="round" />
              </Svg>
            }
          />
        </View>

        <View style={{ height: 24 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container:    { flex: 1, backgroundColor: C.white },
  topBar:       { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingTop: 56, paddingBottom: 10 },
  topTitle:     { fontFamily: FONTS.display, fontSize: 32, color: C.black, letterSpacing: 1 },
  apiPill:      { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: C.gray100, borderRadius: 20, paddingVertical: 4, paddingHorizontal: 10 },
  apiDot:       { width: 6, height: 6, borderRadius: 3 },
  apiTxt:       { fontSize: 11, fontWeight: '700', letterSpacing: 1, textTransform: 'uppercase', color: C.gray400 },
  scroll:       { flex: 1, paddingHorizontal: 20 },

  hero:         { backgroundColor: C.black, borderRadius: 14, padding: 18, marginBottom: 12 },
  heroEye:      { fontSize: 11, fontWeight: '700', letterSpacing: 2, textTransform: 'uppercase', color: C.red, marginBottom: 5 },
  heroName:     { fontFamily: FONTS.display, fontSize: 26, color: C.white, letterSpacing: 1, marginBottom: 3 },
  heroSub:      { fontSize: 13, color: 'rgba(255,255,255,0.45)', marginBottom: 14 },
  heroPills:    { flexDirection: 'row', gap: 7, flexWrap: 'wrap' },
  heroPill:     { backgroundColor: 'rgba(212,43,43,0.15)', borderWidth: 1, borderColor: 'rgba(212,43,43,0.3)', borderRadius: 6, paddingVertical: 5, paddingHorizontal: 10 },
  heroPillTxt:  { fontSize: 12, color: 'rgba(255,255,255,0.7)', fontFamily: FONTS.body },

  metricsRow:   { flexDirection: 'row', gap: 10, marginBottom: 14 },
  metricBox:    { flex: 1, backgroundColor: C.gray100, borderRadius: 8, padding: 14 },
  metricVal:    { fontFamily: FONTS.display, fontSize: 36, color: C.black, lineHeight: 36 },
  metricLbl:    { fontSize: 10, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1.5, color: C.gray400, marginTop: 3 },

  sectionHead:  { fontSize: 11, fontWeight: '700', letterSpacing: 2, textTransform: 'uppercase', color: C.gray400, marginBottom: 8, marginTop: 14 },
  card:         { backgroundColor: C.white, borderRadius: 14, borderWidth: 1, borderColor: C.gray200, marginBottom: 10 },
  emptyTxt:     { color: C.gray400, fontSize: 13, textAlign: 'center', padding: 16, fontFamily: FONTS.body },
  concernRow:   { flexDirection: 'row', alignItems: 'flex-start', gap: 10, paddingVertical: 11, paddingHorizontal: 14, borderBottomWidth: 1, borderBottomColor: C.gray200 },
  cDot:         { width: 8, height: 8, borderRadius: 4, marginTop: 5 },
  cName:        { fontSize: 14, fontWeight: '500', color: C.black, fontFamily: FONTS.bodyMedium },
  cMeta:        { fontSize: 12, color: C.gray400, marginTop: 2 },
  badge:        { borderRadius: 20, paddingVertical: 3, paddingHorizontal: 8, alignSelf: 'flex-start' },
  badgeTxt:     { fontSize: 10, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1 },

  quickGrid:    { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  quickTile:    { width: '48%', backgroundColor: C.gray100, borderRadius: 8, padding: 16, alignItems: 'center', borderWidth: 1.5, borderColor: 'transparent' },
  quickTilePressed: { borderColor: C.red, backgroundColor: '#FDF0F0' },
  quickLabel:   { fontSize: 13, fontWeight: '600', color: C.black, marginTop: 8, fontFamily: FONTS.bodySemi },
});
