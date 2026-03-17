/**
 * app/(tabs)/edit-concern.js — Concern History & Archive Manager
 *
 * Shows active concerns with expand/edit/archive.
 * Shows archived concerns with restore / hard-delete.
 */

import { useState, useCallback } from 'react';
import { View, Text, ScrollView, Pressable, StyleSheet, StatusBar, ActivityIndicator, Alert } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Path, Circle } from 'react-native-svg';
import { Colors, FONTS, FontSize, Radius, Shadow, SPECIALIST_COLORS } from '../../constants/theme';
import { api } from '../../services/api';

const TABS = ['Active', 'Archived'];

function SeverityBar({ value }) {
  const color = value >= 7 ? Colors.urgent : value >= 4 ? Colors.warning : Colors.ok;
  return (
    <View style={{ flexDirection:'row', alignItems:'center', gap:4 }}>
      {Array.from({ length: 10 }, (_, i) => i + 1).map(n => (
        <View key={n} style={[sv.seg, n <= value && { backgroundColor: color }]} />
      ))}
      <Text style={sv.label}>{value}/10</Text>
    </View>
  );
}
const sv = StyleSheet.create({
  seg:   { flex:1, height:4, borderRadius:2, backgroundColor: Colors.surface3 },
  label: { fontFamily: FONTS.body, fontSize: FontSize.tiny, color: Colors.textFaint, marginLeft:2 },
});

export default function EditConcernScreen() {
  const insets = useSafeAreaInsets();
  const [tab,      setTab]      = useState('Active');
  const [active,   setActive]   = useState([]);
  const [archived, setArchived] = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [expanded, setExpanded] = useState(null);

  useFocusEffect(useCallback(() => { load(); }, []));

  async function load() {
    setLoading(true);
    try {
      const [a, b] = await Promise.all([api.getConcerns(), api.getArchivedConcerns()]);
      setActive(a.concerns || []);
      setArchived(b.concerns || []);
    } catch {
      setActive([]); setArchived([]);
    } finally {
      setLoading(false);
    }
  }

  async function handleArchive(c) {
    Alert.alert('Archive?', `"${c.symptom}" will be archived. Restore it anytime.`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Archive', style: 'destructive', onPress: async () => {
        try { await api.archiveConcern(c.id); load(); } catch { Alert.alert('Error', 'Could not archive.'); }
      }},
    ]);
  }

  async function handleRestore(c) {
    try { await api.restoreConcern(c.id); load(); } catch { Alert.alert('Error', 'Could not restore.'); }
  }

  async function handleDelete(c) {
    Alert.alert('Delete permanently?', `"${c.symptom}" will be removed forever.`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: async () => {
        try { await api.deleteConcern(c.id); load(); } catch { Alert.alert('Error', 'Could not delete.'); }
      }},
    ]);
  }

  const items = tab === 'Active' ? active : archived;

  function ConcernEntry({ c }) {
    const open = expanded === c.id;
    const urg  = c.urgency_level || 'low';
    const urgColor = urg === 'high' ? Colors.urgent : urg === 'medium' ? Colors.warning : Colors.ok;
    const catStyle = SPECIALIST_COLORS[c.category] || SPECIALIST_COLORS['General'];
    const date = c.symptom_date || c.date_logged || '';

    return (
      <Pressable style={[ce.wrap, open && ce.wrapOpen]} onPress={() => setExpanded(open ? null : c.id)}>
        <View style={[ce.bar, { backgroundColor: urgColor }]} />
        <View style={ce.body}>
          <View style={ce.topRow}>
            <Text style={ce.symptom} numberOfLines={open ? undefined : 2}>{c.symptom}</Text>
            <View style={[ce.cat, { backgroundColor: catStyle.bg }]}>
              <Text style={[ce.catTxt, { color: catStyle.text }]}>{c.category || 'General'}</Text>
            </View>
          </View>
          <Text style={ce.meta}>{c.body_area} · {date}</Text>

          {open && (
            <View style={ce.detail}>
              <Text style={ce.detailLbl}>Severity</Text>
              <SeverityBar value={c.severity || 0} />
              {!!c.notes && <>
                <Text style={[ce.detailLbl, { marginTop:10 }]}>Notes</Text>
                <Text style={ce.detailVal}>{c.notes}</Text>
              </>}

              <View style={ce.actions}>
                {tab === 'Active' ? (
                  <Pressable style={ce.archBtn} onPress={() => handleArchive(c)}>
                    <Text style={ce.archTxt}>Archive</Text>
                  </Pressable>
                ) : (
                  <>
                    <Pressable style={ce.restoreBtn} onPress={() => handleRestore(c)}>
                      <Text style={ce.restoreTxt}>Restore</Text>
                    </Pressable>
                    <Pressable style={ce.delBtn} onPress={() => handleDelete(c)}>
                      <Text style={ce.delTxt}>Delete</Text>
                    </Pressable>
                  </>
                )}
              </View>
            </View>
          )}

          <View style={{ alignItems:'flex-end' }}>
            <Svg width={14} height={14} viewBox="0 0 14 14">
              <Path d={open ? 'M3 9l4-4 4 4' : 'M3 5l4 4 4-4'} stroke={Colors.textFaint} strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" fill="none" />
            </Svg>
          </View>
        </View>
      </Pressable>
    );
  }

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <StatusBar barStyle="dark-content" backgroundColor={Colors.offWhite} />

      <View style={styles.header}>
        <Text style={styles.title}>CONCERN HISTORY</Text>
        <Text style={styles.subtitle}>
          {tab === 'Active' ? `${active.length} active` : `${archived.length} archived`}
        </Text>
      </View>

      {/* Tab toggle */}
      <View style={styles.tabRow}>
        {TABS.map(t => (
          <Pressable key={t} style={[styles.tabBtn, tab === t && styles.tabActive]} onPress={() => setTab(t)}>
            <Text style={[styles.tabTxt, tab === t && styles.tabTxtActive]}>{t}</Text>
          </Pressable>
        ))}
      </View>

      {tab === 'Archived' && archived.length > 0 && (
        <View style={styles.archiveBanner}>
          <Text style={styles.archiveBannerTxt}>
            Archived items are automatically deleted after 30 days.
          </Text>
        </View>
      )}

      <ScrollView
        style={styles.scroll}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: insets.bottom + 40, paddingTop:4 }}
      >
        {loading ? (
          <ActivityIndicator color={Colors.red} style={{ padding:40 }} />
        ) : items.length === 0 ? (
          <View style={styles.empty}>
            <Text style={styles.emptyTitle}>{tab === 'Active' ? 'No active concerns' : 'Nothing archived'}</Text>
            <Text style={styles.emptySub}>{tab === 'Active' ? 'Log a concern from the Log tab.' : 'Archived concerns will appear here.'}</Text>
          </View>
        ) : (
          items.map((c, i) => <ConcernEntry key={c.id || i} c={c} />)
        )}
      </ScrollView>
    </View>
  );
}

const ce = StyleSheet.create({
  wrap:    { flexDirection:'row', backgroundColor: Colors.surface, borderRadius: Radius.sm, marginBottom:8, overflow:'hidden', borderWidth:1, borderColor: Colors.border, ...Shadow.sm },
  wrapOpen:{ borderColor: Colors.borderStrong },
  bar:     { width:4 },
  body:    { flex:1, paddingHorizontal:14, paddingVertical:12 },
  topRow:  { flexDirection:'row', alignItems:'flex-start', gap:8, marginBottom:3 },
  symptom: { flex:1, fontFamily: FONTS.bodyMedium, fontSize: FontSize.body, color: Colors.text, lineHeight:20 },
  cat:     { borderRadius: Radius.xs, paddingHorizontal:6, paddingVertical:2, alignSelf:'flex-start' },
  catTxt:  { fontFamily: FONTS.bodySemi, fontSize:10, textTransform:'uppercase', letterSpacing:0.4 },
  meta:    { fontFamily: FONTS.body, fontSize: FontSize.tiny, color: Colors.textFaint },
  detail:  { marginTop:12, paddingTop:12, borderTopWidth:1, borderTopColor: Colors.border, gap:4 },
  detailLbl:{ fontFamily: FONTS.bodySemi, fontSize: FontSize.micro, color: Colors.textMuted, textTransform:'uppercase', letterSpacing:1, marginBottom:4 },
  detailVal:{ fontFamily: FONTS.body, fontSize: FontSize.body, color: Colors.text, lineHeight:20 },
  actions: { flexDirection:'row', gap:8, marginTop:12 },
  archBtn: { borderWidth:1, borderColor: Colors.borderStrong, borderRadius: Radius.xs, paddingVertical:8, paddingHorizontal:14 },
  archTxt: { fontFamily: FONTS.bodySemi, fontSize: FontSize.small, color: Colors.textMuted },
  restoreBtn: { backgroundColor: Colors.okLight, borderRadius: Radius.xs, paddingVertical:8, paddingHorizontal:14 },
  restoreTxt: { fontFamily: FONTS.bodySemi, fontSize: FontSize.small, color: '#1A6B40' },
  delBtn:  { borderWidth:1, borderColor: Colors.redLight, borderRadius: Radius.xs, paddingVertical:8, paddingHorizontal:14 },
  delTxt:  { fontFamily: FONTS.bodySemi, fontSize: FontSize.small, color: Colors.redDark },
});

const styles = StyleSheet.create({
  root:    { flex:1, backgroundColor: Colors.offWhite },
  header:  { paddingHorizontal:20, paddingTop:10, paddingBottom:8 },
  title:   { fontFamily: FONTS.display, fontSize:30, color: Colors.black, letterSpacing:1 },
  subtitle:{ fontFamily: FONTS.body, fontSize: FontSize.small, color: Colors.textMuted, marginTop:2 },
  tabRow:  { flexDirection:'row', marginHorizontal:20, marginBottom:10, backgroundColor: Colors.surface2, borderRadius: Radius.sm, padding:3, borderWidth:1, borderColor: Colors.border },
  tabBtn:  { flex:1, alignItems:'center', paddingVertical:8, borderRadius: Radius.xs },
  tabActive:{ backgroundColor: Colors.surface, ...Shadow.sm },
  tabTxt:  { fontFamily: FONTS.body, fontSize: FontSize.body, color: Colors.textMuted },
  tabTxtActive:{ fontFamily: FONTS.bodySemi, color: Colors.text },
  archiveBanner: { marginHorizontal:20, marginBottom:8, backgroundColor: Colors.warningLight, borderRadius: Radius.xs, padding:10, borderWidth:1, borderColor: Colors.warning + '44' },
  archiveBannerTxt:{ fontFamily: FONTS.body, fontSize: FontSize.small, color: '#7A4A10' },
  scroll:  { flex:1, paddingHorizontal:20 },
  empty:   { paddingTop:48, alignItems:'center', paddingHorizontal:16 },
  emptyTitle: { fontFamily: FONTS.bodySemi, fontSize: FontSize.medium, color: Colors.text, marginBottom:8 },
  emptySub:   { fontFamily: FONTS.body, fontSize: FontSize.body, color: Colors.textMuted, textAlign:'center', lineHeight:20 },
});