import { useState, useRef, useEffect } from 'react';
import {
  View, Text, ScrollView, Pressable, TextInput,
  StyleSheet, StatusBar, Animated,
} from 'react-native';
import { C, FONTS } from '../../constants/colors';
import { API_BASE } from '../../constants/api';

// 'idle' | 'active' | 'done'
const INIT_STEPS = [
  { id: 1, name: 'Check-in Agent',          desc: 'Logs Day 8 entry — body area, severity, urgency',        state: 'idle' },
  { id: 2, name: 'Pattern Detection Agent', desc: 'IBM Granite reads 8-day history, finds escalation',      state: 'idle' },
  { id: 3, name: 'Visit Prep Agent',        desc: 'Generates doctor questions + escalation decision',        state: 'idle' },
];

function StepCard({ step }) {
  const anim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(anim, {
      toValue: step.state === 'idle' ? 0 : 1,
      duration: 300,
      useNativeDriver: false,
    }).start();
  }, [step.state]);

  const bgColor = anim.interpolate({
    inputRange: [0, 1],
    outputRange: [
      'rgba(255,255,255,0.03)',
      step.state === 'done' ? 'rgba(212,43,43,0.08)' : 'rgba(212,43,43,0.04)',
    ],
  });

  const circleBg =
    step.state === 'done'   ? C.red :
    step.state === 'active' ? 'rgba(212,43,43,0.3)' :
    'rgba(255,255,255,0.06)';

  const circleText =
    step.state === 'done'   ? C.white :
    step.state === 'active' ? C.red :
    'rgba(255,255,255,0.3)';

  const nameColor =
    step.state === 'idle' ? 'rgba(255,255,255,0.5)' : 'rgba(255,255,255,0.9)';

  const descColor =
    step.state === 'idle' ? 'rgba(255,255,255,0.25)' : 'rgba(255,255,255,0.45)';

  return (
    <Animated.View style={[styles.stepCard, { backgroundColor: bgColor, borderColor: step.state !== 'idle' ? 'rgba(212,43,43,0.25)' : 'rgba(255,255,255,0.06)' }]}>
      <View style={[styles.stepCircle, { backgroundColor: circleBg }]}>
        <Text style={[styles.stepNum, { color: circleText }]}>
          {step.state === 'done' ? '✓' : step.id}
        </Text>
      </View>
      <View style={{ flex: 1 }}>
        <Text style={[styles.stepName, { color: nameColor }]}>{step.name}</Text>
        <Text style={[styles.stepDesc, { color: descColor }]}>{step.desc}</Text>
      </View>
    </Animated.View>
  );
}

function SeverityBar({ value, onChange }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
      <Text style={styles.sevLbl}>Severity</Text>
      <View style={{ flex: 1, flexDirection: 'row', gap: 3 }}>
        {Array.from({ length: 10 }, (_, i) => i + 1).map((n) => (
          <Pressable
            key={n}
            style={[styles.sevSeg, n <= value && styles.sevSegOn]}
            onPress={() => onChange(n)}
          />
        ))}
      </View>
      <Text style={styles.sevVal}>{value}</Text>
    </View>
  );
}

export default function DemoScreen() {
  const [steps, setSteps]       = useState(INIT_STEPS);
  const [area, setArea]         = useState('Left Ankle');
  const [symptom, setSymptom]   = useState('Cannot walk normally. Severe arch pain and ankle swelling.');
  const [severity, setSeverity] = useState(8);
  const [firing, setFiring]     = useState(false);
  const [error, setError]       = useState('');
  const [result, setResult]     = useState(null);

  function updateStep(id, state) {
    setSteps((prev) => prev.map((s) => s.id === id ? { ...s, state } : s));
  }

  async function fireChain() {
    setFiring(true);
    setError('');
    setResult(null);
    setSteps(INIT_STEPS.map((s) => ({ ...s, state: 'idle' })));

    // Animate steps
    setTimeout(() => updateStep(1, 'active'), 0);
    setTimeout(() => updateStep(1, 'done'),   800);
    setTimeout(() => updateStep(2, 'active'), 850);
    setTimeout(() => updateStep(2, 'done'),   1800);
    setTimeout(() => updateStep(3, 'active'), 1850);

    try {
      const r = await fetch(`${API_BASE}/run-agent-chain`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          body_area:     area,
          symptom,
          urgency_level: 'high',
          severity,
          notes:         'Day 8 live demo',
          language:      'en',
        }),
      });
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      const data = await r.json();

      setTimeout(() => {
        updateStep(3, 'done');
        setResult(data);
        setFiring(false);
      }, 2400);
    } catch (e) {
      setTimeout(() => {
        setError(`API unreachable. Run: python run.py\n\n${e.message}`);
        setSteps(INIT_STEPS.map((s) => ({ ...s, state: 'idle' })));
        setFiring(false);
      }, 600);
    }
  }

  const prep = result?.step3_visit_prep || {};
  const pat  = result?.step2_pattern    || {};
  const esc  = prep.escalation_decision || pat.escalation_level || 'monitor';
  const escBg =
    esc === 'urgent'     ? C.red :
    esc === 'see_doctor' ? '#D4A500' : '#22C55E';

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={C.black} />

      <View style={styles.topBar}>
        <Text style={styles.topTitle}>DEMO</Text>
        <View style={styles.ibmBadge}>
          <View style={styles.ibmDot} />
          <Text style={styles.ibmTxt}>IBM watsonx</Text>
        </View>
      </View>

      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 48 }}>

        {/* Hero */}
        <View style={styles.demoHero}>
          <Text style={styles.demoEye}>● Live Agent Chain</Text>
          <Text style={styles.demoTitle}>3 AGENTS FIRE</Text>
          <Text style={styles.demoSub}>
            Day 8 entry → <Text style={styles.demoCode}>POST /api/run-agent-chain</Text> → escalation decision + visit prep generated autonomously
          </Text>
        </View>

        {/* Step cards */}
        {steps.map((step) => (
          <StepCard key={step.id} step={step} />
        ))}

        <View style={{ height: 14 }} />

        {/* Form */}
        <View style={styles.form}>
          <Text style={styles.formLabel}>Day 8 — Live Entry</Text>
          <TextInput
            style={styles.darkInput}
            value={area}
            onChangeText={setArea}
            placeholder="Body area"
            placeholderTextColor="rgba(255,255,255,0.25)"
          />
          <TextInput
            style={styles.darkInput}
            value={symptom}
            onChangeText={setSymptom}
            placeholder="Symptom"
            placeholderTextColor="rgba(255,255,255,0.25)"
            multiline
          />
          <SeverityBar value={severity} onChange={setSeverity} />
          <View style={styles.urgDisplay}>
            <Text style={styles.urgTxt}>⚠ HIGH URGENCY</Text>
          </View>
        </View>

        {/* Fire button */}
        <Pressable
          style={({ pressed }) => [styles.fireBtn, firing && styles.fireBtnFiring, pressed && { transform: [{ scale: 0.98 }] }]}
          onPress={fireChain}
          disabled={firing}
        >
          <Text style={styles.fireBtnTxt}>
            {firing ? '● RUNNING AGENTS…' : result ? 'RUN AGAIN' : 'FIRE ALL 3 AGENTS'}
          </Text>
        </Pressable>

        {/* Error */}
        {!!error && (
          <View style={styles.errBox}>
            <Text style={styles.errTxt}>{error}</Text>
          </View>
        )}

        {/* Result */}
        {result && (
          <View style={styles.resultBox}>
            <View style={styles.resultHd}>
              <Text style={styles.resultTitle}>CHAIN COMPLETE</Text>
              <View style={[styles.escBadge, { backgroundColor: escBg }]}>
                <Text style={styles.escTxt}>{esc.replace('_', ' ').toUpperCase()}</Text>
              </View>
            </View>
            <View style={styles.resultBody}>
              <ResultSection title="Pattern Summary"      text={pat.pattern_summary      || 'Pattern analyzed.'} />
              <ResultSection title="Escalation Reason"   text={prep.escalation_reason   || 'Based on severity trend.'} />
              <ResultSection title="Concern Summary"     text={prep.concern_summary     || 'Patient logged escalating symptoms.'} />
              <Text style={styles.rSecTitle}>Questions for Your Doctor</Text>
              {(prep.suggested_questions || []).length === 0 ? (
                <Text style={styles.rText}>No questions generated.</Text>
              ) : (
                (prep.suggested_questions || []).map((q, i) => (
                  <View key={i} style={styles.rQ}>
                    <View style={styles.rQNum}><Text style={styles.rQNumTxt}>{i + 1}</Text></View>
                    <Text style={styles.rQTxt}>{q}</Text>
                  </View>
                ))
              )}
            </View>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

function ResultSection({ title, text }) {
  return (
    <View style={{ marginBottom: 12 }}>
      <Text style={styles.rSecTitle}>{title}</Text>
      <Text style={styles.rText}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.black },
  topBar:    { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingTop: 56, paddingBottom: 10 },
  topTitle:  { fontFamily: FONTS.display, fontSize: 32, color: C.white, letterSpacing: 1 },
  ibmBadge:  { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: 'rgba(212,43,43,0.15)', borderWidth: 1, borderColor: 'rgba(212,43,43,0.3)', borderRadius: 20, paddingVertical: 4, paddingHorizontal: 10 },
  ibmDot:    { width: 5, height: 5, borderRadius: 3, backgroundColor: C.red },
  ibmTxt:    { fontSize: 11, fontWeight: '700', letterSpacing: 1, textTransform: 'uppercase', color: C.red, fontFamily: FONTS.bodySemi },
  scroll:    { flex: 1, paddingHorizontal: 20 },

  demoHero:  { backgroundColor: 'rgba(212,43,43,0.08)', borderWidth: 1, borderColor: 'rgba(212,43,43,0.2)', borderRadius: 14, padding: 16, marginBottom: 14 },
  demoEye:   { fontSize: 11, fontWeight: '700', letterSpacing: 2, textTransform: 'uppercase', color: C.red, marginBottom: 6, fontFamily: FONTS.bodySemi },
  demoTitle: { fontFamily: FONTS.display, fontSize: 29, color: C.white, letterSpacing: 1, marginBottom: 4 },
  demoSub:   { fontSize: 12, color: 'rgba(255,255,255,0.35)', lineHeight: 20, fontFamily: FONTS.body },
  demoCode:  { fontSize: 11, backgroundColor: 'rgba(255,255,255,0.07)', color: C.red, fontFamily: 'monospace' },

  stepCard:   { flexDirection: 'row', gap: 10, alignItems: 'flex-start', padding: 12, paddingHorizontal: 14, borderWidth: 1, borderRadius: 8, marginBottom: 8 },
  stepCircle: { width: 26, height: 26, borderRadius: 13, alignItems: 'center', justifyContent: 'center' },
  stepNum:    { fontSize: 12, fontWeight: '700', fontFamily: FONTS.bodySemi },
  stepName:   { fontSize: 14, fontWeight: '600', marginBottom: 2, fontFamily: FONTS.bodySemi },
  stepDesc:   { fontSize: 11, fontFamily: FONTS.body },

  form:      { backgroundColor: 'rgba(255,255,255,0.04)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.07)', borderRadius: 14, padding: 16, marginBottom: 14, gap: 10 },
  formLabel: { fontSize: 10, fontWeight: '700', letterSpacing: 2, textTransform: 'uppercase', color: 'rgba(255,255,255,0.25)', fontFamily: FONTS.bodySemi },
  darkInput: { backgroundColor: 'rgba(255,255,255,0.06)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)', borderRadius: 5, paddingHorizontal: 12, paddingVertical: 10, fontSize: 14, color: 'rgba(255,255,255,0.85)', fontFamily: FONTS.body },
  sevLbl:    { fontSize: 12, color: 'rgba(255,255,255,0.35)', fontFamily: FONTS.body },
  sevSeg:    { flex: 1, height: 4, borderRadius: 2, backgroundColor: 'rgba(255,255,255,0.1)' },
  sevSegOn:  { backgroundColor: C.red },
  sevVal:    { fontFamily: FONTS.display, fontSize: 22, color: C.red, minWidth: 24, textAlign: 'center' },
  urgDisplay: { paddingVertical: 9, paddingHorizontal: 12, borderWidth: 1.5, borderColor: 'rgba(212,43,43,0.4)', backgroundColor: 'rgba(212,43,43,0.1)', borderRadius: 5, alignItems: 'center' },
  urgTxt:    { fontSize: 13, fontWeight: '700', color: C.red, textTransform: 'uppercase', letterSpacing: 1, fontFamily: FONTS.bodySemi },

  fireBtn:      { backgroundColor: C.red, borderRadius: 8, paddingVertical: 16, alignItems: 'center', marginBottom: 0 },
  fireBtnFiring:{ backgroundColor: C.redDark },
  fireBtnTxt:   { fontFamily: FONTS.display, fontSize: 22, letterSpacing: 2, color: C.white },

  errBox: { backgroundColor: 'rgba(212,43,43,0.08)', borderWidth: 1, borderColor: 'rgba(212,43,43,0.25)', borderRadius: 5, padding: 12, marginTop: 10 },
  errTxt: { fontSize: 13, color: 'rgba(255,150,150,0.9)', lineHeight: 20, fontFamily: FONTS.body },

  resultBox:   { backgroundColor: 'rgba(255,255,255,0.03)', borderWidth: 1, borderColor: 'rgba(212,43,43,0.25)', borderRadius: 14, overflow: 'hidden', marginTop: 14 },
  resultHd:    { backgroundColor: 'rgba(212,43,43,0.15)', padding: 10, paddingHorizontal: 14, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  resultTitle: { fontFamily: FONTS.display, fontSize: 16, color: C.white, letterSpacing: 1 },
  escBadge:    { borderRadius: 20, paddingVertical: 4, paddingHorizontal: 10 },
  escTxt:      { fontSize: 11, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1, color: C.white, fontFamily: FONTS.bodySemi },
  resultBody:  { padding: 14 },
  rSecTitle:   { fontSize: 10, fontWeight: '700', letterSpacing: 2, textTransform: 'uppercase', color: 'rgba(255,255,255,0.3)', marginBottom: 6, fontFamily: FONTS.bodySemi },
  rText:       { fontSize: 13, color: 'rgba(255,255,255,0.7)', lineHeight: 22, fontFamily: FONTS.body },
  rQ:          { flexDirection: 'row', gap: 8, paddingVertical: 7, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.06)' },
  rQNum:       { width: 18, height: 18, borderRadius: 9, backgroundColor: 'rgba(212,43,43,0.25)', alignItems: 'center', justifyContent: 'center', marginTop: 2 },
  rQNumTxt:    { fontSize: 10, fontWeight: '700', color: C.red, fontFamily: FONTS.bodySemi },
  rQTxt:       { flex: 1, fontSize: 13, color: 'rgba(255,255,255,0.65)', lineHeight: 22, fontFamily: FONTS.body },
});
