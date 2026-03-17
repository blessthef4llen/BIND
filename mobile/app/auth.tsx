/**
 * app/auth.tsx — Login / Signup
 * Self-contained auth. Saves token directly, navigates on success.
 */

import React, { useState, useEffect } from 'react';
import {
  View, Text, TextInput, Pressable, StyleSheet,
  StatusBar, KeyboardAvoidingView, Platform,
  ActivityIndicator, ScrollView, TouchableOpacity,
} from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_BASE_URL } from '../services/api';
import { Colors, FONTS, FontSize, Radius, Shadow } from '../constants/theme';

const TOKEN_KEY = 'pulse_auth_token';
const USER_KEY  = 'pulse_auth_user';

type Mode = 'login' | 'signup';

export default function AuthScreen() {
  const insets = useSafeAreaInsets();
  const [mode,      setMode]      = useState<Mode>('login');
  const [username,  setUsername]  = useState('');
  const [password,  setPassword]  = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName,  setLastName]  = useState('');
  const [loading,   setLoading]   = useState(false);
  const [error,     setError]     = useState('');

  // If already logged in, skip straight to tabs
  useEffect(() => {
    AsyncStorage.getItem(TOKEN_KEY).then(token => {
      if (token) router.replace('/(tabs)');
    });
  }, []);

  function switchMode(m: Mode) {
    setError('');
    setPassword('');
    setMode(m);
  }

  async function handleSubmit() {
    const user = username.trim();
    if (!user || password.length < 4) {
      setError('Username and password (4+ characters) are required.');
      return;
    }
    if (mode === 'signup') {
      if (!firstName.trim()) { setError('First name is required.'); return; }
    }

    setLoading(true);
    setError('');

    const endpoint = mode === 'login'
      ? `${API_BASE_URL}/api/auth/login`
      : `${API_BASE_URL}/api/auth/signup`;

    try {
      const res  = await fetch(endpoint, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ username: user, pin: password }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.detail || (mode === 'login'
          ? 'Incorrect username or password.'
          : 'Could not create account. Username may already be taken.'));
        setLoading(false);
        return;
      }

      await AsyncStorage.setItem(TOKEN_KEY, data.token);
      await AsyncStorage.setItem(USER_KEY, JSON.stringify({
        user_id:    data.user_id,
        username:   data.username,
        first_name: firstName.trim(),
        token:      data.token,
      }));

      router.replace('/(tabs)');

    } catch {
      setError('Cannot reach server. Make sure the backend is running on port 8000.');
      setLoading(false);
    }
  }

  const canSubmit = username.trim().length >= 2 && password.length >= 4
    && (mode === 'login' || firstName.trim().length >= 1);

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: '#1C1C1E' }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <StatusBar barStyle="light-content" />
      <ScrollView
        contentContainerStyle={[s.scroll, { paddingTop: insets.top + 40, paddingBottom: insets.bottom + 32 }]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Logo */}
        <View style={s.logoBlock}>
          <Text style={s.wordmark}>PULSE</Text>
          <Text style={s.tagline}>Your health, remembered.</Text>
        </View>

        {/* Card */}
        <View style={s.card}>
          {/* Toggle */}
          <View style={s.toggle}>
            <Pressable
              style={[s.toggleBtn, mode === 'login' && s.toggleActive]}
              onPress={() => switchMode('login')}
            >
              <Text style={[s.toggleTxt, mode === 'login' && s.toggleTxtActive]}>Sign In</Text>
            </Pressable>
            <Pressable
              style={[s.toggleBtn, mode === 'signup' && s.toggleActive]}
              onPress={() => switchMode('signup')}
            >
              <Text style={[s.toggleTxt, mode === 'signup' && s.toggleTxtActive]}>Create Account</Text>
            </Pressable>
          </View>

          {/* Signup-only fields */}
          {mode === 'signup' && (
            <>
              <View style={s.row}>
                <View style={[s.fieldWrap, { flex: 1 }]}>
                  <Text style={s.label}>First Name</Text>
                  <TextInput
                    style={s.input}
                    value={firstName}
                    onChangeText={t => { setFirstName(t); setError(''); }}
                    placeholder="Alex"
                    placeholderTextColor="rgba(255,255,255,0.25)"
                    autoCorrect={false}
                  />
                </View>
                <View style={[s.fieldWrap, { flex: 1 }]}>
                  <Text style={s.label}>Last Name</Text>
                  <TextInput
                    style={s.input}
                    value={lastName}
                    onChangeText={t => { setLastName(t); setError(''); }}
                    placeholder="Johnson"
                    placeholderTextColor="rgba(255,255,255,0.25)"
                    autoCorrect={false}
                  />
                </View>
              </View>
            </>
          )}

          {/* Username */}
          <View style={s.fieldWrap}>
            <Text style={s.label}>Username</Text>
            <TextInput
              style={s.input}
              value={username}
              onChangeText={t => { setUsername(t); setError(''); }}
              placeholder="e.g. alex_j"
              placeholderTextColor="rgba(255,255,255,0.25)"
              autoCapitalize="none"
              autoCorrect={false}
              returnKeyType="next"
            />
          </View>

          {/* Password */}
          <View style={s.fieldWrap}>
            <Text style={s.label}>Password</Text>
            <TextInput
              style={s.input}
              value={password}
              onChangeText={t => { setPassword(t); setError(''); }}
              placeholder="4+ characters"
              placeholderTextColor="rgba(255,255,255,0.25)"
              secureTextEntry
              returnKeyType="done"
              onSubmitEditing={handleSubmit}
            />
          </View>

          {mode === 'signup' && (
            <Text style={s.hint}>No email required. Your data stays on your device.</Text>
          )}

          {/* Error */}
          {!!error && (
            <View style={s.errorBox}>
              <Text style={s.errorTxt}>{error}</Text>
            </View>
          )}

          {/* Submit */}
          <Pressable
            style={[s.btn, (!canSubmit || loading) && s.btnOff]}
            onPress={handleSubmit}
            disabled={!canSubmit || loading}
          >
            {loading
              ? <ActivityIndicator color="#fff" />
              : <Text style={s.btnTxt}>{mode === 'login' ? 'SIGN IN' : 'CREATE ACCOUNT'}</Text>
            }
          </Pressable>
        </View>

        <Text style={s.footer}>Powered by IBM watsonx · Team BIND{'\n'}Pulse does not diagnose.</Text>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const s = StyleSheet.create({
  scroll:    { paddingHorizontal: 24 },
  logoBlock: { alignItems: 'center', marginBottom: 36 },
  wordmark:  { fontFamily: FONTS.display, fontSize: 64, letterSpacing: 8, color: '#fff', lineHeight: 64 },
  tagline:   { fontFamily: FONTS.body, fontSize: FontSize.small, color: 'rgba(255,255,255,0.35)', marginTop: 6 },

  card: {
    backgroundColor: '#2C2C2E',
    borderRadius: 20,
    padding: 20,
    gap: 16,
  },

  toggle:         { flexDirection: 'row', backgroundColor: 'rgba(255,255,255,0.07)', borderRadius: 12, padding: 3 },
  toggleBtn:      { flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: 10 },
  toggleActive:   { backgroundColor: Colors.red },
  toggleTxt:      { fontFamily: FONTS.body, fontSize: FontSize.body, color: 'rgba(255,255,255,0.4)' },
  toggleTxtActive:{ fontFamily: FONTS.bodySemi, color: '#fff' },

  row:       { flexDirection: 'row', gap: 12 },
  fieldWrap: { gap: 6 },
  label:     { fontFamily: FONTS.bodySemi, fontSize: FontSize.tiny, color: 'rgba(255,255,255,0.45)', textTransform: 'uppercase', letterSpacing: 1 },
  input:     {
    backgroundColor: 'rgba(255,255,255,0.07)',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.12)',
    borderRadius: 10, paddingHorizontal: 14, paddingVertical: 13,
    fontFamily: FONTS.body, fontSize: FontSize.body, color: '#fff',
  },
  hint: { fontFamily: FONTS.body, fontSize: FontSize.small, color: 'rgba(255,255,255,0.3)', lineHeight: 18 },

  errorBox: { backgroundColor: 'rgba(201,64,64,0.2)', borderRadius: 8, padding: 12, borderWidth: 1, borderColor: 'rgba(201,64,64,0.4)' },
  errorTxt: { fontFamily: FONTS.body, fontSize: FontSize.small, color: '#ffaaaa' },

  btn:    { backgroundColor: Colors.red, borderRadius: 12, paddingVertical: 16, alignItems: 'center', minHeight: 52, justifyContent: 'center' },
  btnOff: { opacity: 0.35 },
  btnTxt: { fontFamily: FONTS.display, fontSize: 22, letterSpacing: 2.5, color: '#fff' },

  footer: { fontFamily: FONTS.body, fontSize: FontSize.micro, color: 'rgba(255,255,255,0.18)', textAlign: 'center', marginTop: 28, lineHeight: 18 },
});