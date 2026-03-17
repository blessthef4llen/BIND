// app/onboarding.tsx — Screen 01: Onboarding / Splash
import React from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet, Dimensions,
} from 'react-native';
import { router } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Svg, { Circle, Path } from 'react-native-svg';
import { Colors, Fonts, FontSize, Radius } from '../constants/theme';
import { PrimaryButton } from '../components/ui/PrimaryButton';

const { width } = Dimensions.get('window');

const FEATURES = [
  {
    icon: (
      <Svg width={16} height={16} viewBox="0 0 16 16">
        <Path d="M3 8h10M8 3v10" stroke={Colors.teal} strokeWidth={2} strokeLinecap="round" />
      </Svg>
    ),
    title: 'Log symptoms fast',
    subtitle: 'Takes under 30 seconds',
  },
  {
    icon: (
      <Svg width={16} height={16} viewBox="0 0 16 16">
        <Path d="M2 12V5a1 1 0 011-1h10a1 1 0 011 1v7M5 4V3a1 1 0 011-1h4a1 1 0 011 1v1" stroke={Colors.teal} strokeWidth={1.5} fill="none" />
        <Path d="M5 9h6M5 11h4" stroke={Colors.teal} strokeWidth={1.5} strokeLinecap="round" />
      </Svg>
    ),
    title: 'AI visit prep',
    subtitle: 'Smart questions for your doctor',
  },
  {
    icon: (
      <Svg width={16} height={16} viewBox="0 0 16 16">
        <Circle cx={8} cy={8} r={6} stroke={Colors.teal} strokeWidth={1.5} fill="none" />
        <Path d="M8 5v4l2 2" stroke={Colors.teal} strokeWidth={1.5} strokeLinecap="round" />
      </Svg>
    ),
    title: 'Health timeline',
    subtitle: 'Your complete medical history',
  },
];

async function handleGetStarted() {
  try {
    await AsyncStorage.setItem('onboarding_complete', 'true');
  } catch {}
  router.replace('/(tabs)/home');
}

export default function OnboardingScreen() {
  return (
    <ScrollView style={styles.root} bounces={false} showsVerticalScrollIndicator={false}>
      {/* Dark hero section */}
      <View style={styles.hero}>
        {/* Decorative circles */}
        <View style={styles.circle1} />
        <View style={styles.circle2} />

        {/* PULSE logo mark */}
        <Svg width={56} height={56} viewBox="0 0 56 56" style={styles.logoMark}>
          <Circle cx={28} cy={28} r={28} fill="rgba(29,158,117,0.2)" />
          <Circle cx={28} cy={28} r={20} fill="rgba(29,158,117,0.3)" />
          <Path
            d="M28 16 L28 40 M16 28 L40 28"
            stroke={Colors.tealMid}
            strokeWidth={3.5}
            strokeLinecap="round"
          />
        </Svg>

        <Text style={styles.headline}>
          {'Your health,\n'}
          <Text style={styles.headlineAccent}>remembered.</Text>
        </Text>
        <Text style={styles.subtitle}>
          Never forget a symptom or question before your next doctor visit.
        </Text>
      </View>

      {/* Bottom content */}
      <View style={styles.body}>
        {/* Progress dots */}
        <View style={styles.dotRow}>
          <View style={[styles.dot, styles.dotActive]} />
          <View style={styles.dot} />
          <View style={styles.dot} />
        </View>

        {/* Feature rows */}
        <View style={styles.featureList}>
          {FEATURES.map((f, i) => (
            <View key={i} style={styles.featureRow}>
              <View style={styles.featureIcon}>
                {f.icon}
              </View>
              <View style={styles.featureText}>
                <Text style={styles.featureTitle}>{f.title}</Text>
                <Text style={styles.featureSub}>{f.subtitle}</Text>
              </View>
            </View>
          ))}
        </View>

        <PrimaryButton label="Get Started" onPress={handleGetStarted} />

        <TouchableOpacity style={styles.signInRow} onPress={() => {}}>
          <Text style={styles.signInText}>
            {'Already have an account? '}
            <Text style={styles.signInLink}>Sign in</Text>
          </Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: Colors.bg,
  },
  hero: {
    backgroundColor: '#0D2E1F',
    minHeight: 320,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
    paddingBottom: 48,
    position: 'relative',
    overflow: 'hidden',
  },
  circle1: {
    position: 'absolute',
    top: -40,
    right: -40,
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: 'rgba(29,158,117,0.12)',
  },
  circle2: {
    position: 'absolute',
    bottom: 10,
    left: -30,
    width: 130,
    height: 130,
    borderRadius: 65,
    backgroundColor: 'rgba(29,158,117,0.08)',
  },
  logoMark: {
    marginBottom: 16,
  },
  headline: {
    fontFamily: Fonts.serif,
    fontSize: 38,
    color: '#fff',
    textAlign: 'center',
    lineHeight: 44,
    marginBottom: 10,
  },
  headlineAccent: {
    color: Colors.tealMid,
  },
  subtitle: {
    fontFamily: Fonts.sansLight,
    fontSize: FontSize.small + 1,
    color: 'rgba(255,255,255,0.55)',
    textAlign: 'center',
    lineHeight: 22,
    maxWidth: 240,
  },
  body: {
    backgroundColor: Colors.bg,
    padding: 24,
    paddingTop: 28,
  },
  dotRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 6,
    marginBottom: 28,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.borderStrong,
  },
  dotActive: {
    width: 18,
    borderRadius: 3,
    backgroundColor: Colors.teal,
  },
  featureList: {
    gap: 6,
    marginBottom: 20,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    padding: 12,
    backgroundColor: Colors.surface2,
    borderRadius: Radius.sm,
  },
  featureIcon: {
    width: 32,
    height: 32,
    backgroundColor: Colors.tealLight,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  featureText: {
    flex: 1,
  },
  featureTitle: {
    fontFamily: Fonts.sansMedium,
    fontSize: FontSize.small + 1,
    color: Colors.text,
    marginBottom: 2,
  },
  featureSub: {
    fontFamily: Fonts.sans,
    fontSize: FontSize.small,
    color: Colors.textMuted,
  },
  signInRow: {
    alignItems: 'center',
    marginTop: 12,
  },
  signInText: {
    fontFamily: Fonts.sans,
    fontSize: FontSize.small,
    color: Colors.textFaint,
  },
  signInLink: {
    color: Colors.teal,
  },
});
