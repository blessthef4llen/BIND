/**
 * app/loading.tsx — AI Processing loading screen
 *
 * Redesigned with soft red/white/charcoal brand.
 * Animated wave-pulse instead of generic spinner.
 * Shows 3-step agent progress.
 */

import React, { useEffect, useRef } from 'react';
import { View, Text, Animated, Easing, StyleSheet } from 'react-native';
import Svg, { Circle, Path, Polyline } from 'react-native-svg';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors, FONTS, FontSize, Radius } from '../constants/theme';

const STEPS = [
  { label: 'Reading your concern history',      done: true  },
  { label: 'Detecting symptom patterns',         done: true  },
  { label: 'Generating visit prep report…',      done: false },
];

// ── Heartbeat SVG animation ───────────────────────────────────────────────────
function HeartbeatIcon() {
  const progress = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.timing(progress, {
        toValue: 1, duration: 1800,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    ).start();
  }, []);

  // Subtle scale on the whole icon
  const scale = progress.interpolate({ inputRange: [0, 0.5, 1], outputRange: [1, 1.06, 1] });

  return (
    <Animated.View style={{ transform: [{ scale }] }}>
      <Svg width={64} height={64} viewBox="0 0 64 64">
        {/* Circle background */}
        <Circle cx={32} cy={32} r={30} fill={Colors.redLight} />
        {/* ECG line */}
        <Polyline
          points="8,32 16,32 20,20 24,44 28,14 32,44 36,32 44,32 56,32"
          stroke={Colors.red}
          strokeWidth={2.4}
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
        />
      </Svg>
    </Animated.View>
  );
}

// ── Pulsing dots ──────────────────────────────────────────────────────────────
function PulseDot({ delay }: { delay: number }) {
  const anim = useRef(new Animated.Value(0.3)).current;
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.delay(delay),
        Animated.timing(anim, { toValue: 1,   duration: 350, useNativeDriver: true }),
        Animated.timing(anim, { toValue: 0.3, duration: 350, useNativeDriver: true }),
        Animated.delay(600 - delay),
      ])
    ).start();
  }, []);
  return <Animated.View style={[pd.dot, { opacity: anim }]} />;
}
const pd = StyleSheet.create({ dot: { width:8, height:8, borderRadius:4, backgroundColor: Colors.red } });

// ── Step row ──────────────────────────────────────────────────────────────────
function StepRow({ label, done, isLast }: { label: string; done: boolean; isLast?: boolean }) {
  return (
    <View style={[sr.row, !isLast && sr.divider]}>
      <View style={[sr.iconWrap, done ? sr.done : sr.pending]}>
        {done ? (
          <Svg width={12} height={12} viewBox="0 0 12 12">
            <Path d="M2 6l3 3 5-5" stroke={Colors.white} strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round" fill="none" />
          </Svg>
        ) : (
          <View style={sr.spinner} />
        )}
      </View>
      <Text style={[sr.label, done ? sr.labelDone : sr.labelPending]}>{label}</Text>
    </View>
  );
}
const sr = StyleSheet.create({
  row:         { flexDirection:'row', alignItems:'center', gap:12, paddingVertical:12 },
  divider:     { borderBottomWidth:1, borderBottomColor: Colors.border },
  iconWrap:    { width:24, height:24, borderRadius:12, alignItems:'center', justifyContent:'center' },
  done:        { backgroundColor: Colors.ok },
  pending:     { backgroundColor: Colors.surface2, borderWidth:1.5, borderColor: Colors.borderStrong },
  spinner:     { width:8, height:8, borderRadius:4, backgroundColor: Colors.red },
  label:       { flex:1, fontFamily: FONTS.body, fontSize: FontSize.body },
  labelDone:   { color: Colors.text },
  labelPending:{ color: Colors.textMuted },
});

// ── Screen ────────────────────────────────────────────────────────────────────
export default function LoadingScreen() {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.root, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>

      {/* Soft background accent */}
      <View style={styles.bgBlob} />

      <View style={styles.center}>
        <HeartbeatIcon />

        <Text style={styles.title}>Analyzing your data</Text>
        <Text style={styles.subtitle}>
          IBM Granite is running autonomously — detecting patterns, assessing urgency, and preparing your visit summary.
        </Text>

        {/* Pulsing dots */}
        <View style={styles.dots}>
          <PulseDot delay={0}   />
          <PulseDot delay={200} />
          <PulseDot delay={400} />
        </View>

        {/* Steps */}
        <View style={styles.stepsCard}>
          {STEPS.map((step, i) => (
            <StepRow
              key={i}
              label={step.label}
              done={step.done}
              isLast={i === STEPS.length - 1}
            />
          ))}
        </View>

        <Text style={styles.footer}>Powered by IBM Granite · Pulse does not diagnose</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex:1,
    backgroundColor: Colors.offWhite,
    alignItems:'center',
    justifyContent:'center',
  },
  bgBlob: {
    position:'absolute',
    top: -100, right: -100,
    width: 300, height: 300,
    borderRadius: 150,
    backgroundColor: Colors.redLight,
    opacity: 0.5,
  },
  center: {
    alignItems:'center',
    paddingHorizontal:32,
    gap:12,
    width:'100%',
  },
  title:    { fontFamily: FONTS.display, fontSize:30, color: Colors.black, textAlign:'center', letterSpacing:0.5, marginTop:8 },
  subtitle: { fontFamily: FONTS.body, fontSize: FontSize.body, color: Colors.textMuted, textAlign:'center', lineHeight:21 },
  dots:     { flexDirection:'row', gap:8, paddingVertical:4 },
  stepsCard:{ width:'100%', backgroundColor: Colors.surface, borderRadius: Radius.md, paddingHorizontal:16, borderWidth:1, borderColor: Colors.border, marginTop:8 },
  footer:   { fontFamily: FONTS.body, fontSize: FontSize.tiny, color: Colors.textFaint, textAlign:'center', marginTop:8 },
});