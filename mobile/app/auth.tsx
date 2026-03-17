/**
 * app/auth.tsx — Login / Signup screen
 *
 * Hackathon-grade auth: username + 4-digit PIN.
 * Fast to demo, shows we took user isolation seriously.
 * Warm red/white/charcoal brand.
 */

import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, TextInput, Pressable, StyleSheet,
  StatusBar, KeyboardAvoidingView, Platform,
  Animated, Easing, ActivityIndicator,
} from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Path, Polyline } from 'react-native-svg';
import { Colors, FONTS, FontSize, Radius, Shadow } from '../constants/theme';
import { useAuth } from '../hooks/useAuth';

type Mode = 'login' | 'signup';

export default function AuthScreen() {
  const insets = useSafeAreaInsets();
  const { login, signup, loading, error, clearError } = useAuth();

  const [mode,     setMode]     = useState<Mode>('login');
  const [username, setUsername] = useState('');
  const [pin,      setPin]      = useState('');

  const slideAnim = useRef(new Animated.Value(0)).current;
  const logoScale = useRef(new Animated.Value(0.8)).current;
  const logoOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(logoScale,   { toValue: 1, duration: 600, easing: Easing.out(Easing.back(1.2)), useNativeDriver: true }),
      Animated.timing(logoOpacity, { toValue: 1, duration: 500, useNativeDriver: true }),
    ]).start();
  }, []);

  function switchMode(m: Mode) {
    clearError();
    setPin('');
    setMode(m);
    Animated.timing(slideAnim, {
      toValue: m === 'signup' ? 1 : 0, duration: 250,
      easing: Easing.out(Easing.quad), useNativeDriver: true,
    }).start();
  }

  async function handleSubmit() {
    if (!username.trim() || pin.length < 4) return;
    const ok = mode === 'login'
      ? await login(username.trim(), pin)
      : await signup(username.trim(), pin);

    if (ok) router.replace('/(tabs)');
  }

  const isReady = username.trim().length >= 2 && pin.length >= 4;

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: Colors.black }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <StatusBar barStyle="light-content" />

      {/* Background blobs */}
      <View style={s.blob1} />
      <View style={s.blob2} />

      <View style={[s.container, { paddingTop: insets.top + 32, paddingBottom: insets.bottom + 24 }]}>

        {/* Logo */}
        <Animated.View style={[s.logoWrap, { opacity: logoOpacity, transform: [{ scale: logoScale }] }]}>
          <Svg viewBox="0 0 240 72" width={200} height={60}>
            <Polyline
              points="0,36 20,36 28,36 34,16 42,56 48,6 54,56 60,36 72,36"
              stroke={Colors.red} strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" fill="none"
            />
            <Path
              d="M100,26 C100,20 107,15 114,18 C116,19 118,21 119,24 C120,21 122,19 124,18 C131,15 138,20 138,26 C138,32 131,40 119,50 C107,40 100,32 100,26Z"
              stroke={Colors.red} strokeWidth={2.5} fill="none" strokeLinecap="round" strokeLinejoin="round"
            />
            <Polyline
              points="148,36 160,36 166,16 172,56 178,8 184,56 190,36 200,36 220,36 240,36"
              stroke={Colors.red} strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" fill="none"
            />
          </Svg>
          <Text style={s.wordmark}>PULSE</Text>
          <Text style={s.tagline}>Your health, remembered.</Text>
        </Animated.View>

        {/* Tab switcher */}
        <View style={s.tabRow}>
          <Pressable style={[s.tab, mode === 'login' && s.tabActive]} onPress={() => switchMode('login')}>
            <Text style={[s.tabTxt, mode === 'login' && s.tabTxtActive]}>Sign In</Text>
          </Pressable>
          <Pressable style={[s.tab, mode === 'signup' && s.tabActive]} onPress={() => switchMode('signup')}>
            <Text style={[s.tabTxt, mode === 'signup' && s.tabTxtActive]}>Create Account</Text>
          </Pressable>
        </View>

        {/* Form */}
        <View style={s.form}>
          <Text style={s.fieldLabel}>Username</Text>
          <TextInput
            style={s.input}
            value={username}
            onChangeText={t => { setUsername(t); clearError(); }}
            placeholder="e.g. alex_j"
            placeholderTextColor={Colors.darkTextFaint}
            autoCapitalize="none"
            autoCorrect={false}
            returnKeyType="next"
          />

          <Text style={[s.fieldLabel, { marginTop: 14 }]}>
            {mode === 'signup' ? 'Password' : 'Password'}
          </Text>
          <TextInput
            style={s.input}
            value={pin}
            onChangeText={t => { setPin(t); clearError(); }}
            placeholder="••••••••"
            placeholderTextColor={Colors.darkTextFaint}
            secureTextEntry
            maxLength={20}
            returnKeyType="done"
            onSubmitEditing={handleSubmit}
          />

          {mode === 'signup' && (
            <Text style={s.hint}>
              Choose a username and password. No email needed.
            </Text>
          )}

          {error ? (
            <View style={s.errorBox}>
              <Text style={s.errorTxt}>{error}</Text>
            </View>
          ) : null}

          <Pressable
            style={({ pressed }) => [s.submitBtn, !isReady && s.submitDisabled, pressed && isReady && { opacity: 0.85 }]}
            onPress={handleSubmit}
            disabled={!isReady || loading}
          >
            {loading
              ? <ActivityIndicator color={Colors.white} />
              : <Text style={s.submitTxt}>{mode === 'login' ? 'SIGN IN' : 'CREATE ACCOUNT'}</Text>
            }
          </Pressable>
        </View>

        {/* IBM badge */}
        <Text style={s.ibmBadge}>Powered by IBM watsonx · IBM Granite · Team BIND</Text>
        <Text style={s.disclaimer}>Pulse does not diagnose. Data stays on your device.</Text>
      </View>
    </KeyboardAvoidingView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, paddingHorizontal: 28, justifyContent: 'space-between' },
  blob1: { position: 'absolute', top: -60, right: -60, width: 240, height: 240, borderRadius: 120, backgroundColor: 'rgba(201,64,64,0.12)' },
  blob2: { position: 'absolute', bottom: 40, left: -40, width: 160, height: 160, borderRadius: 80, backgroundColor: 'rgba(201,64,64,0.07)' },

  logoWrap:  { alignItems: 'center', gap: 6 },
  wordmark:  { fontFamily: FONTS.display, fontSize: 56, letterSpacing: 6, color: Colors.white, lineHeight: 56 },
  tagline:   { fontFamily: FONTS.body, fontSize: FontSize.small, color: Colors.darkTextMuted, letterSpacing: 0.5 },

  tabRow:      { flexDirection: 'row', backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: Radius.sm, padding: 3 },
  tab:         { flex: 1, paddingVertical: 9, alignItems: 'center', borderRadius: Radius.xs },
  tabActive:   { backgroundColor: Colors.red },
  tabTxt:      { fontFamily: FONTS.body, fontSize: FontSize.body, color: Colors.darkTextMuted },
  tabTxtActive:{ fontFamily: FONTS.bodySemi, color: Colors.white },

  form: { gap: 0 },
  fieldLabel: { fontFamily: FONTS.bodySemi, fontSize: FontSize.tiny, color: Colors.darkTextMuted, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 6 },
  input: {
    backgroundColor: 'rgba(255,255,255,0.07)', borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.12)',
    borderRadius: Radius.xs, paddingHorizontal: 14, paddingVertical: 12,
    fontFamily: FONTS.body, fontSize: FontSize.body, color: Colors.white,
  },
  hint: { fontFamily: FONTS.body, fontSize: FontSize.small, color: Colors.darkTextFaint, marginTop: 6, lineHeight: 18 },

  errorBox: { backgroundColor: 'rgba(201,64,64,0.15)', borderRadius: Radius.xs, padding: 10, marginTop: 10, borderWidth: 1, borderColor: 'rgba(201,64,64,0.3)' },
  errorTxt: { fontFamily: FONTS.body, fontSize: FontSize.small, color: Colors.redMid },

  submitBtn:      { backgroundColor: Colors.red, borderRadius: Radius.sm, paddingVertical: 15, alignItems: 'center', marginTop: 20, ...Shadow.lg },
  submitDisabled: { backgroundColor: 'rgba(201,64,64,0.35)' },
  submitTxt:      { fontFamily: FONTS.display, fontSize: 22, letterSpacing: 2.5, color: Colors.white },

  ibmBadge:   { fontFamily: FONTS.body, fontSize: FontSize.micro, color: 'rgba(255,255,255,0.18)', textAlign: 'center', letterSpacing: 1 },
  disclaimer: { fontFamily: FONTS.body, fontSize: FontSize.micro, color: 'rgba(255,255,255,0.14)', textAlign: 'center', marginTop: 3 },
});