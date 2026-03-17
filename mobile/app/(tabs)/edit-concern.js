import { useState, useCallback } from 'react';
import {
  View, Text, ScrollView, Pressable,
  StyleSheet, StatusBar, ActivityIndicator, Alert,
} from 'react-native';
import { useFocusEffect } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Path, Circle } from 'react-native-svg';
import { C, FONTS } from '../../constants/colors';
import { API_BASE } from '../../constants/api';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatDisplayDate(raw) {
  if (!raw) return 'Unknown date';
  const d = new Date(raw);
  if (isNaN(d)) return raw;
  return d.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
}

function groupByDate(concerns) {
  const groups = {};
  concerns.forEach(c => {
    const key = c.symptom_date || c.date_logged || 'Unknown date';
    if (!groups[key]) groups[key] = [];
    groups[key].push(c);
  });
  return Object.entries(groups);
}

const URGENCY = {
  high:   { dot: C.red,     label: 'HIGH',   labelColor: C.redDark,  labelBg: '#FDF0F0' },
  medium: { dot: '#D4A500', label: 'MEDIUM', labelColor: '#7A5E00',  labelBg: '#FFFBEA' },
  low:    { dot: C.gray400, label: 'LOW',    labelColor: C.gray400,  labelBg: C.gray100 },
};

// ─── Severity read-only display ───────────────────────────────────────────────
function SeverityDots({ value }) {
  return (
    <View style={sev.row}>
      {Array.from({ length: 10 }, (_, i) => i + 1).map(n => (
        <View
          key={n}
          style={[
            sev.dot,
            n <= value && (value >= 7 ? sev.dotHigh : value >= 4 ? sev.dotMed : sev.dotLow),
          ]}
        />
      ))}
      <Text style={sev.label}>{value}/10</Text>
    </View>
  );
}

const sev = StyleSheet.create({
  row:     { flexDirection: 'row', alignItems: 'center', gap: 4 },
  dot:     { width: 10, height: 10, borderRadius: 5, backgroundColor: C.gray200 },
  dotLow:  { backgroundColor: '#22C55E' },
  dotMed:  { backgroundColor: '#D4A500' },
  dotHigh: { backgroundColor: C.red },
  label:   { fontSize: 12, color: C.gray400, fontFamily: FONTS.body, marginLeft: 4 },
});

// ─── Screen ───────────────────────────────────────────────────────────────────
export default function TimelineScreen() {
  const insets = useSafeAreaInsets();
  const [concerns, setConcerns] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [expanded, setExpanded] = useState(null);
  const [deleting, setDeleting] = useState(null);

  useFocusEffect(
    useCallback(() => { load(); }, [])
  );

  async function load() {
    setLoading(true);
    try {
      const r = await fetch(`${API_BASE}/concerns`);
      const d = await r.json();
      setConcerns((d.concerns || []).slice().reverse());
    } catch {
      setConcerns([]);
    } finally {
      setLoading(false);
    }
  }

  function confirmDelete(c) {
    Alert.alert(
      'Remove entry?',
      `This will permanently remove "${c.symptom}" from your health history.`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Remove', style: 'destructive', onPress: () => doDelete(c) },
      ]
    );
  }

  async function doDelete(c) {
    setDeleting(c.id);
    try {
      const r = await fetch(`${API_BASE}/concerns/${c.id}`, { method: 'DELETE' });
      if (!r.ok) throw new Error();
      setConcerns(prev => prev.filter(x => x.id !== c.id));
      setExpanded(null);
    } catch {
      Alert.alert('Error', 'Could not remove — is the server running?');
    } finally {
      setDeleting(null);
    }
  }

  const groups = groupByDate(concerns);

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <StatusBar barStyle="dark-content" backgroundColor={C.white} />

      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>TIMELINE</Text>
          <Text style={styles.subtitle}>Your health history</Text>
        </View>
        {!loading && concerns.length > 0 && (
          <View style={styles.countBadge}>
            <Text style={styles.countTxt}>{concerns.length}</Text>
            <Text style={styles.countLbl}>entries</Text>
          </View>
        )}
      </View>

      {/* IBM Granite strip */}
      {!loading && concerns.length >= 3 && (
        <View style={styles.ibmStrip}>
          <View style={styles.ibmDot} />
          <Text style={styles.ibmTxt}>
            IBM Granite is analyzing patterns across {concerns.length} entries
          </Text>
        </View>
      )}

      <ScrollView
        style={styles.scroll}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: insets.bottom + 40, paddingTop: 4 }}
      >
        {loading ? (
          <ActivityIndicator color={C.red} style={{ padding: 60 }} />

        ) : concerns.length === 0 ? (
          <View style={styles.emptyWrap}>
            <Svg width={48} height={48} viewBox="0 0 48 48">
              <Circle cx={24} cy={24} r={22} stroke={C.gray200} strokeWidth={2} fill="none" />
              <Path d="M24 14v12l6 6" stroke={C.gray400} strokeWidth={2.5} strokeLinecap="round" />
            </Svg>
            <Text style={styles.emptyTitle}>No history yet</Text>
            <Text style={styles.emptyBody}>
              Log your first concern and IBM Granite will begin tracking patterns here.
            </Text>
          </View>

        ) : (
          groups.map(([dateKey, entries]) => (
            <View key={dateKey} style={styles.group}>

              {/* Date header */}
              <View style={styles.dateRow}>
                <Text style={styles.dateLabel}>{formatDisplayDate(dateKey)}</Text>
                <View style={styles.dateLine} />
              </View>

              {/* Entries for this date */}
              {entries.map((c, i) => {
                const urg = URGENCY[c.urgency_level] || URGENCY.low;
                const open = expanded === (c.id ?? `${dateKey}-${i}`);
                const key  = c.id ?? `${dateKey}-${i}`;

                return (
                  <Pressable
                    key={key}
                    style={({ pressed }) => [
                      styles.entry,
                      open && styles.entryOpen,
                      pressed && !open && { opacity: 0.82 },
                    ]}
                    onPress={() => setExpanded(open ? null : key)}
                  >
                    {/* Left accent bar */}
                    <View style={[styles.accentBar, { backgroundColor: urg.dot }]} />

                    <View style={styles.entryBody}>
                      {/* Top row */}
                      <View style={styles.entryTop}>
                        <Text style={styles.entrySymptom} numberOfLines={open ? undefined : 2}>
                          {c.symptom || 'No description'}
                        </Text>
                        <View style={[styles.urgBadge, { backgroundColor: urg.labelBg }]}>
                          <Text style={[styles.urgBadgeTxt, { color: urg.labelColor }]}>
                            {urg.label}
                          </Text>
                        </View>
                      </View>

                      {/* Body area */}
                      <Text style={styles.entryArea}>{c.body_area}</Text>

                      {/* Expanded detail */}
                      {open && (
                        <View style={styles.detail}>
                          <View style={styles.detailRow}>
                            <Text style={styles.detailKey}>Severity</Text>
                            <SeverityDots value={c.severity || 0} />
                          </View>

                          {!!c.notes && (
                            <View style={[styles.detailRow, { alignItems: 'flex-start' }]}>
                              <Text style={styles.detailKey}>Notes</Text>
                              <Text style={styles.detailVal}>{c.notes}</Text>
                            </View>
                          )}

                          <Pressable
                            style={({ pressed }) => [
                              styles.removeBtn,
                              pressed && { opacity: 0.65 },
                              deleting === c.id && { opacity: 0.4 },
                            ]}
                            onPress={() => confirmDelete(c)}
                            disabled={!!deleting}
                          >
                            <Svg width={13} height={13} viewBox="0 0 13 13">
                              <Path
                                d="M1.5 3.5h10M4.5 3.5V2.5a.5.5 0 0 1 .5-.5h3a.5.5 0 0 1 .5.5v1M2.5 3.5l.6 7a.5.5 0 0 0 .5.5h5.8a.5.5 0 0 0 .5-.5l.6-7"
                                stroke={C.redDark}
                                strokeWidth={1.2}
                                strokeLinecap="round"
                                fill="none"
                              />
                            </Svg>
                            <Text style={styles.removeTxt}>
                              {deleting === c.id ? 'Removing…' : 'Remove from history'}
                            </Text>
                          </Pressable>
                        </View>
                      )}

                      {/* Chevron */}
                      <View style={styles.chevronRow}>
                        <Svg width={14} height={14} viewBox="0 0 14 14">
                          <Path
                            d={open ? 'M3 9l4-4 4 4' : 'M3 5l4 4 4-4'}
                            stroke={C.gray400}
                            strokeWidth={1.5}
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            fill="none"
                          />
                        </Svg>
                      </View>
                    </View>
                  </Pressable>
                );
              })}
            </View>
          ))
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root:   { flex: 1, backgroundColor: C.white },

  header:     { paddingHorizontal: 20, paddingTop: 10, paddingBottom: 10, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end' },
  title:      { fontFamily: FONTS.display, fontSize: 32, color: C.black, letterSpacing: 1 },
  subtitle:   { fontSize: 12, color: C.gray400, fontFamily: FONTS.body, marginTop: 1 },
  countBadge: { alignItems: 'center', backgroundColor: C.gray100, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 8, borderWidth: 1, borderColor: C.gray200 },
  countTxt:   { fontFamily: FONTS.display, fontSize: 24, color: C.black, lineHeight: 26 },
  countLbl:   { fontSize: 10, color: C.gray400, fontFamily: FONTS.body, textTransform: 'uppercase', letterSpacing: 1 },

  ibmStrip:   { flexDirection: 'row', alignItems: 'center', gap: 7, marginHorizontal: 20, marginBottom: 10, backgroundColor: '#F0FFF4', borderRadius: 8, paddingVertical: 8, paddingHorizontal: 12, borderWidth: 1, borderColor: '#BBF7D0' },
  ibmDot:     { width: 6, height: 6, borderRadius: 3, backgroundColor: '#22C55E' },
  ibmTxt:     { fontSize: 11, color: '#166534', fontFamily: FONTS.body, flex: 1 },

  scroll: { flex: 1 },

  emptyWrap:  { alignItems: 'center', paddingTop: 70, paddingHorizontal: 40, gap: 12 },
  emptyTitle: { fontSize: 16, fontFamily: FONTS.bodySemi, color: C.black },
  emptyBody:  { fontSize: 13, color: C.gray400, fontFamily: FONTS.body, textAlign: 'center', lineHeight: 20 },

  group: { paddingHorizontal: 20, marginBottom: 6 },

  dateRow:  { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 8, marginTop: 16 },
  dateLabel:{ fontSize: 11, fontWeight: '700', letterSpacing: 1, textTransform: 'uppercase', color: C.gray400, fontFamily: FONTS.bodySemi },
  dateLine: { flex: 1, height: 1, backgroundColor: C.gray200 },

  entry:      { flexDirection: 'row', backgroundColor: C.gray100, borderRadius: 10, marginBottom: 8, overflow: 'hidden', borderWidth: 1, borderColor: 'transparent' },
  entryOpen:  { backgroundColor: C.white, borderColor: C.gray200 },
  accentBar:  { width: 4, borderRadius: 2, marginVertical: 0 },
  entryBody:  { flex: 1, paddingHorizontal: 14, paddingVertical: 12 },

  entryTop:     { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: 10, marginBottom: 4 },
  entrySymptom: { flex: 1, fontSize: 15, fontFamily: FONTS.bodyMedium, color: C.black, lineHeight: 21 },
  entryArea:    { fontSize: 12, color: C.gray400, fontFamily: FONTS.body },

  urgBadge:    { borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3, alignSelf: 'flex-start' },
  urgBadgeTxt: { fontSize: 9, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1, fontFamily: FONTS.bodySemi },

  detail:     { marginTop: 14, borderTopWidth: 1, borderTopColor: C.gray200, paddingTop: 12, gap: 10 },
  detailRow:  { flexDirection: 'row', alignItems: 'center', gap: 12 },
  detailKey:  { fontSize: 11, fontWeight: '700', letterSpacing: 1, textTransform: 'uppercase', color: C.gray400, fontFamily: FONTS.bodySemi, width: 64 },
  detailVal:  { flex: 1, fontSize: 13, color: C.black, fontFamily: FONTS.body, lineHeight: 19 },

  removeBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 6, paddingTop: 12, borderTopWidth: 1, borderTopColor: C.gray200, alignSelf: 'flex-start' },
  removeTxt: { fontSize: 12, color: C.redDark, fontFamily: FONTS.bodySemi },

  chevronRow: { alignItems: 'flex-end', marginTop: 6 },
});
