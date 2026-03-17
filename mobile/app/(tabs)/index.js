/**
 * app/(tabs)/index.js — Home Dashboard
 *
 * Redesigned with warm red/white/charcoal brand.
 * Shows IBM Granite status, recent concerns, key metrics, quick actions.
 */

import { useState, useEffect, useCallback } from 'react';
import {
  View, Text, ScrollView, Pressable, StyleSheet,
  StatusBar, ActivityIndicator,
} from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Path, Rect, Circle } from 'react-native-svg';
import { Colors, FONTS, FontSize, Radius, Shadow, SPECIALIST_COLORS } from '../../constants/theme';
import { api } from '../../services/api';

// ─── IBM status badge ─────────────────────────────────────────────────────────
function IBMBadge({ status }) {
  const dot = status === 'granite' ? Colors.ok
            : status === 'offline'  ? Colors.textFaint
            : '#F59E0B';
  const label = status === 'granite' ? 'IBM Granite · Live'
              : status === 'offline'  ? 'IBM Granite · Offline'
              : status === 'mock'     ? 'IBM Granite · Mock'
              : 'IBM Granite · Connecting';

  return (
    <View style={badge.pill}>
      <View style={[badge.dot, { backgroundColor: dot }]} />
      <Text style={badge.label}>{label}</Text>
    </View>
  );
}
const badge = StyleSheet.create({
  pill:  { flexDirection:'row', alignItems:'center', gap:5, backgroundColor: Colors.surface2, borderRadius: Radius.pill, paddingVertical:5, paddingHorizontal:11, borderWidth:1, borderColor: Colors.border },
  dot:   { width:6, height:6, borderRadius:3 },
  label: { fontSize: FontSize.micro, fontFamily: FONTS.bodySemi, color: Colors.textMuted, letterSpacing:0.4 },
});

// ─── Concern card (compact) ───────────────────────────────────────────────────
function ConcernCard({ concern, onPress }) {
  const urgColor = concern.urgency_level === 'high' ? Colors.urgent
                 : concern.urgency_level === 'medium' ? Colors.warning : Colors.ok;
  const catStyle = SPECIALIST_COLORS[concern.category] || SPECIALIST_COLORS['General'];
  const dateStr  = concern.symptom_date || concern.date_logged || '';

  return (
    <Pressable style={({ pressed }) => [card.wrap, pressed && card.pressed]} onPress={onPress}>
      <View style={[card.urgBar, { backgroundColor: urgColor }]} />
      <View style={card.body}>
        <View style={card.topRow}>
          <Text style={card.symptom} numberOfLines={1}>{concern.symptom || 'No description'}</Text>
          <View style={[card.catBadge, { backgroundColor: catStyle.bg }]}>
            <Text style={[card.catText, { color: catStyle.text }]}>{concern.category || 'General'}</Text>
          </View>
        </View>
        <Text style={card.meta}>
          {concern.body_area}  ·  {dateStr}  ·  Sev {concern.severity}/10
        </Text>
      </View>
    </Pressable>
  );
}
const card = StyleSheet.create({
  wrap:     { flexDirection:'row', backgroundColor: Colors.surface, borderRadius: Radius.sm, marginBottom:8, overflow:'hidden', borderWidth:1, borderColor: Colors.border, ...Shadow.sm },
  pressed:  { opacity: 0.80 },
  urgBar:   { width:4 },
  body:     { flex:1, paddingHorizontal:14, paddingVertical:11 },
  topRow:   { flexDirection:'row', alignItems:'flex-start', gap:8, marginBottom:3 },
  symptom:  { flex:1, fontFamily: FONTS.bodyMedium, fontSize: FontSize.body, color: Colors.text },
  catBadge: { borderRadius: Radius.xs, paddingHorizontal:7, paddingVertical:2, alignSelf:'flex-start' },
  catText:  { fontFamily: FONTS.bodySemi, fontSize: FontSize.micro, textTransform:'uppercase', letterSpacing:0.5 },
  meta:     { fontFamily: FONTS.body, fontSize: FontSize.tiny, color: Colors.textFaint },
});

// ─── Quick action tile ────────────────────────────────────────────────────────
function QuickTile({ label, sublabel, iconBg, icon, onPress }) {
  return (
    <Pressable style={({ pressed }) => [qt.tile, pressed && qt.pressed]} onPress={onPress}>
      <View style={[qt.iconWrap, { backgroundColor: iconBg || Colors.redLight }]}>{icon}</View>
      <Text style={qt.label}>{label}</Text>
      {sublabel && <Text style={qt.sub}>{sublabel}</Text>}
    </Pressable>
  );
}
const qt = StyleSheet.create({
  tile:    { width:'48%', backgroundColor: Colors.surface, borderRadius: Radius.md, padding:14, borderWidth:1, borderColor: Colors.border, ...Shadow.sm, gap:8 },
  pressed: { opacity:0.75 },
  iconWrap:{ width:38, height:38, borderRadius: Radius.sm, alignItems:'center', justifyContent:'center' },
  label:   { fontFamily: FONTS.bodySemi, fontSize: FontSize.body, color: Colors.text },
  sub:     { fontFamily: FONTS.body, fontSize: FontSize.tiny, color: Colors.textFaint },
});

// ─── Screen ───────────────────────────────────────────────────────────────────
export default function HomeScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [ibmStatus, setIBMStatus] = useState('connecting');
  const [concerns,  setConcerns]  = useState([]);
  const [loading,   setLoading]   = useState(true);

  async function checkHealth() {
    try {
      const d = await api.health();
      setIBMStatus(d.granite_ready ? 'granite' : 'mock');
    } catch {
      setIBMStatus('offline');
    }
  }

  async function loadConcerns() {
    try {
      const d = await api.getConcerns();
      setConcerns(d.concerns || []);
    } catch {
      setConcerns([]);
    } finally {
      setLoading(false);
    }
  }

  useFocusEffect(useCallback(() => {
    setLoading(true);
    checkHealth();
    loadConcerns();
  }, []));

  useEffect(() => {
    const t = setInterval(checkHealth, 12000);
    return () => clearInterval(t);
  }, []);

  const count   = concerns.length;
  const peak    = count ? Math.max(...concerns.map(c => c.severity || 0)) : 0;
  const recent  = concerns.slice(0, 3);
  const highCt  = concerns.filter(c => c.urgency_level === 'high').length;

  // Hero copy
  const heroTitle = ibmStatus === 'offline'   ? 'Connect the backend\nto get started'
                  : count === 0               ? 'Your health\ncompanion is ready'
                  : peak >= 7                 ? 'Escalation\ndetected'
                  : `${count} concern${count !== 1 ? 's' : ''}\nunder review`;

  const heroSub = ibmStatus === 'offline'   ? 'Run the backend server to enable AI-powered health tracking.'
                : count === 0               ? 'Log your first concern and IBM Granite will start tracking patterns over time.'
                : peak >= 7                 ? `Peak severity ${peak}/10 · IBM Granite recommends visit prep.`
                : `IBM Granite is monitoring your health history. Peak severity ${peak}/10.`;

  const heroColor = ibmStatus === 'offline' ? Colors.textMuted
                  : peak >= 7               ? Colors.urgent
                  : count >= 3              ? Colors.ok : Colors.red;

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <StatusBar barStyle="dark-content" backgroundColor={Colors.offWhite} />

      {/* Top bar */}
      <View style={styles.topBar}>
        <Text style={styles.wordmark}>PULSE</Text>
        <IBMBadge status={ibmStatus} />
      </View>

      <ScrollView
        style={styles.scroll}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: insets.bottom + 32 }}
      >
        {/* Hero */}
        <View style={styles.hero}>
          <View style={[styles.heroAccent, { backgroundColor: heroColor }]} />
          <View style={styles.heroContent}>
            <Text style={[styles.heroEye, { color: heroColor }]}>
              {ibmStatus === 'granite' ? '● IBM GRANITE · ACTIVE' : ibmStatus === 'offline' ? '○ OFFLINE' : '● IBM GRANITE · READY'}
            </Text>
            <Text style={styles.heroTitle}>{heroTitle}</Text>
            <Text style={styles.heroSub}>{heroSub}</Text>

            <View style={styles.metricsRow}>
              <View style={styles.metricChip}>
                <Text style={styles.metricVal}>{count || '—'}</Text>
                <Text style={styles.metricLbl}>Concerns</Text>
              </View>
              <View style={styles.metricChip}>
                <Text style={styles.metricVal}>{count ? `${peak}/10` : '—'}</Text>
                <Text style={styles.metricLbl}>Peak Severity</Text>
              </View>
              <View style={styles.metricChip}>
                <Text style={[styles.metricVal, highCt > 0 && { color: Colors.urgent }]}>{highCt || '—'}</Text>
                <Text style={styles.metricLbl}>High Urgency</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Recent concerns */}
        <Text style={styles.sectionHead}>Recent Concerns</Text>
        <View>
          {loading ? (
            <ActivityIndicator color={Colors.red} style={{ padding: 24 }} />
          ) : recent.length === 0 ? (
            <View style={styles.emptyCard}>
              <Text style={styles.emptyTitle}>No concerns logged yet</Text>
              <Text style={styles.emptySub}>
                Tap "Log Concern" below. IBM Granite will begin pattern analysis after a few entries.
              </Text>
            </View>
          ) : (
            recent.map((c, i) => (
              <ConcernCard
                key={c.id || i}
                concern={c}
                onPress={() => router.push('/(tabs)/edit-concern')}
              />
            ))
          )}
          {count > 3 && (
            <Pressable style={styles.viewAll} onPress={() => router.push('/(tabs)/edit-concern')}>
              <Text style={styles.viewAllText}>View all {count} concerns →</Text>
            </Pressable>
          )}
        </View>

        {/* Quick actions */}
        <Text style={styles.sectionHead}>Quick Actions</Text>
        <View style={styles.quickGrid}>
          <QuickTile
            label="Log Concern"
            sublabel="Body map + AI"
            iconBg={Colors.redLight}
            onPress={() => router.push('/(tabs)/log')}
            icon={<Svg width={20} height={20} viewBox="0 0 20 20"><Path d="M10 4v12M4 10h12" stroke={Colors.red} strokeWidth={2} strokeLinecap="round" /></Svg>}
          />
          <QuickTile
            label="Visit Prep"
            sublabel="AI questions for your doctor"
            iconBg={Colors.redLight}
            onPress={() => router.push('/(tabs)/demo')}
            icon={<Svg width={20} height={20} viewBox="0 0 20 20"><Rect x={3} y={3} width={14} height={14} rx={2.5} stroke={Colors.red} strokeWidth={1.6} fill="none" /><Path d="M6 10h8M6 13h5" stroke={Colors.red} strokeWidth={1.6} strokeLinecap="round" /></Svg>}
          />
          <QuickTile
            label="After Visit"
            sublabel="Upload doctor notes"
            iconBg={Colors.redLight}
            onPress={() => router.push('/doctor-notes')}
            icon={<Svg width={20} height={20} viewBox="0 0 20 20"><Rect x={3} y={2} width={14} height={16} rx={2} stroke={Colors.red} strokeWidth={1.6} fill="none" /><Path d="M10 7v6M7 10l3-3 3 3" stroke={Colors.red} strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round" fill="none" /></Svg>}
          />
          <QuickTile
            label="My Timeline"
            sublabel="Your health history"
            iconBg={Colors.redLight}
            onPress={() => router.push('/(tabs)/timeline')}
            icon={<Svg width={20} height={20} viewBox="0 0 20 20"><Circle cx={10} cy={10} r={7} stroke={Colors.red} strokeWidth={1.6} fill="none" /><Path d="M10 6v5l3 3" stroke={Colors.red} strokeWidth={1.6} strokeLinecap="round" /></Svg>}
          />
        </View>

        <Text style={styles.footer}>Powered by IBM watsonx · IBM Granite · Team BIND</Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root:    { flex:1, backgroundColor: Colors.offWhite },
  topBar:  { flexDirection:'row', justifyContent:'space-between', alignItems:'center', paddingHorizontal:20, paddingVertical:12 },
  wordmark:{ fontFamily: FONTS.display, fontSize:32, color: Colors.black, letterSpacing:2 },
  scroll:  { flex:1, paddingHorizontal:20 },

  hero: { backgroundColor: Colors.surface, borderRadius: Radius.lg, marginBottom:20, overflow:'hidden', borderWidth:1, borderColor: Colors.border, ...Shadow.md, flexDirection:'row' },
  heroAccent: { width:5 },
  heroContent:{ flex:1, padding:18, gap:4 },
  heroEye:  { fontFamily: FONTS.bodySemi, fontSize: FontSize.micro, letterSpacing:1.5, textTransform:'uppercase', marginBottom:4 },
  heroTitle:{ fontFamily: FONTS.display, fontSize:32, color: Colors.black, letterSpacing:0.5, lineHeight:34, marginBottom:6 },
  heroSub:  { fontFamily: FONTS.body, fontSize: FontSize.small, color: Colors.textMuted, lineHeight:18, marginBottom:14 },

  metricsRow: { flexDirection:'row', gap:8 },
  metricChip: { flex:1, backgroundColor: Colors.surface2, borderRadius: Radius.sm, padding:10, alignItems:'center' },
  metricVal:  { fontFamily: FONTS.display, fontSize:22, color: Colors.black },
  metricLbl:  { fontFamily: FONTS.body, fontSize: FontSize.micro, color: Colors.textFaint, textTransform:'uppercase', letterSpacing:0.8, marginTop:2 },

  sectionHead: { fontFamily: FONTS.bodySemi, fontSize: FontSize.tiny, color: Colors.textFaint, textTransform:'uppercase', letterSpacing:1.5, marginBottom:10, marginTop:4 },

  emptyCard: { backgroundColor: Colors.surface, borderRadius: Radius.md, padding:20, alignItems:'center', borderWidth:1, borderColor: Colors.border, marginBottom:8 },
  emptyTitle:{ fontFamily: FONTS.bodySemi, fontSize: FontSize.body, color: Colors.text, marginBottom:6 },
  emptySub:  { fontFamily: FONTS.body, fontSize: FontSize.small, color: Colors.textMuted, textAlign:'center', lineHeight:19 },

  viewAll:    { alignItems:'center', paddingVertical:10 },
  viewAllText:{ fontFamily: FONTS.bodySemi, fontSize: FontSize.small, color: Colors.red },

  quickGrid: { flexDirection:'row', flexWrap:'wrap', gap:10, marginBottom:20 },
  footer:    { fontFamily: FONTS.body, fontSize: FontSize.micro, color: Colors.textFaint, textAlign:'center', marginTop:4, letterSpacing:0.5 },
});