/**
 * app/visit-prep.tsx — AI Visit Prep results
 *
 * Redesigned with warm red/white/charcoal brand.
 * Shows IBM Granite analysis: symptom summary, concerns, questions.
 */

import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet, Pressable, ActivityIndicator } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import Svg, { Path, Circle } from 'react-native-svg';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors, FONTS, FontSize, Radius, Shadow } from '../constants/theme';
import { api, VisitPrepResponse } from '../services/api';

// ─── Types ────────────────────────────────────────────────────────────────────

type UrgencyLevel = 'high' | 'medium' | 'low';

interface ConcernToMention { area: string; urgency: UrgencyLevel; }

// ─── Mock fallback ────────────────────────────────────────────────────────────

const MOCK: VisitPrepResponse = {
  symptom_summary: 'You reported left ankle pain that has been present for 3 days, worsening with activity. You marked this as high urgency.',
  questions_to_ask: [
    'What could be causing this ankle pain — structural, nerve, or muscular?',
    'Should I get imaging done given the severity?',
    'What at-home treatments are safe while I wait for my appointment?',
    'Are there any warning signs I should watch for?',
  ],
  concerns_to_mention: [
    { area: 'Left Foot / Ankle', urgency: 'high'   },
    { area: 'Head / Neck',       urgency: 'medium'  },
  ],
};

// ─── Urgency config ───────────────────────────────────────────────────────────

const URGENCY_STYLE: Record<UrgencyLevel, { dot: string; bg: string; text: string; label: string }> = {
  high:   { dot: Colors.urgent,  bg: Colors.redLight,     text: Colors.redDark,  label: 'HIGH'   },
  medium: { dot: Colors.warning, bg: Colors.warningLight, text: '#7A4A10',       label: 'MEDIUM' },
  low:    { dot: Colors.ok,      bg: Colors.okLight,      text: '#1A6B40',       label: 'LOW'    },
};

// ─── Section label ────────────────────────────────────────────────────────────

function GraniteLabel({ text }: { text: string }) {
  return (
    <View style={gl.row}>
      <View style={gl.dot} />
      <Text style={gl.txt}>{text}</Text>
    </View>
  );
}
const gl = StyleSheet.create({
  row: { flexDirection:'row', alignItems:'center', gap:5, marginBottom:6 },
  dot: { width:5, height:5, borderRadius:3, backgroundColor: Colors.red },
  txt: { fontFamily: FONTS.bodySemi, fontSize: FontSize.tiny, color: Colors.red, letterSpacing:0.8, textTransform:'uppercase' },
});

// ─── Question item ────────────────────────────────────────────────────────────

function QuestionItem({ number, text, isLast }: { number:number; text:string; isLast?:boolean }) {
  return (
    <View style={[qi.row, !isLast && qi.divider]}>
      <View style={qi.num}>
        <Text style={qi.numTxt}>{number}</Text>
      </View>
      <Text style={qi.text}>{text}</Text>
    </View>
  );
}
const qi = StyleSheet.create({
  row:    { flexDirection:'row', alignItems:'flex-start', gap:10, paddingVertical:12 },
  divider:{ borderBottomWidth:1, borderBottomColor: Colors.border },
  num:    { width:22, height:22, borderRadius:11, backgroundColor: Colors.redLight, alignItems:'center', justifyContent:'center', marginTop:1 },
  numTxt: { fontFamily: FONTS.bodySemi, fontSize: FontSize.micro, color: Colors.red },
  text:   { flex:1, fontFamily: FONTS.body, fontSize: FontSize.body, color: Colors.text, lineHeight:21 },
});

// ─── Screen ───────────────────────────────────────────────────────────────────

export default function VisitPrepScreen() {
  const params = useLocalSearchParams<{ result?: string }>();
  const insets = useSafeAreaInsets();
  const [prep,    setPrep]    = useState<VisitPrepResponse | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (params.result) {
      try { setPrep(JSON.parse(params.result)); } catch { setPrep(MOCK); }
    }
  }, [params.result]);

  async function generate() {
    setLoading(true);
    try {
      const data = await fetch(`http://localhost:8000/api/prep`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ body_area:'General', start_time:'', concern_description:'General health concern', urgency:'low', additional_message:'' }),
      }).then(r => r.json());
      setPrep(data);
    } catch {
      setPrep(MOCK);
    } finally {
      setLoading(false);
    }
  }

  const data = prep ?? MOCK;

  return (
    <View style={styles.root}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: insets.bottom + 32 }}>

        {/* Dark hero */}
        <View style={[styles.hero, { paddingTop: insets.top + 16 }]}>
          <Pressable style={styles.backBtn} onPress={() => router.back()}>
            <Svg width={18} height={18} viewBox="0 0 18 18">
              <Path d="M11 4L6 9l5 5" stroke="rgba(255,255,255,0.6)" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" fill="none" />
            </Svg>
            <Text style={styles.backTxt}>Back</Text>
          </Pressable>

          {/* IBM Granite chip */}
          <View style={styles.chip}>
            <View style={styles.chipDot} />
            <Text style={styles.chipTxt}>IBM Granite · Active</Text>
          </View>

          <Text style={styles.heroTitle}>YOUR{'\n'}VISIT PREP</Text>
          <Text style={styles.heroSub}>
            IBM Granite analyzed your concern and generated personalized insights.{'\n'}
            <Text style={{ fontStyle:'italic', opacity:0.6 }}>Pulse does not diagnose.</Text>
          </Text>
        </View>

        <View style={styles.body}>

          {/* No result yet */}
          {!prep && (
            <View style={styles.genCard}>
              <GraniteLabel text="IBM Granite · Ready" />
              <Text style={styles.genTitle}>Generate your personalized visit prep</Text>
              <Text style={styles.genBody}>IBM Granite will analyze your concern and create tailored questions and a summary for your doctor.</Text>
              <Pressable
                style={({ pressed }) => [styles.genBtn, pressed && { opacity:0.85 }]}
                onPress={generate}
                disabled={loading}
              >
                {loading
                  ? <ActivityIndicator color={Colors.white} />
                  : <Text style={styles.genBtnTxt}>GENERATE VISIT PREP</Text>
                }
              </Pressable>
            </View>
          )}

          {/* Section 1: Summary */}
          <View style={styles.section}>
            <GraniteLabel text="IBM Granite · What Was Found" />
            <Text style={styles.sectionTitle}>Summary of your concern</Text>
            <View style={styles.card}>
              <Text style={styles.summaryText}>{data.symptom_summary}</Text>
            </View>
          </View>

          {/* Section 2: Concerns to mention */}
          {data.concerns_to_mention.length > 0 && (
            <View style={styles.section}>
              <GraniteLabel text="IBM Granite · Ranked by Urgency" />
              <Text style={styles.sectionTitle}>Bring these up with your doctor</Text>
              <View style={styles.card}>
                {data.concerns_to_mention.map((c, i) => {
                  const ust = URGENCY_STYLE[c.urgency] || URGENCY_STYLE.low;
                  return (
                    <View key={i} style={[cm.row, i < data.concerns_to_mention.length - 1 && cm.divider]}>
                      <View style={[cm.dot, { backgroundColor: ust.dot }]} />
                      <Text style={cm.area}>{c.area}</Text>
                      <View style={[cm.badge, { backgroundColor: ust.bg }]}>
                        <Text style={[cm.badgeTxt, { color: ust.text }]}>{ust.label}</Text>
                      </View>
                    </View>
                  );
                })}
              </View>
            </View>
          )}

          {/* Section 3: Questions */}
          <View style={styles.section}>
            <GraniteLabel text="IBM Granite · Generated Questions" />
            <Text style={styles.sectionTitle}>Questions to ask your doctor</Text>
            <Text style={styles.sectionSub}>Written specifically for your concern — not generic advice.</Text>
            <View style={styles.card}>
              {data.questions_to_ask.map((q, i) => (
                <QuestionItem key={i} number={i + 1} text={q} isLast={i === data.questions_to_ask.length - 1} />
              ))}
            </View>
          </View>

          {/* CTA */}
          <Pressable
            style={({ pressed }) => [styles.ctaBtn, pressed && { opacity:0.85 }]}
            onPress={() => router.push('/doctor-notes')}
          >
            <Text style={styles.ctaTxt}>Upload Doctor Notes After Visit</Text>
          </Pressable>

        </View>
      </ScrollView>
    </View>
  );
}

const cm = StyleSheet.create({
  row:      { flexDirection:'row', alignItems:'center', gap:10, paddingVertical:11 },
  divider:  { borderBottomWidth:1, borderBottomColor: Colors.border },
  dot:      { width:8, height:8, borderRadius:4 },
  area:     { flex:1, fontFamily: FONTS.body, fontSize: FontSize.body, color: Colors.text },
  badge:    { borderRadius: Radius.xs, paddingHorizontal:8, paddingVertical:3 },
  badgeTxt: { fontFamily: FONTS.bodySemi, fontSize: FontSize.micro, textTransform:'uppercase', letterSpacing:0.5 },
});

const styles = StyleSheet.create({
  root:  { flex:1, backgroundColor: Colors.offWhite },

  hero:  { backgroundColor: Colors.black, paddingHorizontal:22, paddingBottom:28 },
  backBtn: { flexDirection:'row', alignItems:'center', gap:4, marginBottom:20 },
  backTxt: { fontFamily: FONTS.sansMedium, fontSize: FontSize.body, color:'rgba(255,255,255,0.60)' },
  chip:    { flexDirection:'row', alignItems:'center', gap:5, backgroundColor:'rgba(201,64,64,0.18)', borderWidth:1, borderColor:'rgba(201,64,64,0.35)', borderRadius: Radius.pill, paddingVertical:4, paddingHorizontal:10, alignSelf:'flex-start', marginBottom:14 },
  chipDot: { width:5, height:5, borderRadius:3, backgroundColor: Colors.redMid },
  chipTxt: { fontFamily: FONTS.bodySemi, fontSize: FontSize.tiny, color: Colors.redMid, letterSpacing:0.4 },
  heroTitle:{ fontFamily: FONTS.display, fontSize:40, color: Colors.white, lineHeight:42, marginBottom:10, letterSpacing:0.5 },
  heroSub:  { fontFamily: FONTS.body, fontSize: FontSize.small, color:'rgba(255,255,255,0.48)', lineHeight:19 },

  body:  { paddingHorizontal:20, paddingTop:20 },

  genCard:  { backgroundColor: Colors.surface, borderRadius: Radius.md, padding:18, marginBottom:16, borderWidth:1, borderColor: Colors.border, ...Shadow.sm },
  genTitle: { fontFamily: FONTS.display, fontSize:22, color: Colors.text, marginBottom:8, letterSpacing:0.5 },
  genBody:  { fontFamily: FONTS.body, fontSize: FontSize.body, color: Colors.textMuted, lineHeight:21, marginBottom:16 },
  genBtn:   { backgroundColor: Colors.red, borderRadius: Radius.sm, paddingVertical:13, alignItems:'center' },
  genBtnTxt:{ fontFamily: FONTS.display, fontSize:20, letterSpacing:2, color: Colors.white },

  section:     { marginBottom:22 },
  sectionTitle:{ fontFamily: FONTS.display, fontSize:22, color: Colors.text, marginBottom:4, letterSpacing:0.3 },
  sectionSub:  { fontFamily: FONTS.body, fontSize: FontSize.small, color: Colors.textMuted, marginBottom:10, lineHeight:18 },

  card:        { backgroundColor: Colors.surface, borderRadius: Radius.sm, paddingHorizontal:14, paddingVertical:4, borderWidth:1, borderColor: Colors.border },
  summaryText: { fontFamily: FONTS.body, fontSize: FontSize.body, color: Colors.text, lineHeight:22, paddingVertical:12 },

  ctaBtn:  { borderWidth:1.5, borderColor: Colors.red, borderRadius: Radius.sm, paddingVertical:13, alignItems:'center', marginTop:4 },
  ctaTxt:  { fontFamily: FONTS.bodySemi, fontSize: FontSize.body, color: Colors.red },
});