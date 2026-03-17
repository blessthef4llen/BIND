/**
 * app/auth.tsx — Login / Signup
 *
 * Self-contained: navigates directly to /(tabs) on success.
 * Does NOT rely on _layout.js redirect.
 */

import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, TextInput, Pressable, StyleSheet,
  StatusBar, KeyboardAvoidingView, Platform,
  Animated, Easing, ActivityIndicator, Alert,
} from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Path, Polyline } from 'react-native-svg';
import { Colors, FONTS, FontSize, Radius, Shadow } from '../constants/theme';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_BASE_URL } from '../services/api';

const TOKEN_KEY = 'pulse_auth_token';
const USER_KEY  = 'pulse_auth_user';

type Mode = 'login' | 'signup';

export default function AuthScreen() {
  const insets = useSafeAreaInsets();

  const [mode,     setMode]     = useState<Mode>('login');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState('');

  const logoOpacity = useRef(new Animated.Value(0)).current;
  const logoScale   = useRef(new Animated.Value(0.85)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(logoOpacity, { toValue: 1, duration: 500, useNativeDriver: true }),
      Animated.timing(logoScale,   { toValue: 1, duration: 500, easing: Easing.out(Easing.back(1.1)), useNativeDriver: true }),
    ]).start();
  }, []);

  function switchMode(m: Mode) {
    setError('');
    setPassword('');
    setMode(m);
  }

  async function handleSubmit() {
    const user = username.trim();
    if (!user || password.length < 4) {
      setError('Username and password (4+ characters) required.');
      return;
    }

    setLoading(true);
    setError('');

    const endpoint = mode === 'login'
      ? `${API_BASE_URL}/api/auth/login`
      : `${API_BASE_URL}/api/auth/signup`;

    try {
      const res = await fetch(endpoint, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ username: user, pin: password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.detail || (mode === 'login' ? 'Invalid username or password.' : 'Could not create account.'));
        setLoading(false);
        return;
      }

      // Save token and user to AsyncStorage
      await AsyncStorage.setItem(TOKEN_KEY, data.token);
      await AsyncStorage.setItem(USER_KEY, JSON.stringify({
        user_id:  data.user_id,
        username: data.username,
        token:    data.token,
      }));

      // Navigate directly — don't wait for _layout.js
      router.replace('/(tabs)');

    } catch {
      setError('Could not reach server. Make sure the backend is running.');
      setLoading(false);
    }
  }

  const canSubmit = username.trim().length >= 2 && password.length >= 4;

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

        {/* Mode toggle */}
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
          <Text style={s.label}>Username</Text>
          <TextInput
            style={s.input}
            value={username}
            onChangeText={t => { setUsername(t); setError(''); }}
            placeholder="e.g. alex_j"
            placeholderTextColor={Colors.darkTextFaint}
            autoCapitalize="none"
            autoCorrect={false}
            returnKeyType="next"
          />

          <Text style={[s.label, { marginTop: 16 }]}>Password</Text>
          <TextInput
            style={s.input}
            value={password}
            onChangeText={t => { setPassword(t); setError(''); }}
            placeholder="4+ characters"
            placeholderTextColor={Colors.darkTextFaint}
            secureTextEntry
            returnKeyType="done"
            onSubmitEditing={handleSubmit}
          />

          {mode === 'signup' && (
            <Text style={s.hint}>No email needed. Just a username and password.</Text>
          )}

          {!!error && (
            <View style={s.errorBox}>
              <Text style={s.errorTxt}>{error}</Text>
            </View>
          )}

          <Pressable
            style={[s.btn, (!canSubmit || loading) && s.btnDisabled]}
            onPress={handleSubmit}
            disabled={!canSubmit || loading}
          >
            {loading
              ? <ActivityIndicator color="#fff" />
              : <Text style={s.btnTxt}>{mode === 'login' ? 'SIGN IN' : 'CREATE ACCOUNT'}</Text>
            }
          </Pressable>
        </View>

        <Text style={s.footer}>Powered by IBM watsonx · Team BIND</Text>
      </View>
    </KeyboardAvoidingView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, paddingHorizontal: 28, justifyContent: 'space-between' },
  blob1: { position: 'absolute', top: -60, right: -60, width: 220, height: 220, borderRadius: 110, backgroundColor: 'rgba(201,64,64,0.12)' },
  blob2: { position: 'absolute', bottom: 40, left: -40, width: 160, height: 160, borderRadius: 80,  backgroundColor: 'rgba(201,64,64,0.07)' },

  logoWrap: { alignItems: 'center', gap: 6 },
  wordmark: { fontFamily: FONTS.display, fontSize: 52, letterSpacing: 6, color: Colors.white, lineHeight: 54 },
  tagline:  { fontFamily: FONTS.body, fontSize: FontSize.small, color: Colors.darkTextMuted },

  tabRow:       { flexDirection: 'row', backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: Radius.sm, padding: 3 },
  tab:          { flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: Radius.xs },
  tabActive:    { backgroundColor: Colors.red },
  tabTxt:       { fontFamily: FONTS.body, fontSize: FontSize.body, color: Colors.darkTextMuted },
  tabTxtActive: { fontFamily: FONTS.bodySemi, color: Colors.white },

  form:  { gap: 0 },
  label: { fontFamily: FONTS.bodySemi, fontSize: FontSize.tiny, color: Colors.darkTextMuted, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 7 },
  input: {
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.14)',
    borderRadius: Radius.xs, paddingHorizontal: 14, paddingVertical: 13,
    fontFamily: FONTS.body, fontSize: FontSize.body, color: Colors.white,
  },
  hint: { fontFamily: FONTS.body, fontSize: FontSize.small, color: Colors.darkTextFaint, marginTop: 8 },

  errorBox: { backgroundColor: 'rgba(201,64,64,0.18)', borderRadius: Radius.xs, padding: 11, marginTop: 12, borderWidth: 1, borderColor: 'rgba(201,64,64,0.35)' },
  errorTxt: { fontFamily: FONTS.body, fontSize: FontSize.small, color: '#ffaaaa' },

  btn:         { backgroundColor: Colors.red, borderRadius: Radius.sm, paddingVertical: 15, alignItems: 'center', marginTop: 22, minHeight: 52, justifyContent: 'center', ...Shadow.lg },
  btnDisabled: { opacity: 0.4 },
  btnTxt:      { fontFamily: FONTS.display, fontSize: 22, letterSpacing: 2.5, color: Colors.white },

  footer: { fontFamily: FONTS.body, fontSize: FontSize.micro, color: 'rgba(255,255,255,0.18)', textAlign: 'center' },
});