// app/loading.tsx — Screen 10: AI Processing loading state
// Auto-navigates away when API call resolves (managed via shared state or params)
import React, { useEffect, useRef } from 'react';
import { View, Text, Animated, StyleSheet } from 'react-native';
import Svg, { Circle, Path } from 'react-native-svg';
import { Colors, Fonts, FontSize, Radius } from '../constants/theme';
import PulseDots from '../components/ui/PulseDots';

const STEPS = [
  { label: 'Reading check-in history',     done: true },
  { label: 'Identifying symptom patterns', done: true },
  { label: 'Generating visit prep report...', done: false },
];

function SpinnerCircle() {
  const rotation = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.timing(rotation, {
        toValue: 1,
        duration: 1500,
        useNativeDriver: true,
      })
    ).start();
  }, []);

  const rotate = rotation.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  return (
    <Animated.View style={{ transform: [{ rotate }] }}>
      <Svg width={72} height={72} viewBox="0 0 72 72">
        {/* Track */}
        <Circle
          cx={36} cy={36} r={30}
          fill="none"
          stroke={Colors.tealLight}
          strokeWidth={5}
        />
        {/* Spinner arc */}
        <Circle
          cx={36} cy={36} r={30}
          fill="none"
          stroke={Colors.teal}
          strokeWidth={5}
          strokeDasharray="47 141"
          strokeLinecap="round"
          strokeDashoffset={0}
        />
      </Svg>
    </Animated.View>
  );
}

export default function LoadingScreen() {
  return (
    <View style={styles.root}>
      <View style={styles.center}>
        {/* Spinner */}
        <View style={styles.spinnerWrap}>
          <SpinnerCircle />
        </View>

        <Text style={styles.title}>Analyzing your data</Text>
        <Text style={styles.subtitle}>
          Three IBM watsonx agents are running autonomously — detecting patterns,
          assessing urgency, and preparing your visit summary.
        </Text>

        <PulseDots />

        {/* Step progress */}
        <View style={styles.steps}>
          {STEPS.map((step, i) => (
            <View
              key={i}
              style={[styles.step, step.done ? styles.stepDone : styles.stepInProgress]}
            >
              {step.done ? (
                <Svg width={14} height={14} viewBox="0 0 14 14">
                  <Circle cx={7} cy={7} r={6} fill={Colors.teal} />
                  <Path
                    d="M4.5 7l2 2 3.5-3.5"
                    stroke="#fff"
                    strokeWidth={1.5}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    fill="none"
                  />
                </Svg>
              ) : (
                <View style={styles.stepDot} />
              )}
              <Text style={[styles.stepLabel, !step.done && styles.stepLabelMuted]}>
                {step.label}
              </Text>
            </View>
          ))}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: Colors.bg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  center: {
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  spinnerWrap: {
    width: 72,
    height: 72,
    marginBottom: 20,
  },
  title: {
    fontFamily: Fonts.serif,
    fontSize: 22,
    color: Colors.text,
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontFamily: Fonts.sans,
    fontSize: FontSize.small + 1,
    color: Colors.textMuted,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 4,
  },
  steps: {
    width: '100%',
    marginTop: 24,
    gap: 8,
  },
  step: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: Radius.xs,
  },
  stepDone: {
    backgroundColor: Colors.tealLight,
  },
  stepInProgress: {
    backgroundColor: Colors.surface2,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  stepDot: {
    width: 8, height: 8,
    borderRadius: 4,
    backgroundColor: Colors.tealMid,
  },
  stepLabel: {
    fontFamily: Fonts.sansMedium,
    fontSize: FontSize.small,
    color: Colors.tealDark,
    flex: 1,
  },
  stepLabelMuted: {
    color: Colors.textMuted,
    fontFamily: Fonts.sans,
  },
});
