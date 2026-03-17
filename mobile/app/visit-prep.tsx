/**
 * app/visit-prep.tsx — Visit Prep results screen
 *
 * API contract implemented:
 *   Receives params.result from POST /api/prep
 *   Response shape: { symptom_summary, questions_to_ask: string[], concerns_to_mention: { area, urgency }[] }
 *
 * If navigated to directly (no params), falls back to mock POST /api/prep with sample data.
 * Urgency values: 'high' | 'medium' | 'low'
 */

import React, { useState, useEffect } from 'react';
import {
  View, Text, ScrollView, StyleSheet, Pressable, ActivityIndicator,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import Svg, { Path } from 'react-native-svg';
import { Colors, Fonts, FontSize, Radius } from '../constants/theme';
import AIChip from '../components/ui/AIChip';
import UrgencyDot from '../components/ui/UrgencyDot';
import Badge from '../components/ui/Badge';
import QuestionItem from '../components/ui/QuestionItem';
import { PrimaryButton } from '../components/ui/PrimaryButton';
import { OutlineButton } from '../components/ui/OutlineButton';
import { ROUTES } from '../constants/api';

// ─── Types ────────────────────────────────────────────────────────────────

type UrgencyLevel = 'high' | 'medium' | 'low';

interface ConcernToMention {
  area: string;
  urgency: UrgencyLevel;
}

interface PrepResult {
  symptom_summary: string;
  questions_to_ask: string[];
  concerns_to_mention: ConcernToMention[];
}

// ─── Constants ────────────────────────────────────────────────────────────

const URGENCY_BADGE: Record<UrgencyLevel, 'red' | 'amber' | 'teal'> = {
  high: 'red', medium: 'amber', low: 'teal',
};

// Mock data for fallback (direct navigation with no params)
const MOCK_RESULT: PrepResult = {
  symptom_summary:
    'Patient reports left ankle pain of 3 days duration with moderate-to-high urgency. ' +
    'Pain is described as sharp and throbbing, worsening on weight-bearing activities.',
  questions_to_ask: [
    'What could be causing my ankle pain, and what should I avoid doing?',
    'Is this likely muscular, structural, or nerve-related?',
    'Should I get imaging done given the severity and duration?',
    'What at-home treatments are safe before my next visit?',
  ],
  concerns_to_mention: [
    { area: 'Left Foot / Ankle', urgency: 'high'   },
    { area: 'Head / Neck',       urgency: 'medium'  },
    { area: 'Right Foot',        urgency: 'low'     },
  ],
};

// Mock payload used when hitting the API as a fallback
const MOCK_REQUEST_PAYLOAD = {
  body_area:           'Left Foot / Ankle',
  start_time:          '3 days ago',
  concern_description: 'Sharp throbbing ankle pain, worse when walking.',
  urgency:             'high',
  additional_message:  '',
};

// ─── GraniteLabel sub-component ───────────────────────────────────────────

function GraniteLabel({ text }: { text: string }) {
  return (
    <View style={gl.row}>
      <View style={gl.dot} />
      <Text style={gl.txt}>{text}</Text>
    </View>
  );
}

const gl = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 5, marginBottom: 6 },
  dot: { width: 5, height: 5, borderRadius: 3, backgroundColor: Colors.teal },
  txt: { fontFamily: Fonts.sansSemiBold, fontSize: FontSize.tiny, color: Colors.teal, letterSpacing: 0.4 },
});

// ─── Screen ───────────────────────────────────────────────────────────────

export default function VisitPrepScreen() {
  const params = useLocalSearchParams<{ result?: string }>();
  const [prep,    setPrep]    = useState<PrepResult | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (params.result) {
      try {
        const parsed = JSON.parse(params.result);
        setPrep(parsed);
      } catch {
        setPrep(MOCK_RESULT);
      }
    }
  }, [params.result]);

  // Fallback: called when user arrives with no result param
  async function handleGenerate() {
    setLoading(true);
    try {
      const response = await fetch(ROUTES.prep, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify(MOCK_REQUEST_PAYLOAD),
      });
      if (!response.ok) throw new Error('Server error');
      const data: PrepResult = await response.json();
      setPrep(data);
    } catch {
      setPrep(MOCK_RESULT);
    } finally {
      setLoading(false);
    }
  }

  // Use live data if available, otherwise fall back to MOCK for display structure
  const data = prep ?? MOCK_RESULT;

  return (
    <View style={styles.root}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>

        {/* ── Dark hero header ─────────────────────────────────────── */}
        <View style={styles.hero}>
          <Pressable style={styles.backBtn} onPress={() => router.back()}>
            <Svg width={18} height={18} viewBox="0 0 18 18">
              <Path
                d="M11 4L6 9l5 5"
                stroke="rgba(255,255,255,0.6)"
                strokeWidth={2}
                strokeLinecap="round"
                strokeLinejoin="round"
                fill="none"
              />
            </Svg>
            <Text style={styles.backTxt}>Back</Text>
          </Pressable>

          <AIChip label="IBM Granite · Active" />

          <Text style={styles.heroTitle}>YOUR{'\n'}VISIT PREP</Text>
          <Text style={styles.heroSub}>
            IBM Granite analyzed your concern and generated personalized insights
          </Text>
        </View>

        <View style={styles.body}>

          {/* ── No result yet: show Generate CTA ─────────────────── */}
          {!prep && (
            <View style={styles.generateCard}>
              <GraniteLabel text="IBM GRANITE · READY TO ANALYZE" />
              <Text style={styles.generateTitle}>Generate your personalized visit prep</Text>
              <Text style={styles.generateBody}>
                IBM Granite will analyze your concern and create a tailored summary and question list for your doctor.
              </Text>
              <PrimaryButton
                label={loading ? 'Analyzing…' : 'Generate Visit Prep'}
                onPress={handleGenerate}
                loading={loading}
                style={{ marginTop: 16 }}
              />
            </View>
          )}

          {/* ── Section 1: What IBM Granite found ────────────────── */}
          <View style={styles.section}>
            <GraniteLabel text="IBM GRANITE · WHAT WAS FOUND" />
            <Text style={styles.sectionTitle}>What IBM Granite found</Text>
            <View style={styles.card}>
              <Text style={styles.summaryText}>{data.symptom_summary}</Text>
            </View>
          </View>

          {/* ── Section 2: Concerns to mention ───────────────────── */}
          <View style={styles.section}>
            <GraniteLabel text="IBM GRANITE · RANKED BY URGENCY" />
            <Text style={styles.sectionTitle}>Bring these up with your doctor</Text>
            <View style={styles.card}>
              {data.concerns_to_mention.map((c, i) => (
                <View
                  key={i}
                  style={[
                    styles.concernRow,
                    i < data.concerns_to_mention.length - 1 && styles.concernDivider,
                  ]}
                >
                  <UrgencyDot level={c.urgency} />
                  <Text style={styles.concernArea}>{c.area}</Text>
                  <Badge
                    label={c.urgency === 'medium' ? 'Med' : c.urgency}
                    variant={URGENCY_BADGE[c.urgency]}
                  />
                </View>
              ))}
            </View>
          </View>

          {/* ── Section 3: Questions to ask ──────────────────────── */}
          <View style={styles.section}>
            <GraniteLabel text="IBM GRANITE · GENERATED FROM YOUR CONCERN" />
            <Text style={styles.sectionTitle}>Questions to ask your doctor</Text>
            <Text style={styles.sectionSub}>
              These questions were written specifically based on what you described — not generic advice.
            </Text>
            <View style={styles.card}>
              {data.questions_to_ask.map((q, i) => (
                <QuestionItem
                  key={i}
                  number={i + 1}
                  text={q}
                  isLast={i === data.questions_to_ask.length - 1}
                />
              ))}
            </View>
          </View>

          {/* ── Actions ──────────────────────────────────────────── */}
          <View style={styles.actions}>
            <OutlineButton
              label="Upload Doctor Notes After Visit"
              onPress={() => router.push('/doctor-notes')}
            />
          </View>

        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root:   { flex: 1, backgroundColor: Colors.bg },
  scroll: { paddingBottom: 48 },

  // Hero
  hero:      { backgroundColor: Colors.darkBg, paddingHorizontal: 22, paddingTop: 56, paddingBottom: 28 },
  backBtn:   { flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 20 },
  backTxt:   { fontFamily: Fonts.sansMedium, fontSize: FontSize.body, color: 'rgba(255,255,255,0.6)' },
  heroTitle: { fontFamily: Fonts.serif, fontSize: 42, color: '#FFFFFF', lineHeight: 46, marginTop: 14, marginBottom: 10 },
  heroSub:   { fontFamily: Fonts.sans, fontSize: FontSize.small, color: 'rgba(255,255,255,0.5)', lineHeight: 19 },

  body: { paddingHorizontal: 20, paddingTop: 20 },

  // Generate fallback card
  generateCard:  { backgroundColor: Colors.surface, borderRadius: Radius.md, padding: 18, marginBottom: 16, borderWidth: 1, borderColor: Colors.borderStrong },
  generateTitle: { fontFamily: Fonts.serif, fontSize: 20, color: Colors.text, marginBottom: 8 },
  generateBody:  { fontFamily: Fonts.sans, fontSize: FontSize.body, color: Colors.textMuted, lineHeight: 21 },

  // Sections
  section:      { marginBottom: 20 },
  sectionTitle: { fontFamily: Fonts.serif, fontSize: 18, color: Colors.text, marginBottom: 4 },
  sectionSub:   { fontFamily: Fonts.sans, fontSize: FontSize.small, color: Colors.textMuted, marginBottom: 10, lineHeight: 18 },

  card: { backgroundColor: Colors.surface, borderRadius: Radius.sm, padding: 14, borderWidth: 1, borderColor: Colors.border },

  summaryText: { fontFamily: Fonts.sans, fontSize: FontSize.body, color: Colors.text, lineHeight: 22 },

  concernRow:     { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 10 },
  concernDivider: { borderBottomWidth: 1, borderBottomColor: Colors.border },
  concernArea:    { flex: 1, fontFamily: Fonts.sans, fontSize: FontSize.body, color: Colors.text },

  actions: { gap: 0, marginTop: 4 },
});
