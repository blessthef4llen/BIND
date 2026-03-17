// app/visit-prep.tsx — Screen 05: AI Visit Prep Summary
import React, { useState, useEffect } from 'react';
import {
  View, Text, ScrollView, StyleSheet, Alert,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Colors, Fonts, FontSize, Radius } from '../constants/theme';
import Card from '../components/ui/Card';
import AIChip from '../components/ui/AIChip';
import SectionHead from '../components/ui/SectionHead';
import UrgencyDot from '../components/ui/UrgencyDot';
import Badge from '../components/ui/Badge';
import QuestionItem from '../components/ui/QuestionItem';
import { PrimaryButton } from '../components/ui/PrimaryButton';
import { OutlineButton } from '../components/ui/OutlineButton';
import PulseDots from '../components/ui/PulseDots';
import { api, VisitPrepResult, UrgencyLevel } from '../services/api';

const MOCK_PREP: VisitPrepResult = {
  concern_summary:
    "You've logged 3 health concerns since your last visit. Primary issues include recurring " +
    "migraines affecting daily function, ankle pain when walking (8 days, severity 8/10), " +
    "and intermittent foot numbness.",
  questions: [
    "What could be causing my recurring ankle pain, and what should I avoid?",
    "Is this pain likely muscular, structural, or nerve-related?",
    "Should I get imaging done given the severity and duration?",
    "What at-home treatments are safe to try before my next visit?",
    "Could the foot numbness be related to my ankle issue?",
  ],
  concerns_to_mention: [
    { area: 'Left Foot / Ankle', urgency: 'high'   },
    { area: 'Head / Neck',       urgency: 'medium'  },
    { area: 'Right Foot',        urgency: 'low'     },
  ],
  escalation: {
    escalation_level: 'see_doctor',
    pattern_summary: 'Severity trending from 3 to 8 over 8 days. Recommend prompt evaluation.',
    recurring_areas: ['Left lower leg / ankle'],
    severity_trend: 'escalating',
  },
};

const URGENCY_BADGE: Record<UrgencyLevel, 'red' | 'amber' | 'teal'> = {
  high: 'red', medium: 'amber', low: 'teal',
};

export default function VisitPrepScreen() {
  const params = useLocalSearchParams<{ agentResult?: string }>();
  const [prep,    setPrep]    = useState<VisitPrepResult | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (params.agentResult) {
      try {
        const result = JSON.parse(params.agentResult);
        setPrep(result.step3_visit_prep ?? result);
      } catch {
        setPrep(MOCK_PREP);
      }
    }
  }, [params.agentResult]);

  async function handleGenerate() {
    setLoading(true);
    try {
      const result = await api.generatePrep();
      setPrep(result);
    } catch {
      setPrep(MOCK_PREP); // graceful fallback
    } finally {
      setLoading(false);
    }
  }

  const data = prep ?? MOCK_PREP;

  return (
    <View style={styles.root}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Visit Prep</Text>
          <AIChip label="AI Generated" />
        </View>
        <Text style={styles.subtitle}>Dr. Chen · April 10</Text>

        {/* Escalation banner */}
        {data.escalation.escalation_level !== 'monitor' && (
          <View style={[
            styles.escalationBanner,
            data.escalation.escalation_level === 'urgent'
              ? styles.bannerUrgent
              : styles.bannerSeeDoctor,
          ]}>
            <Text style={styles.bannerTitle}>
              {data.escalation.escalation_level === 'urgent'
                ? '⚠️ Urgent — See a doctor soon'
                : '📋 Recommendation: Schedule a visit'}
            </Text>
            <Text style={styles.bannerBody}>{data.escalation.pattern_summary}</Text>
          </View>
        )}

        {/* Concern Summary card */}
        <Card style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardHeaderLabel}>Concern Summary</Text>
          </View>
          <View style={styles.cardBody}>
            <Text style={styles.summaryText}>{data.concern_summary}</Text>
          </View>
        </Card>

        {/* Suggested Questions */}
        <SectionHead label="Suggested Questions" style={{ marginTop: 16 }} />
        <Card style={styles.card}>
          <View style={styles.cardBody}>
            {data.questions.map((q, i) => (
              <QuestionItem
                key={i}
                number={i + 1}
                text={q}
                isLast={i === data.questions.length - 1}
              />
            ))}
          </View>
        </Card>

        {/* Urgency Breakdown */}
        <SectionHead label="Concerns to Mention" style={{ marginTop: 16 }} />
        <Card style={styles.card}>
          <View style={styles.cardBody}>
            {data.concerns_to_mention.map((c, i) => (
              <View
                key={i}
                style={[styles.concernRow, i < data.concerns_to_mention.length - 1 && styles.concernDivider]}
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
        </Card>

        <View style={styles.spacer} />

        {!prep && (
          <PrimaryButton
            label="Generate Visit Prep"
            onPress={handleGenerate}
            loading={loading}
            style={{ marginBottom: 8 }}
          />
        )}
        <PrimaryButton
          label="Share with Doctor"
          onPress={() => Alert.alert('Share', 'Export feature coming soon.')}
          style={{ marginBottom: 8 }}
        />
        <OutlineButton
          label="Download PDF"
          onPress={() => router.push('/doctor-notes')}
        />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.bg },
  content: { paddingHorizontal: 20, paddingTop: 54, paddingBottom: 40 },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  title: { fontFamily: Fonts.serif, fontSize: 22, color: Colors.text },
  subtitle: { fontFamily: Fonts.sans, fontSize: FontSize.small, color: Colors.textMuted, marginBottom: 16 },
  escalationBanner: {
    borderRadius: Radius.sm,
    padding: 14,
    marginBottom: 14,
  },
  bannerSeeDoctor: { backgroundColor: Colors.tealLight },
  bannerUrgent:    { backgroundColor: Colors.redLight },
  bannerTitle: { fontFamily: Fonts.sansSemiBold, fontSize: FontSize.small + 1, color: Colors.text, marginBottom: 4 },
  bannerBody:  { fontFamily: Fonts.sans, fontSize: FontSize.small, color: Colors.textMuted, lineHeight: 18 },
  card: { marginBottom: 8 },
  cardHeader: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    backgroundColor: Colors.tealLight,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  cardHeaderLabel: {
    fontFamily: Fonts.sansSemiBold,
    fontSize: FontSize.tiny,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    color: Colors.teal,
  },
  cardBody: { padding: 14 },
  summaryText: { fontFamily: Fonts.sans, fontSize: FontSize.body, color: Colors.text, lineHeight: 22 },
  concernRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 10,
  },
  concernDivider: { borderBottomWidth: 1, borderBottomColor: Colors.border },
  concernArea: { flex: 1, fontFamily: Fonts.sans, fontSize: FontSize.body, color: Colors.text },
  spacer: { height: 16 },
});
