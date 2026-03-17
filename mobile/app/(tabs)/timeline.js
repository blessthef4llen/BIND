import { useState, useCallback } from 'react';
import {
  View, Text, ScrollView, StyleSheet,
  StatusBar, ActivityIndicator,
} from 'react-native';
import { useFocusEffect } from 'expo-router';
import { C, FONTS } from '../../constants/colors';
import { API_BASE } from '../../constants/api';

export default function TimelineScreen() {
  const [concerns, setConcerns] = useState([]);
  const [loading, setLoading]   = useState(true);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [])
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

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={C.white} />

      <View style={styles.topBar}>
        <Text style={styles.topTitle}>TIMELINE</Text>
      </View>

      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
        {loading ? (
          <ActivityIndicator color={C.red} style={{ padding: 40 }} />
        ) : concerns.length === 0 ? (
          <Text style={styles.empty}>No entries yet.</Text>
        ) : (
          <View style={styles.tlWrap}>
            {/* Vertical line */}
            <View style={styles.tlLine} />

            {concerns.map((c, i) => {
              const high = c.urgency_level === 'high';
              return (
                <View key={i} style={styles.tlItem}>
                  {/* Dot on the line */}
                  <View style={[styles.tlDot, { backgroundColor: high ? C.red : C.gray400 }]} />

                  {/* Card */}
                  <View style={styles.card}>
                    <View style={styles.cardTop}>
                      <Text style={styles.cardSymptom} numberOfLines={2}>{c.symptom}</Text>
                      <Text style={styles.cardDate}>{c.date_logged || ''}</Text>
                    </View>
                    <Text style={styles.cardMeta}>
                      {c.body_area} · Severity {c.severity}/10
                    </Text>
                    {!!c.notes && (
                      <Text style={styles.cardNotes}>{c.notes}</Text>
                    )}
                    <View style={[styles.badge, { backgroundColor: high ? '#FDF0F0' : C.gray100 }]}>
                      <Text style={[styles.badgeTxt, { color: high ? C.redDark : C.gray400 }]}>
                        {(c.urgency_level || 'low').toUpperCase()}
                      </Text>
                    </View>
                  </View>
                </View>
              );
            })}
          </View>
        )}
        <View style={{ height: 32 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.white },
  topBar:    { paddingHorizontal: 20, paddingTop: 56, paddingBottom: 10 },
  topTitle:  { fontFamily: FONTS.display, fontSize: 32, color: C.black, letterSpacing: 1 },
  scroll:    { flex: 1, paddingHorizontal: 20 },
  empty:     { color: C.gray400, fontSize: 14, textAlign: 'center', padding: 40, fontFamily: FONTS.body },

  tlWrap:    { position: 'relative', paddingLeft: 26, paddingTop: 4 },
  tlLine:    { position: 'absolute', left: 8, top: 16, bottom: 0, width: 2, backgroundColor: C.gray200 },

  tlItem:    { position: 'relative', marginBottom: 10 },
  tlDot:     { position: 'absolute', left: -19, top: 14, width: 10, height: 10, borderRadius: 5, borderWidth: 2, borderColor: C.white },

  card:      { backgroundColor: C.white, borderRadius: 14, borderWidth: 1, borderColor: C.gray200, padding: 11, paddingHorizontal: 14 },
  cardTop:   { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 3, gap: 8 },
  cardSymptom: { flex: 1, fontSize: 14, fontWeight: '500', color: C.black, fontFamily: FONTS.bodyMedium },
  cardDate:  { fontSize: 11, color: C.gray400, whiteSpace: 'nowrap', fontFamily: FONTS.body },
  cardMeta:  { fontSize: 12, color: C.gray400, fontFamily: FONTS.body },
  cardNotes: { fontSize: 11, color: C.gray400, fontStyle: 'italic', marginTop: 3, fontFamily: FONTS.body },
  badge:     { alignSelf: 'flex-start', borderRadius: 20, paddingVertical: 3, paddingHorizontal: 8, marginTop: 6 },
  badgeTxt:  { fontSize: 10, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1, fontFamily: FONTS.bodySemi },
});
