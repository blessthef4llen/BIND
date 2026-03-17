/**
 * app/index.js — PULSE Splash / Entry
 *
 * Mission-centered redesign. Warm red/white/charcoal brand.
 * Animated ECG heartbeat logo with soft pulse effect.
 */

import { useEffect, useRef } from 'react';
import {
  View, Text, Pressable, StyleSheet, StatusBar,
  Animated, Easing, Dimensions,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Polyline, Path, Circle, Defs, LinearGradient, Stop } from 'react-native-svg';
import { Colors, FONTS, FontSize, Radius, Shadow } from '../constants/theme';

const { width } = Dimensions.get('window');

// ── Animated ECG + Heart logo ────────────────────────────────────────────────

function PulseLogo() {
  const pulse   = useRef(new Animated.Value(1)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  const slideY  = useRef(new Animated.Value(12)).current;

  useEffect(() => {
    // Entrance
    Animated.parallel([
      Animated.timing(opacity, { toValue: 1, duration: 700, useNativeDriver: true }),
      Animated.timing(slideY,  { toValue: 0, duration: 700, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
    ]).start();

    // Pulse loop
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1.04, duration: 800, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 1.00, duration: 800, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
      ])
    ).start();
  }, []);

  return (
    <Animated.View style={{ opacity, transform: [{ translateY: slideY }, { scale: pulse }] }}>
      <Svg viewBox="0 0 320 100" width={width * 0.72} height={(width * 0.72) * 0.31}>
        {/* ECG left */}
        <Polyline
          points="0,50 28,50 38,50 46,22 56,78 64,8 74,78 82,50 100,50"
          stroke={Colors.red}
          strokeWidth="2.8"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
        />
        {/* Heart */}
        <Path
          d="M138,36 C138,29 145,23 153,27 C155,28 157,30 158,33 C159,30 161,28 163,27 C171,23 178,29 178,36 C178,43 171,51 158,61 C145,51 138,43 138,36Z"
          stroke={Colors.red}
          strokeWidth="2.8"
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        {/* ECG right */}
        <Polyline
          points="188,50 206,50 214,22 224,78 232,8 242,78 250,50 268,50 320,50"
          stroke={Colors.red}
          strokeWidth="2.8"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
        />
      </Svg>
    </Animated.View>
  );
}

// ── Feature row ───────────────────────────────────────────────────────────────

function FeatureRow({ emoji, text, delay }) {
  const anim = useRef(new Animated.Value(0)).current;
  const slide = useRef(new Animated.Value(16)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(anim,  { toValue: 1, duration: 500, delay, useNativeDriver: true }),
      Animated.timing(slide, { toValue: 0, duration: 500, delay, easing: Easing.out(Easing.quad), useNativeDriver: true }),
    ]).start();
  }, []);

  return (
    <Animated.View style={[styles.featureRow, { opacity: anim, transform: [{ translateY: slide }] }]}>
      <Text style={styles.featureEmoji}>{emoji}</Text>
      <Text style={styles.featureText}>{text}</Text>
    </Animated.View>
  );
}

// ── Screen ────────────────────────────────────────────────────────────────────

export default function SplashScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const btnAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(btnAnim, {
      toValue: 1, duration: 600, delay: 900,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, []);

  return (
    <View style={[styles.container, { paddingTop: insets.top, paddingBottom: insets.bottom + 16 }]}>
      <StatusBar barStyle="light-content" backgroundColor={Colors.black} />

      {/* Soft background circles */}
      <View style={styles.bgCircle1} />
      <View style={styles.bgCircle2} />

      {/* Logo */}
      <View style={styles.logoSection}>
        <PulseLogo />
        <Text style={styles.wordmark}>PULSE</Text>
        <Text style={styles.tagline}>
          Your health, remembered.{'\n'}Built for young adults.
        </Text>
      </View>

      {/* Mission statement */}
      <View style={styles.missionBox}>
        <Text style={styles.missionText}>
          When you turn 18, navigating healthcare gets complicated.{' '}
          <Text style={styles.missionBold}>Pulse helps you track symptoms, prepare for appointments, and understand your health records.</Text>
        </Text>
      </View>

      {/* Features */}
      <View style={styles.features}>
        <FeatureRow emoji="🩺" text="Log symptoms and get AI-powered visit prep" delay={400} />
        <FeatureRow emoji="📋" text="Upload doctor notes and extract key info"    delay={550} />
        <FeatureRow emoji="📅" text="Build a health timeline you actually own"     delay={700} />
      </View>

      {/* CTA */}
      <Animated.View style={{ opacity: btnAnim, transform: [{ translateY: btnAnim.interpolate({ inputRange:[0,1], outputRange:[12,0] }) }] }}>
        <Pressable
          style={({ pressed }) => [styles.btn, pressed && styles.btnPressed]}
          onPress={() => router.replace('/auth')}
        >
          <Text style={styles.btnText}>GET STARTED</Text>
        </Pressable>

        <Text style={styles.disclaimer}>
          Pulse does not diagnose. We help you organize, prepare, and advocate for yourself.
        </Text>

        <Text style={styles.ibmBadge}>Powered by IBM watsonx · IBM Granite</Text>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.black,
    paddingHorizontal: 28,
    justifyContent: 'space-between',
    overflow: 'hidden',
  },

  // Background decoration
  bgCircle1: {
    position: 'absolute', top: -80, right: -80,
    width: 280, height: 280, borderRadius: 140,
    backgroundColor: 'rgba(201,64,64,0.10)',
  },
  bgCircle2: {
    position: 'absolute', bottom: 40, left: -60,
    width: 200, height: 200, borderRadius: 100,
    backgroundColor: 'rgba(201,64,64,0.06)',
  },

  // Logo block
  logoSection: {
    alignItems: 'center',
    paddingTop: 24,
    gap: 10,
  },
  wordmark: {
    fontFamily: FONTS.display,
    fontSize: 72,
    letterSpacing: 8,
    color: Colors.white,
    lineHeight: 72,
    marginTop: 4,
  },
  tagline: {
    fontFamily: FONTS.body,
    fontSize: FontSize.small,
    color: 'rgba(255,255,255,0.40)',
    textAlign: 'center',
    letterSpacing: 0.6,
    lineHeight: 20,
  },

  // Mission
  missionBox: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    padding: 16,
  },
  missionText: {
    fontFamily: FONTS.body,
    fontSize: FontSize.body,
    color: 'rgba(255,255,255,0.55)',
    lineHeight: 22,
    textAlign: 'center',
  },
  missionBold: {
    color: 'rgba(255,255,255,0.82)',
    fontFamily: FONTS.bodySemi,
  },

  // Features
  features: { gap: 8 },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 11,
    paddingHorizontal: 14,
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderRadius: Radius.sm,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.07)',
  },
  featureEmoji: { fontSize: 18 },
  featureText: {
    flex: 1,
    fontFamily: FONTS.body,
    fontSize: FontSize.body,
    color: 'rgba(255,255,255,0.75)',
    lineHeight: 20,
  },

  // Button
  btn: {
    backgroundColor: Colors.red,
    borderRadius: Radius.sm,
    paddingVertical: 16,
    alignItems: 'center',
    ...Shadow.lg,
  },
  btnPressed: {
    backgroundColor: Colors.redDark,
    transform: [{ scale: 0.98 }],
  },
  btnText: {
    fontFamily: FONTS.display,
    fontSize: 24,
    letterSpacing: 3,
    color: Colors.white,
  },

  disclaimer: {
    fontFamily: FONTS.body,
    fontSize: FontSize.tiny,
    color: 'rgba(255,255,255,0.22)',
    textAlign: 'center',
    marginTop: 12,
    lineHeight: 17,
  },
  ibmBadge: {
    fontFamily: FONTS.body,
    fontSize: FontSize.micro,
    color: 'rgba(255,255,255,0.16)',
    textAlign: 'center',
    marginTop: 6,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
});